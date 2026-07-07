'use server';

import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import { SupabaseProfileRepository, SupabaseUserCardRepository } from '@world-legends/db';
import type { ClaimStarterResult, UpdateProfileResult } from './profile.types';

// ─── claimStarterPack ─────────────────────────────────────────────────────────

const STARTER_CARD_IDS = [
  'taffarel-elite',
  'cafu-legendary',
  'lucio-elite',
  'roberto-carlos-legendary',
  'falcao-elite',
  'socrates-rare',
  'rivaldo-legendary',
  'bebeto-rare',
  'ronaldo-ultra',
  'zico-legendary',
  'romario-legendary',
] as const;

/**
 * Concede cartas iniciais ao usuário se ainda não tem nenhuma.
 * Idempotente — pode ser chamado múltiplas vezes sem duplicar cartas.
 */
export async function claimStarterPack(): Promise<ClaimStarterResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const db = getServiceDb();
  const cardRepo = new SupabaseUserCardRepository(db);

  const existing = await cardRepo.findByProfile(userId);
  if (existing.ok && existing.value.length > 0) {
    return { ok: true, cardIds: existing.value.map((c) => c.cardId) };
  }

  const inserted: string[] = [];
  for (const cardId of STARTER_CARD_IDS) {
    const result = await cardRepo.create({ profileId: userId, cardId, acquiredVia: 'starter' });
    if (result.ok) inserted.push(cardId);
  }

  return { ok: true, cardIds: inserted };
}

// ─── updateProfile ────────────────────────────────────────────────────────────

export async function updateProfile(input: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<UpdateProfileResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const db = getServiceDb();
  const repo = new SupabaseProfileRepository(db);
  const result = await repo.update(userId, input);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}
