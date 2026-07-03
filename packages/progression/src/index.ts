/**
 * @world-legends/progression — T031 Player Progression.
 *
 * API pública:
 *   createProfile()  Cria UserProfile no nível 1
 *   gainXp()         Adiciona XP e aplica level-ups
 *   levelUp()        Aplica um único level-up (helper)
 *   rewardTrack()    Recompensas de um nível específico
 */

// ── Use-cases ────────────────────────────────────────────────────────────────
export { createProfile, gainXp, levelUp, rewardTrack } from './use-cases/progression';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type {
  UserProfile,
  UserId,
  GainXpResult,
  LevelUpEvent,
  RewardTrackItem,
  RewardType,
  ProgressionError,
} from './types/types';
export { MAX_LEVEL, userId } from './types/types';

// ── XP Curve ────────────────────────────────────────────────────────────────
export {
  xpRequiredForNextLevel,
  totalXpForLevel,
  levelFromTotalXp,
  currentXpInLevel,
  xpToNextLevel,
} from './xp/xp-curve';

// ── Reward Track ──────────────────────────────────────────────────────────────
export {
  getRewardsForLevel,
  getRewardsForLevelRange,
  REWARD_LEVELS,
  FULL_REWARD_TRACK,
} from './rewards/reward-track';
