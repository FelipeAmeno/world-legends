'use client';

import { type TodayProgress, getTodayProgress } from '@/lib/retention-store';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const ITEMS: Array<{ key: keyof TodayProgress; icon: string; label: string }> = [
  { key: 'login', icon: '📅', label: 'Login' },
  { key: 'pack', icon: '📦', label: 'Pack' },
  { key: 'win', icon: '⚽', label: 'Vitória' },
  { key: 'mission', icon: '✅', label: 'Missão' },
  { key: 'reward', icon: '🎁', label: 'Recompensa' },
];

export function ProgressTracker() {
  const [progress, setProgress] = useState<TodayProgress>({
    login: false,
    pack: false,
    win: false,
    mission: false,
    reward: false,
  });

  useEffect(() => {
    setProgress(getTodayProgress());
    const onUpdate = () => setProgress(getTodayProgress());
    window.addEventListener('wl:retention-update', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('wl:retention-update', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, []);

  const done = ITEMS.filter((item) => progress[item.key]).length;
  const allDone = done === ITEMS.length;

  return (
    <div className="px-4">
      <div
        className="rounded-2xl p-4 border"
        style={{
          background: 'rgba(255,255,255,0.025)',
          backdropFilter: 'blur(20px)',
          borderColor: allDone ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.055)',
          boxShadow: allDone ? '0 0 20px rgba(52,211,153,0.1)' : 'none',
          transition: 'all 0.4s ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted">Hoje você fez</p>
          <p
            className="text-[10px] font-bold"
            style={{ color: allDone ? '#34d399' : 'rgba(201,168,76,0.8)' }}
          >
            {done}/5
          </p>
        </div>

        {/* Items */}
        <div className="flex gap-2">
          {ITEMS.map((item, i) => {
            const isDone = progress[item.key];
            return (
              <motion.div
                key={item.key}
                className="flex-1 flex flex-col items-center gap-1"
                animate={isDone ? { scale: [1, 1.18, 1] } : {}}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg border transition-all duration-300"
                  style={{
                    background: isDone ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.03)',
                    borderColor: isDone ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.06)',
                    boxShadow: isDone ? '0 0 10px rgba(52,211,153,0.15)' : 'none',
                  }}
                >
                  {isDone ? (
                    <motion.span
                      className="text-sm font-bold"
                      style={{ color: '#34d399' }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                    >
                      ✓
                    </motion.span>
                  ) : (
                    <span style={{ opacity: 0.25 }}>{item.icon}</span>
                  )}
                </div>
                <p
                  className="text-[8px] text-center transition-colors duration-300"
                  style={{ color: isDone ? '#34d399' : 'rgba(255,255,255,0.25)' }}
                >
                  {item.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* All done! */}
        {allDone && (
          <motion.p
            className="text-center text-[9px] mt-3 font-bold"
            style={{ color: '#34d399' }}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            🏆 Dia perfeito! Volte amanhã para continuar.
          </motion.p>
        )}
      </div>
    </div>
  );
}
