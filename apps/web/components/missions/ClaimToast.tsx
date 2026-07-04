'use client';

import type { MissionReward } from '@/lib/mission-system';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

type Props = {
  rewards: MissionReward[] | null;
  onDismiss: () => void;
};

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  x: -55 + ((i * 37) % 115),
  delay: i * 0.04,
  color: ['#c9a84c', '#e6c85a', '#ffffff', '#10b981', '#3b82f6', '#a855f7'][i % 6]!,
  size: 4 + (i % 3) * 2,
}));

export function ClaimToast({ rewards, onDismiss }: Props) {
  useEffect(() => {
    if (!rewards) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [rewards, onDismiss]);

  return (
    <AnimatePresence>
      {rewards && (
        <>
          {/* Particle burst */}
          <div className="fixed top-20 left-0 right-0 pointer-events-none z-50 flex justify-center" style={{ height: 100 }}>
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{ width: p.size, height: p.size, background: p.color, top: '100%', left: '50%' }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: -90, opacity: 0, scale: 0.3 }}
                transition={{ duration: 1, delay: p.delay, ease: 'easeOut' }}
              />
            ))}
          </div>

          {/* Toast */}
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
            style={{ maxWidth: 'calc(100vw - 32px)' }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
              style={{
                background: 'linear-gradient(135deg, #0d1800, #1a2800)',
                borderColor: 'rgba(201,168,76,0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 24px rgba(201,168,76,0.2)',
              }}
            >
              <motion.span
                className="text-xl shrink-0"
                animate={{ rotate: [0, 18, -12, 6, 0], scale: [1, 1.4, 1] }}
                transition={{ duration: 0.5 }}
              >
                🎉
              </motion.span>
              <div className="min-w-0">
                <p className="text-gold text-xs font-bold">Missão concluída!</p>
                <div className="flex flex-wrap gap-2 mt-0.5">
                  {rewards.map((r, i) => (
                    <span key={i} className="text-white/60 text-[10px] whitespace-nowrap">
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
