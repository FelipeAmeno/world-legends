'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── SVG Icon system ──────────────────────────────────────────────────────────

function Icon({ d, size = 16 }: { d: string | readonly string[]; size?: number }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static icon paths
        <path key={i} d={p} />
      ))}
    </svg>
  );
}

const ICONS = {
  home: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  collection: ['M4 6h16M4 12h16M4 18h16', 'M8 3l4 3 4-3'],
  squad: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  packs:
    'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  match: [
    'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z',
    'M4.93 4.93l4.24 4.24m5.66 5.66 4.24 4.24M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24M9 12h6',
  ],
  missions: [
    'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z',
    'M12 8v4l3 3',
    'M12 12m-1 0a1 1 0 102 0 1 1 0 10-2 0',
  ],
  events: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  ranking: ['M6 9H2V3h4m12 6h4V3h-4M6 9a6 6 0 0012 0M8 21h8M12 17v4'],
  market:
    'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  profile: ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z'],
  rewards: [
    'M20 12v10H4V12',
    'M2 7h20v5H2z',
    'M12 22V7',
    'M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z',
    'M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
  ],
  settings: [
    'M12 15a3 3 0 100-6 3 3 0 000 6z',
    'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  ],
  album: [
    'M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z',
    'M8 7h8M8 11h5M8 15h3',
  ],
  trophy: 'M6 9H2V3h4m12 6h4V3h-4M6 9a6 6 0 0012 0M8 21h8M12 17v4',
  debug: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z'],
};

// ─── Nav config ───────────────────────────────────────────────────────────────

const MAIN_NAV = [
  { href: '/', icon: 'home', label: 'Home' },
  { href: '/collection', icon: 'collection', label: 'Coleção' },
  { href: '/album', icon: 'album', label: 'Álbum' },
  { href: '/achievements', icon: 'trophy', label: 'Conquistas' },
  { href: '/squad', icon: 'squad', label: 'Squad' },
  { href: '/packs', icon: 'packs', label: 'Packs' },
  { href: '/match', icon: 'match', label: 'Partida' },
  { href: '/missions', icon: 'missions', label: 'Missões' },
  { href: '/events', icon: 'events', label: 'Eventos' },
  { href: '/ranking', icon: 'ranking', label: 'Ranking' },
  { href: '/market', icon: 'market', label: 'Mercado' },
  { href: '/profile', icon: 'profile', label: 'Perfil' },
  { href: '/rewards', icon: 'rewards', label: 'Recompensas' },
  { href: '/settings', icon: 'settings', label: 'Configs' },
] as const;

const DEV_NAV = [{ href: '/dashboard', icon: 'debug', label: 'Debug' }] as const;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-[220px] shrink-0 flex flex-col h-screen overflow-hidden"
      style={{
        background: 'linear-gradient(180deg,#0d0f1c 0%,#07080f 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-start gap-3">
          {/* Logo mark */}
          <div
            className="w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
            style={{
              background: 'linear-gradient(135deg,#c9a84c,#e6c85a)',
              boxShadow: '0 0 16px rgba(201,168,76,0.35)',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#07080f"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-[22px] leading-[1] tracking-[0.12em] gold-text">
              WORLD
              <br />
              LEGENDS
            </h1>
            <p
              className="text-[9px] tracking-[0.22em] uppercase mt-0.5"
              style={{ color: '#6a7090' }}
            >
              Card Game
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {MAIN_NAV.map(({ href, icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon d={ICONS[icon as keyof typeof ICONS]} size={15} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Dev section */}
        <div className="my-3 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <span className="text-[8px] uppercase tracking-widest" style={{ color: '#3a3f5c' }}>
            dev
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        {DEV_NAV.map(({ href, icon, label }) => (
          <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
            <Icon d={ICONS[icon as keyof typeof ICONS]} size={15} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Link
          href="/profile"
          className="flex items-center gap-2.5 px-2.5 py-2 rounded-[10px] transition-all duration-150 group"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 font-display text-[17px] text-obsidian"
            style={{
              background: 'linear-gradient(135deg,#c9a84c,#e6c85a)',
              boxShadow: '0 0 10px rgba(201,168,76,0.30)',
            }}
          >
            F
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate" style={{ color: '#e8e2d8' }}>
              Felipe Ameno
            </p>
            <p className="text-[10px]" style={{ color: '#6a7090' }}>
              Nível 12 · Estrela
            </p>
          </div>
          {/* Arrow */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 opacity-30 group-hover:opacity-60 transition-opacity"
            style={{ color: '#e8e2d8' }}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      </div>
    </aside>
  );
}
