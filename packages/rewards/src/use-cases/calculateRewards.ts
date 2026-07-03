/**
 * `calculateRewards` — T029 Match Rewards.
 *
 * Calcula as recompensas completas de uma partida para o usuário.
 *
 * Pipeline:
 *   1. Detectar resultado (vitória/empate/derrota) considerando
 *      pênaltis e W.O.
 *   2. Aplicar recompensa base.
 *   3. Detectar e aplicar bônus:
 *        - clean_sheet  — adversário não marcou
 *        - hat_trick    — jogador do squad marcou 3+ gols
 *        - mvp          — MVP pertence ao squad do usuário
 *        - goal_scored  — +créditos por gol marcado
 *   4. Calcular total (base + soma dos bônus).
 *   5. Construir progress updates.
 *
 * Função pura: sem I/O, sem estado global. Chamadas idempotentes.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import { cleanSheetBonus, goalScoredBonuses, hatTrickBonuses, mvpBonus } from '../rules/bonuses';
import { BASE_REWARDS } from '../rules/constants';
import { detectOutcome } from '../rules/outcome';
import { buildProgressUpdates } from '../rules/progress';
import type { BonusReward, CalculateRewardsInput, RewardResult } from '../types/types';

type RewardError = ReturnType<typeof validationError>;

export function calculateRewards(input: CalculateRewardsInput): Result<RewardResult, RewardError> {
  // ── Validação de input ────────────────────────────────────────────────────
  if (!input.userSide) {
    return Err(validationError('userSide é obrigatório', 'userSide'));
  }
  if (input.userCardIds.length === 0) {
    return Err(validationError('userCardIds não pode ser vazio', 'userCardIds'));
  }

  // ── 1. Resultado ─────────────────────────────────────────────────────────
  const outcome = detectOutcome(input.result, input.userSide);

  // ── 2. Recompensa base ───────────────────────────────────────────────────
  const baseValues = BASE_REWARDS[outcome];
  const base = Object.freeze({
    outcome,
    credits: baseValues.credits,
    xp: baseValues.xp,
  });

  // ── 3. Bônus ──────────────────────────────────────────────────────────────
  const bonuses: BonusReward[] = [];

  // Clean sheet
  const cs = cleanSheetBonus(input.result, input.userSide);
  if (cs) bonuses.push(cs);

  // Hat tricks (0 ou mais)
  bonuses.push(...hatTrickBonuses(input.result, input.userSide, input.userCardIds));

  // MVP
  const mvp = mvpBonus(input.result, input.userCardIds);
  if (mvp) bonuses.push(mvp);

  // Bônus por gol (por gol marcado pelo squad)
  bonuses.push(...goalScoredBonuses(input.result, input.userSide, input.userCardIds));

  // ── 4. Total ──────────────────────────────────────────────────────────────
  const totalCredits = base.credits + bonuses.reduce((s, b) => s + b.credits, 0);
  const totalXp = base.xp + bonuses.reduce((s, b) => s + b.xp, 0);

  const total = Object.freeze({ credits: totalCredits, xp: totalXp });

  // ── 5. Progress ───────────────────────────────────────────────────────────
  const progress = buildProgressUpdates(input.result, input.userSide, outcome, bonuses);

  // ── Resultado ─────────────────────────────────────────────────────────────
  return Ok(
    Object.freeze({
      base,
      bonuses: Object.freeze(bonuses),
      total,
      progress,
    }),
  );
}
