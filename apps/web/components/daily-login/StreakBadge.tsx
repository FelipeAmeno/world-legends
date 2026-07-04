'use client';

import { motion } from 'framer-motion';

type Props = {
  streakDays: number;
  nextMilestone: number | null;
};

type Tier = {
  flames: number;
  crown: boolean;
  label: string;
  color: string;
  glow: string;
  bg: string;
  border: string;
};

function getTier(days: number): Tier {
  if (days >= 30) return {
    flames: 0, crown: true,
    label: '👑 Lenda mensal!',
    color: '#fbbf24',
    glow: '0 0 24px rgba(251,191,36,0.6)',
    bg: 'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.35)',
  };
  if (days >= 15) return {
    flames: 3, crown: false,
    label: '🔥🔥🔥 Em chamas!',
    color: '#f97316',
    glow: '0 0 20px rgba(249,115,22,0.5)',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.3)',
  };
  if (days >= 7) return {
    flames: 2, crown: false,
    label: '🔥🔥 Consistência',
    color: '#fb923c',
    glow: '0 0 16px rgba(251,146,60,0.45)',
    bg: 'rgba(251,146,60,0.07)',
    border: 'rgba(251,146,60,0.25)',
  };
  if (days >= 3) return {
    flames: 1, crown: false,
    label: '🔥 Aquecendo',
    color: '#fbbf24',
    glow: '0 0 12px rgba(251,191,36,0.35)',
    bg: 'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.2)',
  };
  return {
    flames: 0, crown: false,
    label: 'Comece hoje',
    color: 'rgba(255,255,255,0.3)',
    glow: 'none',
    bg: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)',
  };
}

export function StreakBadge({ streakDays, nextMilestone }: Props) {
  if (streakDays === 0) {
    return (
      <div
        className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border"
        style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <span className="text-xl opacity-30">🔥</span>
        <p className="text-muted text-xs">Inicie sua sequência hoje!</p>
      </div>
    );
  }

  const tier = getTier(streakDays);
  const pct = nextMilestone ? Math.min(100, Math.round((streakDays / nextMilestone) * 100)) : 100;

  return (
    <motion.div
      layout
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border"
      style={{ background: tier.bg, borderColor: tier.border, boxShadow: tier.glow }}
    >
      {/* Flame cluster */}
      <div className="flex items-center shrink-0">
        {tier.crown ? (
          <motion.span
            className="text-3xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            👑
          </motion.span>
        ) : (
          <div className="flex">
            {Array.from({ length: Math.max(1, tier.flames) }).map((_, i) => (
              <motion.span
                key={i}
                className="text-2xl"
                style={{ marginLeft: i > 0 ? -6 : 0 }}
                animate={{ scale: [1, 1.12, 1], y: [0, -3, 0] }}
                transition={{
                  duration: 1.4,
                  delay: i * 0.18,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                }}
              >
                🔥
              </motion.span>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold" style={{ color: tier.color }}>
            {streakDays} dias seguidos
          </p>
          {nextMilestone && (
            <p className="text-[9px] opacity-50" style={{ color: tier.color }}>
              {nextMilestone}d bônus
            </p>
          )}
        </div>

        {nextMilestone && (
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${tier.color}99, ${tier.color})`,
                boxShadow: `0 0 6px ${tier.color}66`,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
        )}
      </div>

      {/* Milestone hint */}
      {tier.crown && (
        <motion.div
          className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider"
          style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
        >
          MAX
        </motion.div>
      )}
    </motion.div>
  );
}
