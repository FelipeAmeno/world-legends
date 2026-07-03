/**
 * Recuperação de lesões (T036).
 *
 * Funções puras para progressão de recuperação entre partidas.
 * A cada partida que passa sem o jogador, `matchesOut` decrementa em 1.
 * Quando atinge 0, o jogador está disponível.
 *
 * Não muta — retorna novo Injury (ou null quando curado).
 */
import type { Injury } from '../types/types';

// ─── progressRecovery ─────────────────────────────────────────────────────────

/**
 * Reduz `matchesOut` em 1 (simula uma partida de espera).
 * `matchesOut` nunca vai abaixo de 0.
 *
 * @returns Injury atualizada com matchesOut decrementado.
 */
export function progressRecovery(injury: Injury): Injury {
  return Object.freeze({
    ...injury,
    matchesOut: Math.max(0, injury.matchesOut - 1),
  });
}

// ─── isFullyRecovered ────────────────────────────────────────────────────────

/** Retorna true quando o jogador está disponível (matchesOut === 0). */
export function isFullyRecovered(injury: Injury): boolean {
  return injury.matchesOut === 0;
}

// ─── recover N matches ────────────────────────────────────────────────────────

/**
 * Aplica `matches` partidas de recuperação de uma vez.
 * Útil para simular calendário de jogos em lote.
 */
export function progressRecoveryN(injury: Injury, matches: number): Injury {
  return Object.freeze({
    ...injury,
    matchesOut: Math.max(0, injury.matchesOut - Math.max(0, matches)),
  });
}

// ─── estimatedReturnMatch ─────────────────────────────────────────────────────

/**
 * Retorna o número de partidas até o retorno do jogador.
 * Equivalente a `injury.matchesOut` — incluído para semântica explícita.
 */
export function matchesUntilReturn(injury: Injury): number {
  return injury.matchesOut;
}
