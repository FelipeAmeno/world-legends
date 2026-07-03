import type { USER_PROFILE } from '@/lib/mock-data';

type Props = {
  profile: typeof USER_PROFILE;
  collectionSize: number;
  totalGames: number;
};

type Milestone = {
  id: string;
  icon: string;
  label: string;
  desc: string;
  progress: number; // 0–100
  done: boolean;
  sub?: string;
};

function buildMilestones(
  profile: typeof USER_PROFILE,
  collectionSize: number,
  totalGames: number,
): Milestone[] {
  return [
    {
      id: 'first_win',
      icon: '🏆',
      label: 'Primeira Vitória',
      desc: 'Vença sua primeira partida',
      progress: profile.wins >= 1 ? 100 : 0,
      done: profile.wins >= 1,
    },
    {
      id: 'level_10',
      icon: '⭐',
      label: 'Veterano',
      desc: 'Alcance o nível 10',
      progress: Math.min(100, Math.round((profile.level / 10) * 100)),
      done: profile.level >= 10,
      sub: `Nível ${profile.level}/10`,
    },
    {
      id: 'wins_25',
      icon: '🎖️',
      label: 'Vencedor',
      desc: '25 vitórias acumuladas',
      progress: Math.min(100, Math.round((profile.wins / 25) * 100)),
      done: profile.wins >= 25,
      sub: `${profile.wins}/25 vitórias`,
    },
    {
      id: 'collection_10',
      icon: '🃏',
      label: 'Colecionador',
      desc: 'Colecione 10 cartas',
      progress: Math.min(100, Math.round((collectionSize / 10) * 100)),
      done: collectionSize >= 10,
      sub: `${collectionSize}/10 cartas`,
    },
    {
      id: 'games_50',
      icon: '⚽',
      label: 'Experiente',
      desc: 'Dispute 50 partidas',
      progress: Math.min(100, Math.round((totalGames / 50) * 100)),
      done: totalGames >= 50,
      sub: `${totalGames}/50 partidas`,
    },
    {
      id: 'wins_50',
      icon: '👑',
      label: 'Campeão',
      desc: '50 vitórias acumuladas',
      progress: Math.min(100, Math.round((profile.wins / 50) * 100)),
      done: profile.wins >= 50,
      sub: `${profile.wins}/50 vitórias`,
    },
    {
      id: 'credits_10k',
      icon: '💰',
      label: 'Magnata',
      desc: 'Acumule 10.000 créditos',
      progress: Math.min(100, Math.round((profile.credits / 10000) * 100)),
      done: profile.credits >= 10000,
      sub: `${profile.credits.toLocaleString()}/10.000c`,
    },
    {
      id: 'winrate_60',
      icon: '🎯',
      label: 'Dominante',
      desc: 'Mantenha 60% de aproveitamento',
      progress: Math.min(100, Math.round((profile.winRate / 60) * 100)),
      done: profile.winRate >= 60,
      sub: `${profile.winRate}%/60%`,
    },
  ];
}

export function Milestones({ profile, collectionSize, totalGames }: Props) {
  const milestones = buildMilestones(profile, collectionSize, totalGames);
  const completed = milestones.filter((m) => m.done).length;

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-parchment tracking-wider">MARCOS</h2>
        <span className="text-muted text-xs">
          {completed}/{milestones.length} concluídos
        </span>
      </div>

      {/* Barra geral */}
      <div className="h-1.5 bg-obsidian rounded-full overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all duration-700"
          style={{ width: `${Math.round((completed / milestones.length) * 100)}%` }}
        />
      </div>

      {/* Grade de marcos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {milestones.map((m) => (
          <MilestoneCard key={m.id} milestone={m} />
        ))}
      </div>
    </div>
  );
}

// ─── MilestoneCard ────────────────────────────────────────────────────────────

function MilestoneCard({ milestone: m }: { milestone: Milestone }) {
  return (
    <div
      className={[
        'relative rounded-xl border p-3 transition-all',
        m.done ? 'border-gold/40 bg-gold/5 shadow-gold' : 'border-border bg-obsidian/40',
      ].join(' ')}
    >
      {/* Ícone */}
      <div className={`text-2xl mb-2 ${m.done ? '' : 'opacity-40 grayscale'}`}>{m.icon}</div>

      {/* Label */}
      <p
        className={`text-xs font-bold leading-tight mb-0.5 ${m.done ? 'text-gold' : 'text-muted'}`}
      >
        {m.label}
      </p>
      <p className="text-muted text-[9px] leading-tight mb-2">{m.desc}</p>

      {/* Barra de progresso */}
      {!m.done && (
        <>
          <div className="h-1 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-steel transition-all duration-500"
              style={{ width: `${m.progress}%` }}
            />
          </div>
          {m.sub && <p className="text-muted text-[8px] mt-1">{m.sub}</p>}
        </>
      )}

      {/* Completo */}
      {m.done && (
        <div className="flex items-center gap-1">
          <span className="text-emerald-400 text-[9px] font-bold">✓ CONCLUÍDO</span>
        </div>
      )}
    </div>
  );
}
