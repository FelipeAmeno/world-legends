'use client';

import { useGameDirector } from '@/lib/hooks/useGameDirector';
import type { FormationKey } from '@/lib/squad-data';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

type Props = {
  collectionCount: number;
  squadFormation: FormationKey | null | undefined;
  balance: number;
  wins: number;
  hasMissionReward?: boolean;
};

export function NextBestAction({
  collectionCount,
  squadFormation,
  balance,
  wins,
  hasMissionReward,
}: Props) {
  const router = useRouter();
  const { action, openDaily } = useGameDirector({
    collectionCount,
    squadFormation,
    balance,
    wins,
    ...(hasMissionReward !== undefined ? { hasMissionReward } : {}),
  });

  const handleCta = () => {
    if (action.id === 'claim_daily') {
      openDaily();
    } else {
      router.push(action.href);
    }
  };

  return (
    <motion.div
      className="mx-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <p className="text-[10px] uppercase tracking-[0.3em] text-white/25 mb-2">Sua próxima ação</p>

      <motion.div
        className="relative rounded-2xl overflow-hidden border"
        style={{
          background: `linear-gradient(135deg, ${action.gradientFrom} 0%, ${action.gradientTo} 100%)`,
          borderColor: `${action.accentColor}40`,
          boxShadow: `0 0 32px ${action.glowColor}, 0 2px 12px rgba(0,0,0,0.5)`,
        }}
        whileTap={{ scale: 0.985 }}
      >
        {/* Glow orb */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 70% 60% at 100% 0%, ${action.glowColor} 0%, transparent 65%)`,
          }}
        />

        <div className="relative z-10 flex items-center gap-4 px-5 py-5">
          {/* Icon */}
          <motion.div
            className="shrink-0 text-5xl leading-none"
            style={{ filter: `drop-shadow(0 0 14px ${action.glowColor})` }}
            animate={{ y: [-3, 3, -3] }}
            transition={{ duration: 3.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            {action.icon}
          </motion.div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p
              className="font-display text-lg tracking-wide leading-tight"
              style={{ color: action.accentColor }}
            >
              {action.title}
            </p>
            <p className="text-white/50 text-xs mt-0.5 leading-snug">{action.subtitle}</p>
          </div>
        </div>

        {/* CTA bar */}
        <button
          onClick={handleCta}
          className="relative z-10 w-full py-3 text-center font-bold text-sm transition-all hover:brightness-110 active:brightness-90"
          style={{
            background: `${action.accentColor}22`,
            borderTop: `1px solid ${action.accentColor}30`,
            color: action.accentColor,
          }}
        >
          {action.cta}
        </button>
      </motion.div>
    </motion.div>
  );
}
