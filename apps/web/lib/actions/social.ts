'use server';

import { getServiceDb } from '@/lib/server/db';
import { getCurrentUser } from '@/lib/supabase/server';

type FriendResult = { ok: true; displayName: string | null } | { ok: false; error: string };

type LeagueCreateResult =
  | { ok: true; leagueId: string; code: string }
  | { ok: false; error: string };

type LeagueJoinResult = { ok: true; leagueName: string } | { ok: false; error: string };

// ─── Friend requests ──────────────────────────────────────────────────────────

export async function sendFriendRequestAction(targetFriendCode: string): Promise<FriendResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Não autenticado' };

  const db = getServiceDb();
  const normalized = targetFriendCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, display_name')
    .ilike('id', `${normalized.slice(0, 4)}%`)
    .limit(10);

  if (error || !profiles?.length) {
    return { ok: false, error: 'Código de amigo não encontrado' };
  }

  const target = profiles.find(
    (p) => p.id.replace(/-/g, '').toUpperCase().slice(0, 8) === normalized,
  );

  if (!target) return { ok: false, error: 'Código de amigo não encontrado' };
  if (target.id === user.id) return { ok: false, error: 'Não é possível adicionar você mesmo' };

  // Social tables not yet migrated
  return { ok: false, error: 'Sistema de amigos em breve' };
}

export async function acceptFriendRequestAction(
  _friendId: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Não autenticado' };
  return { ok: false, error: 'Sistema de amigos em breve' };
}

// ─── Private leagues ──────────────────────────────────────────────────────────

export async function createLeagueAction(_name: string): Promise<LeagueCreateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Não autenticado' };
  return { ok: false, error: 'Sistema de ligas em breve' };
}

export async function joinLeagueAction(_code: string): Promise<LeagueJoinResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Não autenticado' };
  return { ok: false, error: 'Sistema de ligas em breve' };
}

// ─── Social activity log ──────────────────────────────────────────────────────

export async function logSocialActivityAction(
  _type: string,
  _meta: Record<string, unknown> = {},
): Promise<void> {
  // Social activity table not yet migrated — no-op
}
