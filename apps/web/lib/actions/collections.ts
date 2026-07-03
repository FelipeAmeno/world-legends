'use server';

import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import {
  COLLECTION_SETS,
  detectNewlyCompletedSets,
  getSetByCode,
  setCompletionPct,
  type CollectionSetDef,
} from '@/lib/collection-sets';
import type { CollectionSetRow } from '@world-legends/db';
import { SupabaseCollectionRepository, SupabaseProfileRepository } from '@world-legends/db';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type CollectionSetView = Readonly<{
  def: CollectionSetDef;
  ownedCardIds: readonly string[];
  completionPct: number;
  isCompleted: boolean;
  isClaimed: boolean;
}>;

export type CollectionsData = Readonly<{
  views: readonly CollectionSetView[];
  totalCompleted: number;
}>;

export type ClaimCollectionResult =
  | { ok: true; creditsEarned: number; newBalance: number }
  | { ok: false; error: string };

export type CheckCollectionResult = Readonly<{
  newlyCompleted: readonly CollectionSetDef[];
}>;

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getCollectionsAction(): Promise<CollectionsData> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return {
      views: COLLECTION_SETS.map((def) => ({
        def,
        ownedCardIds: [],
        completionPct: 0,
        isCompleted: false,
        isClaimed: false,
      })),
      totalCompleted: 0,
    };
  }

  const db = getServiceDb();
  const repo = new SupabaseCollectionRepository(db);

  const [setsResult, ownedResult, completedResult] = await Promise.all([
    repo.getAllSets(),
    repo.getOwnedCardIds(userId),
    repo.getCompletedSetIds(userId),
  ]);

  const ownedIds: readonly string[] = ownedResult.ok ? ownedResult.value : [];
  const completedSetIds: readonly string[] = completedResult.ok ? completedResult.value : [];
  const dbSets: readonly CollectionSetRow[] = setsResult.ok ? setsResult.value : [];

  const ownedSet = new Set<string>(ownedIds);
  const completedIdSet = new Set<string>(completedSetIds);

  const dbSetsByCode = new Map<string, string>(
    dbSets.map((s: CollectionSetRow) => [s.code, s.id] as [string, string]),
  );

  const views: CollectionSetView[] = COLLECTION_SETS.map((def) => {
    const dbId = dbSetsByCode.get(def.code);
    const isClaimed = dbId !== undefined && completedIdSet.has(dbId);
    const ownedForSet = def.requiredCardIds.filter((id) => ownedSet.has(id));
    const pct = setCompletionPct(def, ownedSet);
    return Object.freeze({
      def,
      ownedCardIds: Object.freeze(ownedForSet),
      completionPct: pct,
      isCompleted: pct === 100,
      isClaimed,
    });
  });

  return Object.freeze({
    views: Object.freeze(views),
    totalCompleted: views.filter((v) => v.isCompleted).length,
  });
}

export async function claimCollectionRewardAction(
  setCode: string,
): Promise<ClaimCollectionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const def = getSetByCode(setCode);
  if (!def) return { ok: false, error: 'Conjunto não encontrado.' };

  const db = getServiceDb();
  const repo = new SupabaseCollectionRepository(db);
  const profileRepo = new SupabaseProfileRepository(db);

  const [ownedResult, setsResult] = await Promise.all([
    repo.getOwnedCardIds(userId),
    repo.getAllSets(),
  ]);

  if (!ownedResult.ok) return { ok: false, error: 'Erro ao verificar coleção.' };
  if (!setsResult.ok) return { ok: false, error: 'Erro ao carregar conjuntos.' };

  const ownedSet = new Set<string>(ownedResult.value);
  const allOwned = def.requiredCardIds.every((id) => ownedSet.has(id));
  if (!allOwned) return { ok: false, error: 'Coleção incompleta.' };

  const dbSet = setsResult.value.find((s: CollectionSetRow) => s.code === setCode);
  if (!dbSet) return { ok: false, error: 'Conjunto não registrado no banco.' };

  const completedResult = await repo.getCompletedSetIds(userId);
  if (completedResult.ok && completedResult.value.includes(dbSet.id)) {
    return { ok: false, error: 'Recompensa já coletada.' };
  }

  const [markResult, creditResult] = await Promise.all([
    repo.markSetComplete(userId, dbSet.id),
    def.rewardSoftCurrency > 0
      ? profileRepo.creditSoftCurrency(userId, def.rewardSoftCurrency)
      : Promise.resolve({ ok: true as const, value: 0 }),
  ]);

  if (!markResult.ok) return { ok: false, error: 'Erro ao registrar conclusão.' };
  if (!creditResult.ok) return { ok: false, error: 'Erro ao creditar recompensa.' };

  return {
    ok: true,
    creditsEarned: def.rewardSoftCurrency,
    newBalance: creditResult.value,
  };
}

/**
 * Chamada internamente por openPackAction após adquirir cartas.
 * Detecta e persiste sets recém-completados.
 */
export async function checkAndMarkCompletedSetsInternal(
  userId: string,
  newCardIds: readonly string[],
): Promise<CheckCollectionResult> {
  if (newCardIds.length === 0) return { newlyCompleted: [] };

  const db = getServiceDb();
  const repo = new SupabaseCollectionRepository(db);

  const [ownedResult, setsResult, completedResult] = await Promise.all([
    repo.getOwnedCardIds(userId),
    repo.getAllSets(),
    repo.getCompletedSetIds(userId),
  ]);

  if (!ownedResult.ok || !setsResult.ok || !completedResult.ok) {
    return { newlyCompleted: [] };
  }

  const ownedSet = new Set<string>(ownedResult.value);
  const dbSets = setsResult.value;

  const dbSetsByCode = new Map<string, string>(
    dbSets.map((s: CollectionSetRow) => [s.code, s.id] as [string, string]),
  );

  const previouslyCompletedIds = new Set<string>(completedResult.value);
  const completedCodes = new Set<string>(
    dbSets
      .filter((s: CollectionSetRow) => previouslyCompletedIds.has(s.id))
      .map((s: CollectionSetRow) => s.code),
  );

  const newlyCompleted = detectNewlyCompletedSets(ownedSet, completedCodes);

  await Promise.allSettled(
    newlyCompleted.map((set) => {
      const dbId = dbSetsByCode.get(set.code);
      if (!dbId) return Promise.resolve();
      return repo.markSetComplete(userId, dbId);
    }),
  );

  return { newlyCompleted };
}
