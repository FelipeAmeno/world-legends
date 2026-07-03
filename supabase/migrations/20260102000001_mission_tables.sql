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

CREATE POLICY "mission_progress_owner"
  ON mission_progress FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "achievement_progress_owner"
  ON achievement_progress FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
