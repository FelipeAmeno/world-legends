/**
 * Foundation Recovery — Sprint 16.1, Problema 1.
 *
 * Persiste o catálogo de jogadores/cartas (já corrigido — ver
 * fix-catalog-ovr.mts / fix-handcrafted-ovr.mts) nas tabelas `players` e
 * `cards` do Supabase, como mirror auditável do catálogo em código.
 * O gameplay (user_cards, pack_openings) continua usando os IDs de texto
 * do catálogo em código — este script não muda isso, apenas persiste uma
 * cópia rastreável (players.slug / cards.code_id) para fins de auditoria
 * e futura consulta (admin, analytics).
 *
 * ZERO descarte silencioso: cada falha de validação é reportada no
 * relatório final, nunca só ignorada.
 */
import { createServiceClient } from '@world-legends/db';
import {
  createCard,
  createPlayer,
  cardId,
  playerId,
  type BaseAttributeSet,
} from '@world-legends/cards';
import type { NationalityCode, RarityCode } from '@world-legends/types';
import { ALL_PLAYER_SEEDS, ALL_CARD_SEEDS } from '../lib/catalog-seeds.ts';
import { PLAYER_SEEDS, CARD_SEEDS } from '../lib/collection-data.ts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!SUPABASE_URL || !SERVICE_KEY) throw new Error('Faltam env vars do Supabase.');

const db = createServiceClient(SUPABASE_URL, SERVICE_KEY);

const RARITY_ID: Record<RarityCode, number> = {
  common: 1,
  rare: 2,
  elite: 3,
  legendary: 4,
  ultra: 5,
  world_cup_hero: 6,
};

const DEFAULT_ATTRS: BaseAttributeSet = {
  pace: 70, stamina: 70, physical: 70, heading: 60, finishing: 60, shot_power: 60,
  passing: 65, vision: 65, dribbling: 65, penalty_kicks: 60, defending: 40,
  composure: 70, aggression: 60, leadership: 60,
  gk_reflexes: 20, gk_positioning: 20, gk_handling: 20, gk_kicking: 20, gk_penalty_save: 20,
};
function fullAttrs(partial: Partial<BaseAttributeSet>): BaseAttributeSet {
  return { ...DEFAULT_ATTRS, ...partial };
}

const WCH_CONTEXT: Record<string, { tournament: string; year: number; hostCountry: string; narrativeDescription: string; performanceIndicator: number }> = {
  pelé: { tournament: 'FIFA World Cup', year: 1970, hostCountry: 'Mexico', narrativeDescription: 'O Rei na Copa de 1970', performanceIndicator: 99 },
  maradona: { tournament: 'FIFA World Cup', year: 1986, hostCountry: 'Mexico', narrativeDescription: 'La Mano de Dios na Copa de 1986', performanceIndicator: 99 },
};

type PlayerRow = {
  slug: string;
  full_name: string;
  known_as: string;
  birth_year: number;
  nationality_code: NationalityCode;
  primary_position: string;
  secondary_positions: string[];
  preferred_foot: string;
  height_cm: number;
  era_start: number;
  era_end: number;
  base_attributes: BaseAttributeSet;
  bio_short: string;
  source_notes: string;
};
type CardRow = {
  code_id: string;
  player_slug: string;
  rarity_id: number;
  edition_code: string;
  overall: number;
  attributes: Record<string, number>;
  is_active: boolean;
};

const playerRows: PlayerRow[] = [];
const cardRows: CardRow[] = [];
const errors: { kind: 'player' | 'card'; id: string; rarity?: RarityCode; reason: string }[] = [];
const skipped: { id: string; rarity?: RarityCode; reason: string }[] = [];

const allPlayerSeeds = [...PLAYER_SEEDS, ...ALL_PLAYER_SEEDS];
const allCardSeeds = [...CARD_SEEDS, ...ALL_CARD_SEEDS];
const playerObjById = new Map<string, ReturnType<typeof createPlayer> extends { value: infer V } ? V : never>();

