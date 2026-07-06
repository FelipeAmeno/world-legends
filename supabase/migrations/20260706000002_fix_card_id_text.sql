-- Fix: card_id / pack_id columns were uuid with FK constraints, but the app
-- uses text-based identifiers (e.g. 'pelé-world_cup_hero', 'classic').
-- The FK to the `cards` and `packs` catalog tables is removed; the catalog
-- lives in application code, not in the DB.

-- 1. user_cards.card_id  uuid → text
ALTER TABLE user_cards DROP CONSTRAINT IF EXISTS user_cards_card_id_fkey;
ALTER TABLE user_cards ALTER COLUMN card_id TYPE text USING card_id::text;

-- 2. pack_openings.pack_id  uuid → text
ALTER TABLE pack_openings DROP CONSTRAINT IF EXISTS pack_openings_pack_id_fkey;
ALTER TABLE pack_openings ALTER COLUMN pack_id TYPE text USING pack_id::text;

-- 3. pack_opening_cards.card_id  uuid → text (if table exists)
ALTER TABLE pack_opening_cards DROP CONSTRAINT IF EXISTS pack_opening_cards_card_id_fkey;
ALTER TABLE pack_opening_cards ALTER COLUMN card_id TYPE text USING card_id::text;

-- 4. card_mastery.card_id  uuid → text
ALTER TABLE card_mastery DROP CONSTRAINT IF EXISTS card_mastery_card_id_fkey;
ALTER TABLE card_mastery ALTER COLUMN card_id TYPE text USING card_id::text;

-- 5. craft_requests.target_card_id  uuid → text
ALTER TABLE craft_requests DROP CONSTRAINT IF EXISTS craft_requests_target_card_id_fkey;
ALTER TABLE craft_requests ALTER COLUMN target_card_id TYPE text USING target_card_id::text;
