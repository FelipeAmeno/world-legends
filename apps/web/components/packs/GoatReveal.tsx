'use client';

import type { DrawnCard } from '@/lib/pack-logic';
import { vibrate } from '@/lib/haptics';
import { SFX } from '@/lib/sound-manager';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfettiCanvas } from './ConfettiCanvas';

type Props = {
  card: DrawnCard;
  onComplete: () => void;
};

type GoatPhase = 'dark' | 'text' | 'card' | 'burst' | 'hold';

const PHASE_ORDER: GoatPhase[] = ['dark', 'text', 'card', 'burst', 'hold'];

// ─── Canvas Burst Particles ───────────────────────────────────────────────────

function BurstCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width  = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2;
    const cy = H / 2;

    const COLORS = ['#c9a84c', '#e6c85a', '#f5e098', '#ffffff', '#e2e8f0', '#a855f7'];
    const COUNT  = 120;

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; alpha: number; life: number;
    };

    const particles: Particle[] = Array.from({ length: COUNT }, (_, i) => {
      const angle  = (i / COUNT) * Math.PI * 2 + Math.random() * 0.3;
      const speed  = 2 + Math.random() * 7;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size:  2 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        alpha: 1,
        life:  0.7 + Math.random() * 0.6,
      };
    });

    let raf = 0;
    let elapsed = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      elapsed += dt;

      ctx.clearRect(0, 0, W, H);
      let any = false;

      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.vy += 0.15;
        p.vx *= 0.97;
        p.alpha = Math.max(0, 1 - elapsed / p.life);
        if (p.alpha <= 0) continue;
        any = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.shadowBlur  = p.size * 2;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (any) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };

    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function GoatReveal({ card, onComplete }: Props) {
  const [phase, setPhase] = useState<GoatPhase>('dark');
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef  = useRef<GoatPhase>('dark');

  const advancePhase = useCallback(() => {
    const current = phaseRef.current;
    const idx = PHASE_ORDER.indexOf(current);
    if (idx < 0 || idx >= PHASE_ORDER.length - 1) return;
    const next = PHASE_ORDER[idx + 1]!;
    phaseRef.current = next;
    setPhase(next);
    if (next === 'burst') {
      vibrate('cardGoat');
      SFX.cardGoat?.();
    }
  }, []);

  // Sequência automática
  useEffect(() => {
    const delays: [number, GoatPhase][] = [
      [900,  'text'],
      [2000, 'card'],
      [3200, 'burst'],
      [4200, 'hold'],
    ];

    timerRefs.current = delays.map(([ms, p]) =>
      setTimeout(() => {
        phaseRef.current = p;
        setPhase(p);
        if (p === 'burst') {
          vibrate('cardGoat');
          SFX.cardGoat?.();
        }
      }, ms),
    );

    const tDone = setTimeout(onComplete, 6500);
    timerRefs.current.push(tDone);

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [onComplete]);

  // Tap handler: skip para próxima fase (exceto hold → onComplete)
  const handleTap = useCallback(() => {
    const current = phaseRef.current;
    if (current === 'hold') {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
      onComplete();
      return;
    }
    // Limpar timers automáticos e avançar manualmente
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    advancePhase();

    // Reescalonar timers para as fases restantes a partir daqui
    const currentIdx = PHASE_ORDER.indexOf(phaseRef.current);
    const remaining: [number, GoatPhase][] = [
      [600,  'card'],
      [1400, 'burst'],
      [2200, 'hold'],
    ].slice(Math.max(0, currentIdx - 1)) as [number, GoatPhase][];

    timerRefs.current = remaining.map(([ms, p]) =>
      setTimeout(() => {
        phaseRef.current = p;
        setPhase(p);
        if (p === 'burst') {
          vibrate('cardGoat');
          SFX.cardGoat?.();
        }
      }, ms),
    );
    timerRefs.current.push(setTimeout(onComplete, remaining.at(-1)?.[0]! + 2000));
  }, [onComplete, advancePhase]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'rgba(2,2,6,0.98)' }}
      onClick={handleTap}
    >
      {/* Confetti durante burst/hold */}
      <AnimatePresence>
        {(phase === 'burst' || phase === 'hold') && (
          <ConfettiCanvas key="goat-confetti" rarity="world_cup_hero" count={140} />
        )}
      </AnimatePresence>

      {/* Burst Canvas particles */}
      <AnimatePresence>
        {phase === 'burst' && <BurstCanvas key="burst" />}
      </AnimatePresence>

      {/* Aura de fundo dourada */}
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
            <p className="text-white/20 text-[10px] mt-6 tracking-widest">toque para avançar</p>
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
                    background: 'linear-gradient(90deg, transparent, rgba(240,244,255,0.6), transparent)',
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
