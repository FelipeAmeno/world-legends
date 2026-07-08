/**
 * app/match/page.tsx — T055 Match Experience
 */
import { MatchExperience } from '@/components/match/premium/MatchExperience';
import {
  buildSBStateFromSaved,
  getUserActiveSquad,
  getUserCollection,
} from '@/lib/server/game-data';
import { calcSnapshot, createSBState } from '@/lib/squad-builder';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function MatchPage() {
  const user = await getCurrentUser();

  let userOvr = 0;
  if (user) {
    const [collection, squad] = await Promise.all([
      getUserCollection(user.id),
      getUserActiveSquad(user.id),
    ]);
    if (squad) {
      const partial = buildSBStateFromSaved(squad, collection);
      const state = { ...createSBState(partial.formation ?? '4-3-3'), ...partial };
      userOvr = calcSnapshot(state).rating.overall;
    }
  }

  return <MatchExperience userOvr={userOvr} />;
}
