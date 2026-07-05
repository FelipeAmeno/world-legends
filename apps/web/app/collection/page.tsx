import { HallOfLegendsExperience } from '@/components/hall-of-legends/HallOfLegendsExperience';
import { getFavoriteCardIds } from '@/lib/actions/favorites';
import { getCollection } from '@/lib/collection-data';
import { getUserCollection } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function CollectionPage() {
  const user = await getCurrentUser();

  const catalogCards = getCollection();
  const [ownedCards, initialFavoriteIds] = await Promise.all([
    user ? getUserCollection(user.id) : Promise.resolve([]),
    user ? getFavoriteCardIds() : Promise.resolve([]),
  ]);
  const ownedCardIds = new Set(ownedCards.map((c) => c.cardId));

  return (
    <div className="flex flex-col h-full">
      <HallOfLegendsExperience
        catalogCards={catalogCards}
        ownedCardIds={ownedCardIds}
        isAuthenticated={!!user}
        initialFavoriteIds={initialFavoriteIds}
      />
    </div>
  );
}
