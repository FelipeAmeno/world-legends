/**
 * Tipos do fluxo de Achievements — separados de achievements.ts porque um
 * arquivo 'use server' só pode exportar funções async (Next.js/Turbopack).
 */
import type { AchievementDef, AchievementView } from '@world-legends/achievements';

export type { AchievementDef, AchievementView };

export type AchievementsData = Readonly<{
  views: readonly AchievementView[];
  totalUnlocked: number;
  totalXpEarned: number;
}>;

export type ClaimAchievementResult =
  | { ok: true; newBalance: number }
  | { ok: false; error: string };

export type NewTrophyNotice = Readonly<{
  achievementId: string;
  name: string;
  icon: string;
  rarity: AchievementDef['rarity'];
  xp: number;
}>;
