'use server';

import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import type { SaveSquadInput, SaveSquadResult } from './squad.types';

/**
 * Cria ou atualiza o squad ativo do usuário.
 * Substitui completamente os squad_slots existentes (operação idempotente).
 */
export async function saveSquad(input: SaveSquadInput): Promise<SaveSquadResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getServiceDb() as any;

  const { data: existing } = (await db
    .from('squads')
    .select('id')
    .eq('profile_id', userId)
    .eq('is_active', true)
    .maybeSingle()) as { data: { id: string } | null; error: unknown };

  let squadId: string;

  if (existing?.id) {
    await db
      .from('squads')
      .update({ formation: input.formation, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    squadId = existing.id;
  } else {
    const { data: newSquad, error } = (await db
      .from('squads')
      .insert({
        profile_id: userId,
        formation: input.formation,
        name: 'Meu Squad',
        is_active: true,
        chemistry_score: 0,
        tactic_mentality: 'balanced',
        captain_user_card_id: null,
      })
      .select('id')
      .single()) as { data: { id: string } | null; error: { message: string } | null };

    if (error || !newSquad) return { ok: false, error: error?.message ?? 'Erro ao criar squad.' };
    squadId = newSquad.id;
  }

  await db.from('squad_slots').delete().eq('squad_id', squadId);

  if (input.slots.length > 0) {
    const { error: insertErr } = (await db.from('squad_slots').insert(
      input.slots.map((s) => ({
        squad_id: squadId,
        slot_position: s.slotId,
        user_card_id: s.userCardId,
        is_starter: s.isStarter,
        bench_order: s.benchOrder ?? null,
      })),
    )) as { error: { message: string } | null };
    if (insertErr) return { ok: false, error: insertErr.message };
  }

  return { ok: true, squadId };
}
