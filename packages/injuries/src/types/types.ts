/**
 * Tipos do bounded context Injuries (T036).
 *
 * Três gravidades de lesão (doc T036):
 *   light    (leve)     — 1–2 partidas fora
 *   moderate (moderada) — 3–5 partidas fora
 *   severe   (grave)    — 6–12 partidas fora
 *
 * Probabilidade baseada em:
 *   stamina   — alta stamina reduz risco
 *   physical  — alta força reduz risco
 *   era       — eras mais antigas têm cuidados médicos inferiores → maior risco
 *
 * Regra: nenhum package existente é alterado.
 */

// ─── Gravidade ────────────────────────────────────────────────────────────────

export type InjuryType = 'light' | 'moderate' | 'severe';

export const INJURY_TYPE_WEIGHTS: Readonly<Record<InjuryType, number>> = {
  light: 60, // 60% das lesões são leves
  moderate: 30, // 30% moderadas
  severe: 10, // 10% graves
};

export const MATCHES_OUT_RANGE: Readonly<
  Record<InjuryType, Readonly<{ min: number; max: number }>>
> = {
  light: Object.freeze({ min: 1, max: 2 }),
  moderate: Object.freeze({ min: 3, max: 5 }),
  severe: Object.freeze({ min: 6, max: 12 }),
};

// ─── Injury ───────────────────────────────────────────────────────────────────

export type Injury = Readonly<{
  readonly id: string;
  readonly type: InjuryType;
  /** Partidas que o jogador ficará indisponível (decrementado por progressRecovery). */
  readonly matchesOut: number;
  readonly description: string;
  /** Minuto da partida em que a lesão ocorreu (se gerada durante uma partida). */
  readonly minute?: number;
}>;

// ─── InjuryEvent — ocorrência em partida ─────────────────────────────────────

export type InjuryEvent = Readonly<{
  readonly userCardId: string;
  readonly injury: Injury;
}>;

// ─── InjuryProfile — dados do jogador para cálculo de risco ──────────────────

/**
 * Perfil mínimo de um jogador para calcular probabilidade de lesão.
 * Injetado pelo chamador (sem dependência de outros packages de domínio).
 */
export type InjuryProfile = Readonly<{
  readonly userCardId: string;
  /** Stamina 0–99. Alta stamina → menor risco. */
  readonly stamina: number;
  /** Força física 0–99. Alta physical → menor risco. */
  readonly physical: number;
  /**
   * Era histórica do jogador.
   * Eras mais antigas tinham menor suporte médico → maior risco.
   */
  readonly era: string;
}>;

// ─── Constantes de probabilidade ──────────────────────────────────────────────

/** Probabilidade base de lesão por partida (3%). */
export const BASE_INJURY_PROBABILITY = 0.03;
/** Probabilidade mínima por partida (1%). */
export const MIN_INJURY_PROBABILITY = 0.01;
/** Probabilidade máxima por partida (15%). */
export const MAX_INJURY_PROBABILITY = 0.15;
