import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/server';
import { getUserActiveSquad, getUserCollection, getUserProfile } from '@/lib/server/game-data';
import { getEvents } from '@/lib/events/mock-events';
import { PremiumHome } from '@/components/home/PremiumHome';

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const [profile, collection, squad] = await Promise.all([
    getUserProfile(user.id),
    getUserCollection(user.id),
    getUserActiveSquad(user.id),
  ]);

  const serverBalance = profile?.softCurrency ?? 0;
  const isNewUser = collection.length === 0;
  const collectionCount = collection.length;
  const squadFormation = squad?.formation ?? null;

  const now = Date.now();
  const activeEventCount = getEvents().filter(
    (e) => now >= new Date(e.startsAt).getTime() && now < new Date(e.endsAt).getTime(),
  ).length;

  return (
    <PremiumHome
      serverBalance={serverBalance}
      isNewUser={isNewUser}
      collectionCount={collectionCount}
      squadFormation={squadFormation}
      activeEventCount={activeEventCount}
    />
  );
}
