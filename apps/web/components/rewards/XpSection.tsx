'use client';

import type { RewardData } from '@/lib/rewards-data';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Partículas de XP determinísticas
const XP_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: 15 + ((i * 43) % 70), // 15..85 vw
  y: 10 + ((i * 17) % 25), // 10..35 vh
  delay: i * 0.11,
  value: ['+10', '+20', '+15', '+5', '+25'][i % 5]!,
}));

type Props = {
  data: RewardData;
  onComplete: () => void;
};

export function XpSection({ data, onComplete }: Props) {
  const { prevXp, prevXpForNext, xpGained, newXp, newXpForNext, prevLevel, newLevel, leveledUp } =
    data;

  const [barPct, setBarPct] = useState((prevXp / prevXpForNext) * 100);
  const [displayXp, setDisplayXp] = useState(prevXp);
  const [showParticles, setShowParticles] = useState(false);
  const [filling, setFilling] = useState(false);
  const [flash, setFlash] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    // 1. Mostrar partículas voando
    const t1 = setTimeout(() => setShowParticles(true), 200);

    // 2. Começar a encher a barra
    const t2 = setTimeout(() => {
      setFilling(true);
      // Animar o número de XP
      const start = prevXp;
      const end = leveledUp ? prevXpForNext : newXp;
      const duration = 1500;
      const startTime = Date.now();

      const tick = () => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(1, elapsed / duration);
        const eased = 1 - (1 - pct) ** 3;
        const current = Math.round(start + (end - start) * eased);
        setDisplayXp(current);
        setBarPct((current / prevXpForNext) * 100);
        if (pct < 1) requestAnimationFrame(tick);
        else if (leveledUp) {
          // Flash + reset
          setTimeout(() => {
            setFlash(true);
            setTimeout(() => {
              setFlash(false);
              setBarPct((newXp / newXpForNext) * 100);
              setDisplayXp(newXp);
            }, 400);
          }, 200);
        }
      };
      requestAnimationFrame(tick);
    }, 600);

    // 3. Completar
    const t3 = setTimeout(() => {
      if (!calledRef.current) {
        calledRef.current = true;
        onComplete();
      }
    }, 3200);

    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  const displayLevel = leveledUp && flash ? newLevel : prevLevel;

  return (
    <div className="relative flex flex-col items-center gap-5">
      {/* XP particles */}
      <AnimatePresence>
        {showParticles && (
          <div className="fixed inset-0 pointer-events-none z-10">
            {XP_PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                className="absolute font-display text-sm font-bold text-blue-300"
                style={{ left: `${p.x}vw`, top: `${p.y}vh` }}
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{
                  opacity: [1, 1, 0],
                  y: [0, 40, 120],
                  scale: [1, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.2,
                  delay: p.delay,
                  ease: 'easeIn',
                }}
              >
                <span className="drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]">{p.value}</span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* XP total ganho */}
      <motion.div
        className="text-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <p className="text-white/30 text-[10px] uppercase tracking-[0.4em] mb-1">XP Ganho</p>
        <p
          className="font-display text-6xl text-blue-400"
          style={{ textShadow: '0 0 30px rgba(59,130,246,0.6)' }}
        >
          +{xpGained}
        </p>
      </motion.div>

      {/* XP bar */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Level indicator */}
        <div className="flex justify-between text-[10px] mb-1.5">
          <AnimatePresence mode="wait">
            <motion.span
              key={displayLevel}
              className="text-gold font-bold font-display text-base"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              Nv {displayLevel}
            </motion.span>
          </AnimatePresence>
          <span className="text-white/30">
            {displayXp.toLocaleString('pt-BR')} /{' '}
            {(leveledUp && flash ? newXpForNext : prevXpForNext).toLocaleString('pt-BR')} XP
          </span>
          <span className="text-gold font-bold font-display text-base">Nv {displayLevel + 1}</span>
        </div>

        {/* Bar track */}
        <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
          {/* Bar fill */}
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            animate={{ width: `${Math.min(100, barPct)}%` }}
            transition={{ duration: 1.5, delay: 0.6, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(90deg, #3b82f6, #818cf8, #a855f7)',
              boxShadow: '0 0 10px rgba(99,102,241,0.6)',
            }}
          />

          {/* Shine sweep */}
          <motion.div
            className="absolute inset-y-0 w-12 opacity-40"
            animate={{ x: ['-100%', '400%'] }}
            transition={{
              duration: 1.8,
              delay: 0.8,
              ease: 'easeInOut',
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 1,
            }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
            }}
          />
        </div>

        {/* Percentual */}
        <p className="text-right text-[9px] text-white/30 mt-0.5">
          {Math.round(Math.min(100, barPct))}%
        </p>
      </motion.div>

      {/* Flash de level-up */}
      <AnimatePresence>
        {flash && (
          <motion.div
            className="fixed inset-0 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.4 }}
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.4), transparent 60%)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
