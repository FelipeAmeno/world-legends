import { PitchBuilder } from '@/components/squad/premium/PitchBuilder';
import { getCollection } from '@/lib/collection-data';
import {
  buildSBStateFromSaved,
  getUserActiveSquad,
  getUserCollection,
} from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function SquadPage() {
  const user = await getCurrentUser();

  const allCards = user ? await getUserCollection(user.id) : getCollection();

  let initialState = undefined;
  if (user && allCards.length > 0) {
    const saved = await getUserActiveSquad(user.id);
    if (saved) initialState = buildSBStateFromSaved(saved, allCards);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <PitchBuilder
          allCards={allCards}
          {...(initialState !== undefined ? { initialState } : {})}
        />
      </div>
    </div>
  );
}
