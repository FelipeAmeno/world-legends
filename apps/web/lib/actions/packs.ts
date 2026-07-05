'use server';

import { checkAndUnlockAchievementsInternal } from '@/lib/actions/achievements';
import { checkAndMarkCompletedSetsInternal } from '@/lib/actions/collections';
import { incrementMissionProgressInternal } from '@/lib/actions/missions';
import { getCollectionMap } from '@/lib/collection-data';
import { crash } from '@/lib/crash/sentry';
import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import {
  SupabasePackRepository,
  SupabaseProfileRepository,
  SupabaseUserCardRepository,
} from '@world-legends/db';
import {
  CLASSIC_PACK,
  ELITE_PACK,
  GOAT_PACK,
  HERO_PACK,
  LEGEND_PACK,
  NATIONAL_PACK,
  STARTER_PACK,
  createPityCounter,
  createUserPityState,
  fragmentsForDuplicate,
  openPack,
  updatePityAfterOpening,
} from '@world-legends/packs';
import type { Pack, UserPityState } from '@world-legends/packs';
import type { RarityCode } from '@world-legends/types';
import { revalidatePath } from 'next/cache';

type PackDef = { pack: Pack; price: number; nationalityFilter?: string };

const PACK_DEFS: Record<string, PackDef> = {
  starter: { pack: STARTER_PACK, price: 75 },
  classic: { pack: CLASSIC_PACK, price: 250 },
  national: { pack: NATIONAL_PACK, price: 800, nationalityFilter: 'BR' },
  elite: { pack: ELITE_PACK, price: 2500 },
  hero: { pack: HERO_PACK, price: 7000 },
  legend: { pack: LEGEND_PACK, price: 20000 },
  goat: { pack: GOAT_PACK, price: 75000 },
};

const RARITY_ORDER: Record<RarityCode, number> = {
  common: 0,
  rare: 1,
  elite: 2,
  legendary: 3,
  ultra: 4,
  world_cup_hero: 5,
};

export type DrawnCardInfo = {
  cardId: string;
  userCardId: string;
  rarityCode: RarityCode;
  isDuplicate: boolean;
  fragmentsGained: number;
};

export type OpenPackResult =
  | { ok: true; drawn: DrawnCardInfo[]; newBalance: number; totalFragments: number }
  | { ok: false; error: string };

// ─── Pity state helpers ───────────────────────────────────────────────────────

/** Lê os contadores de pity do banco e constrói o UserPityState. */
async function loadPityState(
  packRepo: SupabasePackRepository,
  userId: string,
): Promise<UserPityState> {
  const [legResult, ultraResult] = await Promise.all([
    packRepo.getPityCounter(userId, 'legendary_plus'),
    packRepo.getPityCounter(userId, 'ultra_plus'),
  ]);
  return {
    legendaryPlus: createPityCounter('legendary_plus', legResult.ok ? legResult.value : 0),
    ultraPlus: createPityCounter('ultra_plus', ultraResult.ok ? ultraResult.value : 0),
  };
}

/** Persiste o pity state atualizado no banco (upsert por tipo). */
async function savePityState(
  packRepo: SupabasePackRepository,
  userId: string,
  oldState: UserPityState,
  newState: UserPityState,
): Promise<void> {
  const updates: Array<['legendary_plus' | 'ultra_plus', number, number]> = [
    [
      'legendary_plus',
      oldState.legendaryPlus.packsSinceLastHit,
      newState.legendaryPlus.packsSinceLastHit,
    ],
    ['ultra_plus', oldState.ultraPlus.packsSinceLastHit, newState.ultraPlus.packsSinceLastHit],
  ];

  for (const [pityType, oldCount, newCount] of updates) {
    if (newCount === 0 && oldCount !== 0) {
      await packRepo.resetPityCounter(userId, pityType);
    } else if (newCount > oldCount) {
      // Incrementar apenas uma vez por abertura
      await packRepo.incrementPityCounter(userId, pityType);
    }
  }
}

// ─── Server Action ────────────────────────────────────────────────────────────

