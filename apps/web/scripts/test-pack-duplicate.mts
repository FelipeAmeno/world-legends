import { createServiceClient } from '@world-legends/db';
import { openPackForUser } from '../lib/actions/packs.ts';

const db = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const TEST_USERNAME = 'felipeameno5';

async function main() {
  const { data: profile } = await db
    .from('profiles')
    .select('id, soft_currency, fragment_balance')
    .eq('username', TEST_USERNAME)
    .single();
  const userId = profile!.id as string;
  const originalBalance = profile!.soft_currency as number;
  const originalFragments = profile!.fragment_balance as number;
  await db.from('profiles').update({ soft_currency: 500000 }).eq('id', userId);

  const { count: ownedBefore } = await db
    .from('user_cards')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId);

  const createdIds: string[] = [];
  let duplicateFound = false;
  let fragmentsTotal = 0;
  // Abre packs 'classic' repetidamente até achar uma duplicata (pool pequeno, deve ocorrer rápido)
  for (let i = 0; i < 60 && !duplicateFound; i++) {
    const result = await openPackForUser(userId, 'classic');
    if (!result.ok) {
      console.log(JSON.stringify({ error: result.error, attempt: i }));
      break;
    }
    for (const d of result.drawn) {
      if (d.userCardId) createdIds.push(d.userCardId);
      if (d.isDuplicate) {
        duplicateFound = true;
        fragmentsTotal += d.fragmentsGained;
      }
    }
  }

  // creditFragments é fire-and-forget dentro de openPackForUser — aguarda um
  // instante para a escrita assíncrona no banco terminar antes de checar.
  await new Promise((r) => setTimeout(r, 2000));
  const { data: profAfter } = await db
    .from('profiles')
    .select('fragment_balance')
    .eq('id', userId)
    .single();

  await db
    .from('profiles')
    .update({ soft_currency: originalBalance, fragment_balance: originalFragments })
    .eq('id', userId);
  if (createdIds.length > 0) await db.from('user_cards').delete().in('id', createdIds);

  console.log(
    JSON.stringify(
      {
        ownedBefore,
        duplicateFound,
        fragmentsGainedThisSlot: fragmentsTotal,
        fragmentBalanceAfterOpening: profAfter?.fragment_balance,
        newCardsCreated: createdIds.length,
      },
      null,
      2,
    ),
  );
}

main();
