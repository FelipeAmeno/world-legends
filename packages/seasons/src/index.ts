/**
 * @world-legends/seasons — T040 Offline Season Mode.
 */
export {
  createSeason,
  recordRoundResult,
  advanceRound,
  simulateFullSeason,
  isSeasonComplete,
} from './season/season';
export type { CreateSeasonInput } from './season/season';
export { calculateStandings, getChampion, getUserStanding } from './standings/standings';
export { getRewardsForPosition, REWARD_TABLE } from './rewards/rewards';
export { generateFixtures } from './fixtures/fixtures';
export { simulateAIMatch, simulateRoundAI } from './simulation/simulation';
export type { SimulatedScore } from './simulation/simulation';
export type {
  Season,
  SeasonTeam,
  Round,
  SeasonMatch,
  StandingsEntry,
  SeasonReward,
  SeasonError,
  SeasonStatus,
} from './types/types';
export {
  TOTAL_ROUNDS,
  TEAMS_PER_SEASON,
  MATCHES_PER_ROUND,
  POINTS_WIN,
  POINTS_DRAW,
  POINTS_LOSS,
} from './types/types';
