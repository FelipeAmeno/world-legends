-- Sprint 43A — Asset Studio Foundation
--
-- Domínio interno de geração de arte (jobs → attempts → candidates →
-- reviews), mais os catálogos de reference-set e prompt-template.
-- Nenhuma linha aqui é gameplay/economia — são tabelas de ferramenta
-- interna, sem acesso de usuário final (RLS habilitado, SEM policy pra
-- `authenticated`/`anon`: só o client service_role, via getServiceDb(),
-- lê/escreve — mesmo padrão de "INSERT/DELETE via service role apenas"
-- já usado em user_cards).
--
-- Convenções seguidas (auditadas nas migrations existentes):
--   - uuid primary key default gen_random_uuid()
--   - timestamptz not null default now()
--   - status/enum via TEXT + CHECK (nunca Postgres ENUM nativo)
--   - FK "on delete cascade" pra linhas filhas/possuídas
--
-- Não populamos seed de jogador/arte real nesta migration — só o
-- catálogo vazio (0 reference sets, 0 prompt templates ativos). Os
-- fixtures de teste vivem só em código de teste (in-memory), nunca no
-- banco real.

-- ─── asset_prompt_templates ────────────────────────────────────────────────

create table if not exists asset_prompt_templates (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  schema_version         smallint not null check (schema_version in (1, 2)) default 2,
  template_version       int not null default 1,
  content                text not null,
  required_placeholders  text[] not null default '{}',
  active                 boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (name, template_version)
);

comment on table asset_prompt_templates is
  'Sprint 43A — versões de prompt-template pro Artwork Schema V2. Editar um template NUNCA muda o texto já congelado num asset_generation_attempts.prompt_snapshot existente.';

-- ─── asset_reference_sets ──────────────────────────────────────────────────

