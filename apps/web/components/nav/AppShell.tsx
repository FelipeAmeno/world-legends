'use client';

import { FlowProgress } from '@/components/flow/FlowProgress';
import { GameTopBar } from '@/components/flow/GameTopBar';
/**
 * AppShell — wrapper que decide qual shell usar.
 *
 * Home (/):     sem shell → PremiumHome renderiza seu próprio layout fullscreen
 * Outras:       shell normal (sidebar desktop / mobile header + bottom nav)
 */
import { usePathname } from 'next/navigation';
import { BottomNav } from './BottomNav';
import { MobileHeader } from './MobileHeader';
import { Sidebar } from './Sidebar';

type Props = { children: React.ReactNode };

const FULLSCREEN_ROUTES = ['/', '/enter', '/packs', '/match', '/rewards', '/login'];

export function AppShell({ children }: Props) {
  const pathname = usePathname();
  const isFull = FULLSCREEN_ROUTES.includes(pathname);

  // Telas fullscreen: sem shell (Home/Enter têm layout próprio)
  if (isFull) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden flex flex-col h-screen overflow-hidden">
        <MobileHeader />
        <FlowProgress />
        <main
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
        >
          {children}
        </main>
        <BottomNav />
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <GameTopBar />
          <FlowProgress />
          <main className="flex-1 overflow-y-auto px-6 py-5">{children}</main>
        </div>
      </div>
    </>
  );
}
