'use client';

import type { AchievementView } from '@/lib/actions/achievements';
import type { AchievementDef } from '@world-legends/achievements';
import { motion } from 'framer-motion';

// ─── Rarity visuals ───────────────────────────────────────────────────────────

const RARITY_CONFIG: Record<
  AchievementDef['rarity'],
  { border: string; glow: string; bg: string; badge: string; label: string }
> = {
  common: {
    border: 'border-slate-500/40',
    glow: '',
    bg: 'bg-slate-900/50',
    badge: 'bg-slate-700 text-slate-300',
    label: 'Comum',
  },
  rare: {
    border: 'border-blue-500/50',
    glow: 'shadow-[0_0_14px_rgba(59,130,246,0.25)]',
    bg: 'bg-blue-950/40',
    badge: 'bg-blue-800 text-blue-200',
    label: 'Raro',
  },
  epic: {
    border: 'border-purple-500/50',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.35)]',
    bg: 'bg-purple-950/40',
    badge: 'bg-purple-800 text-purple-200',
    label: 'Épico',
  },
  legendary: {
    border: 'border-amber-400/60',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.4)]',
    bg: 'bg-amber-950/40',
    badge: 'bg-amber-700 text-amber-100',
    label: 'Lendário',
  },
  goat: {
    border: 'border-rose-400/70',
    glow: 'shadow-[0_0_28px_rgba(251,113,133,0.55)]',
    bg: 'bg-rose-950/40',
    badge: 'bg-rose-700 text-rose-100',
    label: 'GOAT',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

type AchievementCardProps = {
  view: AchievementView;
  onClaim: (id: string) => void;
  claiming: boolean;
};

export function AchievementCard({ view, onClaim, claiming }: AchievementCardProps) {
  const { def, unlocked, unlockedAt, rewardClaimed } = view;
  const cfg = RARITY_CONFIG[def.rarity];

  return (
    <motion.div
      layout
      className={[
        'relative rounded-2xl border overflow-hidden transition-all duration-300',
        unlocked ? `${cfg.border} ${cfg.glow} ${cfg.bg}` : 'border-white/5 bg-surface/60',
        !unlocked ? 'opacity-60 grayscale' : '',
      ].join(' ')}
      whileHover={unlocked ? { scale: 1.01 } : {}}
    >
      {/* Unlock shimmer overlay */}
      {unlocked && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: [0, 0.04, 0] }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          style={{ background: 'linear-gradient(135deg, white 0%, transparent 50%, white 100%)' }}
        />
      )}

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={[
              'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border',
              unlocked ? cfg.border : 'border-white/5 bg-black/30',
            ].join(' ')}
          >
            <span style={unlocked ? {} : { filter: 'grayscale(100%)' }}>{def.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className={`text-sm font-bold ${unlocked ? 'text-parchment' : 'text-muted'}`}>
                {def.name}
              </p>
              {/* Rarity badge */}
              <span
                className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${cfg.badge}`}
              >
                {cfg.label}
              </span>
              {unlocked && rewardClaimed && (
                <span className="text-emerald-400 text-[10px] font-bold">✓</span>
              )}
            </div>
            <p className="text-muted text-[10px] mt-0.5 leading-relaxed">{def.description}</p>

            {/* XP + Reward row */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[9px] font-bold text-amber-400 bg-amber-900/30 border border-amber-600/30 px-2 py-0.5 rounded-full">
                +{def.xp} XP
              </span>
              <span className="text-[9px] text-muted">{def.reward.label}</span>
            </div>

            {/* Unlocked date */}
            {unlocked && unlockedAt && (
              <p className="text-[8px] text-muted/60 mt-1">
                Desbloqueado em {unlockedAt.toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>

          {/* Locked icon overlay */}
          {!unlocked && <span className="text-muted text-lg shrink-0">🔒</span>}
        </div>

        {/* Claim reward button */}
        {unlocked && !rewardClaimed && (
          <motion.button
            onClick={() => onClaim(def.id)}
            disabled={claiming}
            className="mt-3 w-full py-2 rounded-xl text-xs font-display tracking-wider transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #8c6f27, #c9a84c)',
              color: '#07080f',
              boxShadow: '0 0 12px rgba(201,168,76,0.4)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🎁 COLETAR RECOMPENSA
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
