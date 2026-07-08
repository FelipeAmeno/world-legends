import { getCollection } from '@/lib/collection-data';
import { SEASONS, buildAchievements, buildAdvancedStats, buildTitles } from '@/lib/profile-data';
import { deriveAccountProgress } from '@/lib/rewards-data';
import { getUserCollection, getUserMatchStats, getUserProfile } from '@/lib/server/game-data';
import { getCurrentUser } from '@/lib/supabase/server';

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

  const [collection, stats, profile] = await Promise.all([
    user ? getUserCollection(user.id) : Promise.resolve(getCollection()),
    user ? getUserMatchStats(user.id) : Promise.resolve(null),
    user ? getUserProfile(user.id) : Promise.resolve(null),
  ]);

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let recentMatches: Awaited<ReturnType<typeof getUserMatchStats>>['recentMatches'] = [];
  let credits = 0;
  let fragments = 0;
  let username: string | undefined;

  if (user && stats) {
    wins = stats.wins;
    draws = stats.draws;
    losses = stats.losses;
    recentMatches = stats.recentMatches;
    credits = profile?.softCurrency ?? 0;
    fragments = profile?.fragmentBalance ?? 0;
    username = profile?.username;
  }

  const total = wins + draws + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const progress = deriveAccountProgress({ wins, draws, collectionCount: collection.length });

  const advStats = buildAdvancedStats(collection);
  const titles = buildTitles(wins, progress.level, collection);
  const achiev = buildAchievements(wins, draws, losses, progress.level, credits, collection);
  advStats.winRate = winRate;

  return (
    <div
      className="min-h-full animate-[fadeIn_0.4s_ease-out]"
      style={{
        background: [
          'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(71,85,105,0.18) 0%, transparent 55%)',
          'radial-gradient(ellipse 40% 25% at 100% 70%, rgba(51,65,85,0.10) 0%, transparent 50%)',
          '#050508',
        ].join(', '),
      }}
    >
      <div className="max-w-2xl mx-auto space-y-8 pb-10 px-4">
        <div className="glass rounded-3xl overflow-hidden border border-white/5">
          <ProfileHero
            wins={wins}
            draws={draws}
            losses={losses}
            winRate={winRate}
            username={username}
            credits={credits}
            fragments={fragments}
            level={progress.level}
            xp={progress.xp}
            xpForNext={progress.xpForNext}
          />
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
    </div>
  );
}
