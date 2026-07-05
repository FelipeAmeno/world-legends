import { PremiumHome } from '@/components/home/PremiumHome';
import { getEvents } from '@/lib/events/mock-events';
import { getUserActiveSquad, getUserCollection, getUserProfile } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [profile, collection, squad] = await Promise.all([
    getUserProfile(user.id),
    getUserCollection(user.id),
    getUserActiveSquad(user.id),
  ]);

  const serverBalance = profile?.softCurrency ?? 0;
  const collectionCount = collection.length;
  const squadFormation = squad?.formation ?? null;

  const now = Date.now();
  const activeEventCount = getEvents().filter(
    (e) => now >= new Date(e.startsAt).getTime() && now < new Date(e.endsAt).getTime(),
  ).length;

  return (
    <PremiumHome
      serverBalance={serverBalance}
      collectionCount={collectionCount}
      squadFormation={squadFormation}
      activeEventCount={activeEventCount}
    />
  );
}
