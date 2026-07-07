'use server';

import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import {
  ACHIEVEMENT_CATALOG,
  type AchievementCheckInput,
  type AchievementDef,
  AchievementService,
} from '@world-legends/achievements';
import {
  SupabaseAchievementRepository,
  SupabaseCollectionRepository,
  SupabaseDailyLoginRepository,
  SupabaseMissionRepository,
  SupabaseProfileRepository,
  SupabaseUserCardRepository,
} from '@world-legends/db';
import type {
  AchievementsData,
  ClaimAchievementResult,
  NewTrophyNotice,
} from './achievements.types';

const svc = new AchievementService();

// ─── getAchievementsAction ────────────────────────────────────────────────────

export async function getAchievementsAction(): Promise<AchievementsData> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    const views = svc.buildViews(ACHIEVEMENT_CATALOG, new Map());
    return { views, totalUnlocked: 0, totalXpEarned: 0 };
  }

  const db = getServiceDb();
  const achievementRepo = new SupabaseAchievementRepository(db);
  const result = await achievementRepo.findAllByProfile(userId);

  const unlockedMap = new Map<string, { unlockedAt: Date; rewardClaimed: boolean }>();
  if (result.ok) {
    for (const row of result.value) {
      unlockedMap.set(row.achievementId, {
        unlockedAt: row.unlockedAt,
        rewardClaimed: row.rewardClaimed,
      });
    }
  }

  const views = svc.buildViews(ACHIEVEMENT_CATALOG, unlockedMap);
  const totalUnlocked = views.filter((v) => v.unlocked).length;
  const totalXpEarned = views.filter((v) => v.unlocked).reduce((sum, v) => sum + v.def.xp, 0);

  return { views, totalUnlocked, totalXpEarned };
}

// ─── claimAchievementRewardAction ────────────────────────────────────────────

export async function claimAchievementRewardAction(
  achievementId: string,
): Promise<ClaimAchievementResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const def = ACHIEVEMENT_CATALOG.find((a) => a.id === achievementId);
  if (!def) return { ok: false, error: 'Achievement não encontrado.' };

  const db = getServiceDb();
  const achievementRepo = new SupabaseAchievementRepository(db);
  const profileRepo = new SupabaseProfileRepository(db);

  // Verify the achievement is actually unlocked and not yet claimed
  const existing = await achievementRepo.findAllByProfile(userId);
  if (!existing.ok) return { ok: false, error: 'Erro ao buscar conquistas.' };

  const trophy = existing.value.find((t) => t.achievementId === achievementId);
  if (!trophy) return { ok: false, error: 'Achievement não desbloqueado.' };
  if (trophy.rewardClaimed) return { ok: false, error: 'Recompensa já coletada.' };

  // Credit reward
  let newBalance = 0;
  if (def.reward.kind === 'credits' && def.reward.amount > 0) {
    const creditResult = await profileRepo.creditSoftCurrency(userId, def.reward.amount);
    if (creditResult.ok) newBalance = creditResult.value;
  }

  // Mark as claimed
  await achievementRepo.markRewardClaimed(userId, achievementId);

  return { ok: true, newBalance };
}

// ─── checkAndUnlockAchievementsInternal ───────────────────────────────────────
// Called fire-and-forget from game event hooks (match, packs, collections, etc.)

export async function checkAndUnlockAchievementsInternal(
  userId: string,
): Promise<NewTrophyNotice[]> {
  const db = getServiceDb();

  // Gather all needed data in parallel
  const [cardsResult, setsResult, trophiesResult, missionProgressResult, dailyLoginResult] =
    await Promise.all([
      new SupabaseUserCardRepository(db).findByProfile(userId),
      new SupabaseCollectionRepository(db).getCompletedSetIds(userId),
      new SupabaseAchievementRepository(db).findAllByProfile(userId),
      new SupabaseMissionRepository(db).getAchievementProgress(userId),
      new SupabaseDailyLoginRepository(db).findByProfile(userId),
    ]);

  // Extract owned card IDs
  const cardsOwnedIds: string[] = cardsResult.ok ? cardsResult.value.map((c) => c.cardId) : [];

  // Extract completed set codes
  const completedSetCodes: string[] = setsResult.ok ? [...setsResult.value] : [];

  // Extract already unlocked IDs
  const alreadyUnlockedIds = new Set<string>(
    trophiesResult.ok ? trophiesResult.value.map((t) => t.achievementId) : [],
  );

  // Extract stats from mission_progress achievement rows
  const progressMap = new Map<string, number>();
  if (missionProgressResult.ok) {
    for (const row of missionProgressResult.value) {
      progressMap.set(row.missionId, row.currentValue);
    }
  }

  const checkInput: AchievementCheckInput = {
    cardsOwnedIds,
    completedSetCodes,
    matchesPlayed: progressMap.get('achiev_100_matches') ?? 0,
    wins: progressMap.get('achiev_30_unbeaten') ?? 0,
    goals: progressMap.get('achiev_500_goals') ?? 0,
    currentWinStreak: progressMap.get('achiev_30_unbeaten') ?? 0,
    packsOpened: progressMap.get('achiev_100_packs') ?? 0,
    streakDays:
      dailyLoginResult.ok && dailyLoginResult.value ? dailyLoginResult.value.streakDays : 0,
    dailyMissionsCompleted: 0,
    starterClaimed: cardsOwnedIds.length > 0,
  };

  const newlyUnlocked = svc.computeNewlyUnlocked(checkInput, alreadyUnlockedIds);
  if (newlyUnlocked.length === 0) return [];

  // Persist new trophies
  const achievementRepo = new SupabaseAchievementRepository(db);
  await achievementRepo.insertManyTrophies(
    newlyUnlocked.map((def) => ({ profileId: userId, achievementId: def.id })),
  );

  return newlyUnlocked.map((def) => ({
    achievementId: def.id,
    name: def.name,
    icon: def.icon,
    rarity: def.rarity,
    xp: def.xp,
  }));
}
