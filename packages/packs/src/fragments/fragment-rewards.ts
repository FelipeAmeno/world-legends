/**
 * Fragment Rewards — T030 Pack Opening Engine.
 *
 * Quando o usuário tira uma carta que já possui, ela é convertida
 * automaticamente em fragmentos (doc 10 §16).
 *
 * Taxas de conversão por raridade:
 *   Common        →  10 fragmentos
 *   Rare          →  25 fragmentos
 *   Elite         →  75 fragmentos
 *   Legendary     → 200 fragmentos
 *   Ultra         → 500 fragmentos
 *   World Cup Hero→ 1000 fragmentos
 *
 * Fragmentos são usados para craft (packages/craft, T016).
 * Nota: GOAT não entra em packs regulares — não precisa de taxa de conversão.
 */
import type { RarityCode } from '@world-legends/types';

// ─── Taxas de conversão ───────────────────────────────────────────────────────

export const FRAGMENT_RATES: Readonly<Record<RarityCode, number>> = {
  common: 10,
  rare: 25,
  elite: 75,
  legendary: 200,
  ultra: 500,
  world_cup_hero: 1000,
};

// ─── fragmentsForDuplicate ────────────────────────────────────────────────────

/** Retorna a quantidade de fragmentos para uma carta duplicada desta raridade. */
export function fragmentsForDuplicate(rarityCode: RarityCode): number {
  return FRAGMENT_RATES[rarityCode] ?? 0;
}

/** Calcula o total de fragmentos para uma lista de raridades duplicadas. */
export function totalFragments(duplicateRarities: readonly RarityCode[]): number {
  return duplicateRarities.reduce((sum, r) => sum + fragmentsForDuplicate(r), 0);
}
