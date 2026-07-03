import type { MatchDisplay } from '@/lib/match-data';

type Props = { stats: MatchDisplay['stats'] };

export function MatchStats({ stats }: Props) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <h3 className="font-display text-lg text-parchment tracking-wider mb-3">ESTATÍSTICAS</h3>

      <div className="space-y-3">
        <StatRow
          label="Posse"
          home={stats.possession[0]}
          away={stats.possession[1]}
          unit="%"
          max={100}
        />
        <StatRow label="Finalizações" home={stats.shots[0]} away={stats.shots[1]} max={20} />
        <StatRow
          label="No alvo"
          home={stats.shotsOnTarget[0]}
          away={stats.shotsOnTarget[1]}
          max={15}
        />
        <StatRow label="xG" home={stats.xg[0]} away={stats.xg[1]} max={4} decimal />
        <StatRow label="Faltas" home={stats.fouls[0]} away={stats.fouls[1]} max={20} reverse />
        <StatRow label="Escanteios" home={stats.corners[0]} away={stats.corners[1]} max={12} />
        <StatRow
          label="Amarelos"
          home={stats.yellowCards[0]}
          away={stats.yellowCards[1]}
          max={5}
          reverse
        />
        <StatRow
          label="Vermelhos"
          home={stats.redCards[0]}
          away={stats.redCards[1]}
          max={3}
          reverse
        />
      </div>
    </div>
  );
}

// ─── StatRow ──────────────────────────────────────────────────────────────────

function StatRow({
  label,
  home,
  away,
  unit,
  max,
  decimal,
  reverse,
}: {
  label: string;
  home: number;
  away: number;
  unit?: string;
  max?: number;
  decimal?: boolean;
  reverse?: boolean;
}) {
  const total = (max ?? home + away) || 1;
  const homePct = Math.round((home / total) * 100);
  const awayPct = Math.round((away / total) * 100);

  const fmt = (v: number) => (decimal ? v.toFixed(1) : String(v));

  // Se reverse, menor é melhor (faltas, cartões) — invertemos cores
  const homeWins = reverse ? home <= away : home >= away;

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className={`font-bold w-10 ${homeWins ? 'text-emerald-400' : 'text-parchment'}`}>
          {fmt(home)}
          {unit ?? ''}
        </span>
        <span className="text-muted text-center flex-1">{label}</span>
        <span
          className={`font-bold w-10 text-right ${!homeWins ? 'text-emerald-400' : 'text-parchment'}`}
        >
          {fmt(away)}
          {unit ?? ''}
        </span>
      </div>
      <div className="flex gap-0.5 h-1.5">
        {/* Barra da casa (cresce da esquerda) */}
        <div className="flex-1 bg-obsidian rounded-l-full overflow-hidden flex justify-end">
          <div
            className={`h-full rounded-l-full transition-all duration-700 ${homeWins ? 'bg-emerald-500' : 'bg-blue-700'}`}
            style={{ width: `${homePct}%` }}
          />
        </div>
        {/* Divisor */}
        <div className="w-px bg-border shrink-0" />
        {/* Barra do fora (cresce da direita) */}
        <div className="flex-1 bg-obsidian rounded-r-full overflow-hidden">
          <div
            className={`h-full rounded-r-full transition-all duration-700 ${!homeWins ? 'bg-emerald-500' : 'bg-red-800'}`}
            style={{ width: `${awayPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
