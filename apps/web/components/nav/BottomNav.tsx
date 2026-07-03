'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function NavIcon({ d, size = 22 }: { d: string | readonly string[]; size?: number }) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
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

const TABS = [
  {
    href: '/',
    label: 'Home',
    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    color: '#c9a84c',
  },
  {
    href: '/collection',
    label: 'Coleção',
    icon: ['M4 6h16M4 12h16M4 18h16', 'M8 3l4 3 4-3'],
    color: '#f59e0b',
  },
  {
    href: '/squad',
    label: 'Squad',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    color: '#3b82f6',
  },
  {
    href: '/packs',
    label: 'Packs',
    icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    color: '#a855f7',
  },
  {
    href: '/match',
    label: 'Partida',
    icon: [
      'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z',
      'M4.93 4.93l4.24 4.24m5.66 5.66 4.24 4.24M4.93 19.07l4.24-4.24m5.66-5.66 4.24-4.24',
    ],
    color: '#10b981',
  },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  // Home has its own PremiumBottomNav
  if (pathname === '/' || pathname === '/enter') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{
        background: 'rgba(7,8,15,0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {TABS.map(({ href, label, icon, color }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="bottom-nav-item"
              style={{ '--nav-color': color } as React.CSSProperties}
            >
              {/* Active indicator */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-300"
                style={{
                  width: isActive ? 28 : 0,
                  height: 2,
                  background: color,
                  boxShadow: isActive ? `0 0 10px ${color}` : 'none',
                  opacity: isActive ? 1 : 0,
                }}
              />

              {/* Icon */}
              <span
                className="transition-all duration-300"
                style={{
                  color: isActive ? color : 'rgba(255,255,255,0.28)',
                  transform: isActive ? 'scale(1.18) translateY(-2px)' : 'scale(1)',
                  filter: isActive ? `drop-shadow(0 0 8px ${color}80)` : 'none',
                }}
              >
                <NavIcon d={icon} size={21} />
              </span>

              {/* Label */}
              <span
                className="text-[9px] font-semibold leading-none transition-all duration-200"
                style={{ color: isActive ? color : 'rgba(255,255,255,0.22)' }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
