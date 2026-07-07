'use client';

import type { NewTrophyNotice } from '@/lib/actions/achievements.types';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

type Props = {
  notice: NewTrophyNotice | null;
  onDismiss: () => void;
};

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
  goat: '#fb7185',
};

export function AchievementUnlockToast({ notice, onDismiss }: Props) {
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [notice, onDismiss]);

  return (
    <AnimatePresence>
      {notice && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-80 max-w-[90vw]"
          // biome-ignore lint/a11y/useSemanticElements: motion.div required for Framer Motion animation
          role="status"
          aria-live="polite"
        >
          <div
            className="rounded-2xl overflow-hidden border backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, rgba(7,8,15,0.96) 0%, rgba(20,15,5,0.96) 100%)',
              borderColor: `${RARITY_COLORS[notice.rarity] ?? '#94a3b8'}60`,
              boxShadow: `0 0 32px ${RARITY_COLORS[notice.rarity] ?? '#94a3b8'}40`,
            }}
          >
            {/* Shimmer bar */}
            <motion.div
              className="h-0.5 w-full"
              style={{ background: RARITY_COLORS[notice.rarity] }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
            />

            <div className="flex items-center gap-3 p-4">
              {/* Pulsing icon */}
              <motion.div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
                style={{
                  background: `radial-gradient(circle, ${RARITY_COLORS[notice.rarity] ?? '#94a3b8'}30 0%, transparent 70%)`,
                }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
              >
                {notice.icon}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-[9px] font-black uppercase tracking-widest mb-0.5"
                  style={{ color: RARITY_COLORS[notice.rarity] }}
                >
                  🏆 Achievement Desbloqueado!
                </p>
                <p className="text-parchment text-sm font-bold leading-tight">{notice.name}</p>
                <p className="text-amber-400 text-[10px] font-bold mt-0.5">+{notice.xp} XP</p>
              </div>

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Fechar"
                className="text-muted text-lg leading-none shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
