'use client';

import type { MissionReward } from '@/lib/mission-system';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

type Props = {
  rewards: MissionReward[] | null;
  onDismiss: () => void;
};

// Partículas determinísticas de XP
const XP_PARTS = Array.from({ length: 8 }, (_, i) => ({
  x: -30 + ((i * 43) % 80),
  delay: i * 0.06,
}));

export function ClaimToast({ rewards, onDismiss }: Props) {
  useEffect(() => {
    if (!rewards) return;
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [rewards, onDismiss]);

  return (
    <AnimatePresence>
      {rewards && (
        <>
          {/* Flying particles */}
          <div className="fixed top-24 left-0 right-0 pointer-events-none z-50 flex justify-center">
            {XP_PARTS.map((p, i) => (
              <motion.div
                key={i}
                className="absolute font-display text-xs text-gold font-bold"
                style={{ left: `calc(50% + ${p.x}px)` }}
                initial={{ y: 0, opacity: 1 }}
                animate={{ y: -80, opacity: 0, scale: [1, 1.3, 0.8] }}
                transition={{ duration: 1, delay: p.delay, ease: 'easeOut' }}
              >
                ✨
              </motion.div>
            ))}
          </div>

          {/* Toast */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{
                background: 'linear-gradient(135deg, #0d1800, #1a2800)',
                borderColor: 'rgba(201,168,76,0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(201,168,76,0.2)',
              }}
            >
              <motion.span
                className="text-xl"
                animate={{ rotate: [0, 15, -10, 5, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.6 }}
              >
                🎁
              </motion.span>
              <div>
                <p className="text-gold text-xs font-bold">Recompensa coletada!</p>
                <div className="flex gap-2 mt-0.5">
                  {rewards.map((r, i) => (
                    <span key={i} className="text-white/60 text-[10px]">
                      {r.icon} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
