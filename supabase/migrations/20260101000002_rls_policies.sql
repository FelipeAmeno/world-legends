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
create policy "profiles_public_read" on profiles
  for select using (true);

-- Usuário só atualiza a própria linha
create policy "profiles_own_update" on profiles
  for update using (auth.uid() = id);

-- =============================================================================
-- FRIENDSHIPS — só os participantes veem e gerenciam
-- =============================================================================

create policy "friendships_participant_read" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_requester_insert" on friendships
  for insert with check (auth.uid() = requester_id);

create policy "friendships_participant_update" on friendships
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships_participant_delete" on friendships
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- =============================================================================
-- USER_CARDS — totalmente privado ao dono
-- =============================================================================

create policy "user_cards_own_read" on user_cards
  for select using (auth.uid() = profile_id);

create policy "user_cards_own_update" on user_cards
  for update using (auth.uid() = profile_id);

-- INSERT/DELETE via service role apenas (abertura de pack, craft, trade)

-- =============================================================================
-- SQUADS e SQUAD_SLOTS
-- =============================================================================

create policy "squads_own_read" on squads
  for select using (auth.uid() = profile_id);

create policy "squads_own_insert" on squads
  for insert with check (auth.uid() = profile_id);

create policy "squads_own_update" on squads
  for update using (auth.uid() = profile_id);

create policy "squads_own_delete" on squads
  for delete using (auth.uid() = profile_id);

-- Squad slots: quem pode ver o squad pode ver os slots
create policy "squad_slots_own_read" on squad_slots
  for select using (
    exists (
      select 1 from squads s
      where s.id = squad_id and s.profile_id = auth.uid()
    )
  );

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

create policy "pack_openings_own_read" on pack_openings
  for select using (auth.uid() = profile_id);

-- INSERT via Server Action/service role (fluxo de abertura de pack)

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

create policy "players_authed_read"        on players          for select using (auth.role() = 'authenticated');
create policy "cards_authed_read"          on cards            for select using (auth.role() = 'authenticated');
create policy "rarities_authed_read"       on rarities         for select using (auth.role() = 'authenticated');
create policy "packs_authed_read"          on packs            for select using (auth.role() = 'authenticated');
create policy "collection_sets_authed_read" on collection_sets for select using (auth.role() = 'authenticated');
create policy "seasons_authed_read"        on seasons          for select using (auth.role() = 'authenticated');

-- Ligas: leitura pública para descoberta; membros veem detalhes internos
create policy "leagues_public_read"  on leagues       for select using (status != 'draft_phase' or owner_profile_id = auth.uid());
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

create policy "rankings_authed_read" on rankings
  for select using (auth.role() = 'authenticated');

-- =============================================================================
-- COLLECTION_PROGRESS — privado ao dono
-- =============================================================================

create policy "collection_progress_own_read" on collection_progress
  for select using (auth.uid() = profile_id);

-- =============================================================================
-- CRAFT_REQUESTS — privado ao dono
-- =============================================================================

create policy "craft_requests_own_read" on craft_requests
  for select using (auth.uid() = profile_id);

-- =============================================================================
-- PITY_COUNTERS — privado ao dono
-- =============================================================================

create policy "pity_counters_own_read" on pity_counters
  for select using (auth.uid() = profile_id);
