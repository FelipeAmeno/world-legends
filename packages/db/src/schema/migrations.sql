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
