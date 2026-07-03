/**
 * app/profile/page.tsx — T057 Perfil Premium
 *
 * Server Component: computa todos os dados e renderiza o perfil premium.
 */

import { getCollection } from '@/lib/collection-data';
import { RECENT_MATCHES, USER_PROFILE } from '@/lib/mock-data';
import { SEASONS, buildAchievements, buildAdvancedStats, buildTitles } from '@/lib/profile-data';

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

export default function ProfilePage() {
  const collection = getCollection();
  const p = USER_PROFILE;
  const total = p.wins + p.draws + p.losses;
  const winRate = total > 0 ? Math.round((p.wins / total) * 100) : 0;

  const stats = buildAdvancedStats(collection);
  const titles = buildTitles(p.wins, p.level, collection);
  const achiev = buildAchievements(p.wins, p.draws, p.losses, p.level, p.credits, collection);
  stats.winRate = winRate;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10 animate-[fadeIn_0.4s_ease-out]">
      {/* Hero */}
      <div className="glass rounded-3xl overflow-hidden border border-white/5">
        <ProfileHero wins={p.wins} draws={p.draws} losses={p.losses} winRate={winRate} />
      </div>

      {/* Melhor carta */}
      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <BestCardShowcase
          card={stats.bestCard}
          avgOvr={stats.avgOvr}
          legendaryPlus={stats.legendaryPlus}
        />
      </div>

      {/* Coleção */}
      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <CollectionOverview cards={collection} stats={stats} />
      </div>

      {/* Títulos */}
      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <TitlesGrid titles={titles} />
      </div>

      {/* Conquistas */}
      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <AchievementsGrid achievements={achiev} />
      </div>

      {/* Temporadas */}
      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <SeasonsHistory seasons={SEASONS} />
      </div>

      {/* Histórico */}
      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <MatchHistorySection matches={RECENT_MATCHES} />
      </div>

      {/* Favoritas */}
      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <FavoriteCards allCards={collection} />
      </div>

      {/* Países */}
      <div className="px-5 py-5 glass rounded-3xl border border-white/5">
        <CountriesUnlocked countries={stats.uniqueCountries} />
      </div>
    </div>
  );
}
