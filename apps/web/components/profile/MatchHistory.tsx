import type { MatchRecord } from '@/lib/mock-data';

type Props = { matches: MatchRecord[] };

const OUTCOME_STYLE = {
  win: {
    badge: 'V',
    bg: 'bg-emerald-900/50 border-emerald-700/60',
    text: 'text-emerald-400',
    bar: 'bg-emerald-500',
  },
  draw: {
    badge: 'E',
    bg: 'bg-yellow-900/40  border-yellow-700/50',
    text: 'text-yellow-400',
    bar: 'bg-yellow-500',
  },
  loss: {
    badge: 'D',
    bg: 'bg-red-900/40     border-red-700/50',
    text: 'text-red-400',
    bar: 'bg-red-600',
  },
};

export function MatchHistory({ matches }: Props) {
  const totals = matches.reduce(
    (acc, m) => ({
      credits: acc.credits + m.credits,
      xp: acc.xp + m.xp,
      goals: acc.goals + m.homeScore,
    }),
    { credits: 0, xp: 0, goals: 0 },
  );

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-parchment tracking-wider">HISTÓRICO</h2>
        <div className="flex gap-3 text-[10px] text-muted">
          <span>+{totals.credits.toLocaleString('pt-BR')}c ganhos</span>
          <span>+{totals.xp} XP</span>
        </div>
      </div>

      {/* Barra de forma recente */}
      <FormBar matches={matches} />

      {/* Lista de partidas */}
      <div className="space-y-2 mt-4">
        {matches.map((match, i) => (
          <MatchRow key={i} match={match} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border grid grid-cols-3 gap-3 text-center">
        <FooterStat label="Gols marcados" value={totals.goals} color="text-emerald-400" />
        <FooterStat
          label="Créditos ganhos"
          value={`${totals.credits.toLocaleString()}c`}
          color="text-gold"
        />
        <FooterStat label="XP ganho" value={`+${totals.xp}`} color="text-steel" />
      </div>
    </div>
  );
}

// ─── FormBar — forma recente (5 últimas) ─────────────────────────────────────

function FormBar({ matches }: { matches: MatchRecord[] }) {
  const form = [...matches].slice(0, 5).reverse();
  const BAR_COLOR = { win: 'bg-emerald-500', draw: 'bg-yellow-500', loss: 'bg-red-600' };
  const LABEL = { win: 'V', draw: 'E', loss: 'D' };
  const TEXT = { win: 'text-emerald-400', draw: 'text-yellow-400', loss: 'text-red-400' };

  return (
    <div>
      <p className="text-muted text-[10px] uppercase tracking-wider mb-1.5">Forma recente</p>
      <div className="flex items-center gap-1.5">
        {form.map((m, i) => (
          <div
            key={i}
            className={`w-8 h-8 rounded-lg border ${OUTCOME_STYLE[m.outcome].bg} flex items-center justify-center`}
            title={`${m.opponent} · ${m.homeScore}×${m.awayScore}`}
          >
            <span className={`text-[11px] font-bold ${OUTCOME_STYLE[m.outcome].text}`}>
              {LABEL[m.outcome]}
            </span>
          </div>
        ))}
        <span className="text-muted text-[10px] ml-1">← mais recente</span>
      </div>
    </div>
  );
}

// ─── MatchRow ─────────────────────────────────────────────────────────────────

function MatchRow({ match, index }: { match: MatchRecord; index: number }) {
  const style = OUTCOME_STYLE[match.outcome];
  const isHome = match.isHome;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${style.bg} transition-all hover:opacity-90`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Resultado badge */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${style.bg}`}
      >
        <span className={`font-bold text-sm ${style.text}`}>{style.badge}</span>
      </div>

      {/* Placar */}
      <div className="shrink-0 text-center w-14">
        <p className="font-display text-lg text-parchment leading-none">
          {match.homeScore}
          <span className="text-muted mx-0.5 text-base">×</span>
          {match.awayScore}
        </p>
        <p className="text-muted text-[8px]">{isHome ? 'Casa' : 'Fora'}</p>
      </div>

      {/* Adversário */}
      <div className="flex-1 min-w-0">
        <p className="text-parchment text-xs font-medium truncate">{match.opponent}</p>
        <p className="text-muted text-[10px]">{match.date}</p>
      </div>

      {/* Recompensas */}
      <div className="shrink-0 text-right">
        <p className="text-gold text-[10px] font-bold">+{match.credits}c</p>
        <p className="text-steel text-[9px]">+{match.xp} XP</p>
      </div>
    </div>
  );
}

// ─── FooterStat ───────────────────────────────────────────────────────────────

function FooterStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div>
      <p className={`font-display text-xl ${color}`}>{value}</p>
      <p className="text-muted text-[9px]">{label}</p>
    </div>
  );
}
