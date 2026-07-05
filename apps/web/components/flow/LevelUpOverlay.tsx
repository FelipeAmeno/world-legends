'use client';

import { useGame } from '@/lib/game-context';
import { EASE, SPRING } from '@/lib/motion-tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const TITLES: [number, string][] = [
  [1, 'Recruta'],
  [3, 'Jovem Promessa'],
  [5, 'Profissional'],
  [8, 'Internacional'],
  [10, 'Ídolo'],
  [12, 'Estrela'],
  [15, 'Superestrela'],
  [20, 'Lenda'],
  [30, 'Imortal'],
  [50, 'GOAT'],
];
function getTitle(level: number): string {
  return [...TITLES].filter(([l]) => l <= level).pop()?.[1] ?? 'Recruta';
}

// Static deterministic particles — no Math.random() on render
const PARTICLES = Array.from({ length: 36 }, (_, i) => ({
  angle: (i / 36) * 360,
  r: 80 + (i % 6) * 22,
  size: 3 + (i % 4),
  color: ['#c9a84c', '#e6c85a', '#f5e098', '#ffffff', '#10b981', '#3b82f6', '#a855f7'][i % 7]!,
  delay: i * 0.018,
  dur: 0.75 + (i % 5) * 0.12,
}));

type Phase = 'enter' | 'xp' | 'burst' | 'title' | 'done';

export function LevelUpOverlay() {
  const { state, dismissLevelUp } = useGame();
  const { leveledUp, level, prevLevel } = state;

  const [phase, setPhase] = useState<Phase>('enter');
  const [xpWidth, setXpWidth] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!leveledUp) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase('enter');
    setXpWidth(0);

    timers.current = [
      setTimeout(() => {
        setPhase('xp');
        setTimeout(() => setXpWidth(100), 60);
      }, 350),
      setTimeout(() => setPhase('burst'), 1150),
      setTimeout(() => setPhase('title'), 2000),
      setTimeout(() => setPhase('done'), 2800),
    ];

    return () => timers.current.forEach(clearTimeout);
  }, [leveledUp]);

  if (!leveledUp) return null;

  const newTitle = getTitle(level);
  const showBurst = phase === 'burst' || phase === 'title' || phase === 'done';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ background: 'rgba(2,3,8,0.93)', backdropFilter: 'blur(8px)' }}
      onClick={phase === 'done' ? dismissLevelUp : undefined}
    >
      {/* Ambient glow blob */}
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width: 450, height: 450, background: 'rgba(201,168,76,0.1)' }}
        animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />

      {/* Particle burst */}
      <AnimatePresence>
        {showBurst && (
          <div className="absolute" style={{ top: '42%', left: '50%', width: 0, height: 0 }}>
            {PARTICLES.map((p, i) => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * p.r;
              const ty = Math.sin(rad) * p.r;
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    top: -p.size / 2,
                    left: -p.size / 2,
                    background: p.color,
                    boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  }}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                  animate={{ x: tx, y: ty, scale: [0, 1.6, 0], opacity: [1, 0.8, 0] }}
                  transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Expanding rings */}
      <AnimatePresence>
        {showBurst &&
          [0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border pointer-events-none"
              style={{
                borderColor: 'rgba(201,168,76,0.35)',
                top: '42%',
                left: '50%',
                x: '-50%',
                y: '-50%',
              }}
              initial={{ width: 80, height: 80, opacity: 0.8 }}
              animate={{ width: 460, height: 460, opacity: 0 }}
              transition={{ duration: 1.6, delay: i * 0.45, ease: 'easeOut' }}
            />
          ))}
      </AnimatePresence>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-8"
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Label */}
        <motion.p
          className="font-display text-[11px] tracking-[0.55em] mb-5"
          style={{ color: 'rgba(201,168,76,0.65)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          SUBIU DE NÍVEL
        </motion.p>

        {/* Level numbers */}
        <div className="flex items-center gap-5 mb-7">
          <motion.span
            className="font-display text-5xl"
            style={{ color: 'rgba(255,255,255,0.2)' }}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.1 }}
          >
            {prevLevel}
          </motion.span>

          <motion.span
            className="text-3xl"
            style={{ color: '#c9a84c' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SPRING.bouncy, delay: 0.28 }}
          >
            →
          </motion.span>

          {/* New level badge */}
          <motion.div
            className="relative flex items-center justify-center"
            style={{
              width: 78,
              height: 78,
              borderRadius: '50%',
              border: '3px solid rgba(201,168,76,0.75)',
              background: 'rgba(201,168,76,0.06)',
              boxShadow: '0 0 28px rgba(201,168,76,0.45), inset 0 0 18px rgba(201,168,76,0.12)',
            }}
            animate={
              showBurst
                ? {
                    boxShadow: [
                      '0 0 28px rgba(201,168,76,0.45)',
                      '0 0 60px rgba(201,168,76,0.85)',
                      '0 0 28px rgba(201,168,76,0.45)',
                    ],
                  }
                : {}
            }
            transition={{ duration: 0.55 }}
          >
            <span
              className="font-display text-4xl"
              style={{
                background: 'linear-gradient(180deg,#fff 0%,#c9a84c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {level}
            </span>
            {/* Inner glow ring on burst */}
            <AnimatePresence>
              {showBurst && (
                <motion.div
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    inset: -3,
                    borderRadius: '50%',
                    border: '2px solid rgba(201,168,76,0.6)',
                  }}
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* XP Bar */}
        <AnimatePresence>
          {phase !== 'enter' && (
            <motion.div
              className="w-60 mb-7"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <div
                className="flex justify-between mb-1.5"
                style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}
              >
                <span>XP</span>
                <span>Nível {level}</span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg,#8c6f27,#c9a84c,#e6c85a)',
                    boxShadow: '0 0 8px rgba(201,168,76,0.6)',
                  }}
                  initial={{ width: '0%' }}
                  animate={{ width: `${xpWidth}%` }}
                  transition={{
                    duration: 0.75,
                    ease: EASE.smooth as [number, number, number, number],
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New title */}
        <AnimatePresence>
          {(phase === 'title' || phase === 'done') && (
            <motion.div
              className="mb-7 px-6 py-3 rounded-2xl"
              style={{
                background: 'rgba(201,168,76,0.07)',
                border: '1px solid rgba(201,168,76,0.35)',
                boxShadow: '0 0 20px rgba(201,168,76,0.18)',
              }}
              initial={{ opacity: 0, scale: 0.82, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING.bouncy}
            >
              <p
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  marginBottom: 4,
                }}
              >
                Novo título
              </p>
              <p
                className="font-display text-2xl tracking-wider"
                style={{
                  background: 'linear-gradient(90deg,#c9a84c,#f5e098,#c9a84c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.45))',
                }}
              >
                {newTitle.toUpperCase()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Continue button */}
        <AnimatePresence>
          {phase === 'done' && (
            <motion.button
              onClick={dismissLevelUp}
              className="px-8 py-3 rounded-xl font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg,#8c6f27,#c9a84c,#e6c85a)',
                color: '#07080f',
                boxShadow: '0 0 20px rgba(201,168,76,0.35)',
              }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING.smooth}
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(201,168,76,0.6)' }}
              whileTap={{ scale: 0.96 }}
            >
              ✨ CONTINUAR
            </motion.button>
          )}
        </AnimatePresence>

        {phase === 'done' && (
          <motion.p
            className="mt-3"
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            ou clique em qualquer lugar
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
