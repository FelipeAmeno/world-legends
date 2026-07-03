'use client';

import { motion } from 'framer-motion';

type Props = {
  streakDays: number;
  nextMilestone: number | null;
};

export function StreakBadge({ streakDays, nextMilestone }: Props) {
  if (streakDays === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/50 border border-white/5">
        <span className="text-lg">🔥</span>
        <p className="text-muted text-xs">Inicie sua sequência hoje!</p>
      </div>
    );
  }

  const pct = nextMilestone ? Math.min(100, (streakDays / nextMilestone) * 100) : 100;

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-950/20 border border-amber-500/20">
      <motion.span
        className="text-2xl shrink-0"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
      >
        🔥
      </motion.span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-amber-300 text-xs font-bold">{streakDays} dias seguidos</p>
          {nextMilestone && (
            <p className="text-amber-500/60 text-[9px]">
              Bônus em {nextMilestone} dias
            </p>
          )}
        </div>

        {nextMilestone && (
          <div className="h-1 bg-black/30 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
