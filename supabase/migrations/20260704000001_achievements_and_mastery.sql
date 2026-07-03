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

CREATE POLICY "card_mastery_owner"
  ON card_mastery FOR ALL
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
