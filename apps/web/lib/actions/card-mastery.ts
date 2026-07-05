'use server';

import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import {
  CardMasteryService,
  type CardMasteryState,
  MASTERY_LEVELS,
  type MasteryLevelConfig,
  type XpGainSource,
} from '@world-legends/card-mastery';
import { SupabaseCardMasteryRepository } from '@world-legends/db';

const svc = new CardMasteryService();

// ─── Public types ─────────────────────────────────────────────────────────────

export type { CardMasteryState, MasteryLevelConfig, XpGainSource };

export type CardMasteryView = Readonly<{
  cardId: string;
  state: CardMasteryState;
  levelConfig: MasteryLevelConfig;
  nextLevelConfig: MasteryLevelConfig | null;
}>;

export type AllMasteryData = Readonly<{
  masteries: readonly CardMasteryView[];
}>;

// ─── getAllCardMasteryAction ───────────────────────────────────────────────────

export async function getAllCardMasteryAction(): Promise<AllMasteryData> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { masteries: [] };

  const db = getServiceDb();
  const repo = new SupabaseCardMasteryRepository(db);
  const result = await repo.findAllByProfile(userId);
  if (!result.ok) return { masteries: [] };

  const masteries: CardMasteryView[] = result.value.map((row) => {
    const state = svc.computeState(row.cardId, row.xp);
    const levelConfig = MASTERY_LEVELS[state.level];
    if (!levelConfig) throw new Error(`Invalid mastery level: ${state.level}`);
    const nextLevelConfig = state.level < 5 ? (MASTERY_LEVELS[state.level + 1] ?? null) : null;
    return { cardId: row.cardId, state, levelConfig, nextLevelConfig };
  });

  return { masteries };
}

// ─── getCardMasteryAction ─────────────────────────────────────────────────────

export async function getCardMasteryAction(cardId: string): Promise<CardMasteryView | null> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  const db = getServiceDb();
  const repo = new SupabaseCardMasteryRepository(db);
  const result = await repo.findByCard(userId, cardId);
  if (!result.ok) return null;

  const xp = result.value?.xp ?? 0;
  const state = svc.computeState(cardId, xp);
  const levelConfig = MASTERY_LEVELS[state.level];
  if (!levelConfig) return null;
  const nextLevelConfig = state.level < 5 ? (MASTERY_LEVELS[state.level + 1] ?? null) : null;

  return { cardId, state, levelConfig, nextLevelConfig };
}

// ─── awardMatchXpInternal ─────────────────────────────────────────────────────
// Called fire-and-forget from match.ts for all squad card IDs that played.

export async function awardMatchXpInternal(
  userId: string,
  cardIds: readonly string[],
  sources: readonly XpGainSource[],
): Promise<void> {
  if (cardIds.length === 0 || sources.length === 0) return;

  const gain = svc.computeXpGain(sources);
  if (gain.totalXp <= 0) return;

  const db = getServiceDb();
  const repo = new SupabaseCardMasteryRepository(db);

  await Promise.all(cardIds.map((cardId) => repo.addXp(userId, cardId, gain.totalXp)));
}
