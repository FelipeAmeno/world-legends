-- =============================================================================
-- World Legends — Schema Completo (executar uma vez no Supabase SQL Editor)
-- Ordem: 001 schema → 002 RLS → 003 trigger → 004 storage → 005 missions
--         → 006 collection_sets seed → 007 daily_login → 008 achievements
-- =============================================================================

-- === 1. Schema principal ===
-- =============================================================================
-- World Legends — Schema completo (doc 02)
-- Supabase / PostgreSQL
-- Convenções: snake_case, PK = uuid (gen_random_uuid()), timestamps = timestamptz
-- =============================================================================

-- Extensão necessária para gen_random_uuid() em versões < PG 13
create extension if not exists "pgcrypto";

-- =============================================================================
-- §2 — Identidade e Perfil
-- =============================================================================

create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  country_code  text not null default 'BR',
  soft_currency bigint not null default 500,  -- Créditos (doc 10 §18, doc 02 §2)
  hard_currency bigint not null default 0,    -- Moeda premium
  fragment_balance bigint not null default 0, -- Fragmentos (doc 10 §16)
  elo_rating    int not null default 1000,    -- Prata ao entrar (doc 06 §3.1)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles(id) on delete cascade,
  addressee_id  uuid not null references profiles(id) on delete cascade,
  status        text not null check (status in ('pending','accepted','blocked')) default 'pending',
  created_at    timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- =============================================================================
-- §3 — Catálogo de Jogadores e Cartas
-- =============================================================================

create table if not exists players (
  id                  uuid primary key default gen_random_uuid(),
  full_name           text not null,
  known_as            text not null,
  birth_year          smallint,
  nationality_code    text not null,
  primary_position    text not null check (primary_position in
    ('GK','CB','LB','RB','LWB','RWB','CDM','CM','CAM','LM','RM','LW','RW','CF','ST')),
  secondary_positions text[] not null default '{}',
  preferred_foot      text check (preferred_foot in ('left','right','both')),
  height_cm           smallint,
  era_start           smallint,
  era_end             smallint,
  base_attributes     jsonb not null,
  bio_short           text,
  source_notes        text,
  created_at          timestamptz not null default now()
);

create table if not exists rarities (
  id                  smallint primary key,
  code                text unique not null,
  label               text not null,
  overall_floor       smallint not null,
  overall_ceiling     smallint not null,
  attribute_multiplier numeric not null default 1.0,
  drop_weight         numeric not null,
  color_primary       text not null,
  color_secondary     text not null
);

create table if not exists cards (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  rarity_id   smallint not null references rarities(id),
  edition_code text not null default 'base',
  overall     smallint not null,
  attributes  jsonb not null,
  artwork_url text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (player_id, rarity_id, edition_code)
);

create table if not exists user_cards (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references profiles(id) on delete cascade,
  card_id               uuid not null references cards(id),
  level                 smallint not null default 1,
  form                  smallint not null default 0 check (form between -2 and 2),
  is_injured            boolean not null default false,
  injury_returns_at_round int,
  suspended_matches     int not null default 0,
  yellow_cards_accum    smallint not null default 0,
  -- craft/achievement permite 'goat' e 'achievement' além dos do doc 02 §3
  acquired_via          text not null check (acquired_via in
    ('pack','draft','reward','trade','starter','craft','achievement')),
  acquired_at           timestamptz not null default now()
);

create index if not exists idx_user_cards_profile on user_cards(profile_id);
create index if not exists idx_user_cards_card    on user_cards(card_id);

-- =============================================================================
-- §4 — Elenco (Squad) e Formação
-- =============================================================================

create table if not exists squads (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references profiles(id) on delete cascade,
  name                  text not null default 'Meu Time',
  formation             text not null default '4-3-3',
  tactic_mentality      text not null default 'balanced',
  captain_user_card_id  uuid references user_cards(id),
  chemistry_score       smallint not null default 0,
  is_active             boolean not null default true,
  updated_at            timestamptz not null default now()
);

