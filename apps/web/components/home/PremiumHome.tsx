import { DailyLoginTrigger } from '@/components/daily-login/DailyLoginTrigger';
import { EventBanner } from './EventBanner';
import { GameGrid } from './GameGrid';
import { NewUserWelcome } from './NewUserWelcome';
import { PlayerHeader } from './PlayerHeader';
import { PremiumBottomNav } from './PremiumBottomNav';
import { ProgressTracker } from './ProgressTracker';
import { QuickStats } from './QuickStats';
import { RetentionPanel } from './RetentionPanel';
import type { FormationKey } from '@/lib/squad-data';

type Props = {
  serverBalance: number;
  isNewUser?: boolean;
  collectionCount?: number;
  squadFormation?: FormationKey | null | undefined;
  activeEventCount?: number;
};

export function PremiumHome({ serverBalance, isNewUser, collectionCount = 0, squadFormation, activeEventCount = 0 }: Props) {
  if (isNewUser) {
    return <NewUserWelcome />;
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse 120% 40% at 50% -5%, rgba(201,168,76,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 60%  30% at 90% 60%, rgba(58,110,165,0.07) 0%, transparent 50%),
          radial-gradient(ellipse 40%  20% at 10% 80%, rgba(124,58,237,0.05) 0%, transparent 50%),
          #050508
        `,
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Scrollable content */}
      <div
        className="relative z-10 flex flex-col gap-4"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <PlayerHeader serverBalance={serverBalance} />
        <GameGrid collectionCount={collectionCount} squadFormation={squadFormation} activeEventCount={activeEventCount} />
        <QuickStats />
        <RetentionPanel />
        <ProgressTracker />
        <EventBanner />

        {/* Spacer */}
        <div className="h-2" />
      </div>

      {/* Bottom navigation */}
      <PremiumBottomNav />

      {/* Daily login — auto-popup + badge */}
      <DailyLoginTrigger />
    </div>
  );
}
