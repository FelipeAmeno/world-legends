/**
 * Curva de XP — T031 Player Progression.
 *
 * Fórmula: para avançar do nível N para N+1 são necessários N × 100 XP.
 *
 *   Nível 1 → 2:  100 XP
 *   Nível 2 → 3:  200 XP
 *   Nível 3 → 4:  300 XP
 *   Nível N → N+1: N × 100 XP
 *
 * XP total acumulado para atingir nível N (a partir do nível 1):
 *   totalXpForLevel(N) = 100 × N × (N−1) / 2
 *
 * Exemplos:
 *   totalXpForLevel(1)  = 0
 *   totalXpForLevel(2)  = 100
 *   totalXpForLevel(5)  = 100 × 5 × 4/2 = 1.000
 *   totalXpForLevel(10) = 100 × 10 × 9/2 = 4.500
 *   totalXpForLevel(100)= 100 × 100 × 99/2 = 495.000
 *
 * A curva é linear (cresce linearmente por nível), o que mantém
 * o progresso sempre perceptível sem explosão exponencial.
 */
import { MAX_LEVEL } from '../types/types';

// ─── xpRequiredForNextLevel ───────────────────────────────────────────────────

/**
 * XP necessário para avançar do `level` atual para `level + 1`.
 * Retorna 0 para level ≥ MAX_LEVEL (level máximo, sem próximo nível).
 */
export function xpRequiredForNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return level * 100;
}

// ─── totalXpForLevel ──────────────────────────────────────────────────────────

/**
 * XP total acumulado necessário para ATINGIR o `targetLevel` a partir do nível 1.
 * totalXpForLevel(1) = 0 (começa no nível 1 sem XP).
 */
export function totalXpForLevel(targetLevel: number): number {
  const lvl = Math.max(1, Math.min(targetLevel, MAX_LEVEL));
  // Soma de 1 + 2 + ... + (lvl-1) × 100
  return (100 * ((lvl - 1) * lvl)) / 2;
}

// ─── levelFromTotalXp ─────────────────────────────────────────────────────────

/**
 * Calcula o nível (1–MAX_LEVEL) a partir do XP total acumulado.
 * Resolve a equação: totalXpForLevel(n) ≤ totalXp < totalXpForLevel(n+1).
 *
 * totalXpForLevel(n) = 100 × n × (n−1) / 2
 * → n² − n − (2 × totalXp / 100) = 0
 * → n = (1 + √(1 + 8 × totalXp / 100)) / 2
 */
export function levelFromTotalXp(totalXp: number): number {
  if (totalXp <= 0) return 1;
  // Quadratic formula
  const discriminant = 1 + (8 * totalXp) / 100;
  const level = Math.floor((1 + Math.sqrt(discriminant)) / 2);
  return Math.max(1, Math.min(level, MAX_LEVEL));
}

// ─── currentXpInLevel ────────────────────────────────────────────────────────

/**
 * XP acumulado DENTRO do nível atual (0 até xpRequiredForNextLevel(level)-1).
 * Útil para exibir a barra de progresso do nível.
 */
export function currentXpInLevel(totalXp: number): number {
  const level = levelFromTotalXp(totalXp);
  return totalXp - totalXpForLevel(level);
}

// ─── xpToNextLevel ───────────────────────────────────────────────────────────

/**
 * Quantos XP faltam para o próximo nível a partir do XP total dado.
 * Retorna 0 se já está no nível máximo.
 */
export function xpToNextLevel(totalXp: number): number {
  const level = levelFromTotalXp(totalXp);
  if (level >= MAX_LEVEL) return 0;
  return totalXpForLevel(level + 1) - totalXp;
}