for (const seed of allPlayerSeeds) {
  const result = createPlayer({
    id: playerId(seed.id),
    fullName: seed.fullName,
    knownAs: seed.knownAs,
    birthYear: seed.birthYear,
    nationality: seed.nationality,
    primaryPosition: seed.primary,
    secondaryPositions: seed.secondary,
    preferredFoot: seed.foot,
    heightCm: seed.height,
    eraStart: seed.eraStart,
    eraEnd: seed.eraEnd,
    baseAttributes: fullAttrs(seed.baseAttrs),
    bioShort: seed.bio,
    sourceNotes: 'Dados históricos curados — fontes: Wikipedia, FIFA, RSSSF.',
  });
  if (!result.ok) {
    errors.push({ kind: 'player', id: seed.id, reason: result.error.message });
    continue;
  }
  const p = result.value;
  playerObjById.set(seed.id, p);
  playerRows.push({
    slug: seed.id,
    full_name: p.fullName,
    known_as: p.knownAs,
    birth_year: p.birthYear,
    nationality_code: p.nationality,
    primary_position: p.positions.primary,
    secondary_positions: [...p.positions.secondary],
    preferred_foot: p.preferredFoot,
    height_cm: p.heightCm,
    era_start: p.era.start,
    era_end: p.era.end,
    base_attributes: p.baseAttributes,
    bio_short: p.bioShort,
    source_notes: p.sourceNotes,
  });
}

for (const seed of allCardSeeds) {
  const player = playerObjById.get(seed.playerId);
  if (!player) {
    skipped.push({ id: seed.playerId, rarity: seed.rarity, reason: 'player não registrado (ver errors)' });
    continue;
  }
  const result = createCard({
    id: cardId(`${seed.playerId}-${seed.rarity}`),
    playerId: player.id,
    rarityCode: seed.rarity,
    editionCode: 'base',
    baseAttributes: player.baseAttributes,
    playerPosition: player.positions.primary,
    editionMetadata: { kind: 'base' },
    traits: seed.traits,
    ...(seed.rarity === 'world_cup_hero'
      ? { tournamentContext: WCH_CONTEXT[seed.playerId] ?? { tournament: 'FIFA World Cup', year: 2002, hostCountry: 'Japan/Korea', narrativeDescription: 'Ícone da Copa do Mundo', performanceIndicator: 90 } }
      : {}),
  });
  if (!result.ok) {
    errors.push({ kind: 'card', id: seed.playerId, rarity: seed.rarity, reason: result.error.message });
    continue;
  }
  const c = result.value;
  cardRows.push({
    code_id: `${seed.playerId}-${seed.rarity}`,
    player_slug: seed.playerId,
    rarity_id: RARITY_ID[seed.rarity],
    edition_code: c.editionCode,
    overall: c.overall,
    attributes: { ...c.finalAttributes },
    is_active: true,
  });
}

// ── Upsert players ──────────────────────────────────────────────────────────
async function upsertBatched<T extends Record<string, unknown>>(table: string, rows: T[], onConflict: string, batchSize = 200) {
  const failures: { batch: number; error: string }[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await db.from(table).upsert(batch, { onConflict });
    if (error) failures.push({ batch: i / batchSize, error: error.message });
  }
  return failures;
}

const playerFailures = await upsertBatched('players', playerRows, 'slug');

// Buscar ids reais gerados para linkar cards.player_id
const { data: playerIdRows, error: playerFetchErr } = await db.from('players').select('id, slug');
if (playerFetchErr) throw new Error(`Falha ao buscar players após upsert: ${playerFetchErr.message}`);
const idBySlug = new Map((playerIdRows ?? []).map((r) => [r.slug as string, r.id as string]));

const cardRowsWithFk = cardRows
  .map((c) => {
    const player_id = idBySlug.get(c.player_slug);
    if (!player_id) {
      skipped.push({ id: c.player_slug, reason: 'player_id não encontrado após upsert (slug ausente no banco)' });
      return null;
    }
    const { player_slug, ...rest } = c;
    return { ...rest, player_id };
  })
  .filter((c): c is NonNullable<typeof c> => c !== null);

const cardFailures = await upsertBatched('cards', cardRowsWithFk, 'code_id');

// ── Relatório final ──────────────────────────────────────────────────────────
const { count: dbPlayerCount } = await db.from('players').select('*', { count: 'exact', head: true });
const { count: dbCardCount } = await db.from('cards').select('*', { count: 'exact', head: true });

const countries = new Set(playerRows.map((p) => p.nationality_code));
const byRarity: Record<string, number> = {};
for (const c of cardRows) {
  const code = Object.entries(RARITY_ID).find(([, id]) => id === c.rarity_id)?.[0] ?? 'unknown';
  byRarity[code] = (byRarity[code] ?? 0) + 1;
}

console.log(JSON.stringify({
  totalPlayersAttempted: allPlayerSeeds.length,
  totalCardsAttempted: allCardSeeds.length,
  totalPlayersUpserted: playerRows.length,
  totalCardsUpserted: cardRowsWithFk.length,
  dbPlayerCount,
  dbCardCount,
  totalCountries: countries.size,
  byRarity,
  errors,
  skipped,
  playerFailures,
  cardFailures,
}, null, 2));
