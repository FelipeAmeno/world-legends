import { CardFullPage } from '@/components/collection/CardFullPage';
import { getCollectionMap } from '@/lib/collection-data';
import { getUserCollection } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ cardId: string }>;
};

export default async function CardDetailPage({ params }: Props) {
  const { cardId } = await params;

  const catalog = getCollectionMap();
  const card = catalog.get(cardId);
  if (!card) notFound();

  const user = await getCurrentUser();
  const ownedCards = user ? await getUserCollection(user.id) : [];
  const owned = ownedCards.some((c) => c.cardId === cardId);

  return <CardFullPage card={card} owned={owned} />;
}
