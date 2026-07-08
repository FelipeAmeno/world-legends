import { PackExperience } from '@/components/packs/PackExperience';
import { getUserCollection, getUserMatchStats, getUserProfile } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

type Props = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function PacksPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const [profile, matchStats, collection, params] = await Promise.all([
    user ? getUserProfile(user.id) : null,
    user ? getUserMatchStats(user.id) : null,
    user ? getUserCollection(user.id) : Promise.resolve([]),
    searchParams,
  ]);

  return (
    <PackExperience
      initialBalance={profile?.softCurrency ?? 500}
      initialFragments={profile?.fragmentBalance ?? 0}
      isWelcome={params.welcome === '1'}
      initialWins={matchStats?.wins ?? 0}
      initialDraws={matchStats?.draws ?? 0}
      initialCollectionCount={collection.length}
    />
  );
}
