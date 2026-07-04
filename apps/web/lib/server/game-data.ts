/**
 * lib/server/game-data.ts
 *
 * Funções de leitura server-side do banco Supabase.
 * Chamadas apenas de Server Components — nunca importadas em Client Components.
 *
 * Usa service_role para leitura direta (contorna RLS de forma controlada).
 */

import { type CollectionCard, enrichWithUserCards } from '@/lib/collection-data';
import { getServiceDb } from '@/lib/server/db';
import type { SBState } from '@/lib/squad-builder';
import type { FormationKey } from '@/lib/squad-data';
import { SupabaseProfileRepository, SupabaseUserCardRepository } from '@world-legends/db';
import type { ProfileRow } from '@world-legends/db';

// ─── Coleção do usuário ───────────────────────────────────────────────────────

/**
 * Retorna as cartas que o usuário possui, enriquecidas com dados do catálogo.
 * Retorna [] se usuário não tem cartas ou ocorre erro.
 */
export async function getUserCollection(userId: string): Promise<CollectionCard[]> {
  const db = getServiceDb();
  const repo = new SupabaseUserCardRepository(db);
  const result = await repo.findByProfile(userId);
  if (!result.ok) return [];
  return enrichWithUserCards(
    result.value.map((uc) => ({ cardId: uc.cardId, userCardId: uc.id, acquiredAt: uc.acquiredAt instanceof Date ? uc.acquiredAt.toISOString() : String(uc.acquiredAt) })),
  );
}

// ─── Perfil do usuário ────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<ProfileRow | null> {
  const db = getServiceDb();
  const repo = new SupabaseProfileRepository(db);
  const result = await repo.findById(userId);
  return result.ok ? result.value : null;
}

// ─── Squad salvo ─────────────────────────────────────────────────────────────

export type SavedSquadSlot = {
  slotId: string;
  userCardId: string;
  isStarter: boolean;
  benchOrder: number | null;
};

export type SavedSquad = {
  id: string;
  formation: FormationKey;
  slots: SavedSquadSlot[];
};

/**
 * Carrega o squad ativo do usuário com seus slots.
 * Retorna null se o usuário não tem squad salvo.
 */
export async function getUserActiveSquad(userId: string): Promise<SavedSquad | null> {
  const db = getServiceDb();

  // Cast necessário — squads FK graph causa inferência 'never' no supabase-js 2.47
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: squad, error: squadErr } = (await (db
    .from('squads')
    .select('id, formation')
    .eq('profile_id', userId)
    .eq('is_active', true)
    .maybeSingle() as any)) as {
    data: { id: string; formation: string } | null;
    error: { message: string } | null;
  };

  if (squadErr || !squad) return null;

  // Cast needed — squad_slots FK graph causes 'never' inference with supabase-js 2.47
  type SlotRow = {
    id: string;
    slot_position: string;
    user_card_id: string;
    is_starter: boolean;
    bench_order: number | null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: slots, error: slotsErr } = (await (db
    .from('squad_slots')
    .select('*')
    .eq('squad_id', squad.id) as any)) as {
    data: SlotRow[] | null;
    error: { message: string } | null;
  };

  if (slotsErr) return null;

  return {
    id: squad.id,
    formation: squad.formation as FormationKey,
    slots: (slots ?? []).map((s) => ({
      slotId: s.slot_position,
      userCardId: s.user_card_id,
      isStarter: s.is_starter,
      benchOrder: s.bench_order,
    })),
  };
}

/**
 * Reconstrói o SBState a partir dos dados do banco.
 * Requer a coleção do usuário (com userCardId) para montar as cartas nos slots.
 */
export function buildSBStateFromSaved(
  saved: SavedSquad,
  userCards: CollectionCard[],
): Partial<SBState> {
  const cardByUserCardId = new Map(
    userCards.filter((c) => c.userCardId).map((c) => [c.userCardId!, c]),
  );

  const slots: Record<string, CollectionCard | null> = {};
  const bench: (CollectionCard | null)[] = Array(7).fill(null);

  for (const slot of saved.slots) {
    const card = cardByUserCardId.get(slot.userCardId) ?? null;
    if (slot.isStarter) {
      slots[slot.slotId] = card;
    } else if (slot.benchOrder !== null) {
      bench[slot.benchOrder] = card;
    }
  }

  return { formation: saved.formation, slots, bench };
}
