import { PremiumHome } from '@/components/home/PremiumHome';
import { getEvents } from '@/lib/events/mock-events';
import { deriveAccountProgress } from '@/lib/rewards-data';
import {
  buildSBStateFromSaved,
  getUserActiveSquad,
  getUserCollection,
  getUserMatchStats,
  getUserProfile,
} from '@/lib/server/game-data';
import { calcSnapshot, createSBState } from '@/lib/squad-builder';
import { getCurrentUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [profile, collection, squad, matchStats] = await Promise.all([
    getUserProfile(user.id),
    getUserCollection(user.id),
    getUserActiveSquad(user.id),
    getUserMatchStats(user.id),
  ]);

  const serverBalance = profile?.softCurrency ?? 0;
  const collectionCount = collection.length;
  const squadFormation = squad?.formation ?? null;

  // OVR/química reais do squad ativo — a Home não deve mostrar dados mockados
  // para um squad que o usuário nunca montou.
  let squadOverall = 0;
  let squadChemistry = 0;
  if (squad) {
    const partial = buildSBStateFromSaved(squad, collection);
    const state = { ...createSBState(partial.formation ?? '4-3-3'), ...partial };
    const snapshot = calcSnapshot(state);
    squadOverall = snapshot.rating.overall;
    squadChemistry = snapshot.chemistry.total;
  }

  const now = Date.now();
  const activeEventCount = getEvents().filter(
    (e) => now >= new Date(e.startsAt).getTime() && now < new Date(e.endsAt).getTime(),
  ).length;

  const progress = deriveAccountProgress({
    wins: matchStats.wins,
    draws: matchStats.draws,
    collectionCount,
  });

  return (
    <PremiumHome
      serverBalance={serverBalance}
      fragmentBalance={profile?.fragmentBalance ?? 0}
      username={profile?.username}
      collectionCount={collectionCount}
      squadFormation={squadFormation}
      activeEventCount={activeEventCount}
      squadOverall={squadOverall}
      squadChemistry={squadChemistry}
      wins={matchStats.wins}
      draws={matchStats.draws}
      losses={matchStats.losses}
      level={progress.level}
      xp={progress.xp}
      xpForNext={progress.xpForNext}
    />
  );
}
