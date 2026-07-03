import { effectiveMultiplier } from '../attributes/attribute-impact';
/**
 * FatigueCalculator — T037 Fatigue System.
 *
 * Funções puras para gerenciar fadiga:
 *
 *   createFreshState()       Cria estado fresco (0 consecutivas).
 *   getPerformanceRatio()    Retorna multiplicador para o estado atual.
 *   fatigueLevel()           Converte consecutiveMatches → FatigueLevel.
 *   afterMatch()             Registra que jogou uma partida (incrementa contador).
 *   afterRest()              Registra descanso (reset total ou parcial).
 *   applyFatigue()           Aplica multiplicador nos atributos.
 *   applyFatigueToSquad()    Aplica fadiga a múltiplos jogadores.
 *
 * Todas as funções são puras — sem I/O, sem mutação.
 */
import type {
  FatigueLevel,
  FatigueState,
  FatiguedAttributes,
  PlayerAttributes,
} from '../types/types';
import {
  MAX_CONSECUTIVE_MATCHES,
  MAX_PERFORMANCE,
  MIN_PERFORMANCE,
  PERFORMANCE_STEPS,
} from '../types/types';

// ─── fatigueLevel ─────────────────────────────────────────────────────────────

export function fatigueLevel(consecutiveMatches: number): FatigueLevel {
  if (consecutiveMatches <= 0) return 'fresh';
  if (consecutiveMatches === 1) return 'light';
  if (consecutiveMatches === 2) return 'moderate';
  return 'heavy';
}

// ─── createFreshState ────────────────────────────────────────────────────────

export function createFreshState(userCardId: string): FatigueState {
  return Object.freeze({
    userCardId,
    consecutiveMatches: 0,
    performanceMultiplier: MAX_PERFORMANCE,
    fatigueLevel: 'fresh',
  });
}

// ─── getPerformanceRatio ─────────────────────────────────────────────────────

/**
 * Retorna o multiplicador de performance para o estado atual.
 * Usa PERFORMANCE_STEPS e limita ao índice máximo.
 */
export function getPerformanceRatio(state: FatigueState): number {
  const idx = Math.min(state.consecutiveMatches, MAX_CONSECUTIVE_MATCHES);
  return PERFORMANCE_STEPS[idx] ?? MIN_PERFORMANCE;
}

// ─── afterMatch ──────────────────────────────────────────────────────────────

/**
 * Atualiza FatigueState após o jogador ter participado de uma partida.
 * Incrementa `consecutiveMatches` (cap em MAX_CONSECUTIVE_MATCHES).
 */
export function afterMatch(state: FatigueState): FatigueState {
  const newConsecutive = Math.min(state.consecutiveMatches + 1, MAX_CONSECUTIVE_MATCHES);
  const newRatio = PERFORMANCE_STEPS[newConsecutive] ?? MIN_PERFORMANCE;

  return Object.freeze({
    ...state,
    consecutiveMatches: newConsecutive,
    performanceMultiplier: newRatio,
    fatigueLevel: fatigueLevel(newConsecutive),
  });
}

// ─── afterRest ───────────────────────────────────────────────────────────────

/**
 * Atualiza FatigueState após o jogador ter descansado (não jogou).
 *
 * @param state      Estado atual de fadiga.
 * @param restDays   Número de partidas/ciclos de descanso (default: 1).
 *                   1 descanso = reset total para fresh.
 *                   (Simplificação comum em card games).
 */
export function afterRest(state: FatigueState, restMatches = 1): FatigueState {
  if (restMatches <= 0) return state;

  const newConsecutive = Math.max(0, state.consecutiveMatches - restMatches * 2);
  const newRatio = PERFORMANCE_STEPS[newConsecutive] ?? MAX_PERFORMANCE;

  return Object.freeze({
    ...state,
    consecutiveMatches: newConsecutive,
    performanceMultiplier: newRatio,
    fatigueLevel: fatigueLevel(newConsecutive),
  });
}

/**
 * Reset completo: o jogador descansou totalmente (volta a fresh).
 * Equivale a afterRest com restMatches suficiente para zerar.
 */
export function resetFatigue(state: FatigueState): FatigueState {
  return createFreshState(state.userCardId);
}

// ─── applyFatigue ────────────────────────────────────────────────────────────

/**
 * Aplica a fadiga do estado atual nos atributos do jogador.
 * Retorna os atributos modificados e os deltas (diferenças).
 *
 * @param attributes  Atributos originais do jogador.
 * @param state       FatigueState com o multiplicador atual.
 */
export function applyFatigue(
  attributes: PlayerAttributes,
  state: FatigueState,
): FatiguedAttributes {
  const multiplier = getPerformanceRatio(state);

  const result: Record<string, number> = {};
  const deltas: Record<string, number> = {};

  for (const [attr, baseValue] of Object.entries(attributes)) {
    const effMult = effectiveMultiplier(multiplier, attr);
    const newValue = Math.max(1, Math.round(baseValue * effMult));
    result[attr] = newValue;
    deltas[attr] = newValue - baseValue;
  }

  return Object.freeze({
    attributes: Object.freeze(result),
    deltas: Object.freeze(deltas),
    multiplier,
  });
}

// ─── applyFatigueToSquad ─────────────────────────────────────────────────────

export type SquadFatigueInput = Readonly<{
  readonly userCardId: string;
  readonly attributes: PlayerAttributes;
  readonly state: FatigueState;
}>;

export type SquadFatigueResult = Readonly<{
  readonly userCardId: string;
  readonly fatigued: FatiguedAttributes;
  readonly performanceRatio: number;
  readonly level: FatigueLevel;
}>;

/**
 * Aplica fadiga a um conjunto de jogadores.
 * Retorna lista paralela com resultados individuais.
 */
export function applyFatigueToSquad(
  players: readonly SquadFatigueInput[],
): readonly SquadFatigueResult[] {
  return Object.freeze(
    players.map((p) =>
      Object.freeze({
        userCardId: p.userCardId,
        fatigued: applyFatigue(p.attributes, p.state),
        performanceRatio: getPerformanceRatio(p.state),
        level: p.state.fatigueLevel,
      }),
    ),
  );
}