create table if not exists asset_reference_sets (
  id             uuid primary key default gen_random_uuid(),
  rarity         text not null,
  schema_version smallint not null check (schema_version in (1, 2)) default 2,
  name           text not null,
  description    text,
  version        int not null default 1,
  active         boolean not null default false,
  files          text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table asset_reference_sets is
  'Sprint 43A — reference sets de estilo/estrutura por raridade. `active` só vira true por aprovação humana explícita (nunca automático).';

-- Só um reference set ATIVO por (rarity, schema_version) quando active=true.
create unique index if not exists asset_reference_sets_one_active_per_rarity
  on asset_reference_sets (rarity, schema_version)
  where active;

-- ─── asset_generation_jobs ─────────────────────────────────────────────────

create table if not exists asset_generation_jobs (
  id                     uuid primary key default gen_random_uuid(),
  card_id                text,
  artwork_preset_id      text not null,
  player_id              text not null,
  rarity                 text not null,
  artwork_schema_version smallint not null check (artwork_schema_version in (1, 2)) default 2,
  generation_mode        text not null check (generation_mode in ('new', 'revision', 'variant')) default 'new',
  prompt_template_id     uuid references asset_prompt_templates(id),
  reference_set_id       uuid references asset_reference_sets(id),
  provider               text not null default 'none',
  model                  text,
  priority               text not null check (priority in ('low', 'normal', 'high')) default 'normal',
  status                 text not null check (status in (
                           'draft', 'queued', 'generating', 'generated', 'validating',
                           'needs_review', 'approved', 'rejected', 'failed', 'published', 'cancelled'
                         )) default 'draft',
  requested_variants     smallint not null default 1 check (requested_variants between 1 and 4),
  -- FK pra asset_candidates adicionada via ALTER TABLE mais abaixo — a
  -- tabela ainda não existe nesse ponto (referência circular job ⇄ candidate).
  approved_candidate_id  uuid,
  created_by             uuid references profiles(id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  started_at             timestamptz,
  completed_at           timestamptz,
  failed_at              timestamptz,
  error_code             text,
  error_message          text,
  metadata               jsonb not null default '{}'::jsonb
);

comment on table asset_generation_jobs is
  'Sprint 43A — intenção de gerar/substituir arte pra um artwork preset. Nenhum provedor é chamado nesta sprint; jobs ficam em draft/fixture.';

create index if not exists asset_generation_jobs_status_idx on asset_generation_jobs (status);
create index if not exists asset_generation_jobs_preset_idx on asset_generation_jobs (artwork_preset_id);

-- ─── asset_generation_attempts ──────────────────────────────────────────────

create table if not exists asset_generation_attempts (
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid not null references asset_generation_jobs(id) on delete cascade,
  attempt_number      smallint not null,
  provider            text not null,
  model               text,
  request_snapshot    jsonb not null default '{}'::jsonb,
  prompt_snapshot     text not null default '',
  reference_snapshot  jsonb not null default '{}'::jsonb,
  requested_variants  smallint not null default 1,
  status              text not null check (status in ('pending', 'running', 'succeeded', 'failed')) default 'pending',
  provider_request_id text,
  provider_batch_id   text,
  started_at          timestamptz,
  completed_at        timestamptz,
  failed_at           timestamptz,
  error_code          text,
  error_message       text,
  estimated_cost      numeric,
  actual_cost         numeric,
  usage_metadata      jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  unique (job_id, attempt_number)
);

comment on table asset_generation_attempts is
  'Sprint 43A — uma linha por invocação de provedor (nenhuma ainda nesta sprint — só criadas via fixture/ação manual interna). Nunca sobrescrita: retry sempre cria uma nova linha com attempt_number+1.';

create index if not exists asset_generation_attempts_job_idx on asset_generation_attempts (job_id);

-- ─── asset_candidates ───────────────────────────────────────────────────────

create table if not exists asset_candidates (
  id                     uuid primary key default gen_random_uuid(),
  job_id                 uuid not null references asset_generation_jobs(id) on delete cascade,
  attempt_id             uuid not null references asset_generation_attempts(id) on delete cascade,
  variant_index          smallint not null,
  storage_path           text not null,
  mime_type              text not null default 'image/png',
  width                  int,
  height                 int,
  file_size              bigint,
  checksum               text,
  perceptual_hash        text,
  artwork_schema_version smallint not null check (artwork_schema_version in (1, 2)),
  technical_validation   jsonb not null default '{}'::jsonb,
  visual_validation      jsonb not null default '{}'::jsonb,
  review_status          text not null check (review_status in ('pending', 'approved', 'rejected', 'needs_revision')) default 'pending',
  created_at             timestamptz not null default now(),
  unique (attempt_id, variant_index)
);

comment on table asset_candidates is
  'Sprint 43A — um resultado de imagem gerada, em STAGING (nunca escrito direto em public/assets/cards/source/artworks). Rejeitado permanece no histórico, nunca é apagado.';

create index if not exists asset_candidates_job_idx on asset_candidates (job_id);
create index if not exists asset_candidates_attempt_idx on asset_candidates (attempt_id);

-- Agora que asset_candidates existe, fecha a referência circular.
alter table asset_generation_jobs
  add constraint asset_generation_jobs_approved_candidate_fk
  foreign key (approved_candidate_id) references asset_candidates(id);

-- ─── asset_reviews ──────────────────────────────────────────────────────────

create table if not exists asset_reviews (
  id           uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references asset_candidates(id) on delete cascade,
  reviewer_id  uuid references profiles(id),
  decision     text not null check (decision in ('approve', 'reject', 'request_revision')),
  notes        text,
  issue_codes  text[] not null default '{}',
  created_at   timestamptz not null default now()
);

comment on table asset_reviews is
  'Sprint 43A — decisão de revisão, append-only. Uma revisão nova NUNCA apaga/edita uma anterior — o histórico de reviews de um candidate é a trilha de auditoria.';

create index if not exists asset_reviews_candidate_idx on asset_reviews (candidate_id);

-- ─── RLS — todas as tabelas: habilitado, SEM policy pra authenticated/anon ──
-- Só o client service_role (getServiceDb(), nunca exposto ao browser)
-- lê/escreve essas tabelas. Nenhum usuário final tem acesso, direto ou via
-- policy — a autorização real (allowlist interno) mora na camada de
-- aplicação (lib/asset-studio/authorization.ts), checada antes de qualquer
-- chamada de service.

alter table asset_prompt_templates enable row level security;
alter table asset_reference_sets enable row level security;
alter table asset_generation_jobs enable row level security;
alter table asset_generation_attempts enable row level security;
alter table asset_candidates enable row level security;
alter table asset_reviews enable row level security;
