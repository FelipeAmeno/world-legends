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
      <div className="page-header">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1.5"
          style={{ color: '#6a7090' }}
        >
          Formação
        </p>
        <div className="flex items-end gap-3">
          <h1 className="font-display text-4xl gold-text tracking-wider leading-none">
            SQUAD BUILDER
          </h1>
          <p className="text-muted text-xs pb-0.5">Arraste cartas · química em tempo real</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <PitchBuilder
          allCards={allCards}
          {...(initialState !== undefined ? { initialState } : {})}
        />
      </div>
    </div>
  );
}
