'use server';

import { getCollectionMap } from '@/lib/collection-data';
import { incrementMissionProgressInternal } from '@/lib/actions/missions';
import { checkAndMarkCompletedSetsInternal } from '@/lib/actions/collections';
import { checkAndUnlockAchievementsInternal } from '@/lib/actions/achievements';
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
  LEGEND_PACK,
  createPityCounter,
  createUserPityState,
  openPack,
  updatePityAfterOpening,
} from '@world-legends/packs';
import type { Pack, UserPityState } from '@world-legends/packs';
import type { RarityCode } from '@world-legends/types';

const PACK_DEFS: Record<string, { pack: Pack; price: number }> = {
  classic: { pack: CLASSIC_PACK, price: 150 },
  elite:   { pack: ELITE_PACK,   price: 400 },
  legend:  { pack: LEGEND_PACK,  price: 1000 },
};

const RARITY_ORDER: Record<RarityCode, number> = {
  common: 0, rare: 1, elite: 2, legendary: 3, ultra: 4, world_cup_hero: 5,
};

export type DrawnCardInfo = {
  cardId:     string;
  userCardId: string;
  rarityCode: RarityCode;
};

export type OpenPackResult =
  | { ok: true;  drawn: DrawnCardInfo[]; newBalance: number }
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
    ultraPlus:     createPityCounter('ultra_plus',     ultraResult.ok ? ultraResult.value : 0),
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
    ['legendary_plus', oldState.legendaryPlus.packsSinceLastHit, newState.legendaryPlus.packsSinceLastHit],
    ['ultra_plus',     oldState.ultraPlus.packsSinceLastHit,     newState.ultraPlus.packsSinceLastHit],
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
  const cardRepo    = new SupabaseUserCardRepository(db);
  const packRepo    = new SupabasePackRepository(db);

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

  // ── Preparar catálogo de cartas ───────────────────────────────────────────

  const catalogMap = getCollectionMap();
  const byRarity   = new Map<RarityCode, string[]>();
  for (const [cardId, card] of catalogMap) {
    const pool = byRarity.get(card.rarityCode) ?? [];
    pool.push(cardId);
    byRarity.set(card.rarityCode, pool);
  }

  // ── Simular abertura (puro, sem efeitos colaterais) ───────────────────────

  const seed = String(Date.now() ^ Math.trunc(Math.random() * 0xffffffff));
  const usedCardIds = new Set<string>();
  const packResult = openPack({
    packOpeningId: `opening-${userId}-${Date.now()}`,
    pack:  packDef.pack,
    seed,
    pityState,
    cardResolver: (rarityCode) => {
      const pool = (byRarity.get(rarityCode as RarityCode) ?? []).filter((id) => !usedCardIds.has(id));
      const fallbackPool = [...catalogMap.keys()].filter((id) => !usedCardIds.has(id));
      const source = pool.length > 0 ? pool : fallbackPool;
      if (source.length === 0) return null;
      const picked = source[Math.floor(Math.random() * source.length)] ?? null;
      if (picked) usedCardIds.add(picked);
      return picked;
    },
  });

  // ── P2: criar cartas ANTES de debitar ────────────────────────────────────
  // Se o débito falhar, as cartas criadas são deletadas (compensação).

  const created: DrawnCardInfo[] = [];
  for (const slot of packResult.slots) {
    const cardId = slot.cardId;
    if (!cardId) continue;
    const createResult = await cardRepo.create({ profileId: userId, cardId, acquiredVia: 'pack' });
    if (createResult.ok) {
      created.push({
        cardId,
        userCardId: createResult.value.id,
        rarityCode: slot.rarityCode as RarityCode,
      });
    }
  }

  // ── Debitar créditos ──────────────────────────────────────────────────────

  const debitResult = await profileRepo.debitSoftCurrency(userId, packDef.price);
  if (!debitResult.ok) {
    // Compensação: remover cartas criadas antes de retornar erro
    await Promise.allSettled(created.map((d) => cardRepo.delete(d.userCardId)));
    return { ok: false, error: debitResult.error.message };
  }

  // ── P4: atualizar pity state no banco ─────────────────────────────────────

  const highestRarity = created.reduce<RarityCode>(
    (best, d) => (RARITY_ORDER[d.rarityCode] ?? 0) > (RARITY_ORDER[best] ?? 0) ? d.rarityCode : best,
    'common',
  );
  const newPityState = updatePityAfterOpening(pityState, highestRarity);
  // Fire-and-forget: falha de pity não deve bloquear o retorno ao usuário
  savePityState(packRepo, userId, pityState, newPityState).catch((e) => {
    crash.captureError(e, { context: 'pack_pity_save', userId, extras: { packId }, level: 'warning' });
  });

  // ── Registrar abertura no banco ───────────────────────────────────────────

  await packRepo.recordOpening({
    profileId: userId,
    packId,
    rngSeed: Number.parseInt(seed, 10) || 0,
    cardIds: created.map((d) => d.cardId),
  });

  // ── Atualizar progresso de missões (background, não bloqueia) ────────────

  const LEGENDARY_RARITIES = new Set<string>(['legendary', 'ultra', 'world_cup_hero']);
  const brazilianCount = created.filter((d) => catalogMap.get(d.cardId)?.nationality === 'BR').length;
  const legendaryCount = created.filter((d) => LEGENDARY_RARITIES.has(d.rarityCode)).length;

  void (async () => {
    try {
      await incrementMissionProgressInternal(userId, 'packsOpened', 1);
      await incrementMissionProgressInternal(userId, 'cardsOwned', created.length);
      if (legendaryCount > 0) {
        await incrementMissionProgressInternal(userId, 'legendaryCards', legendaryCount);
      }
      if (brazilianCount > 0) {
        await incrementMissionProgressInternal(userId, 'brazilianCards', brazilianCount);
      }
      await checkAndMarkCompletedSetsInternal(userId, created.map((d) => d.cardId));
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

  return { ok: true, drawn: created, newBalance: debitResult.value };
}
