'use client';

import { FlowProgress } from '@/components/flow/FlowProgress';
import { GameTopBar } from '@/components/flow/GameTopBar';
import { PageTransition } from '@/components/fx/PageTransition';
import { PremiumBottomNav } from '@/components/home/PremiumBottomNav';
import { usePathname } from 'next/navigation';
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
          style={{ paddingBottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
        >
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>
        <PremiumBottomNav />
      </div>

      {/* Desktop */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <GameTopBar />
          <FlowProgress />
          <main className="flex-1 overflow-y-auto px-6 py-5">
            <PageTransition key={pathname}>{children}</PageTransition>
          </main>
        </div>
      </div>
    </>
  );
}
