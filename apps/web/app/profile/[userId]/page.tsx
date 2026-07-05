import { BestCardShowcase } from '@/components/profile/premium/BestCardShowcase';
import { FriendCode } from '@/components/social/FriendCode';
import { ShareButton } from '@/components/social/ShareButton';
import { sendFriendRequestAction } from '@/lib/actions/social';
import { getCollection } from '@/lib/collection-data';
import { buildAdvancedStats } from '@/lib/profile-data';
import { getUserCollection, getUserMatchStats, getUserProfile } from '@/lib/server/game-data';
import { generateFriendCode } from '@/lib/social-data';
import { getCurrentUser } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;

  const [currentUser, profile, collection, stats] = await Promise.all([
    getCurrentUser(),
    getUserProfile(userId),
    getUserCollection(userId),
    getUserMatchStats(userId),
  ]);

  if (!profile) notFound();

  const isOwn = currentUser?.id === userId;
  const friendCode = generateFriendCode(userId);
  const advStats = buildAdvancedStats(collection);
  const total = stats.wins + stats.draws + stats.losses;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;
  const displayName =
    (profile as unknown as { display_name?: string }).display_name ??
    `Jogador ${userId.slice(0, 4).toUpperCase()}`;

  const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://worldlegends.gg'}/profile/${userId}`;

  return (
    <div
      className="min-h-full pb-24"
      style={{
        background: [
          'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(71,85,105,0.18) 0%, transparent 55%)',
          '#050508',
        ].join(', '),
      }}
    >
      <div className="max-w-2xl mx-auto px-4 space-y-6 pt-6">
        {/* Back link */}
        <Link href="/" className="text-muted text-xs hover:text-parchment transition-colors">
          ← Voltar
        </Link>

        {/* Profile hero */}
        <div className="glass rounded-3xl overflow-hidden border border-white/5">
          {/* Banner */}
          <div
            className="h-24 w-full relative"
            style={{
              background:
                'linear-gradient(135deg, #0d1a33 0%, #07080f 40%, #1a1200 70%, #0d0a00 100%)',
            }}
          >
            {/* Decorative grid */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(201,168,76,0.15) 20px, rgba(201,168,76,0.15) 21px)',
              }}
            />
          </div>

          <div className="px-5 pb-5">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl -mt-8 mb-3 flex items-center justify-center font-display text-2xl border-2 border-surface"
              style={{
                background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.05))',
                color: '#c9a84c',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-parchment font-bold text-lg leading-tight">{displayName}</h1>
                <p className="text-muted text-xs mt-0.5">
                  {collection.length} cartas · {stats.wins} vitórias · {winRate}% win rate
                </p>
              </div>

              <div className="flex gap-2 flex-col items-end">
                <ShareButton
                  title={`${displayName} — World Legends`}
                  text={`${displayName} tem ${collection.length} cartas e ${stats.wins} vitórias no World Legends! Veja o perfil:`}
                  url={profileUrl}
                  label="Compartilhar"
                  size="sm"
                />
                {!isOwn && currentUser && (
                  <form
                    action={async () => {
                      'use server';
                      await sendFriendRequestAction(
                        userId.replace(/-/g, '').toUpperCase().slice(0, 8),
                      );
                    }}
                  >
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl text-[10px] font-bold"
                      style={{
                        background: 'rgba(201,168,76,0.12)',
                        color: '#c9a84c',
                        border: '1px solid rgba(201,168,76,0.25)',
                      }}
                    >
                      + Adicionar
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Friend code (own profile only) */}
            {isOwn && (
              <div className="mt-4">
                <FriendCode code={`${friendCode.slice(0, 4)}-${friendCode.slice(4)}`} />
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Cartas', value: collection.length, color: '#c9a84c' },
            { label: 'Vitórias', value: stats.wins, color: '#10b981' },
            { label: 'Win Rate', value: `${winRate}%`, color: '#3b82f6' },
            { label: 'OVR Médio', value: advStats.avgOvr, color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{ background: `${color}10`, border: `1px solid ${color}25` }}
            >
              <p className="font-display text-xl" style={{ color }}>
                {value}
              </p>
              <p className="text-muted text-[8px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Best card */}
        {advStats.bestCard && (
          <div className="glass rounded-3xl border border-white/5 px-5 py-5">
            <p
              className="text-[8px] font-black uppercase tracking-[0.25em] mb-3"
              style={{ color: 'rgba(255,255,255,0.2)' }}
            >
              Melhor Carta
            </p>
            <BestCardShowcase
              card={advStats.bestCard}
              avgOvr={advStats.avgOvr}
              legendaryPlus={advStats.legendaryPlus}
            />
          </div>
        )}
      </div>
    </div>
  );
}
