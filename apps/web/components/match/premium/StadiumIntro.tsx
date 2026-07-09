'use client';

import type { MatchOpponent } from '@/lib/match-data';
import { SPRING } from '@/lib/motion-tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  opponent: MatchOpponent;
  onComplete: () => void;
};

type IntroPhase = 'dark' | 'lights' | 'teams' | 'ready';

export function StadiumIntro({ opponent, onComplete }: Props) {
  const [phase, setPhase] = useState<IntroPhase>('dark');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('lights'), 300);
    const t2 = setTimeout(() => setPhase('teams'), 900);
    const t3 = setTimeout(() => setPhase('ready'), 2000);
    const t4 = setTimeout(() => onComplete(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center"
      style={{ background: '#020204' }}
    >
      {/* Stadium floodlights */}
      <AnimatePresence>
        {phase !== 'dark' && (
          <>
            {/* Left floodlight */}
            <motion.div
              className="absolute top-0 left-0 pointer-events-none"
              style={{
                width: 180,
                height: 320,
                background: 'linear-gradient(135deg, rgba(255,248,200,0.18) 0%, transparent 60%)',
                transformOrigin: 'top left',
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5 }}
            />
            {/* Right floodlight */}
            <motion.div
              className="absolute top-0 right-0 pointer-events-none"
              style={{
                width: 180,
                height: 320,
                background: 'linear-gradient(225deg, rgba(255,248,200,0.18) 0%, transparent 60%)',
                transformOrigin: 'top right',
              }}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            {/* Pitch glow */}
            <motion.div
              className="absolute rounded-full blur-3xl pointer-events-none"
              style={{
                width: 400,
                height: 120,
                bottom: '20%',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(16,120,16,0.15)',
              }}
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.7 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Pitch lines (simplified) */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: '35%' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase !== 'dark' ? 0.07 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Center line */}
        <div className="absolute top-8 left-4 right-4 h-px bg-white" />
        {/* Center circle */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border border-white" />
        {/* Goal area */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-8 border border-white" />
      </motion.div>

      {/* World Legends wordmark */}
      <motion.div
        className="relative z-10 text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: phase !== 'dark' ? 1 : 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p
          className="text-[8px] font-black uppercase tracking-[0.5em] mb-1"
          style={{ color: 'rgba(201,168,76,0.45)' }}
        >
          World Legends
        </p>
        <p
          className="font-display text-xs tracking-[0.3em]"
          style={{ color: 'rgba(255,255,255,0.18)' }}
        >
          APRESENTA
        </p>
      </motion.div>

      {/* Teams presentation */}
      <AnimatePresence>
        {(phase === 'teams' || phase === 'ready') && (
          <motion.div
            className="relative z-10 flex items-center gap-6 px-8"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING.smooth}
          >
            {/* Home team */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ ...SPRING.bouncy, delay: 0.05 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
                  borderColor: 'rgba(16,185,129,0.5)',
                  boxShadow: '0 0 24px rgba(16,185,129,0.3)',
                }}
              >
                <span className="text-3xl">🇧🇷</span>
              </div>
              <p className="font-display text-sm" style={{ color: '#10b981' }}>
                BR LENDAS
              </p>
              <p className="text-[8px] text-muted">Sua seleção</p>
            </motion.div>

            {/* VS divider */}
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...SPRING.bouncy, delay: 0.2 }}
            >
              <div
                className="px-3 py-1.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <span className="font-display text-xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  VS
                </span>
              </div>
            </motion.div>

            {/* Away team */}
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ ...SPRING.bouncy, delay: 0.1 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center border-2"
                style={{
                  background: `linear-gradient(145deg, ${opponent.color ?? '#ef4444'}28, ${opponent.color ?? '#ef4444'}08)`,
                  borderColor: `${opponent.color ?? '#ef4444'}55`,
                  boxShadow: `0 0 24px ${opponent.color ?? '#ef4444'}30`,
                }}
              >
                <span className="text-3xl">{opponent.flag}</span>
              </div>
              <p className="font-display text-sm" style={{ color: opponent.color ?? '#ef4444' }}>
                {opponent.name.toUpperCase()}
              </p>
              <p className="text-[8px] text-muted">{opponent.avgOvr} OVR</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "Jogo vai começar" */}
      <AnimatePresence>
        {phase === 'ready' && (
          <motion.div
            className="relative z-10 mt-10 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.p
              className="font-display text-2xl tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #ffffff, #c9a84c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.5))',
              }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
            >
              ⚽ BOLA ROLANDO
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