create table if not exists squad_slots (
  id              uuid primary key default gen_random_uuid(),
  squad_id        uuid not null references squads(id) on delete cascade,
  user_card_id    uuid not null references user_cards(id) on delete cascade,
  slot_position   text not null,
  is_starter      boolean not null default true,
  bench_order     smallint,
  unique (squad_id, slot_position)
);

-- =============================================================================
-- §5 — Competição: Ligas, Temporadas, Partidas
-- =============================================================================

create table if not exists seasons (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  status     text not null check (status in ('upcoming','active','closed')) default 'upcoming'
);

create table if not exists leagues (
  id               uuid primary key default gen_random_uuid(),
  season_id        uuid references seasons(id),
  owner_profile_id uuid references profiles(id),
  name             text not null,
  type             text not null check (type in ('private_friends','public_ranked','world_cup')),
  format           text not null check (format in ('round_robin','knockout','groups_knockout')),
  invite_code      text unique,
  max_members      smallint not null default 8,
  status           text not null check (status in ('draft_phase','in_progress','finished')) default 'draft_phase',
  created_at       timestamptz not null default now()
);

create table if not exists league_members (
  id              uuid primary key default gen_random_uuid(),
  league_id       uuid not null references leagues(id) on delete cascade,
  profile_id      uuid not null references profiles(id) on delete cascade,
  squad_id        uuid references squads(id),
  points          int not null default 0,
  wins            int not null default 0,
  draws           int not null default 0,
  losses          int not null default 0,
  goals_for       int not null default 0,
  goals_against   int not null default 0,
  group_label     text,
  unique (league_id, profile_id)
);

create index if not exists idx_league_members_league on league_members(league_id);

create table if not exists league_rounds (
  id             uuid primary key default gen_random_uuid(),
  league_id      uuid not null references leagues(id) on delete cascade,
  round_number   smallint not null,
  stage          text not null default 'regular',
  status         text not null check (status in ('scheduled','processing','completed')) default 'scheduled',
  scheduled_at   timestamptz,
  processed_at   timestamptz
);

