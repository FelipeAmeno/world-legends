import { createServiceClient } from '@world-legends/db';
import { openPackForUser } from '../lib/actions/packs.ts';
import { enrichWithUserCards } from '../lib/collection-data.ts';

const db = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const TEST_USERNAME = 'felipeameno5';

async function main() {
  const { data: profile } = await db
    .from('profiles')
    .select('id, soft_currency')
    .eq('username', TEST_USERNAME)
    .single();
  const userId = profile!.id as string;
  const originalBalance = profile!.soft_currency as number;
  await db.from('profiles').update({ soft_currency: 500000 }).eq('id', userId);

  const result = await openPackForUser(userId, 'elite');
  if (!result.ok) throw new Error(result.error);

  const rows = result.drawn
    .filter((d) => !d.isDuplicate)
    .map((d) => ({
      cardId: d.cardId,
      userCardId: d.userCardId,
      acquiredAt: new Date().toISOString(),
    }));
  const enriched = enrichWithUserCards(rows);

  await db.from('profiles').update({ soft_currency: originalBalance }).eq('id', userId);
  const idsToDelete = result.drawn.filter((d) => d.userCardId).map((d) => d.userCardId);
  if (idsToDelete.length > 0) await db.from('user_cards').delete().in('id', idsToDelete);

  console.log(
    JSON.stringify(
      {
        drawn: result.drawn.length,
        resolvedByEnrichWithUserCards: enriched.length,
        sample: enriched.slice(0, 2).map((c) => ({
          cardId: c.cardId,
          displayName: c.displayName,
          overall: c.overall,
          rarityCode: c.rarityCode,
          userCardId: c.userCardId,
        })),
      },
      null,
      2,
    ),
  );
}

main();
