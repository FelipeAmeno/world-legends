import { CardFullPage } from '@/components/collection/CardFullPage';
import { getCollectionMap } from '@/lib/collection-data';
import { getUserCollection } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ cardId: string }>;
};

export default async function CardDetailPage({ params }: Props) {
  const { cardId: rawCardId } = await params;
  // Sprint 37 — o param de rota chega ainda percent-encoded (ex.
  // "pel%C3%A9-world_cup_hero" em vez de "pelé-world_cup_hero") pra
  // qualquer cardId com caractere não-ASCII — jogadores com acento no
  // nome (Pelé) nunca abriam a própria página de detalhe, sempre caindo
  // em notFound() mesmo a carta existindo no catálogo. `.normalize` cobre
  // o caso raro de normalização Unicode divergente (NFC vs. NFD) depois
  // do decode.
  const cardId = decodeURIComponent(rawCardId).normalize('NFC');

  const catalog = getCollectionMap();
  const card = catalog.get(cardId);
  if (!card) notFound();

  const user = await getCurrentUser();
  const ownedCards = user ? await getUserCollection(user.id) : [];
  const owned = ownedCards.some((c) => c.cardId === cardId);

  return <CardFullPage card={card} owned={owned} />;
}
