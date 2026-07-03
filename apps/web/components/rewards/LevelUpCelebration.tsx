'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ConfettiSystem } from './ConfettiSystem';

// Títulos por nível
function getTitle(level: number): string {
  if (level >= 50) return 'GOAT';
  if (level >= 30) return 'Imortal';
  if (level >= 20) return 'Lenda';
  if (level >= 15) return 'Superestrela';
  if (level >= 12) return 'Estrela';
  if (level >= 10) return 'Ídolo';
  if (level >= 8) return 'Internacional';
  if (level >= 5) return 'Profissional';
  return 'Recruta';
}

// Deterministic particles
const BURST = Array.from({ length: 24 }, (_, i) => ({
  angle: (i / 24) * 360,
  r: 80 + (i % 4) * 30,
  color: ['#c9a84c', '#e6c85a', '#ffffff', '#10b981', '#3b82f6', '#a855f7'][i % 6]!,
  size: 4 + (i % 4),
  delay: i * 0.025,
}));

type Props = {
  prevLevel: number;
  newLevel: number;
  onComplete: () => void;
};

export function LevelUpCelebration({ prevLevel, newLevel, onComplete }: Props) {
  const [phase, setPhase] = useState<'burst' | 'reveal' | 'title'>('burst');
  const [confetti, setConfetti] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setPhase('reveal');
      setConfetti(true);
    }, 600);
    const t2 = setTimeout(() => setPhase('title'), 1400);
    const t3 = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete();
      }
    }, 4500);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  const newTitle = getTitle(newLevel);

  return (
    <>
      {/* Confetes */}
      <ConfettiSystem active={confetti} origin="top" />

      <div className="flex flex-col items-center gap-6 py-8 relative">
        {/* Burst ring */}
        {phase === 'burst' && (
          <div className="relative" style={{ width: 200, height: 200 }}>
            <div className="absolute inset-0 pointer-events-none">
              {BURST.map((p, i) => {
                const rad = (p.angle * Math.PI) / 180;
                const tx = Math.round(Math.cos(rad) * p.r);
                const ty = Math.round(Math.sin(rad) * p.r);
                return (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: p.size,
                      height: p.size,
                      top: '50%',
                      left: '50%',
                      marginLeft: -p.size / 2,
                      marginTop: -p.size / 2,
                      background: p.color,
                      boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                    }}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{ x: tx, y: ty, scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
                    transition={{ duration: 0.7, delay: p.delay, ease: 'easeOut' }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Level badge */}
        <AnimatePresence>
          {phase !== 'burst' && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotateY: -90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 150, damping: 12 }}
              className="flex flex-col items-center"
            >
              {/* Gold ring badge */}
              <div className="relative">
                <motion.div
                  className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #8c6f27, #c9a84c, #e6c85a, #c9a84c)',
                    boxShadow: '0 0 40px rgba(201,168,76,0.7), 0 0 80px rgba(201,168,76,0.3)',
                  }}
                  animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #0a0a14, #0f1117)' }}
                  >
                    <motion.span
                      className="font-display text-5xl gold-text"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.3, 1] }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      style={{ textShadow: '0 0 20px rgba(201,168,76,0.8)' }}
                    >
                      {newLevel}
                    </motion.span>
                  </div>
                </motion.div>

                {/* Pulse rings */}
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-gold/40"
                    animate={{ scale: [1, 2.5], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, delay: i * 0.6, repeat: Number.POSITIVE_INFINITY }}
                  />
                ))}
              </div>

              {/* LEVEL UP text */}
              {phase === 'title' && (
                <motion.div
                  className="text-center mt-5"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.5em] mb-1">
                    SUBIU DE NÍVEL
                  </p>
                  <p
                    className="font-display text-4xl tracking-wider"
                    style={{
                      background: 'linear-gradient(90deg, #8c6f27, #e6c85a, #c9a84c)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.5))',
                    }}
                  >
                    {newTitle.toUpperCase()}
                  </p>
                  <p className="text-white/30 text-xs mt-2">
                    Nível {prevLevel} → <span className="text-gold font-bold">{newLevel}</span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
