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

CREATE POLICY "daily_login_owner"
  ON daily_login FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
