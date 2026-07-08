'use client';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { SyncIndicator } from '@/components/sync/SyncIndicator';
import { useAutoSave } from '@/lib/sync/useAutoSave';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

function NavIcon({ d, size = 18 }: { d: string | readonly string[]; size?: number }) {
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

const PAGE_TITLES: Record<string, string> = {
  '/collection': 'Coleção',
  '/squad': 'Squad Builder',
  '/missions': 'Missões',
  '/profile': 'Perfil',
  '/settings': 'Configurações',
  '/ranking': 'Ranking',
  '/events': 'Eventos',
  '/market': 'Mercado',
  '/album': 'Álbum',
  '/achievements': 'Conquistas',
};

const NAV_ICONS: Record<string, string | string[]> = {
  '/': 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
  '/collection': ['M4 6h16M4 12h16M4 18h16', 'M8 3l4 3 4-3'],
  '/squad': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  '/packs':
    'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
  '/match': [
    'M12 22c5.52 0 10-4.48 10-10S17.52 2 12 2 2 6.48 2 12s4.48 10 10 10z',
    'M10 8l6 4-6 4V8z',
  ],
  '/missions': 'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
  '/events': 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  '/ranking': ['M6 9H2V3h4m12 6h4V3h-4M6 9a6 6 0 0012 0M8 21h8M12 17v4'],
  '/market':
    'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z',
  '/profile': ['M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', 'M12 11a4 4 0 100-8 4 4 0 000 8z'],
  '/settings':
    'M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
  '/achievements': 'M6 9H2V3h4m12 6h4V3h-4M6 9a6 6 0 0012 0M8 21h8M12 17v4',
};

// Core routes shown in drawer — ordered by priority
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/collection', label: 'Coleção' },
  { href: '/squad', label: 'Squad' },
  { href: '/packs', label: 'Packs' },
  { href: '/match', label: 'Partida' },
  { href: '/missions', label: 'Missões' },
  { href: '/ranking', label: 'Ranking' },
  { href: '/events', label: 'Eventos' },
  { href: '/profile', label: 'Perfil' },
  { href: '/settings', label: 'Configurações' },
];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { balance?: number | undefined };

export function MobileHeader({ balance }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  useAutoSave();

  const pageTitle = PAGE_TITLES[pathname];
  const isSubPage = Boolean(pageTitle);

  return (
    <>
      <header
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{
          background: 'rgba(7,8,15,0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Left: back button on sub-pages, logo on home */}
        {isSubPage ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 group"
            aria-label="Voltar"
          >
            <div
              className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-all group-active:scale-90"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </div>
            <span
              className="font-display text-xl leading-none tracking-wider"
              style={{
                background: 'linear-gradient(135deg,#c9a84c,#e6c85a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {pageTitle}
            </span>
          </button>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg,#c9a84c,#e6c85a)',
                boxShadow: '0 0 12px rgba(201,168,76,0.3)',
              }}
            >
              <svg
                width="13"
                height="13"
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
            <span
              className="font-display text-[20px] leading-none tracking-widest"
              style={{
                background: 'linear-gradient(135deg,#c9a84c,#e6c85a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              WL
            </span>
          </Link>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          <SyncIndicator />
          {balance !== undefined && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.2)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#c9a84c" stroke="none">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span className="font-display text-[13px] leading-none" style={{ color: '#c9a84c' }}>
                {balance.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
          <NotificationBell />

          {/* Burger button */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="w-8 h-8 rounded-[8px] flex flex-col gap-[5px] items-center justify-center transition-all active:scale-90"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            aria-label="Abrir menu"
          >
            <span className="w-4 h-[1.5px] rounded-full" style={{ background: '#e8e2d8' }} />
            <span className="w-3 h-[1.5px] rounded-full" style={{ background: '#e8e2d8' }} />
            <span className="w-4 h-[1.5px] rounded-full" style={{ background: '#e8e2d8' }} />
          </button>
        </div>
      </header>

      {/* Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed right-0 top-0 bottom-0 z-50 w-72 flex flex-col"
              style={{
                background: 'linear-gradient(180deg,#0d0f1c 0%,#07080f 100%)',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
              }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span
                  className="font-display text-[20px] tracking-widest leading-none"
                  style={{
                    background: 'linear-gradient(135deg,#c9a84c,#e6c85a)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  MENU
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/5 active:scale-90"
                  style={{ color: '#6a7090' }}
                  aria-label="Fechar menu"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-0.5">
                {NAV_ITEMS.map(({ href, label }) => {
                  const isActive = pathname === href;
                  const iconPath = NAV_ICONS[href];
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setDrawerOpen(false)}
                      className={`nav-item ${isActive ? 'active' : ''}`}
                    >
                      {iconPath && <NavIcon d={iconPath} size={15} />}
                      <span>{label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer: perfil shortcut */}
              <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Link
                  href="/profile"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-white/5"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: 'rgba(236,72,153,0.15)',
                      border: '1px solid rgba(236,72,153,0.25)',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/60">Meu Perfil</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
