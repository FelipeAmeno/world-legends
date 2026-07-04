import { PackExperience } from '@/components/packs/PackExperience';
import { getUserProfile } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

type Props = {
  searchParams: Promise<{ welcome?: string }>;
};

export default async function PacksPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const [profile, params] = await Promise.all([
    user ? getUserProfile(user.id) : null,
    searchParams,
  ]);

  return (
    <PackExperience
      initialBalance={profile?.softCurrency ?? 500}
      isWelcome={params.welcome === '1'}
    />
  );
}
