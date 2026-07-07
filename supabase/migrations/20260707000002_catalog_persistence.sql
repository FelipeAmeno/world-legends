-- Sprint 16.1 — Foundation Recovery, Problema 1.
-- O catálogo de jogadores/cartas vive em código (apps/web/lib/collection-data.ts
-- + catalog-seeds.ts) e o gameplay (user_cards, pack_openings) usa os IDs de
-- texto desse catálogo, não uuids de `players`/`cards`. Para persistir o
-- catálogo no Supabase como pede a auditoria, sem duplicar a arquitetura de
-- gameplay já corrigida (20260706000002_fix_card_id_text.sql), adicionamos
-- colunas de "slug" que espelham exatamente os IDs de texto usados em
-- user_cards.card_id — isso torna o mirror auditável/rastreável sem
-- reacoplar o motor de packs ao banco.

ALTER TABLE players ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE cards   ADD COLUMN IF NOT EXISTS code_id text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_players_slug ON players(slug);
CREATE INDEX IF NOT EXISTS idx_cards_code_id ON cards(code_id);

-- rarities.id era referenciado por cards.rarity_id mas nunca foi populada.
INSERT INTO rarities (id, code, label, overall_floor, overall_ceiling, attribute_multiplier, drop_weight, color_primary, color_secondary)
VALUES
  (1, 'common', 'Common', 55, 72, 1.00, 58, '#6b7280', '#6b7280'),
  (2, 'rare', 'Rare', 73, 81, 1.06, 25, '#a855f7', '#9333ea'),
  (3, 'elite', 'Elite', 82, 87, 1.12, 11, '#3b82f6', '#2563eb'),
  (4, 'legendary', 'Legendary', 88, 92, 1.18, 4.5, '#c9a84c', '#c9a84c'),
  (5, 'ultra', 'Ultra', 93, 96, 1.25, 1.3, '#ec4899', '#ec4899'),
  (6, 'world_cup_hero', 'World Cup Hero', 95, 99, 1.30, 0.2, '#e2e8f0', '#f0f4ff')
ON CONFLICT (id) DO UPDATE SET
  code = excluded.code,
  label = excluded.label,
  overall_floor = excluded.overall_floor,
  overall_ceiling = excluded.overall_ceiling,
  attribute_multiplier = excluded.attribute_multiplier,
  drop_weight = excluded.drop_weight,
  color_primary = excluded.color_primary,
  color_secondary = excluded.color_secondary;