create table if not exists matches (
  id               uuid primary key default gen_random_uuid(),
  league_round_id  uuid references league_rounds(id),
  home_profile_id  uuid references profiles(id),
  away_profile_id  uuid references profiles(id),
  home_squad_id    uuid not null references squads(id),
  away_squad_id    uuid not null references squads(id),
  home_score       smallint,
  away_score       smallint,
  rng_seed         bigint not null,
  engine_version   text not null,
  status           text not null check (status in ('scheduled','simulated','disputed')) default 'scheduled',
  simulated_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table if not exists match_events (
  id                     bigserial primary key,
  match_id               uuid not null references matches(id) on delete cascade,
  minute                 smallint not null,
  event_type             text not null check (event_type in
    ('kickoff','chance','goal','own_goal','penalty_scored','penalty_missed',
     'yellow_card','red_card','injury','substitution','half_time','full_time',
     'walkover','extra_time_start','penalty_shootout_result')),
  team_side              text not null check (team_side in ('home','away','neutral')),
  primary_user_card_id   uuid references user_cards(id),
  secondary_user_card_id uuid references user_cards(id),
  description            text not null,
  meta                   jsonb not null default '{}'::jsonb
);

create index if not exists idx_match_events_match on match_events(match_id, minute);

-- =============================================================================
-- §6 — Ranking e Temporadas
-- =============================================================================

create table if not exists rankings (
  id              uuid primary key default gen_random_uuid(),
  season_id       uuid not null references seasons(id),
  profile_id      uuid not null references profiles(id),
  division        smallint not null default 5,
  elo_rating      int not null,
  matches_played  int not null default 0,
  wins            int not null default 0,
  draws           int not null default 0,
  losses          int not null default 0,
  final_position  int,
  reward_claimed  boolean not null default false,
  unique (season_id, profile_id)
);

-- =============================================================================
-- §7 — Packs e Colecionismo
-- =============================================================================

create table if not exists packs (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  name           text not null,
  price_soft     int,
  price_hard     int,
  cards_per_pack smallint not null default 5,
  drop_table     jsonb not null,
  is_purchasable boolean not null default true,
  available_from timestamptz,
  available_to   timestamptz
);

create table if not exists pack_openings (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  pack_id     uuid not null references packs(id),
  rng_seed    bigint not null,
  opened_at   timestamptz not null default now()
);

create table if not exists pack_opening_cards (
  id               bigserial primary key,
  pack_opening_id  uuid not null references pack_openings(id) on delete cascade,
  card_id          uuid not null references cards(id),
  user_card_id     uuid not null references user_cards(id)
);

create table if not exists collection_sets (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  name              text not null,
  required_card_ids uuid[] not null,
  reward_pack_id    uuid references packs(id),
  reward_soft_currency int not null default 0
);

create table if not exists collection_progress (
  profile_id          uuid not null references profiles(id) on delete cascade,
  collection_set_id   uuid not null references collection_sets(id),
  completed_at        timestamptz,
  primary key (profile_id, collection_set_id)
);

-- =============================================================================
-- Tabelas adicionais (doc 10 §16/§17 — Fragmentos e Craft)
-- =============================================================================

create table if not exists craft_requests (
  id                    uuid primary key default gen_random_uuid(),
  profile_id            uuid not null references profiles(id) on delete cascade,
  target_card_id        uuid not null references cards(id),
  resulting_user_card_id uuid references user_cards(id),
  fragment_cost         int not null,
  idempotency_key       text unique,
  status                text not null check (status in ('pending','completed','failed')) default 'pending',
  created_at            timestamptz not null default now()
);

-- Pity counter por tipo (Legendary+, Ultra+)
create table if not exists pity_counters (
  profile_id    uuid not null references profiles(id) on delete cascade,
  pity_type     text not null check (pity_type in ('legendary_plus','ultra_plus')),
  pack_count    int not null default 0,
  updated_at    timestamptz not null default now(),
  primary key (profile_id, pity_type)
);

-- === 2. RLS Policies ===
-- =============================================================================
-- World Legends — Row Level Security (doc 02 §8)
-- "Nenhuma escrita direta do client — só via Server Actions com service role"
-- =============================================================================

-- =============================================================================
-- Habilitar RLS em todas as tabelas de usuário
-- =============================================================================

alter table profiles          enable row level security;
alter table friendships       enable row level security;
alter table user_cards        enable row level security;
alter table squads            enable row level security;
alter table squad_slots       enable row level security;
alter table pack_openings     enable row level security;
alter table pack_opening_cards enable row level security;
alter table league_members    enable row level security;
alter table rankings          enable row level security;
alter table collection_progress enable row level security;
alter table craft_requests    enable row level security;
alter table pity_counters     enable row level security;

-- =============================================================================
-- PROFILES — leitura pública de campos não sensíveis; escrita própria
-- =============================================================================

-- Qualquer autenticado pode ver username/avatar/elo (campo social)
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
create policy "profiles_public_read" on profiles
  for select using (true);

-- Usuário só atualiza a própria linha
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
create policy "profiles_own_update" on profiles
  for update using (auth.uid() = id);

-- =============================================================================
-- FRIENDSHIPS — só os participantes veem e gerenciam
-- =============================================================================

DROP POLICY IF EXISTS "friendships_participant_read" ON friendships;
create policy "friendships_participant_read" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friendships_requester_insert" ON friendships;
create policy "friendships_requester_insert" on friendships
  for insert with check (auth.uid() = requester_id);

DROP POLICY IF EXISTS "friendships_participant_update" ON friendships;
create policy "friendships_participant_update" on friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

DROP POLICY IF EXISTS "friendships_participant_delete" ON friendships;
create policy "friendships_participant_delete" on friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- =============================================================================
-- USER_CARDS — totalmente privado ao dono
-- =============================================================================

DROP POLICY IF EXISTS "user_cards_own_read" ON user_cards;
create policy "user_cards_own_read" on user_cards
  for select using (auth.uid() = profile_id);

DROP POLICY IF EXISTS "user_cards_own_update" ON user_cards;
create policy "user_cards_own_update" on user_cards
  for update using (auth.uid() = profile_id);

-- INSERT/DELETE via service role apenas (abertura de pack, craft, trade)

-- =============================================================================
-- SQUADS e SQUAD_SLOTS
-- =============================================================================

DROP POLICY IF EXISTS "squads_own_read" ON squads;
create policy "squads_own_read" on squads
  for select using (auth.uid() = profile_id);

DROP POLICY IF EXISTS "squads_own_insert" ON squads;
create policy "squads_own_insert" on squads
  for insert with check (auth.uid() = profile_id);

DROP POLICY IF EXISTS "squads_own_update" ON squads;
create policy "squads_own_update" on squads
  for update using (auth.uid() = profile_id);

DROP POLICY IF EXISTS "squads_own_delete" ON squads;
create policy "squads_own_delete" on squads
  for delete using (auth.uid() = profile_id);

-- Squad slots: quem pode ver o squad pode ver os slots
DROP POLICY IF EXISTS "squad_slots_own_read" ON squad_slots;
create policy "squad_slots_own_read" on squad_slots
  for select using (
    exists (
      select 1 from squads s
      where s.id = squad_id and s.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "squad_slots_own_write" ON squad_slots;
create policy "squad_slots_own_write" on squad_slots
  for all using (
    exists (
      select 1 from squads s
      where s.id = squad_id and s.profile_id = auth.uid()
    )
  );

-- =============================================================================
-- MATCHES e MATCH_EVENTS — leitura para participantes; escrita via service role
-- =============================================================================

DROP POLICY IF EXISTS "matches_participant_read" ON matches;
create policy "matches_participant_read" on matches
  for select using (
    auth.uid() = home_profile_id
    or auth.uid() = away_profile_id
    or exists (
      select 1 from league_rounds lr
      join leagues l on l.id = lr.league_id
      join league_members lm on lm.league_id = l.id
      where lr.id = league_round_id and lm.profile_id = auth.uid()
    )
  );

-- match_events: herda a mesma regra da partida pai
DROP POLICY IF EXISTS "match_events_participant_read" ON match_events;
create policy "match_events_participant_read" on match_events
  for select using (
    exists (
      select 1 from matches m
      where m.id = match_id
        and (m.home_profile_id = auth.uid() or m.away_profile_id = auth.uid())
    )
  );

-- =============================================================================
-- LEAGUE_MEMBERS — membros da liga veem; entrar/sair via Server Actions
-- =============================================================================

DROP POLICY IF EXISTS "league_members_read" ON league_members;
create policy "league_members_read" on league_members
  for select using (
    exists (
      select 1 from league_members lm2
      where lm2.league_id = league_id and lm2.profile_id = auth.uid()
    )
  );

-- Inserção controlada por Server Action (service role)
-- Atualização de stats via service role após simulação de rodada

-- =============================================================================
-- PACK_OPENINGS — privado ao dono
-- =============================================================================

DROP POLICY IF EXISTS "pack_openings_own_read" ON pack_openings;
create policy "pack_openings_own_read" on pack_openings
  for select using (auth.uid() = profile_id);

-- INSERT via Server Action/service role (fluxo de abertura de pack)

DROP POLICY IF EXISTS "pack_opening_cards_own_read" ON pack_opening_cards;
create policy "pack_opening_cards_own_read" on pack_opening_cards
  for select using (
    exists (
      select 1 from pack_openings po
      where po.id = pack_opening_id and po.profile_id = auth.uid()
    )
  );

-- =============================================================================
-- CATÁLOGO — somente leitura para autenticados; escrita via service role (admin)
-- =============================================================================

alter table players           enable row level security;
alter table cards             enable row level security;
alter table rarities          enable row level security;
alter table packs             enable row level security;
alter table collection_sets   enable row level security;
alter table seasons           enable row level security;
alter table leagues           enable row level security;
alter table league_rounds     enable row level security;

DROP POLICY IF EXISTS "players_authed_read" ON players;
create policy "players_authed_read"        on players          for select using (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "cards_authed_read" ON cards;
create policy "cards_authed_read"          on cards            for select using (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "rarities_authed_read" ON rarities;
create policy "rarities_authed_read"       on rarities         for select using (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "packs_authed_read" ON packs;
create policy "packs_authed_read"          on packs            for select using (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "collection_sets_authed_read" ON collection_sets;
create policy "collection_sets_authed_read" on collection_sets for select using (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "seasons_authed_read" ON seasons;
create policy "seasons_authed_read"        on seasons          for select using (auth.role() = 'authenticated');

-- Ligas: leitura pública para descoberta; membros veem detalhes internos
DROP POLICY IF EXISTS "leagues_public_read" ON leagues;
create policy "leagues_public_read"  on leagues       for select using (status != 'draft_phase' or owner_profile_id = auth.uid());
DROP POLICY IF EXISTS "league_rounds_read" ON league_rounds;
create policy "league_rounds_read"   on league_rounds for select using (
  exists (
    select 1 from leagues l
    join league_members lm on lm.league_id = l.id
    where l.id = league_id and lm.profile_id = auth.uid()
  )
);

-- =============================================================================
-- RANKINGS — leitura para todos autenticados (ranking é público)
-- =============================================================================

DROP POLICY IF EXISTS "rankings_authed_read" ON rankings;
create policy "rankings_authed_read" on rankings
  for select using (auth.role() = 'authenticated');

-- =============================================================================
-- COLLECTION_PROGRESS — privado ao dono
-- =============================================================================

DROP POLICY IF EXISTS "collection_progress_own_read" ON collection_progress;
create policy "collection_progress_own_read" on collection_progress
  for select using (auth.uid() = profile_id);

-- =============================================================================
-- CRAFT_REQUESTS — privado ao dono
-- =============================================================================

DROP POLICY IF EXISTS "craft_requests_own_read" ON craft_requests;
create policy "craft_requests_own_read" on craft_requests
  for select using (auth.uid() = profile_id);

-- =============================================================================
-- PITY_COUNTERS — privado ao dono
-- =============================================================================

DROP POLICY IF EXISTS "pity_counters_own_read" ON pity_counters;
create policy "pity_counters_own_read" on pity_counters
  for select using (auth.uid() = profile_id);

-- === 3. Auth Trigger ===
-- Auto-cria perfil quando novo usuário faz signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, country_code)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'country_code', 'BR')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- === 4. Storage Buckets ===
-- Storage buckets
insert into storage.buckets (id, name, public) values
  ('avatars',       'avatars',       true),
  ('card-artwork',  'card-artwork',   true),
  ('match-replays', 'match-replays',  false)
on conflict (id) do nothing;

-- Avatars: upload pelo próprio usuário, leitura pública
DROP POLICY IF EXISTS "Avatars leitura pública" ON storage.objects;
create policy "Avatars leitura pública"
  on storage.objects for select
  using (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar upload próprio" ON storage.objects;
create policy "Avatar upload próprio"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Avatar update próprio" ON storage.objects;
create policy "Avatar update próprio"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- Card artwork: leitura pública, escrita só service_role
DROP POLICY IF EXISTS "Card artwork leitura pública" ON storage.objects;
create policy "Card artwork leitura pública"
  on storage.objects for select
  using (bucket_id = 'card-artwork');

-- Match replays: acesso privado por usuário
DROP POLICY IF EXISTS "Match replays acesso próprio" ON storage.objects;
create policy "Match replays acesso próprio"
  on storage.objects for all
  using (bucket_id = 'match-replays' and auth.uid()::text = (storage.foldername(name))[1]);

-- === 5. Mission Tables ===
-- ──────────────────────────────────────────────────────────────────────────────
-- T72 / T73 / T74 — Mission + Achievement persistence
-- ──────────────────────────────────────────────────────────────────────────────

-- mission_progress: progresso por período (daily / weekly)
-- Cada linha = usuário × missão × período
-- period_key: 'daily:2026-07-02'  |  'weekly:2026-W27'
CREATE TABLE IF NOT EXISTS mission_progress (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id   TEXT        NOT NULL,
  period_key   TEXT        NOT NULL,
  current_value INTEGER    NOT NULL DEFAULT 0,
  claimed_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, mission_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_mission_progress_profile_period
  ON mission_progress(profile_id, period_key);

-- achievement_progress: progresso permanente (lifetime / conquistas)
-- Cada linha = usuário × conquista
CREATE TABLE IF NOT EXISTS achievement_progress (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_id    TEXT        NOT NULL,
  current_value INTEGER     NOT NULL DEFAULT 0,
  stage_claimed INTEGER     NOT NULL DEFAULT 0,
  first_unlocked_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_progress_profile
  ON achievement_progress(profile_id);

-- RLS: usuário só acessa seus próprios dados
ALTER TABLE mission_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mission_progress_owner" ON mission_progress;
CREATE POLICY "mission_progress_owner"
  ON mission_progress FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "achievement_progress_owner" ON achievement_progress;
CREATE POLICY "achievement_progress_owner"
  ON achievement_progress FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- === 6. Collection Sets Seed ===
-- ──────────────────────────────────────────────────────────────────────────────
-- T75 / T76 — Collections + Album
-- ──────────────────────────────────────────────────────────────────────────────
-- Altera required_card_ids para text[] (domain card codes, e.g. 'pelé-world_cup_hero')
-- e semeia os 6 conjuntos iniciais do Álbum.

ALTER TABLE collection_sets
  ALTER COLUMN required_card_ids TYPE text[] USING required_card_ids::text[];

-- Adiciona coluna description e icon para o Álbum UI
ALTER TABLE collection_sets ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE collection_sets ADD COLUMN IF NOT EXISTS icon text NOT NULL DEFAULT '📋';
ALTER TABLE collection_sets ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'classic';
ALTER TABLE collection_sets ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

-- Habilita RLS (leitura pública dos sets)
ALTER TABLE collection_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collection_sets_public_read" ON collection_sets;
DROP POLICY IF EXISTS "collection_sets_public_read" ON collection_sets;
CREATE POLICY "collection_sets_public_read"
  ON collection_sets FOR SELECT USING (true);

-- collection_progress: leitura e escrita própria
ALTER TABLE collection_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collection_progress_own_read" ON collection_progress;
DROP POLICY IF EXISTS "collection_progress_own_read" ON collection_progress;
CREATE POLICY "collection_progress_own_read"
  ON collection_progress FOR SELECT USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "collection_progress_own_write" ON collection_progress;
DROP POLICY IF EXISTS "collection_progress_own_write" ON collection_progress;
CREATE POLICY "collection_progress_own_write"
  ON collection_progress FOR ALL USING (auth.uid() = profile_id);

-- ─── Seed: conjuntos do Álbum ─────────────────────────────────────────────────

INSERT INTO collection_sets (code, name, description, icon, theme, sort_order, required_card_ids, reward_soft_currency) VALUES
(
  'artilheiros',
  'Artilheiros Históricos',
  'Os maiores goleadores da história do futebol brasileiro.',
  '⚽',
  'gold',
  1,
  ARRAY['pelé-world_cup_hero','ronaldo-ultra','romario-legendary','bebeto-rare','adriano-elite'],
  3000
),
(
  'meio_campo_de_ouro',
  'Meio-Campo de Ouro',
  'A geração de criadores que encantou o mundo com o jogo bonito.',
  '🎭',
  'classic',
  2,
  ARRAY['ronaldinho-ultra','zico-legendary','kaka-legendary','rivaldo-legendary','falcao-elite','socrates-rare'],
  4000
),
(
  'muralha_verde_amarela',
  'Muralha Verde-Amarela',
  'Os guardiões que protegeram a Seleção por décadas.',
  '🛡️',
  'steel',
  3,
  ARRAY['cafu-legendary','roberto-carlos-legendary','lucio-elite','taffarel-elite'],
  2500
),
(
  'copa_2002',
  'Copa 2002 — O Pentacampeonato',
  'O time que venceu a Copa do Mundo de 2002 com um futebol que parou o planeta.',
  '🏆',
  'epic',
  4,
  ARRAY['ronaldo-ultra','ronaldinho-ultra','cafu-legendary','roberto-carlos-legendary','rivaldo-legendary'],
  5000
),
(
  'lendas_do_brasil',
  'Lendas do Brasil',
  'Toda a elite da Seleção. O álbum completo dos maiores ídolos brasileiros.',
  '🇧🇷',
  'legendary',
  5,
  ARRAY[
    'pelé-world_cup_hero','ronaldo-ultra','ronaldinho-ultra',
    'zico-legendary','romario-legendary','roberto-carlos-legendary',
    'kaka-legendary','cafu-legendary','rivaldo-legendary',
    'taffarel-elite','lucio-elite','falcao-elite',
    'socrates-rare','bebeto-rare','adriano-elite'
  ],
  12000
),
(
  'album_completo',
  'Álbum Completo',
  'Todos os craques — brasileiros e o maior argentino da história.',
  '👑',
  'goat',
  6,
  ARRAY[
    'pelé-world_cup_hero','ronaldo-ultra','ronaldinho-ultra','maradona-world_cup_hero',
    'zico-legendary','romario-legendary','roberto-carlos-legendary',
    'kaka-legendary','cafu-legendary','rivaldo-legendary',
    'taffarel-elite','lucio-elite','falcao-elite',
    'socrates-rare','bebeto-rare','adriano-elite'
  ],
  20000
)
ON CONFLICT (code) DO NOTHING;

-- === 7. Daily Login ===
-- ──────────────────────────────────────────────────────────────────────────────
-- Daily Login System
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_login (
  profile_id    UUID        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_day   SMALLINT    NOT NULL DEFAULT 1 CHECK (current_day BETWEEN 1 AND 7),
  streak_days   INTEGER     NOT NULL DEFAULT 0,
  last_claim_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_login_profile ON daily_login(profile_id);

ALTER TABLE daily_login ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_login_owner" ON daily_login;
CREATE POLICY "daily_login_owner"
  ON daily_login FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- === 8. Achievements & Mastery ===
-- ──────────────────────────────────────────────────────────────────────────────
-- Achievements (Xbox/Steam-style permanent trophies) + Card Mastery
-- ──────────────────────────────────────────────────────────────────────────────

-- ── player_trophies ──────────────────────────────────────────────────────────
-- Stores permanently unlocked achievements per player.
-- achievement_id = domain code (e.g. 'goat_supreme'), NOT a DB UUID.

CREATE TABLE IF NOT EXISTS player_trophies (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id  TEXT        NOT NULL,
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reward_claimed  BOOLEAN     NOT NULL DEFAULT FALSE,
  UNIQUE (profile_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_player_trophies_profile ON player_trophies(profile_id);

ALTER TABLE player_trophies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "player_trophies_owner" ON player_trophies;
CREATE POLICY "player_trophies_owner"
  ON player_trophies FOR ALL
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- ── card_mastery ─────────────────────────────────────────────────────────────
-- Per-card XP tracking. card_id is the domain text code (e.g. 'pelé-world_cup_hero').
-- Mastery levels: 0=Bronze(0) 1=Silver(50) 2=Gold(150) 3=Platinum(350) 4=Diamond(750) 5=WorldClass(1500)

CREATE TABLE IF NOT EXISTS card_mastery (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id   UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id      TEXT        NOT NULL,
  xp           INTEGER     NOT NULL DEFAULT 0 CHECK (xp >= 0),
  mastery_level SMALLINT   NOT NULL DEFAULT 0 CHECK (mastery_level BETWEEN 0 AND 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (profile_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_card_mastery_profile ON card_mastery(profile_id);
CREATE INDEX IF NOT EXISTS idx_card_mastery_profile_card ON card_mastery(profile_id, card_id);

ALTER TABLE card_mastery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_mastery_owner" ON card_mastery;
CREATE POLICY "card_mastery_owner"
  ON card_mastery FOR ALL
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- =============================================================================
-- RPCs de economia (chamadas via service_role — bypass RLS)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.credit_soft_currency(p_profile_id UUID, p_amount INT)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance BIGINT;
BEGIN
  UPDATE profiles
  SET soft_currency = soft_currency + p_amount,
      updated_at    = now()
  WHERE id = p_profile_id
  RETURNING soft_currency INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'profile not found: %', p_profile_id;
  END IF;

  RETURN new_balance;
END;
$$;
