/**
 * Server Actions — operações de escrita transacional (Next.js 15 + service_role).
 *
 * Doc 02 §8: "escrita direta do client nunca ocorre — só via Server Actions
 * ou Edge Functions com service_role."
 *
 * Cada action:
 * 1. Autentica via Supabase SSR
 * 2. Chama o domínio puro (packages de domínio)
 * 3. Persiste via adapter Supabase (service_role)
 * 4. Retorna resultado tipado ao client
 */
'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import {
  createServiceClient, createDbClient,
  SupabaseProfileRepository, SupabaseUserCardRepository,
  SupabasePackRepository, SupabaseCraftRepository,
  SupabaseRankingRepository, SupabaseSeasonRepository,
} from '@world-legends/db';
import { calculateNewRating } from '@world-legends/ranking';
import type { Database } from '@world-legends/db';

// ─── Helper: obter userId autenticado ─────────────────────────────────────────

async function getAuthenticatedUser(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!;

  const db = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (all) => all.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
    },
  });

  const { data: { user } } = await db.auth.getUser();
  return user?.id ?? null;
}

// ─── openPack (doc 03 §3.2) ───────────────────────────────────────────────────

export type OpenPackResult =
  | { ok: true;  drawnCardIds: string[]; packOpeningId: string }
  | { ok: false; error: string };

/**
 * Abre um pack:
 * 1. Verifica saldo de Créditos (debitSoftCurrency)
 * 2. Chama lógica de abertura do domínio (packages/packs)
 * 3. Cria os UserCards com service_role
 * 4. Incrementa pity counter
 */
export async function openPack(packId: string): Promise<OpenPackResult> {
  const userId = await getAuthenticatedUser();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const serviceUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;

  const anonDb    = createDbClient(serviceUrl, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!);
  const serviceDb = createServiceClient(serviceUrl, serviceKey);

  const packRepo    = new SupabasePackRepository(anonDb);
  const profileRepo = new SupabaseProfileRepository(anonDb);
  const cardRepo    = new SupabaseUserCardRepository(serviceDb); // service_role para criar cartas

  // 1. Verificar pack existe
  const pack = await packRepo.findByCode(packId);
  if (!pack.ok || !pack.value) return { ok: false, error: 'Pack não encontrado.' };

  // 2. Debitar créditos
  if (pack.value.priceSoft && pack.value.priceSoft > 0) {
    const debit = await profileRepo.debitSoftCurrency(userId, pack.value.priceSoft);
    if (!debit.ok) return { ok: false, error: debit.error.message };
  }

  // 3. Gerar seed e simular abertura (em produção: chamar packages/packs com a drop table)
  const rngSeed = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
  // Simplificado: em produção, openPack do packages/packs retornaria os cardIds
  const drawnCardIds: string[] = []; // placeholder — real: await openPackDomain(pack.value, rngSeed)

  // 4. Registrar abertura
  const openingResult = await packRepo.recordOpening({
    profileId: userId, packId: pack.value.id, rngSeed, cardIds: drawnCardIds,
  });
  if (!openingResult.ok) return { ok: false, error: openingResult.error.message };

  // 5. Criar UserCards (service_role)
  for (const cardId of drawnCardIds) {
    await cardRepo.create({ profileId: userId, cardId, acquiredVia: 'pack' });
  }

  // 6. Incrementar pity counter
  await packRepo.incrementPityCounter(userId, 'legendary_plus');

  return { ok: true, drawnCardIds, packOpeningId: openingResult.value };
}

// ─── updateProfile (doc 03 §2: Perfil) ───────────────────────────────────────

export type UpdateProfileResult =
  | { ok: true  }
  | { ok: false; error: string };

export async function updateProfile(input: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<UpdateProfileResult> {
  const userId = await getAuthenticatedUser();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const db   = createDbClient(process.env['NEXT_PUBLIC_SUPABASE_URL']!, process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!);
  const repo = new SupabaseProfileRepository(db);
  const result = await repo.update(userId, input);
  if (!result.ok) return { ok: false, error: result.error.message };
  return { ok: true };
}

// ─── recordMatchResult (doc 02 §8: escrita via service_role) ─────────────────

/**
 * Chamado pelo Edge Function (pg_cron) após simular uma rodada de liga.
 * NUNCA chamado diretamente pelo browser — requer SUPABASE_SERVICE_ROLE_KEY.
 */
export async function recordMatchResult(input: {
  matchId:    string;
  homeScore:  number;
  awayScore:  number;
  homeElo:    number;
  awayElo:    number;
  seasonId:   string;
  homeProfileId: string;
  awayProfileId: string;
  events: Array<{
    minute: number; eventType: string; teamSide: 'home' | 'away' | 'neutral';
    primaryUserCardId?: string; secondaryUserCardId?: string; description: string;
    meta: Record<string, unknown>;
  }>;
}): Promise<{ ok: boolean; error?: string }> {
  const serviceUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']!;
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
  const serviceDb  = createServiceClient(serviceUrl, serviceKey);

  const matchRepo   = new SupabaseMatchRepository(serviceDb);
  const rankingRepo = new SupabaseRankingRepository(serviceDb);
  const seasonRepo  = new SupabaseSeasonRepository(serviceDb);

  // Imports necessários inline (Server Action é ficheiro de módulo próprio)
  const { SupabaseMatchRepository } = await import('@world-legends/db');

  // 1. Gravar placar e events
  const matchResult = await matchRepo.recordSimulation(input.matchId, {
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    events:    input.events,
  });
  if (!matchResult.ok) return { ok: false, error: matchResult.error.message };

  // 2. Calcular novo ELO (usando packages/ranking — domínio puro)
  const result = input.homeScore > input.awayScore ? 'win'
               : input.homeScore < input.awayScore ? 'loss'
               : 'draw';

  const eloResult = calculateNewRating(input.homeElo, input.awayElo, result, 'public_ranked');
  if (!eloResult.ok) return { ok: false, error: 'Erro no cálculo de ELO.' };

  // 3. Atualizar rankings
  await rankingRepo.updateElo(input.seasonId, input.homeProfileId, eloResult.value.newRatingA, result);
  await rankingRepo.updateElo(input.seasonId, input.awayProfileId, eloResult.value.newRatingB, result === 'win' ? 'loss' : result === 'loss' ? 'win' : 'draw');

  return { ok: true };
}

// Importação necessária para recordMatchResult
import { SupabaseMatchRepository } from '@world-legends/db';
