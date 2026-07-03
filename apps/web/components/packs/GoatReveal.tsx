'use client';

import type { DrawnCard } from '@/lib/pack-logic';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  card: DrawnCard;
  onComplete: () => void;
};

// ─── Partículas do GOAT ───────────────────────────────────────────────────────

const GOAT_PARTICLES = Array.from({ length: 80 }, (_, i) => {
  const angle = (i / 80) * Math.PI * 2;
  const spread = 60 + (i % 8) * 30; // 60–270px
  const isGold = i % 3 === 0;
  const isWhite = i % 7 === 0;
  return {
    tx: Math.round(Math.cos(angle) * spread),
    ty: Math.round(Math.sin(angle) * spread),
    size: 2 + (i % 6),
    delay: (i % 10) * 0.03,
    dur: 0.8 + (i % 5) * 0.15,
    color: isWhite ? '#ffffff' : isGold ? '#c9a84c' : '#e2e8f0',
  };
});

// ─── Phase ────────────────────────────────────────────────────────────────────

type GoatPhase = 'dark' | 'text' | 'card' | 'burst' | 'hold';

export function GoatReveal({ card, onComplete }: Props) {
  const [phase, setPhase] = useState<GoatPhase>('dark');

  useEffect(() => {
    // 1. Tela escura (suspense)
    const t1 = setTimeout(() => setPhase('text'), 900);
    // 2. Texto dramático
    const t2 = setTimeout(() => setPhase('card'), 2000);
    // 3. Carta aparece
    const t3 = setTimeout(() => setPhase('burst'), 3200);
    // 4. Explosão de partículas
    const t4 = setTimeout(() => setPhase('hold'), 4200);
    // 5. Segurar → chamar onComplete
    const t5 = setTimeout(onComplete, 6500);

    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'rgba(2,2,6,0.98)' }}
      onClick={phase === 'hold' ? onComplete : undefined}
    >
      {/* Aura de fundo dourada (phases: card/burst/hold) */}
      <AnimatePresence>
        {(phase === 'card' || phase === 'burst' || phase === 'hold') && (
          <motion.div
            className="absolute rounded-full blur-3xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0.3, 0.8, 0.5], scale: [1, 2, 1.5] }}
            transition={{ duration: 2, ease: 'easeOut' }}
            style={{ width: 500, height: 500, background: 'rgba(201,168,76,0.15)' }}
          />
        )}
      </AnimatePresence>

      {/* Grade de linhas douradas sutis */}
      {(phase === 'card' || phase === 'burst' || phase === 'hold') && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Fase: texto dramático */}
      <AnimatePresence>
        {phase === 'text' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <motion.p
              className="text-sm tracking-[0.6em] text-white/40 uppercase mb-4"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
            >
              Incrivelmente raro
            </motion.p>
            <motion.h2
              className="font-display text-6xl sm:text-7xl tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #c9a84c, #fff, #e6c85a, #c9a84c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 30px rgba(201,168,76,0.8))',
              }}
            >
              GOAT
            </motion.h2>
            <motion.div
              className="mt-4 h-px w-40 mx-auto"
              style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, transparent)' }}
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fase: carta + shimmer platinum */}
      <AnimatePresence>
        {(phase === 'card' || phase === 'burst' || phase === 'hold') && (
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 60, scale: 0.7, rotateY: -45 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 14 }}
          >
            {/* Carta GOAT */}
            <div
              className="relative w-48 h-64 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #04040a, #0a0812, #110e1a)',
                border: '2px solid rgba(240,244,255,0.8)',
                boxShadow: '0 0 40px rgba(240,244,255,0.4), 0 0 100px rgba(201,168,76,0.2)',
              }}
            >
              {/* Shimmer platinum sweep */}
              <motion.div
                className="absolute inset-0 goat-shimmer-overlay pointer-events-none"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              />

              {/* Rainbow subtle */}
              <div className="absolute inset-0 ultra-rainbow-overlay opacity-10 pointer-events-none" />

              {/* Conteúdo da carta */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-[8px] font-black tracking-widest text-white/60 uppercase">
                    World Cup Hero
                  </span>
                </div>

                {/* OVR enorme */}
                <motion.p
                  className="font-display text-6xl leading-none"
                  style={{
                    background: 'linear-gradient(180deg, #fff 0%, #c9a84c 60%, #e6c85a 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 16px rgba(201,168,76,0.9))',
                  }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  {card.card.overall}
                </motion.p>

                <div
                  className="mt-2 mb-3 h-px w-20"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(240,244,255,0.6), transparent)',
                  }}
                />

                <p className="text-white font-bold text-sm leading-tight">
                  {card.card.displayName}
                </p>
                <p className="text-white/40 text-[9px] mt-0.5">
                  {card.card.flagEmoji} {card.card.position} · {card.card.era}
                </p>
              </div>
            </div>

            {/* Label */}
            <motion.div
              className="text-center"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
              <p
                className="font-display text-2xl tracking-[0.3em]"
                style={{
                  background: 'linear-gradient(90deg, #c9a84c, #fff, #c9a84c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                LENDA SUPREMA
              </p>
              {phase === 'hold' && (
                <motion.p
                  className="text-white/30 text-xs mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Toque para continuar
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Explosão de partículas GOAT (fase burst) */}
      <AnimatePresence>
        {phase === 'burst' && (
          <div
            className="absolute pointer-events-none"
            style={{ top: '50%', left: '50%', width: 0, height: 0 }}
          >
            {GOAT_PARTICLES.map((p, i) => (
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
                animate={{ x: p.tx, y: p.ty, scale: [0, 2, 0], opacity: [1, 0.8, 0] }}
                transition={{ duration: p.dur, delay: p.delay, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Pulse rings dourados */}
      {(phase === 'burst' || phase === 'hold') &&
        [0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border"
            style={{ borderColor: 'rgba(201,168,76,0.4)' }}
            initial={{ width: 100, height: 100, opacity: 0.8 }}
            animate={{ width: 700, height: 700, opacity: 0 }}
            transition={{
              duration: 2,
              delay: i * 0.6,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeOut',
            }}
          />
        ))}
    </motion.div>
  );
}
