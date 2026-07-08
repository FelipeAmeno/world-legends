'use client';

import { DailyLoginTrigger } from '@/components/daily-login/DailyLoginTrigger';
import type { FormationKey } from '@/lib/squad-data';
import { motion } from 'framer-motion';
import { DreamTeamWidget } from './DreamTeamWidget';
import { EventBanner } from './EventBanner';
import { GameGrid } from './GameGrid';
import { PlayerHeader } from './PlayerHeader';
import { PremiumBottomNav } from './PremiumBottomNav';
import { ProgressTracker } from './ProgressTracker';
import { QuickStats } from './QuickStats';
import { RetentionPanel } from './RetentionPanel';

type Props = {
  serverBalance: number;
  fragmentBalance?: number;
  username?: string | undefined;
  collectionCount?: number;
  squadFormation?: FormationKey | null | undefined;
  activeEventCount?: number;
  squadOverall?: number;
  squadChemistry?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  level?: number;
  xp?: number;
  xpForNext?: number;
};

export function PremiumHome({
  serverBalance,
  fragmentBalance = 0,
  username,
  collectionCount = 0,
  squadFormation,
  activeEventCount = 0,
  squadOverall = 0,
  squadChemistry = 0,
  wins = 0,
  draws = 0,
  losses = 0,
  level = 1,
  xp = 0,
  xpForNext = 105,
}: Props) {
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

      {/* Breathing ambient lights */}
      <motion.div
        className="fixed pointer-events-none"
        style={{
          top: '-10%',
          left: '20%',
          width: '60%',
          height: '50%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      <motion.div
        className="fixed pointer-events-none"
        style={{
          bottom: '5%',
          left: '-10%',
          width: '45%',
          height: '45%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.08, 1] }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          delay: 1.5,
        }}
      />
      <motion.div
        className="fixed pointer-events-none"
        style={{
          top: '30%',
          right: '-8%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(58,110,165,0.06) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1.02, 0.98, 1.02] }}
        transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut', delay: 3 }}
      />

      {/* Scrollable content */}
      <div
        className="relative z-10 flex flex-col gap-4"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <PlayerHeader
          serverBalance={serverBalance}
          fragmentBalance={fragmentBalance}
          username={username}
          level={level}
          xp={xp}
          xpForNext={xpForNext}
        />
        <DreamTeamWidget />
        <GameGrid
          collectionCount={collectionCount}
          squadFormation={squadFormation}
          activeEventCount={activeEventCount}
        />
        <QuickStats
          overall={squadOverall}
          chemistry={squadChemistry}
          wins={wins}
          draws={draws}
          losses={losses}
        />
        <RetentionPanel />
        <ProgressTracker />
        <EventBanner />

        <p className="text-white/12 text-[8px] text-center tracking-wider pt-2">
          © Felipe Ameno · World Legends · Todos os direitos reservados.
        </p>

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
