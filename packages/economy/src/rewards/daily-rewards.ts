/**
 * `calculateObjectiveReward` — recompensas de objetivos diários e semanais.
 *
 * Doc 10 §18: Créditos ganhos via "objetivos diários/semanais" como source.
 * Doc 12 §2.7: evento `economy_credits_earned` com motivo `daily_objective`
 * ou `weekly_objective`.
 *
 * VALORES: nenhum doc especifica os montantes exatos de reward de objetivo.
 * Calibrados para que:
 *   - Login diário (7 dias) + primeiras vitórias ≈ 1 Pack Prata/semana (800 creds)
 *   - Isso mantém o jogador casual progredindo sem farming abusivo
 *
 * Tabela (decisão de calibração própria, marcada como tal):
 *   daily_login:          50  créditos + 0   fragmentos
 *   daily_first_match:    80  créditos + 0   fragmentos
 *   daily_win:           120  créditos + 10  fragmentos
 *   weekly_three_wins:   250  créditos + 30  fragmentos
 *   weekly_ten_matches:  400  créditos + 50  fragmentos
 *
 * Funções puras — sem efeitos colaterais.
 */
import type { ObjectiveRewardInput, ObjectiveRewardResult, ObjectiveType } from './types';

export type { ObjectiveRewardInput, ObjectiveRewardResult, ObjectiveType };

type RewardSpec = Readonly<{ credits: number; fragments: number }>;

export const OBJECTIVE_REWARDS: Readonly<Record<ObjectiveType, RewardSpec>> = Object.freeze({
  daily_login: Object.freeze({ credits: 50, fragments: 0 }),
  daily_first_match: Object.freeze({ credits: 80, fragments: 0 }),
  daily_win: Object.freeze({ credits: 120, fragments: 10 }),
  weekly_three_wins: Object.freeze({ credits: 250, fragments: 30 }),
  weekly_ten_matches: Object.freeze({ credits: 400, fragments: 50 }),
});

/**
 * Calcula a recompensa de um objetivo. Se não concluído (`currentProgress <
 * `requiredProgress`), retorna zeros e `completed = false` — sem punição.
 */
export function calculateObjectiveReward(input: ObjectiveRewardInput): ObjectiveRewardResult {
  const completed = input.currentProgress >= input.requiredProgress;
  const spec = OBJECTIVE_REWARDS[input.objectiveType];

  const isWeekly = input.objectiveType.startsWith('weekly_');

  return Object.freeze({
    objectiveType: input.objectiveType,
    credits: completed ? spec.credits : 0,
    fragments: completed ? spec.fragments : 0,
    completed,
    reason: (isWeekly ? 'weekly_objective' : 'daily_objective') as
      | 'weekly_objective'
      | 'daily_objective',
  });
}

/**
 * Retorna o total de créditos possível de ganhar por semana com todos os
 * objetivos completados — útil para validar inflação (doc 12 §7).
 */
export function calculateMaxWeeklyObjectiveCredits(): number {
  return (
    OBJECTIVE_REWARDS.daily_login.credits * 7 + // login todos os dias
    OBJECTIVE_REWARDS.daily_first_match.credits * 7 +
    OBJECTIVE_REWARDS.daily_win.credits * 7 +
    OBJECTIVE_REWARDS.weekly_three_wins.credits +
    OBJECTIVE_REWARDS.weekly_ten_matches.credits
  );
}
