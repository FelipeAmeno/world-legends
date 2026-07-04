import { getCurrentUser } from '@/lib/supabase/server';
import { getCollection } from '@/lib/collection-data';
import { getUserCollection, getUserMatchStats } from '@/lib/server/game-data';
import { SEASONS, buildAdvancedStats, buildTitles, buildAchievements } from '@/lib/profile-data';

import { AchievementsGrid } from '@/components/profile/premium/AchievementsGrid';
import { BestCardShowcase } from '@/components/profile/premium/BestCardShowcase';
import {
  CollectionOverview,
  CountriesUnlocked,
} from '@/components/profile/premium/CollectionOverview';
import { FavoriteCards } from '@/components/profile/premium/FavoriteCards';
import { MatchHistorySection } from '@/components/profile/premium/MatchHistorySection';
import { ProfileHero } from '@/components/profile/premium/ProfileHero';
import { SeasonsHistory } from '@/components/profile/premium/SeasonsHistory';
import { TitlesGrid } from '@/components/profile/premium/TitlesGrid';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const collection = user ? await getUserCollection(user.id) : getCollection();

  let wins = 0, draws = 0, losses = 0;
  let recentMatches: Awaited<ReturnType<typeof getUserMatchStats>>['recentMatches'] = [];

  if (user) {
    const stats = await getUserMatchStats(user.id);
    wins   = stats.wins;
    draws  = stats.draws;
    losses = stats.losses;
    recentMatches = stats.recentMatches;
  }

  const total   = wins + draws + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const advStats = buildAdvancedStats(collection);
  const titles   = buildTitles(wins, 1, collection);
  const achiev   = buildAchievements(wins, draws, losses, 1, 0, collection);
  advStats.winRate = winRate;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10 animate-[fadeIn_0.4s_ease-out]">
      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <ProfileHero wins={wins} draws={draws} losses={losses} winRate={winRate} />
      </div>

      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <BestCardShowcase
          card={advStats.bestCard}
          avgOvr={advStats.avgOvr}
          legendaryPlus={advStats.legendaryPlus}
        />
      </div>

      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <CollectionOverview cards={collection} stats={advStats} />
      </div>

      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <TitlesGrid titles={titles} />
      </div>

      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <AchievementsGrid achievements={achiev} />
      </div>

      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <SeasonsHistory seasons={SEASONS} />
      </div>

      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <MatchHistorySection matches={recentMatches} />
      </div>

      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <FavoriteCards allCards={collection} />
      </div>

      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <CountriesUnlocked countries={advStats.uniqueCountries} />
      </div>
    </div>
  );
}
