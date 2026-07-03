'use client';

import type { DayConfig } from '@/lib/actions/daily-login';
import { motion } from 'framer-motion';

type Props = {
  config: DayConfig;
  isCurrent: boolean;
  isPast: boolean;
  isLocked: boolean;
};

const THEME = {
  normal: {
    border: 'border-white/10',
    bg: 'bg-surface/60',
    activeBorder: 'border-gold/50',
    activeBg: 'bg-gradient-to-b from-gold/10 to-transparent',
    activeGlow: '0 0 16px rgba(201,168,76,0.4)',
  },
  premium: {
    border: 'border-purple-500/20',
    bg: 'bg-purple-950/30',
    activeBorder: 'border-purple-400/60',
    activeBg: 'bg-gradient-to-b from-purple-500/15 to-transparent',
    activeGlow: '0 0 20px rgba(168,85,247,0.45)',
  },
  milestone: {
    border: 'border-amber-400/30',
    bg: 'bg-amber-950/30',
    activeBorder: 'border-amber-300/70',
    activeBg: 'bg-gradient-to-b from-amber-400/20 to-transparent',
    activeGlow: '0 0 28px rgba(251,191,36,0.55)',
  },
} as const;

export function DayCard({ config, isCurrent, isPast, isLocked }: Props) {
  const theme = THEME[config.theme];
  const mainReward = config.rewards[0];

  return (
    <motion.div
      layout
      className={[
        'relative flex flex-col items-center rounded-xl border overflow-hidden transition-all duration-300',
        'p-2 gap-1 min-h-[88px]',
        isPast
          ? 'border-white/5 bg-black/20 opacity-50'
          : isCurrent
            ? `${theme.activeBorder} ${theme.activeBg}`
            : isLocked
              ? `${theme.border} ${theme.bg} opacity-60`
              : `${theme.border} ${theme.bg}`,
      ].join(' ')}
      {...(isCurrent
        ? { style: { boxShadow: theme.activeGlow } }
        : {})}
      animate={isCurrent ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
    >
      {/* Day label */}
      <span
        className={[
          'text-[9px] font-bold uppercase tracking-wider',
          isPast ? 'text-white/20' : isCurrent ? 'text-gold' : 'text-muted',
        ].join(' ')}
      >
        Dia {config.day}
      </span>

      {/* Reward icon */}
      <div className="flex-1 flex items-center justify-center">
        {isPast ? (
          <motion.span
            className="text-emerald-400 text-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          >
            ✓
          </motion.span>
        ) : (
          <span
            className={[
              'transition-all',
              config.isMilestone ? 'text-2xl' : 'text-xl',
              isLocked ? 'opacity-40 grayscale' : '',
            ].join(' ')}
          >
            {mainReward?.icon ?? '🎁'}
          </span>
        )}
      </div>

      {/* Reward label */}
      {!isPast && (
        <p
          className={[
            'text-[8px] text-center leading-tight font-medium',
            isCurrent ? 'text-parchment' : 'text-muted/70',
          ].join(' ')}
        >
          {mainReward?.label ?? ''}
          {config.rewards.length > 1 && (
            <span className="text-[7px] opacity-60"> +{config.rewards.length - 1}</span>
          )}
        </p>
      )}

      {/* Milestone crown */}
      {config.isMilestone && !isPast && (
        <div className="absolute -top-1 -right-1">
          <span className="text-[10px]">👑</span>
        </div>
      )}

      {/* Current day pulse ring */}
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-gold/30"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        />
      )}
    </motion.div>
  );
}
