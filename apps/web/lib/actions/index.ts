'use server';

/**
 * Barrel re-export for all Server Actions.
 * Import from '@/lib/actions' — each sub-module groups by domain.
 */

export type { ClaimStarterResult, UpdateProfileResult } from './profile';
export { claimStarterPack, updateProfile } from './profile';

export type { DrawnCardInfo, OpenPackResult } from './packs';
export { openPackAction } from './packs';

export type { SaveSquadInput, SaveSquadResult, SquadSlotInput } from './squad';
export { saveSquad } from './squad';

export type { PlayMatchResult } from './match';
export { playMatchAction } from './match';

export type { MissionsData, ClaimMissionResult, MissionView, MissionDef } from './missions';
export { getMissionsAction, claimMissionRewardAction } from './missions';

export type { CollectionSetView, CollectionsData, ClaimCollectionResult } from './collections';
export { getCollectionsAction, claimCollectionRewardAction } from './collections';

export type { AchievementsData, ClaimAchievementResult, NewTrophyNotice } from './achievements';
export { getAchievementsAction, claimAchievementRewardAction } from './achievements';

export type { AllMasteryData, CardMasteryView } from './card-mastery';
export { getAllCardMasteryAction, getCardMasteryAction } from './card-mastery';

export type {
  DailyLoginView,
  DailyLoginState,
  DayConfig,
  DailyReward,
  ClaimDayPayload,
  ClaimDailyLoginResult,
} from './daily-login';
export { getDailyLoginAction, claimDailyLoginAction } from './daily-login';
