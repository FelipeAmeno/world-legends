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
CREATE POLICY "collection_sets_public_read"
  ON collection_sets FOR SELECT USING (true);

-- collection_progress: leitura e escrita própria
ALTER TABLE collection_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "collection_progress_own_read" ON collection_progress;
CREATE POLICY "collection_progress_own_read"
  ON collection_progress FOR SELECT USING (auth.uid() = profile_id);

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