export async function openPackAction(packId: string): Promise<OpenPackResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const packDef = PACK_DEFS[packId];
  if (!packDef) return { ok: false, error: 'Pack inválido.' };

  const db = getServiceDb();
  const profileRepo = new SupabaseProfileRepository(db);
  const cardRepo = new SupabaseUserCardRepository(db);
  const packRepo = new SupabasePackRepository(db);

  // ── P7: verificar saldo antes de qualquer mutação ─────────────────────────

  const profileResult = await profileRepo.findById(userId);
  if (!profileResult.ok || !profileResult.value) {
    return { ok: false, error: 'Perfil não encontrado.' };
  }
  if (profileResult.value.softCurrency < packDef.price) {
    return { ok: false, error: 'Créditos insuficientes.' };
  }

  // ── P4: carregar pity state real do banco ─────────────────────────────────

  const pityState = await loadPityState(packRepo, userId);

  // ── Preparar catálogo + coleção existente do usuário ─────────────────────

  const catalogMap = getCollectionMap();
  const byRarity = new Map<RarityCode, string[]>();
  for (const [cardId, card] of catalogMap) {
    // Filtro de nacionalidade para National Pack e similares
    if (packDef.nationalityFilter && card.nationality !== packDef.nationalityFilter) continue;
    const pool = byRarity.get(card.rarityCode) ?? [];
    pool.push(cardId);
    byRarity.set(card.rarityCode, pool);
  }

  // Carregar coleção existente para detecção de duplicatas
  const existingCards = await cardRepo.findByProfile(userId);
  const ownedCardIds = new Set<string>(
    existingCards.ok ? existingCards.value.map((c) => c.cardId) : [],
  );

  // ── Simular abertura (puro, sem efeitos colaterais) ───────────────────────

  const seed = String(Date.now() ^ Math.trunc(Math.random() * 0xffffffff));
  const usedCardIds = new Set<string>();
  const usedPlayerIds = new Set<string>();
  const packResult = openPack({
    packOpeningId: `opening-${userId}-${Date.now()}`,
    pack: packDef.pack,
    seed,
    pityState,
    cardResolver: (rarityCode) => {
      // Preferir cartas que o usuário não possui (evitar duplicatas quando possível)
      const notUsedThisPack = (id: string) => {
        if (usedCardIds.has(id)) return false;
        const pid = catalogMap.get(id)?.playerId;
        return !pid || !usedPlayerIds.has(pid);
      };
      const notOwned = (id: string) => !ownedCardIds.has(id) && notUsedThisPack(id);

      const rarityPool = byRarity.get(rarityCode as RarityCode) ?? [];
      // Primeiro tenta não-duplicatas; se não houver, aceita qualquer carta
      const preferred = rarityPool.filter(notOwned);
      const fallback = rarityPool.filter(notUsedThisPack);
      const globalFallback = [...catalogMap.keys()].filter(notUsedThisPack);

      const source =
        preferred.length > 0 ? preferred : fallback.length > 0 ? fallback : globalFallback;
      if (source.length === 0) return null;
      const picked = source[Math.floor(Math.random() * source.length)] ?? null;
      if (picked) {
        usedCardIds.add(picked);
        const pid = catalogMap.get(picked)?.playerId;
        if (pid) usedPlayerIds.add(pid);
      }
      return picked;
    },
  });

  // ── Processar slots: classificar novo vs. duplicata ──────────────────────

  type SlotInfo = { cardId: string; rarityCode: RarityCode; isDuplicate: boolean; frags: number };
  const slots: SlotInfo[] = [];
  let pendingFragments = 0;

  for (const slot of packResult.slots) {
    const cardId = slot.cardId;
    if (!cardId) continue;
    const rarityCode = slot.rarityCode as RarityCode;
    const isDuplicate = ownedCardIds.has(cardId);
    const frags = isDuplicate ? fragmentsForDuplicate(rarityCode) : 0;
    if (isDuplicate) pendingFragments += frags;
    slots.push({ cardId, rarityCode, isDuplicate, frags });
  }

  // ── P2: criar user_cards apenas para cartas novas ─────────────────────────

  const createdUserCardIds = new Map<string, string>(); // cardId → userCardId
  for (const { cardId, isDuplicate } of slots) {
    if (isDuplicate) continue;
    const createResult = await cardRepo.create({ profileId: userId, cardId, acquiredVia: 'pack' });
    if (createResult.ok) {
      createdUserCardIds.set(cardId, createResult.value.id);
      ownedCardIds.add(cardId); // previne duplicata dentro do mesmo pack
    }
  }

  const drawn: DrawnCardInfo[] = slots.map(({ cardId, rarityCode, isDuplicate, frags }) => ({
    cardId,
    userCardId: isDuplicate ? '' : (createdUserCardIds.get(cardId) ?? ''),
    rarityCode,
    isDuplicate,
    fragmentsGained: frags,
  }));

  // ── Debitar créditos ──────────────────────────────────────────────────────

  const debitResult = await profileRepo.debitSoftCurrency(userId, packDef.price);
  if (!debitResult.ok) {
    // Compensação: remover user_cards criados
    await Promise.allSettled([...createdUserCardIds.values()].map((id) => cardRepo.delete(id)));
    return { ok: false, error: debitResult.error.message };
  }

  // ── Creditar fragmentos de duplicatas (fire-and-forget) ───────────────────

  const newBalance = debitResult.value;
  if (pendingFragments > 0) {
    profileRepo.creditFragments(userId, pendingFragments).catch((e) => {
      crash.captureError(e, {
        context: 'pack_fragment_credit',
        userId,
        extras: { packId, pendingFragments },
        level: 'warning',
      });
    });
  }

  // ── P4: atualizar pity state no banco ─────────────────────────────────────

  const highestRarity = drawn.reduce<RarityCode>(
    (best, d) =>
      (RARITY_ORDER[d.rarityCode] ?? 0) > (RARITY_ORDER[best] ?? 0) ? d.rarityCode : best,
    'common',
  );
  const newPityState = updatePityAfterOpening(pityState, highestRarity);
  savePityState(packRepo, userId, pityState, newPityState).catch((e) => {
    crash.captureError(e, {
      context: 'pack_pity_save',
      userId,
      extras: { packId },
      level: 'warning',
    });
  });

  // ── Registrar abertura no banco ───────────────────────────────────────────

  await packRepo.recordOpening({
    profileId: userId,
    packId,
    rngSeed: Number.parseInt(seed, 10) || 0,
    cardIds: drawn.map((d) => d.cardId),
  });

  // ── Atualizar progresso de missões (background, não bloqueia) ────────────

  const LEGENDARY_RARITIES = new Set<string>(['legendary', 'ultra', 'world_cup_hero']);
  const newCards = drawn.filter((d) => !d.isDuplicate);
  const brazilianCount = newCards.filter(
    (d) => catalogMap.get(d.cardId)?.nationality === 'BR',
  ).length;
  const legendaryCount = drawn.filter((d) => LEGENDARY_RARITIES.has(d.rarityCode)).length;

  void (async () => {
    try {
      await incrementMissionProgressInternal(userId, 'packsOpened', 1);
      await incrementMissionProgressInternal(userId, 'cardsOwned', newCards.length);
      if (legendaryCount > 0) {
        await incrementMissionProgressInternal(userId, 'legendaryCards', legendaryCount);
      }
      if (brazilianCount > 0) {
        await incrementMissionProgressInternal(userId, 'brazilianCards', brazilianCount);
      }
      await checkAndMarkCompletedSetsInternal(
        userId,
        newCards.map((d) => d.cardId),
      );
      await checkAndUnlockAchievementsInternal(userId);
    } catch (e) {
      crash.captureError(e, {
        context: 'pack_post_open_background',
        userId,
        extras: { packId },
        level: 'warning',
      });
    }
  })();

  revalidatePath('/', 'layout');

  return { ok: true, drawn, newBalance, totalFragments: pendingFragments };
}
