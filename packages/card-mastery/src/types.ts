export type MasteryLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type MasteryLevelConfig = Readonly<{
  level: MasteryLevel;
  name: string;
  xpRequired: number;
  borderClass: string;
  glowColor: string;
  icon: string;
  titleUnlock: string | null;
  effectUnlock: string | null;
}>;

export type CardMasteryState = Readonly<{
  cardId: string;
  xp: number;
  level: MasteryLevel;
  xpToNextLevel: number | null;
  progressPct: number;
}>;

export type XpGainSource = 'match_played' | 'match_win' | 'goal' | 'clean_sheet' | 'mvp';

export type XpGainEntry = Readonly<{
  source: XpGainSource;
  amount: number;
}>;

export type XpGainResult = Readonly<{
  totalXp: number;
  entries: readonly XpGainEntry[];
}>;
