/**
 * `calculateMatchRewards` — recompensa de Créditos por resultado de partida.
 *
 * Fonte documentada: doc 10 §18 ("Créditos ganhos jogando partidas —
 * vitória > empate > derrota") e doc 12 §2.7 (evento `economy_credits_earned`
 * com motivo `match_reward`).
 *
 * VALORES CONCRETOS: nenhum doc define os números exatos de crédito por
 * partida. Calibrados aqui a partir das âncoras reais dos docs:
 *   - Saldo inicial do jogador: 500 (doc 02 §2)
 *   - Pack Bronze: 300 créditos (doc 07 §1)
 *   - Meta implícita: ~2 sessões de jogo para abrir um Pack Bronze
 *
 * Tabela resultante (decisão de calibração própria, marcada como tal):
 *   Vitória:  150 créditos base
 *   Empate:    75 créditos base
 *   Derrota:   30 créditos base
 *
 * Modificadores documentados (doc 10 §18 menciona "objetivos" como source):
 *   +50% bonus se for partida ranqueada (incentivo a jogar ranked)
 *   +20% bonus por cada gol de diferença (cap: 3 gols de diferença = +60%)
 *
 * Funções puras — sem efeito colateral. O chamador decide o que fazer com
 * o valor retornado (ex: chamar `depositCredits` de use-cases/).
 */
import type { MatchOutcome, MatchRewardInput, MatchRewardResult } from './types';

export type { MatchOutcome, MatchRewardInput, MatchRewardResult };

// ─── Constantes base (calibradas, não documentadas com precisão) ───────────────

/** Créditos base por resultado — calibrados em relação a Pack Bronze = 300 (doc 07 §1). */
export const BASE_MATCH_REWARDS: Readonly<Record<MatchOutcome, number>> = {
  win: 150,
  draw: 75,
  loss: 30,
};

/** Bônus multiplicativo por partida ranqueada (doc 10 §18: ranked premia mais). */
export const RANKED_BONUS_MULTIPLIER = 1.5;

/** Bônus aditivo por cada gol de diferença (máximo cap em gols). */
export const GOAL_DIFF_BONUS_PER_GOAL = 0.1; // +10% por gol de diferença
export const GOAL_DIFF_BONUS_CAP_GOALS = 3; // cap: 3 gols = +30% máximo

/**
 * Calcula a recompensa de créditos por uma partida.
 *
 * @param input.outcome     - 'win' | 'draw' | 'loss'
 * @param input.goalDiff    - Diferença de gols absoluta (sempre ≥ 0)
 * @param input.isRanked    - Se a partida era ranqueada
 * @returns MatchRewardResult com o breakdown completo
 */
export function calculateMatchRewards(input: MatchRewardInput): MatchRewardResult {
  const base = BASE_MATCH_REWARDS[input.outcome];

  // Bônus por diferença de gols (cap em GOAL_DIFF_BONUS_CAP_GOALS)
  const effectiveDiff = Math.min(Math.abs(input.goalDiff ?? 0), GOAL_DIFF_BONUS_CAP_GOALS);
  const goalDiffBonus = Math.round(base * effectiveDiff * GOAL_DIFF_BONUS_PER_GOAL);

  // Bônus de ranked
  const rankedBonus = input.isRanked ? Math.round(base * (RANKED_BONUS_MULTIPLIER - 1)) : 0;

  const total = base + goalDiffBonus + rankedBonus;

  return Object.freeze({
    base,
    goalDiffBonus,
    rankedBonus,
    total,
    outcome: input.outcome,
    isRanked: input.isRanked,
    reason: 'match_reward' as const,
  });
}
