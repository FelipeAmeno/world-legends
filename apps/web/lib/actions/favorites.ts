'use server';

import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import { revalidatePath } from 'next/cache';

export async function getFavoriteCardIds(): Promise<string[]> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return [];
    const db = getServiceDb();
    const { data } = await db.from('card_favorites').select('card_id').eq('profile_id', userId);
    return (data ?? []).map((r) => r.card_id);
  } catch {
    return [];
  }
}

export async function toggleFavoriteCardAction(cardId: string): Promise<{ isFavorite: boolean }> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { isFavorite: false };
    const db = getServiceDb();
    const { data: existing } = await db
      .from('card_favorites')
      .select('card_id')
      .eq('profile_id', userId)
      .eq('card_id', cardId)
      .maybeSingle();
    if (existing) {
      await db.from('card_favorites').delete().eq('profile_id', userId).eq('card_id', cardId);
      revalidatePath('/collection');
      return { isFavorite: false };
    }
    await db.from('card_favorites').insert({ profile_id: userId, card_id: cardId });
    revalidatePath('/collection');
    return { isFavorite: true };
  } catch {
    return { isFavorite: false };
  }
}
