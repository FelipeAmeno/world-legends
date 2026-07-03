// Reward kinds
export type DailyRewardKind = 'credits' | 'xp' | 'pack' | 'special_card';

// A single reward item
export type DailyReward = Readonly<{
  kind: DailyRewardKind;
  amount: number; // credits or XP amount; for packs = number of packs
  packId: string | null; // pack type for 'pack' kind: 'classic' | 'elite' | 'legend'
  cardId: string | null; // card code for 'special_card' kind
  label: string; // display label, e.g. "150 Créditos"
  icon: string; // emoji
}>;

// 7-day schedule entry
export type DayConfig = Readonly<{
  day: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  rewards: readonly DailyReward[];
  isMilestone: boolean; // true for day 7
  theme: 'normal' | 'premium' | 'milestone';
}>;

// State returned to UI
export type DailyLoginState = Readonly<{
  currentDay: number; // 1–7 current position in cycle
  streakDays: number; // total consecutive days claimed (can exceed 7)
  lastClaimAt: Date | null;
  canClaimToday: boolean; // true if haven't claimed today yet
  alreadyClaimedToday: boolean;
  streakBroken: boolean; // was the streak broken on last evaluation?
  nextStreakMilestone: number | null; // next bonus at X days
}>;

// Result of claiming a day
export type ClaimDayPayload = Readonly<{
  day: number;
  rewards: readonly DailyReward[];
  streakBonus: DailyReward | null; // if hitting a streak milestone
  nextState: DailyLoginStateUpdate;
}>;

// What the repository needs to persist after a claim
export type DailyLoginStateUpdate = Readonly<{
  nextDay: number; // 1–7, wraps after 7
  nextStreak: number; // total consecutive days
  claimedAt: Date;
}>;
