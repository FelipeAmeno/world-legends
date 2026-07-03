/**
 * @world-legends/rewards — T029 Match Rewards.
 *
 * API pública: `calculateRewards(input)` → Result<RewardResult, Error>.
 */

// ── Use-case ──────────────────────────────────────────────────────────────────
export { calculateRewards } from './use-cases/calculateRewards';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type {
  CalculateRewardsInput,
  RewardResult,
  BonusReward,
  BonusType,
  Outcome,
  ProgressUpdate,
  ProgressCategory,
  MatchResult,
  TeamSide,
} from './types/types';

// ── Regras (úteis para extensão e testes) ────────────────────────────────────
export { detectOutcome, opponentScore, userGoalsScored } from './rules/outcome';
export { cleanSheetBonus, hatTrickBonuses, mvpBonus, goalScoredBonuses } from './rules/bonuses';
export { buildProgressUpdates } from './rules/progress';
export {
  BASE_REWARDS,
  BONUS_CLEAN_SHEET,
  BONUS_HAT_TRICK,
  BONUS_MVP,
  BONUS_GOAL,
  HAT_TRICK_THRESHOLD,
} from './rules/constants';
