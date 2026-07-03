import { PackExperience } from '@/components/packs/PackExperience';
import { getUserProfile } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function PacksPage() {
  const user = await getCurrentUser();
  const profile = user ? await getUserProfile(user.id) : null;

  return <PackExperience initialBalance={profile?.softCurrency ?? 500} />;
}
