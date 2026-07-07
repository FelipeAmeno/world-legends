-- ──────────────────────────────────────────────────────────────────────────────
-- Card Favorites (Dream Team / Auto Build "só favoritos" mode)
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS card_favorites (
  profile_id UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_card_favorites_profile ON card_favorites(profile_id);

ALTER TABLE card_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "card_favorites_owner" ON card_favorites;
CREATE POLICY "card_favorites_owner"
  ON card_favorites FOR ALL
  USING  (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
