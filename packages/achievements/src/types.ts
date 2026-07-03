export type AchievementCategory =
  | 'collection'
  | 'gameplay'
  | 'seasons'
  | 'events'
  | 'packs'
  | 'legends'
  | 'goat';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'goat';

// Condition types — evaluated server-side against current game state
export type AchievementCondition =
  | { type: 'cards_owned_count'; min: number }
  | { type: 'specific_cards_owned'; cardIds: readonly string[] }
  | { type: 'rarity_owned_count'; rarity: string; min: number }
  | { type: 'sets_completed'; setCodes: readonly string[] }
  | { type: 'all_sets_completed' }
  | { type: 'matches_played'; min: number }
  | { type: 'wins'; min: number }
  | { type: 'goals'; min: number }
  | { type: 'win_streak'; min: number }
  | { type: 'packs_opened'; min: number }
  | { type: 'streak_days'; min: number }
  | { type: 'daily_missions_completed'; min: number }
  | { type: 'starter_claimed' };

export type AchievementReward = Readonly<{
  kind: 'xp' | 'credits' | 'pack';
  amount: number;
  packId: string | null;
  label: string;
}>;

export type AchievementDef = Readonly<{
  id: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  name: string;
  description: string;
  xp: number;
  reward: AchievementReward;
  condition: AchievementCondition;
  sortOrder: number;
}>;

// Input for checking conditions
export type AchievementCheckInput = Readonly<{
  cardsOwnedIds: readonly string[];
  completedSetCodes: readonly string[];
  matchesPlayed: number;
  wins: number;
  goals: number;
  currentWinStreak: number;
  packsOpened: number;
  streakDays: number;
  dailyMissionsCompleted: number;
  starterClaimed: boolean;
}>;

export type AchievementView = Readonly<{
  def: AchievementDef;
  unlocked: boolean;
  unlockedAt: Date | null;
  rewardClaimed: boolean;
}>;
