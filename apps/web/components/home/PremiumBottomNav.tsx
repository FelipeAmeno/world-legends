'use client';

import { UI_HAPTIC } from '@/lib/haptics';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── SVG icon renderer ────────────────────────────────────────────────────────

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

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  href: string;
  label: string;
  icon: string | string[];
  color: string;
  glow: string;
};

const ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    color: '#c9a84c',
    glow: 'rgba(201,168,76,0.55)',
  },
  {
    href: '/collection',
    label: 'Cartas',
    icon: ['M4 6h16M4 12h16M4 18h16', 'M8 3l4 3 4-3'],
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.55)',
  },
  {
    href: '/squad',
    label: 'Squad',
    icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.55)',
  },
  {
    href: '/packs',
    label: 'Packs',
    icon: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
    color: '#a855f7',
    glow: 'rgba(168,85,247,0.55)',
  },
  {
    href: '/profile',
    label: 'Perfil',
    icon: ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z'],
    color: '#ec4899',
    glow: 'rgba(236,72,153,0.55)',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function PremiumBottomNav() {
  const pathname = usePathname();

  if (pathname === '/enter') return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(5,5,10,0.72)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => UI_HAPTIC.navTap()}
              className="flex-1 flex flex-col items-center justify-center pt-2.5 pb-2 gap-1 relative active:scale-95 transition-transform duration-75"
            >
              {/* Top indicator pill */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full transition-all duration-300"
                style={{
                  width: isActive ? 32 : 0,
                  height: 2.5,
                  background: isActive ? item.color : 'transparent',
                  boxShadow: isActive ? `0 0 12px ${item.glow}` : 'none',
                }}
              />

              {/* Icon */}
              <span
                className="transition-all duration-300"
                style={{
                  color: isActive ? item.color : 'rgba(255,255,255,0.25)',
                  transform: isActive ? 'scale(1.2) translateY(-2px)' : 'scale(1)',
                  filter: isActive ? `drop-shadow(0 0 10px ${item.glow})` : 'none',
                }}
              >
                <NavIcon d={item.icon} size={22} />
              </span>

              {/* Label */}
              <span
                className="text-[9px] font-bold leading-none tracking-wide transition-all duration-200"
                style={{ color: isActive ? item.color : 'rgba(255,255,255,0.22)' }}
              >
                {item.label}
              </span>

              {/* Active bottom bloom */}
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-lg pointer-events-none"
                  style={{ width: 28, height: 6, background: item.color, opacity: 0.22 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
