'use client';

import { FlowProgress } from '@/components/flow/FlowProgress';
import { GameTopBar } from '@/components/flow/GameTopBar';
import { PageTransition } from '@/components/fx/PageTransition';
import { PremiumBottomNav } from '@/components/home/PremiumBottomNav';
import { usePathname } from 'next/navigation';
import { MobileHeader } from './MobileHeader';
import { Sidebar } from './Sidebar';

type HeaderSummary = {
  balance: number;
  fragments: number;
  level: number;
  xp: number;
  xpForNext: number;
  winRate: number;
};

type Props = { children: React.ReactNode; headerSummary?: HeaderSummary };

const FULLSCREEN_ROUTES = ['/', '/enter', '/packs', '/match', '/rewards', '/login'];

export function AppShell({ children, headerSummary }: Props) {
  const pathname = usePathname();
  const isFull = FULLSCREEN_ROUTES.includes(pathname);

  // Telas fullscreen: sem shell (Home/Enter têm layout próprio)
  if (isFull) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — só desktop, escondido via CSS (não desmontado, sem custo de conteúdo) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden">
          <MobileHeader balance={headerSummary?.balance} />
        </div>
        <div className="hidden lg:block">
          <GameTopBar summary={headerSummary} />
        </div>

        <FlowProgress />

        {/* {children} renderiza UMA vez só — antes disso, mobile e desktop tinham
            duas <main> separadas cada uma com sua própria <PageTransition>{children}</PageTransition>,
            então toda a árvore da página (cards, timers, listeners) ficava montada
            em dobro o tempo todo, só uma cópia escondida via CSS (lg:hidden /
            hidden lg:flex) — nunca desmontada. Corrigido na Sprint 20.5. */}
        <main className="flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-5 app-shell-main">
          <PageTransition key={pathname}>{children}</PageTransition>
        </main>

        <div className="lg:hidden">
          <PremiumBottomNav />
        </div>
      </div>
    </div>
  );
}
