'use client';

import { useDailyLogin } from '@/lib/hooks/useDailyLogin';
import { SPRING } from '@/lib/motion-tokens';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

function useCountdown(): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(`${h}h ${m}m`);
    };
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, []);
  return label;
}

export function RetentionPanel() {
  const { view, loading } = useDailyLogin();
  const open = () => window.dispatchEvent(new Event('wl:open-daily-login'));
  const countdown = useCountdown();

  if (loading || !view) return null;

  const { state, schedule } = view;
  const nextDayEntry = schedule[(state.currentDay % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6];
  const nextRewardIcon = nextDayEntry?.rewards[0]?.icon ?? '🎁';
  const nextRewardLabel = nextDayEntry?.rewards[0]?.label ?? '';

  const streakLabel =
    state.streakDays >= 30
      ? '👑 30 dias'
      : state.streakDays >= 15
        ? `🔥🔥🔥 ${state.streakDays}d`
        : state.streakDays >= 7
          ? `🔥🔥 ${state.streakDays}d`
          : state.streakDays >= 3
            ? `🔥 ${state.streakDays}d`
            : `${state.streakDays} dias`;

  return (
    <div className="px-4">
      <div className="grid grid-cols-2 gap-3">
        {/* ── Daily Login card ── */}
        <motion.button
          onClick={open}
          className="rounded-2xl p-3.5 border text-left relative overflow-hidden"
          style={{
            background: state.canClaimToday
              ? 'linear-gradient(145deg, #1a1200, #120d00)'
              : 'rgba(255,255,255,0.025)',
            borderColor: state.canClaimToday ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.07)',
            boxShadow: state.canClaimToday ? '0 0 20px rgba(201,168,76,0.12)' : 'none',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING.snappy}
        >
          {/* Pulse when claimable */}
          {state.canClaimToday && (
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ border: '1px solid rgba(201,168,76,0.3)' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            />
          )}

          <div className="flex items-start justify-between mb-2">
            <span className="text-xl">{state.canClaimToday ? '🎁' : '📅'}</span>
            {state.canClaimToday && (
              <motion.div
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
          </div>

          <p className="font-bold text-[11px] text-parchment mb-0.5">
            {state.canClaimToday ? 'Coletar recompensa' : 'Login diário'}
          </p>
          <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {state.canClaimToday ? 'Toque para coletar' : streakLabel}
          </p>

          {/* Next reward preview */}
          {!state.canClaimToday && nextDayEntry && (
            <div
              className="mt-2 flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <span style={{ fontSize: 12 }}>{nextRewardIcon}</span>
              <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>
                Amanhã: {nextRewardLabel}
              </p>
            </div>
          )}
        </motion.button>

        {/* ── Missions card ── */}
        <Link href="/missions" className="block">
          <motion.div
            className="rounded-2xl p-3.5 border relative overflow-hidden h-full"
            style={{
              background: 'rgba(255,255,255,0.025)',
              borderColor: 'rgba(255,255,255,0.07)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING.snappy}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xl">📋</span>
              <span
                className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  color: '#93c5fd',
                  border: '1px solid rgba(59,130,246,0.25)',
                }}
              >
                DIÁRIAS
              </span>
            </div>

            <p className="font-bold text-[11px] text-parchment mb-0.5">Missões do dia</p>
            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Reset em {countdown}
            </p>

            <div className="mt-2 flex items-center gap-1">
              <div
                className="flex-1 h-1 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', width: 0 }}
                />
              </div>
              <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>→</p>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
