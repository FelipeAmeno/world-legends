import type { USER_PROFILE } from '@/lib/mock-data';

type Props = {
  profile: typeof USER_PROFILE;
  totalGames: number;
  totalXpFromMatches: number;
  totalCreditsEarned: number;
};

export function StatsRow({ profile, totalGames, totalXpFromMatches, totalCreditsEarned }: Props) {
  const drawRate = Math.round((profile.draws / totalGames) * 100);
  const lossRate = Math.round((profile.losses / totalGames) * 100);

  return (
    <div className="space-y-3">
      {/* Linha 1: resultados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultCard
          label="Vitórias"
          value={profile.wins}
          sub={`${profile.winRate}% de aproveitamento`}
          color="text-emerald-400"
          icon="🏆"
          barColor="bg-emerald-500"
          barPct={profile.winRate}
        />
        <ResultCard
          label="Empates"
          value={profile.draws}
          sub={`${drawRate}% das partidas`}
          color="text-yellow-400"
          icon="⚖️"
          barColor="bg-yellow-500"
          barPct={drawRate}
        />
        <ResultCard
          label="Derrotas"
          value={profile.losses}
          sub={`${lossRate}% das partidas`}
          color="text-red-400"
          icon="💔"
          barColor="bg-red-600"
          barPct={lossRate}
        />
        <ResultCard
          label="Partidas"
          value={totalGames}
          sub="total disputadas"
          color="text-parchment"
          icon="⚽"
          barColor="bg-steel"
          barPct={100}
        />
      </div>

      {/* Linha 2: recursos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResourceCard
          icon="💰"
          label="Créditos"
          value={`${profile.credits.toLocaleString('pt-BR')}c`}
          color="text-gold"
        />
        <ResourceCard
          icon="🧩"
          label="Fragmentos"
          value={profile.fragments.toLocaleString('pt-BR')}
          color="text-steel"
        />
        <ResourceCard icon="🃏" label="Cartas" value={profile.totalCards} color="text-parchment" />
        <ResourceCard
          icon="⭐"
          label="XP Total"
          value={profile.totalXpEarned.toLocaleString('pt-BR')}
          color="text-amber-400"
        />
      </div>
    </div>
  );
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({
  label,
  value,
  sub,
  color,
  icon,
  barColor,
  barPct,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  icon: string;
  barColor: string;
  barPct: number;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-muted text-[10px] uppercase tracking-wider">{label}</p>
        <span className="text-base">{icon}</span>
      </div>
      <p className={`font-display text-4xl leading-none ${color}`}>{value}</p>
      <p className="text-muted text-[10px] mt-1.5 mb-2">{sub}</p>
      <div className="h-1 bg-obsidian rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700`}
          style={{ width: `${Math.min(100, barPct)}%` }}
        />
      </div>
    </div>
  );
}

// ─── ResourceCard ─────────────────────────────────────────────────────────────

function ResourceCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
      <span className="text-xl shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-muted text-[10px] uppercase tracking-wider">{label}</p>
        <p className={`font-display text-xl leading-tight truncate ${color}`}>{value}</p>
      </div>
    </div>
  );
}
