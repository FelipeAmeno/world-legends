/**
 * Barrel re-export for all Server Actions.
 * Import from '@/lib/actions' — each sub-module groups by domain.
 */

export type { ClaimStarterResult, UpdateProfileResult } from './profile.types';
export { claimStarterPack, updateProfile } from './profile';

export type { DrawnCardInfo, OpenPackResult } from './packs.types';
export { openPackAction } from './packs';

export type { SaveSquadInput, SaveSquadResult, SquadSlotInput } from './squad.types';
export { saveSquad } from './squad';

export type { PlayMatchResult } from './match.types';
export { playMatchAction } from './match';

export type { MissionsData, ClaimMissionResult, MissionView, MissionDef } from './missions.types';
export { getMissionsAction, claimMissionRewardAction } from './missions';

export type {
  CollectionSetView,
  CollectionsData,
  ClaimCollectionResult,
} from './collections.types';
export { getCollectionsAction, claimCollectionRewardAction } from './collections';

export type {
  AchievementsData,
  ClaimAchievementResult,
  NewTrophyNotice,
} from './achievements.types';
export { getAchievementsAction, claimAchievementRewardAction } from './achievements';

export type { AllMasteryData, CardMasteryView } from './card-mastery.types';
export { getAllCardMasteryAction, getCardMasteryAction } from './card-mastery';

export type {
  DailyLoginView,
  DailyLoginState,
  DayConfig,
  DailyReward,
  ClaimDayPayload,
  ClaimDailyLoginResult,
} from './daily-login.types';
export { getDailyLoginAction, claimDailyLoginAction } from './daily-login';

export { getFavoriteCardIds, toggleFavoriteCardAction } from './favorites';
