/**
 * Tipos do bounded context Fatigue (T037).
 *
 * Jogadores acumulam fadiga ao jogar partidas consecutivas.
 * Performance degradada progressivamente:
 *
 *   1ª partida consecutiva  → 100% (fresh)
 *   2ª partida consecutiva  →  95% (light)
 *   3ª partida consecutiva  →  90% (moderate)
 *   4ª+ partida consecutiva →  85% (heavy)
 *
 * Descanso (1+ partida sem jogar) → recuperação total para 100%.
 *
 * Impacto nos atributos varia por categoria:
 *   physical  (pace, stamina, physical, heading, shot_power) → impacto total
 *   technical (finishing, dribbling, passing, defending)      → 70% do impacto
 *   mental    (vision, composure, leadership)                 → 30% do impacto
 *   gk        (gk_reflexes, gk_handling, etc.)               → 60% do impacto
 *
 * Invariante: nenhum atributo vai abaixo de 1 após aplicação de fadiga.
 */

// ─── Nível qualitativo de fadiga ─────────────────────────────────────────────

export type FatigueLevel = 'fresh' | 'light' | 'moderate' | 'heavy';

// ─── Escadinha de performance ─────────────────────────────────────────────────

/**
 * Multiplicador de performance por partidas consecutivas jogadas.
 * Índice = consecutiveMatches jogadas ANTES desta partida.
 */
export const PERFORMANCE_STEPS: readonly number[] = Object.freeze([
  1.0, // 0 consecutivas → 1ª partida = 100%
  0.95, // 1 consecutiva  → 2ª partida = 95%
  0.9, // 2 consecutivas → 3ª partida = 90%
  0.85, // 3+ consecutivas → 4ª+ = 85%
]);

export const MIN_PERFORMANCE = 0.85;
export const MAX_PERFORMANCE = 1.0;
export const MAX_CONSECUTIVE_MATCHES = 3; // índice máximo em PERFORMANCE_STEPS

// ─── FatigueState — estado de fadiga de um jogador ───────────────────────────

export type FatigueState = Readonly<{
  readonly userCardId: string;
  /**
   * Número de partidas consecutivas jogadas SEM descanso entre elas.
   * 0 = jogador descansado.
   * Limitado a MAX_CONSECUTIVE_MATCHES para que o multiplicador não seja
   * inferior a MIN_PERFORMANCE.
   */
  readonly consecutiveMatches: number;
  /** Multiplicador de performance atual (0.85–1.00). */
  readonly performanceMultiplier: number;
  /** Nível qualitativo de fadiga. */
  readonly fatigueLevel: FatigueLevel;
}>;

// ─── PlayerAttributes — atributos do jogador para aplicar fadiga ──────────────

/**
 * Subconjunto de atributos afetados pela fadiga.
 * Usa Record para independência de @world-legends/engine.
 */
export type PlayerAttributes = Readonly<Record<string, number>>;

// ─── FatiguedAttributes — resultado após aplicação de fadiga ─────────────────

export type FatiguedAttributes = Readonly<{
  /** Atributos com fadiga aplicada. */
  readonly attributes: PlayerAttributes;
  /** Atributos que mudaram (diferença). */
  readonly deltas: PlayerAttributes;
  /** Multiplicador de performance usado. */
  readonly multiplier: number;
}>;
