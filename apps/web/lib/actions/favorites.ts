'use server';

// Migration SQL (run once in Supabase):
// CREATE TABLE card_favorites (
//   profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
//   card_id TEXT NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   PRIMARY KEY (profile_id, card_id)
// );
// CREATE INDEX ON card_favorites(profile_id);
// ALTER TABLE card_favorites ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "users manage own favorites" ON card_favorites
//   FOR ALL USING (auth.uid() = profile_id);

import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import { revalidatePath } from 'next/cache';

export async function getFavoriteCardIds(): Promise<string[]> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return [];
    // biome-ignore lint/suspicious/noExplicitAny: card_favorites not yet in generated DB types
    const db = getServiceDb() as any;
    const { data } = await db.from('card_favorites').select('card_id').eq('profile_id', userId);
    return ((data ?? []) as { card_id: string }[]).map((r) => r.card_id);
  } catch {
    return [];
  }
}

export async function toggleFavoriteCardAction(cardId: string): Promise<{ isFavorite: boolean }> {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { isFavorite: false };
    // biome-ignore lint/suspicious/noExplicitAny: card_favorites not yet in generated DB types
    const db = getServiceDb() as any;
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
