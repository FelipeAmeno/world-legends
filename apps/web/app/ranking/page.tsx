import { LeaderboardExperience } from '@/components/ranking/LeaderboardExperience';
import { getLeaderboardData } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  const [user, leaderboardRows] = await Promise.all([getCurrentUser(), getLeaderboardData()]);

  return (
    <div className="flex flex-col h-full">
      <div className="page-header shrink-0">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1.5"
          style={{ color: '#6a7090' }}
        >
          World Legends
        </p>
        <div className="flex items-end gap-3">
          <h1 className="font-display text-4xl gold-text tracking-wider leading-none">RANKING</h1>
          <p className="text-muted text-xs pb-0.5">Global · País · Amigos · Temporada</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <LeaderboardExperience realData={leaderboardRows} currentUserId={user?.id} />
      </div>
    </div>
  );
}
