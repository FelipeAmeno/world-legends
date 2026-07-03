import { SQUAD_CHEMISTRY, SQUAD_RATING, USER_PROFILE } from '@/lib/mock-data';

export function QuickStats() {
  const total = USER_PROFILE.wins + USER_PROFILE.draws + USER_PROFILE.losses;
  const winRate = total > 0 ? Math.round((USER_PROFILE.wins / total) * 100) : 0;

  const STATS = [
    {
      label: 'OVR',
      value: SQUAD_RATING.overall,
      color: '#c9a84c',
      icon: (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: 'Química',
      value: `${SQUAD_CHEMISTRY.total}`,
      color: '#10b981',
      icon: (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2M9 3a2 2 0 004 0M9 3a2 2 0 014 0" />
          <path d="M7 14l3 3 6-6" />
        </svg>
      ),
    },
    {
      label: 'Vitórias',
      value: USER_PROFILE.wins,
      color: '#3b82f6',
      icon: (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9H2V3h4m12 6h4V3h-4M6 9a6 6 0 0012 0M8 21h8M12 17v4" />
        </svg>
      ),
    },
    {
      label: 'Taxa Win',
      value: `${winRate}%`,
      color: '#a855f7',
      icon: (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
    },
  ];

  return (
    <div className="px-4 stagger-4">
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.055)',
        }}
      >
        <div className="flex items-stretch">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className="flex-1 flex flex-col items-center justify-center py-3 gap-1 relative"
              style={
                i < STATS.length - 1 ? { borderRight: '1px solid rgba(255,255,255,0.05)' } : {}
              }
            >
              {/* Colored icon */}
              <span style={{ color: s.color, opacity: 0.7 }}>{s.icon}</span>
              {/* Value */}
              <p
                className="font-display text-[20px] leading-none"
                style={{
                  color: s.color,
                  textShadow: `0 0 10px ${s.color}55`,
                }}
              >
                {s.value}
              </p>
              {/* Label */}
              <p
                className="text-[8px] uppercase tracking-wider"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
