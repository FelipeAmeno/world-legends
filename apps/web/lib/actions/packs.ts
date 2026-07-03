'use server';

import { getCollectionMap } from '@/lib/collection-data';
import { incrementMissionProgressInternal } from '@/lib/actions/missions';
import { checkAndMarkCompletedSetsInternal } from '@/lib/actions/collections';
import { checkAndUnlockAchievementsInternal } from '@/lib/actions/achievements';
import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import {
  SupabasePackRepository,
  SupabaseProfileRepository,
  SupabaseUserCardRepository,
} from '@world-legends/db';
import {
  CLASSIC_PACK,
  ELITE_PACK,
  LEGEND_PACK,
  createUserPityState,
  openPack,
} from '@world-legends/packs';
import type { Pack } from '@world-legends/packs';
import type { RarityCode } from '@world-legends/types';

const PACK_DEFS: Record<string, { pack: Pack; price: number }> = {
  classic: { pack: CLASSIC_PACK, price: 150 },
  elite: { pack: ELITE_PACK, price: 400 },
  legend: { pack: LEGEND_PACK, price: 1000 },
};

export type DrawnCardInfo = {
  cardId: string;
  userCardId: string;
  rarityCode: RarityCode;
};

export type OpenPackResult =
  | { ok: true; drawn: DrawnCardInfo[]; newBalance: number }
  | { ok: false; error: string };

export async function openPackAction(packId: string): Promise<OpenPackResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const packDef = PACK_DEFS[packId];
  if (!packDef) return { ok: false, error: 'Pack inválido.' };

  const db = getServiceDb();
  const profileRepo = new SupabaseProfileRepository(db);
  const cardRepo = new SupabaseUserCardRepository(db);
  const packRepo = new SupabasePackRepository(db);

  const debitResult = await profileRepo.debitSoftCurrency(userId, packDef.price);
  if (!debitResult.ok) return { ok: false, error: debitResult.error.message };

  const catalogMap = getCollectionMap();
  const byRarity = new Map<RarityCode, string[]>();
  for (const [cardId, card] of catalogMap) {
    const pool = byRarity.get(card.rarityCode) ?? [];
    pool.push(cardId);
    byRarity.set(card.rarityCode, pool);
  }

  // Semente determinística por abertura (XOR para evitar colisão simples)
  const seed = String(Date.now() ^ Math.trunc(Math.random() * 0xffffffff));
  const packResult = openPack({
    packOpeningId: `opening-${userId}-${Date.now()}`,
    pack: packDef.pack,
    seed,
    pityState: createUserPityState(),
    cardResolver: (rarityCode) => {
      const pool = byRarity.get(rarityCode as RarityCode) ?? [];
      if (pool.length === 0) {
        const allIds = [...catalogMap.keys()];
        return allIds[Math.floor(Math.random() * allIds.length)] ?? null;
      }
      return pool[Math.floor(Math.random() * pool.length)] ?? null;
    },
  });

  const drawn: DrawnCardInfo[] = [];
  for (const slot of packResult.slots) {
    const cardId = slot.cardId;
    if (!cardId) continue;
    const createResult = await cardRepo.create({ profileId: userId, cardId, acquiredVia: 'pack' });
    if (createResult.ok) {
      drawn.push({
        cardId,
        userCardId: createResult.value.id,
        rarityCode: slot.rarityCode as RarityCode,
      });
    }
  }

  await packRepo.recordOpening({
    profileId: userId,
    packId,
    rngSeed: Number.parseInt(seed, 10) || 0,
    cardIds: drawn.map((d) => d.cardId),
  });

  // Atualizar progresso de missões
  const legendaryRarities = new Set(['legendary', 'ultra', 'world_cup_hero']);
  const brazilianCardIds = drawn.filter((d) => {
    const card = catalogMap.get(d.cardId);
    return card?.nationality === 'BR';
  });
  const legendaryCount = drawn.filter((d) => legendaryRarities.has(d.rarityCode)).length;

  void (async () => {
    try {
      await incrementMissionProgressInternal(userId, 'packsOpened', 1);
      await incrementMissionProgressInternal(userId, 'cardsOwned', drawn.length);
      if (legendaryCount > 0) {
        await incrementMissionProgressInternal(userId, 'legendaryCards', legendaryCount);
      }
      if (brazilianCardIds.length > 0) {
        await incrementMissionProgressInternal(userId, 'brazilianCards', brazilianCardIds.length);
      }
      await checkAndMarkCompletedSetsInternal(userId, drawn.map((d) => d.cardId));
      await checkAndUnlockAchievementsInternal(userId);
    } catch {
      // Falha silenciosa
    }
  })();

  return { ok: true, drawn, newBalance: debitResult.value };
}
