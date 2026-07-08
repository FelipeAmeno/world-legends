import { PitchBuilder } from '@/components/squad/premium/PitchBuilder';
import { getFavoriteCardIds } from '@/lib/actions/favorites';
import { getCollection } from '@/lib/collection-data';
import {
  buildSBStateFromSaved,
  getUserActiveSquad,
  getUserCollection,
} from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function SquadPage() {
  const user = await getCurrentUser();

  const [allCards, favoriteIds, savedSquad] = await Promise.all([
    user ? getUserCollection(user.id) : Promise.resolve(getCollection()),
    user ? getFavoriteCardIds() : Promise.resolve([]),
    user ? getUserActiveSquad(user.id) : Promise.resolve(null),
  ]);

  let initialState = undefined;
  if (savedSquad && allCards.length > 0) {
    initialState = buildSBStateFromSaved(savedSquad, allCards);
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: [
          'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(22,101,52,0.16) 0%, transparent 55%)',
          'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(5,150,105,0.10) 0%, transparent 55%)',
          '#050508',
        ].join(', '),
      }}
    >
      <div className="flex-1 min-h-0">
        <PitchBuilder
          allCards={allCards}
          favoriteIds={new Set(favoriteIds)}
          {...(initialState !== undefined ? { initialState } : {})}
        />
      </div>
    </div>
  );
}
