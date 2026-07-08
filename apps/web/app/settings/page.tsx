import { SettingsPage } from '@/components/settings/SettingsPage';
import { deriveAccountProgress } from '@/lib/rewards-data';
import { getUserCollection, getUserMatchStats } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

export default async function SettingsRoute() {
  const user = await getCurrentUser();
  let level = 1;
  if (user) {
    const [matchStats, collection] = await Promise.all([
      getUserMatchStats(user.id),
      getUserCollection(user.id),
    ]);
    level = deriveAccountProgress({
      wins: matchStats.wins,
      draws: matchStats.draws,
      collectionCount: collection.length,
    }).level;
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease-out]">
      <SettingsPage level={level} />
    </div>
  );
}
