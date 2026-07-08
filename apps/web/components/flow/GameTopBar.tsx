'use client';

/**
 * GameTopBar — recebe o resumo real do perfil (Supabase) via prop, montado
 * uma vez no root layout. Ver AppShell/app/layout.tsx.
 */
type Summary = {
  balance: number;
  fragments: number;
  level: number;
  xp: number;
  xpForNext: number;
  winRate: number;
};

type Props = { summary?: Summary | undefined };

export function GameTopBar({ summary }: Props) {
  const level = summary?.level ?? 1;
  const credits = summary?.balance ?? 0;
  const frags = summary?.fragments ?? 0;
  const xpCur = summary?.xp ?? 0;
  const xpNext = summary?.xpForNext ?? 105;
  const winRate = summary?.winRate ?? 0;
  const xpPct = Math.round((xpCur / Math.max(1, xpNext)) * 100);

  return (
    <header
      className="h-14 shrink-0 flex items-center justify-between px-5 gap-4"
      style={{
        background: 'rgba(7,8,15,0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Level + XP */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Level ring */}
        <div
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-display text-[14px] leading-none"
          style={{
            background: 'linear-gradient(135deg,#4a3510,#c9a84c)',
            boxShadow: '0 0 10px rgba(201,168,76,0.35)',
            color: '#f5e098',
          }}
        >
          {level}
        </div>
        {/* XP bar */}
        <div className="min-w-0 w-36">
          <div className="flex justify-between text-[9px] mb-1" style={{ color: '#6a7090' }}>
            <span>XP</span>
            <span>
              {xpCur.toLocaleString('pt-BR')} / {xpNext.toLocaleString('pt-BR')}
            </span>
          </div>
          <div
            className="h-[5px] rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div className="xp-bar" style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 ml-auto shrink-0 topbar-stats">
        <TopBarStat
          icon={
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c9a84c"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="8" />
              <path d="M12 6v6l4 2" />
            </svg>
          }
          value={credits.toLocaleString('pt-BR')}
          label="Créditos"
          color="#c9a84c"
        />
        <TopBarStat
          icon={
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#5b9fd6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          }
          value={frags.toLocaleString('pt-BR')}
          label="Fragmentos"
          color="#5b9fd6"
        />
        <TopBarStat
          icon={
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          }
          value={`${winRate}%`}
          label="Vitórias"
          color="#34d399"
        />
      </div>
    </header>
  );
}

function TopBarStat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="opacity-80">{icon}</span>
      <div>
        <p className="font-display text-[13px] leading-none" style={{ color }}>
          {value}
        </p>
        <p className="text-[8px] uppercase tracking-wide mt-0.5" style={{ color: '#6a7090' }}>
          {label}
        </p>
      </div>
    </div>
  );
}
