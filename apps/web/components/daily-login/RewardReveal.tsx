'use client';

import type { ClaimDayPayload, DailyReward } from '@/lib/actions/daily-login';
import { UI_HAPTIC } from '@/lib/haptics';
import { markTodayAction } from '@/lib/retention-store';
import { REWARD_SFX } from '@/lib/sound-manager';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

type Props = {
  payload: ClaimDayPayload;
  onContinue: () => void;
};

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  angle: (i / 24) * 360,
  delay: i * 0.03,
  distance: 55 + (i % 5) * 20,
  size: 4 + (i % 3) * 2,
  color: ['#c9a84c', '#e6c85a', '#ffffff', '#f0c040', '#fbbf24'][i % 5]!,
}));

export function RewardReveal({ payload, onContinue }: Props) {
  const celebrated = useRef(false);

  useEffect(() => {
    if (celebrated.current) return;
    celebrated.current = true;

    UI_HAPTIC.reward(payload.day === 7 ? 'large' : payload.streakBonus ? 'large' : 'medium');
    REWARD_SFX.missionDone();
    markTodayAction('login');
    markTodayAction('reward');
  }, [payload]);

  const allRewards: DailyReward[] = [
    ...payload.rewards,
    ...(payload.streakBonus ? [payload.streakBonus] : []),
  ];
  const isMilestone = payload.day === 7;

  return (
    <motion.div
      className="flex flex-col items-center gap-6 py-4 relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Particle burst */}
      <div
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{ top: '15%' }}
      >
        <AnimatePresence>
          {PARTICLES.map((p, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{ width: p.size, height: p.size, background: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Day badge */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="relative"
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl border-2"
          style={
            isMilestone
              ? {
                  background: 'radial-gradient(circle, #2a1c00, #1a1000)',
                  borderColor: 'rgba(251,191,36,0.7)',
                  boxShadow: '0 0 40px rgba(251,191,36,0.6)',
                }
              : {
                  background: 'radial-gradient(circle, #1a1400, #0d0a00)',
                  borderColor: 'rgba(201,168,76,0.6)',
                  boxShadow: '0 0 24px rgba(201,168,76,0.4)',
                }
          }
        >
          {isMilestone ? '👑' : '🎁'}
        </div>
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-gold/40"
          animate={{ scale: [1, 1.5, 2.2], opacity: [0.7, 0.3, 0] }}
          transition={{ duration: 1.4, repeat: 2, ease: 'easeOut' }}
        />
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <p className="font-display text-xl gold-text tracking-wider">
          {isMilestone ? '🌟 RECOMPENSA SEMANAL!' : `DIA ${payload.day}`}
        </p>
        <p className="text-muted text-xs mt-0.5">
          {payload.streakBonus
            ? `${payload.nextState.nextStreak} dias seguidos! 🔥`
            : 'Login diário'}
        </p>
      </motion.div>

      {/* Reward chips */}
      <motion.div
        className="flex flex-wrap justify-center gap-2 max-w-xs"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {allRewards.map((reward, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold"
            style={{
              background:
                reward.kind === 'pack'
                  ? 'rgba(168,85,247,0.15)'
                  : reward.kind === 'xp'
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(201,168,76,0.15)',
              borderColor:
                reward.kind === 'pack'
                  ? 'rgba(168,85,247,0.4)'
                  : reward.kind === 'xp'
                    ? 'rgba(59,130,246,0.4)'
                    : 'rgba(201,168,76,0.4)',
              color:
                reward.kind === 'pack' ? '#c084fc' : reward.kind === 'xp' ? '#93c5fd' : '#fbbf24',
            }}
          >
            <span>{reward.icon}</span>
            <span>{reward.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Streak bonus badge */}
      {payload.streakBonus && (
        <motion.div
          initial={{ scale: 0, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-400/40 bg-amber-950/30"
        >
          <span className="text-lg">🔥</span>
          <div>
            <p className="text-amber-300 text-xs font-bold">Bônus de Sequência!</p>
            <p className="text-amber-400/70 text-[10px]">{payload.streakBonus.label}</p>
          </div>
        </motion.div>
      )}

      {/* CTA */}
      <motion.button
        onClick={onContinue}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full max-w-xs py-3 rounded-xl font-display text-sm tracking-wider"
        style={{
          background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a)',
          boxShadow: '0 0 20px rgba(201,168,76,0.4)',
          color: '#07080f',
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        CONTINUAR
      </motion.button>
    </motion.div>
  );
}
