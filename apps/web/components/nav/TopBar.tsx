import type { USER_PROFILE } from '@/lib/mock-data';

type Props = { user: typeof USER_PROFILE };

export function TopBar({ user }: Props) {
  const xpPct = Math.round((user.currentXp / user.xpForNext) * 100);

  return (
    <header
      className="h-14 shrink-0 border-b border-border bg-midnight/80 backdrop-blur
                       flex items-center justify-between px-6 gap-6"
    >
      {/* XP progress */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center">
            <span className="font-display text-gold text-sm leading-none">{user.level}</span>
          </div>
        </div>
        <div className="min-w-0 w-40">
          <div className="flex justify-between text-[10px] text-muted mb-1">
            <span>XP</span>
            <span>
              {user.currentXp.toLocaleString('pt-BR')} / {user.xpForNext.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-surface overflow-hidden">
            <div className="xp-bar" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-5 ml-auto shrink-0">
        <Stat
          icon="💰"
          value={user.credits.toLocaleString('pt-BR')}
          label="Créditos"
          color="text-gold"
        />
        <Stat
          icon="🧩"
          value={user.fragments.toLocaleString('pt-BR')}
          label="Fragmentos"
          color="text-steel"
        />
        <Stat icon="🃏" value={user.totalCards} label="Cartas" color="text-parchment" />
        <Stat icon="🏆" value={`${user.winRate}%`} label="Vitórias" color="text-emerald-400" />
      </div>
    </header>
  );
}

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm">{icon}</span>
      <div>
        <p className={`font-display text-sm leading-none ${color}`}>{value}</p>
        <p className="text-muted text-[9px] uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}
