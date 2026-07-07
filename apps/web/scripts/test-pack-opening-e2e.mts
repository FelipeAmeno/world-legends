/**
 * Foundation Recovery — Sprint 16.1. Teste de integração real: chama
 * openPackForUser() (o MESMO código de produção usado por openPackAction,
 * só sem a camada de cookies/auth) contra o Supabase de produção, para um
 * perfil de teste real, para cada um dos 7 packs. Sem mocks.
 */
import { createServiceClient } from '@world-legends/db';
import { openPackForUser } from '../lib/actions/packs.ts';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const db = createServiceClient(SUPABASE_URL, SERVICE_KEY);

const TEST_USERNAME = 'felipeameno5';
const PACKS = ['starter', 'classic', 'national', 'elite', 'hero', 'legend', 'goat'];
const TOP_UP_BALANCE = 500000;

async function main() {
  const { data: profile, error } = await db
    .from('profiles')
    .select('id, soft_currency, fragment_balance')
    .eq('username', TEST_USERNAME)
    .single();
  if (error || !profile) throw new Error(`Perfil de teste não encontrado: ${error?.message}`);

  const userId = profile.id as string;
  const originalBalance = profile.soft_currency as number;
  const originalFragments = profile.fragment_balance as number;

  await db.from('profiles').update({ soft_currency: TOP_UP_BALANCE }).eq('id', userId);

  const results: Record<string, unknown>[] = [];
  const createdUserCardIds: string[] = [];

  for (const packId of PACKS) {
    const { count: openingsBefore } = await db
      .from('pack_openings')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId);
    const { count: cardsBefore } = await db
      .from('user_cards')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId);
    const { data: profBefore } = await db
      .from('profiles')
      .select('soft_currency, fragment_balance')
      .eq('id', userId)
      .single();

    const result = await openPackForUser(userId, packId);
    if (result.ok) {
      for (const d of result.drawn) {
        if (d.userCardId) createdUserCardIds.push(d.userCardId);
      }
    }

    const { count: openingsAfter } = await db
      .from('pack_openings')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId);
    const { count: cardsAfter } = await db
      .from('user_cards')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId);
    const { data: profAfter } = await db
      .from('profiles')
      .select('soft_currency, fragment_balance')
      .eq('id', userId)
      .single();

    results.push({
      packId,
      ok: result.ok,
      error: result.ok ? null : result.error,
      drawnCount: result.ok ? result.drawn.length : 0,
      duplicates: result.ok ? result.drawn.filter((d) => d.isDuplicate).length : 0,
      fragmentsGained: result.ok ? result.totalFragments : 0,
      balanceBefore: profBefore?.soft_currency,
      balanceAfter: profAfter?.soft_currency,
      fragmentBalanceBefore: profBefore?.fragment_balance,
      fragmentBalanceAfter: profAfter?.fragment_balance,
      packOpeningsRowWritten: (openingsAfter ?? 0) - (openingsBefore ?? 0) === 1,
      userCardsCreated: (cardsAfter ?? 0) - (cardsBefore ?? 0),
    });
  }

  // Restaura saldo original do perfil de teste
  await db
    .from('profiles')
    .update({ soft_currency: originalBalance, fragment_balance: originalFragments })
    .eq('id', userId);
  // Remove SOMENTE as cartas criadas por este teste (IDs exatos retornados pela
  // própria action) para não poluir a coleção do perfil de teste. pack_openings
  // fica como registro de auditoria — é exatamente o que estamos provando existir.
  if (createdUserCardIds.length > 0) {
    await db.from('user_cards').delete().in('id', createdUserCardIds);
  }

  console.log(
    JSON.stringify(
      { testProfile: TEST_USERNAME, createdUserCardIdsRemoved: createdUserCardIds.length, results },
      null,
      2,
    ),
  );
}

main();
