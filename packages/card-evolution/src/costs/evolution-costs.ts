/**
 * Cálculo de custos de evolução (T039).
 *
 * O custo escala por dois eixos:
 *   1. Raridade da carta  — cartas raras custam mais para evoluir.
 *   2. Nível de destino   — níveis superiores custam exponencialmente mais.
 *
 * Fórmula:
 *   credits   = BASE_CREDITS[rarity]   × LEVEL_MULTIPLIER[targetLevel]
 *   fragments = BASE_FRAGMENTS[rarity] × LEVEL_MULTIPLIER[targetLevel]
 *
 * Multiplicadores de nível (exponencial):
 *   nível 1: ×1
 *   nível 2: ×2
 *   nível 3: ×4
 *   nível 4: ×8
 *
 * Exemplo — Legendary +0 → +1:
 *   credits = 1000 × 1 = 1.000c
 *   frags   = 300  × 1 = 300 frags
 *
 * Exemplo — Legendary +2 → +3:
 *   credits = 1000 × 4 = 4.000c
 *   frags   = 300  × 4 = 1.200 frags
 *
 * Exemplo — Ultra +3 → +4:
 *   credits = 2000 × 8 = 16.000c
 *   frags   = 750  × 8 = 6.000 frags
 */
import type { EvolutionCost, EvolvableRarity } from '../types/types';

// ─── Custos base por raridade ─────────────────────────────────────────────────

export const BASE_CREDIT_COST: Readonly<Record<EvolvableRarity, number>> = {
  common: 0, // não evolui
  rare: 200,
  elite: 500,
  legendary: 1000,
  ultra: 2000,
  world_cup_hero: 3000,
};

export const BASE_FRAGMENT_COST: Readonly<Record<EvolvableRarity, number>> = {
  common: 0,
  rare: 25,
  elite: 100,
  legendary: 300,
  ultra: 750,
  world_cup_hero: 1500,
};

// ─── Multiplicadores por nível de destino ─────────────────────────────────────

/**
 * Multiplicador de custo para cada nível de destino (índice = targetLevel).
 * targetLevel 0 = inválido; 1, 2, 3, 4 = multiplicadores crescentes.
 */
export const LEVEL_MULTIPLIER: readonly number[] = Object.freeze([
  0, // nível 0 = não tem custo (nunca calculado)
  1, // nível 1 → ×1
  2, // nível 2 → ×2
  4, // nível 3 → ×4
  8, // nível 4 → ×8
]);

// ─── getCostForNextLevel ──────────────────────────────────────────────────────

/**
 * Retorna o custo para evoluir uma carta do nível atual para o próximo.
 * Retorna `null` se já estiver no nível máximo ou se a raridade não evolui.
 *
 * @param rarityCode    Raridade da carta.
 * @param currentLevel  Nível de evolução atual (0 = base).
 * @param maxLevel      Nível máximo para esta raridade.
 */
export function getCostForNextLevel(
  rarityCode: EvolvableRarity,
  currentLevel: number,
  maxLevel: number,
): EvolutionCost | null {
  if (currentLevel >= maxLevel) return null;
  if (maxLevel === 0) return null;

  const targetLevel = currentLevel + 1;
  const multiplier = LEVEL_MULTIPLIER[targetLevel] ?? 1;

  return Object.freeze({
    credits: BASE_CREDIT_COST[rarityCode] * multiplier,
    fragments: BASE_FRAGMENT_COST[rarityCode] * multiplier,
    targetLevel,
  });
}

/**
 * Retorna o custo acumulado para evoluir de `fromLevel` até `toLevel`.
 * Útil para planejar múltiplos níveis de uma vez.
 */
export function getCumulativeCost(
  rarityCode: EvolvableRarity,
  fromLevel: number,
  toLevel: number,
  maxLevel: number,
): EvolutionCost {
  let totalCredits = 0;
  let totalFragments = 0;

  for (let lvl = fromLevel; lvl < toLevel && lvl < maxLevel; lvl++) {
    const cost = getCostForNextLevel(rarityCode, lvl, maxLevel);
    if (!cost) break;
    totalCredits += cost.credits;
    totalFragments += cost.fragments;
  }

  return Object.freeze({ credits: totalCredits, fragments: totalFragments, targetLevel: toLevel });
}
