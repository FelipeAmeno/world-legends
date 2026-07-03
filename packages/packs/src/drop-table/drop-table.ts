import type { RNGInstance } from '@world-legends/engine';
/**
 * `DropTable` — tabela de pesos de sorteio por raridade e edição.
 *
 * Fonte: doc 10 §15 (probabilidades-base), doc 07 §2 (interface).
 *
 * PROBABILIDADES-BASE (doc 10 §15, slot "livre" de Pacote Clássico):
 *   Common        58%
 *   Rare          25%
 *   Elite         11%
 *   Legendary      4.5%
 *   Ultra          1.3%
 *   World Cup Hero 0.2%
 *
 * Cada tipo de pack sobrescreve esses pesos (doc 07 §2).
 * Os pesos NÃO precisam somar 100 — são normalizados internamente.
 *
 * RNG: usa `RNG` de `packages/engine` (mulberry32 determinístico, T003).
 * A dependência em `engine` é unidirecional e já aprovada pelo doc 18 §3
 * — `packs` pode usar RNG, mas `engine` nunca importa `packs`.
 */
import type { EditionCode, RarityCode } from '@world-legends/types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Weights por raridade. Não precisam somar 100 — normalizados no sorteio.
 * `world_cup_hero` pode ser 0 para packs que não incluem WCH no pool.
 */
export type RarityWeights = Readonly<Record<RarityCode, number>>;

/**
 * Weights por EditionCode para cartas do pool.
 * Se omitido, todas as edições disponíveis têm peso igual.
 * `prime` e `event` raramente entram no pool base — só em packs especiais.
 */
export type EditionWeights = Readonly<Partial<Record<EditionCode, number>>>;

/**
 * Um "slot" da DropTable descreve como UMA carta de um slot específico
 * é sorteada. Packs com slots diferenciados (ex: slot garantido) têm
 * múltiplos SlotDefinitions.
 *
 * `guaranteedMinRarity`: se definido, o sorteio é repetido até produzir
 * uma raridade ≥ este valor. Nunca forçado para WCH (doc 10 §15/doc 17 §8).
 */
export type SlotDefinition = Readonly<{
  readonly rarityWeights: RarityWeights;
  readonly editionWeights?: EditionWeights;
  readonly guaranteedMinRarity?: RarityCode;
}>;

/** DropTable completa de um pack: uma SlotDefinition por carta do pack. */
export type DropTable = Readonly<{
  readonly slots: readonly SlotDefinition[];
}>;

// ─── Ordem de raridade (para comparação >= ) ──────────────────────────────────
/** Ordem crescente de raridade para verificar "mínimo de raridade". */
export const RARITY_ORDER: Readonly<Record<RarityCode, number>> = {
  common: 0,
  rare: 1,
  elite: 2,
  legendary: 3,
  ultra: 4,
  world_cup_hero: 5,
};

export function rarityMeetsMinimum(rarity: RarityCode, minimum: RarityCode): boolean {
  return RARITY_ORDER[rarity] >= RARITY_ORDER[minimum];
}

// ─── Pesos-base documentados (doc 10 §15) ─────────────────────────────────────
export const BASE_RARITY_WEIGHTS: RarityWeights = Object.freeze({
  common: 58,
  rare: 25,
  elite: 11,
  legendary: 4.5,
  ultra: 1.3,
  world_cup_hero: 0.2,
});

// ─── Sorteio de raridade ──────────────────────────────────────────────────────

/**
 * Sorteia uma raridade dado um conjunto de pesos e um RNG.
 * Normalização interna: soma total pode ser qualquer valor positivo.
 */
export function rollRarity(weights: RarityWeights, rng: RNGInstance): RarityCode {
  const entries = (Object.entries(weights) as [RarityCode, number][]).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return 'common';
  let cursor = rng.nextFloat() * total;
  for (const [code, weight] of entries) {
    cursor -= weight;
    if (cursor <= 0) return code;
  }
  return entries[entries.length - 1]?.[0] ?? 'common';
}

/**
 * Sorteia uma raridade respeitando `guaranteedMinRarity`.
 * Resamples até obter raridade >= mínimo.
 * WCH NUNCA é forçado por garantia (doc 10 §15/doc 17 §8) — se o
 * `guaranteedMinRarity` for `world_cup_hero`, trata como `ultra`.
 *
 * Decisão própria: limite de 20 resamples para evitar loop infinito em
 * caso de pesos zero para a raridade mínima (degenerate config).
 */
export function rollRarityWithGuarantee(
  weights: RarityWeights,
  rng: RNGInstance,
  guaranteedMinRarity: RarityCode,
): RarityCode {
  // WCH nunca é forçado como garantia (doc 10 §15)
  const effectiveMin: RarityCode =
    guaranteedMinRarity === 'world_cup_hero' ? 'ultra' : guaranteedMinRarity;

  const MAX_RESAMPLES = 20;
  for (let i = 0; i < MAX_RESAMPLES; i++) {
    const rarity = rollRarity(weights, rng);
    if (rarityMeetsMinimum(rarity, effectiveMin)) return rarity;
  }
  // Após MAX_RESAMPLES sem sucesso, força a raridade mínima diretamente.
  return effectiveMin;
}

/**
 * Sorteia a edição de uma carta dado pesos de edição.
 * Se `editionWeights` for undefined, retorna 'base'.
 */
export function rollEdition(
  editionWeights: EditionWeights | undefined,
  rng: RNGInstance,
): EditionCode {
  if (editionWeights === undefined) return 'base';
  const entries = Object.entries(editionWeights) as [EditionCode, number][];
  if (entries.length === 0) return 'base';
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return 'base';
  let cursor = rng.nextFloat() * total;
  for (const [code, weight] of entries) {
    cursor -= weight;
    if (cursor <= 0) return code;
  }
  return entries.at(-1)?.[0] ?? 'base';
}
