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

// ─── Canvas Burst ─────────────────────────────────────────────────────────────

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

    const COLORS = ['#c9a84c', '#e6c85a', '#f5e098', '#ffffff', '#e2e8f0', '#a855f7', '#818cf8'];
    const COUNT  = 150;

    type Particle = {
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; alpha: number; life: number;
    };

    const particles: Particle[] = Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.35;
      const speed = 3 + Math.random() * 9;
      return {
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size:  2 + Math.random() * 7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
        alpha: 1,
        life:  0.8 + Math.random() * 0.7,
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
        p.vy += 0.18;
        p.vx *= 0.97;
        p.alpha = Math.max(0, 1 - elapsed / p.life);
        if (p.alpha <= 0) continue;
        any = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = p.color;
        ctx.shadowBlur  = p.size * 2.5;
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

  // ── Build tension on mount (dark phase sound) ─────────────────────────────
  useEffect(() => {
    SFX.packCharge?.();
    vibrate('packCharge');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sequência automática ──────────────────────────────────────────────────
  useEffect(() => {
    const delays: [number, GoatPhase][] = [
      [900,  'text'],
      [2100, 'card'],
      [3300, 'burst'],
      [4300, 'hold'],
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

    const tDone = setTimeout(onComplete, 7200);
    timerRefs.current.push(tDone);

    return () => {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
    };
  }, [onComplete]);

  // ── Tap: avançar ou concluir ──────────────────────────────────────────────
  const handleTap = useCallback(() => {
    const current = phaseRef.current;
    if (current === 'hold') {
      timerRefs.current.forEach(clearTimeout);
      timerRefs.current = [];
      onComplete();
      return;
    }

    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    advancePhase();

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
    timerRefs.current.push(setTimeout(onComplete, (remaining.at(-1)?.[0] ?? 2200) + 2000));
  }, [onComplete, advancePhase]);

  const nameLetters = card.card.displayName.split('');

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{ background: 'rgba(2,2,6,0.99)' }}
      onClick={handleTap}
    >
      {/* ── Barras de letterbox ── */}
      <motion.div
        className="fixed top-0 left-0 right-0 pointer-events-none z-20"
        style={{ background: '#000', height: '9vh' }}
        initial={{ y: '-100%' }}
        animate={{ y: phase === 'dark' || phase === 'text' ? 0 : '-100%' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="fixed bottom-0 left-0 right-0 pointer-events-none z-20"
        style={{ background: '#000', height: '9vh' }}
        initial={{ y: '100%' }}
        animate={{ y: phase === 'dark' || phase === 'text' ? 0 : '100%' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Confetti burst/hold */}
      <AnimatePresence>
        {(phase === 'burst' || phase === 'hold') && (
          <ConfettiCanvas key="goat-confetti" rarity="world_cup_hero" count={160} />
        )}
      </AnimatePresence>

      {/* Burst canvas */}
      <AnimatePresence>
        {phase === 'burst' && <BurstCanvas key="burst" />}
      </AnimatePresence>

      {/* Aura dourada de fundo */}
      <AnimatePresence>
        {(phase === 'card' || phase === 'burst' || phase === 'hold') && (
          <motion.div
            className="absolute rounded-full blur-3xl pointer-events-none"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: [0.2, 0.7, 0.45], scale: [1, 2.2, 1.7] }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            style={{ width: 540, height: 540, background: 'radial-gradient(circle, rgba(201,168,76,0.22), rgba(240,244,255,0.06))' }}
          />
        )}
      </AnimatePresence>

      {/* Grade dourada */}
      {(phase === 'card' || phase === 'burst' || phase === 'hold') && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* ── Fase: dark — tensão pura ── */}
      <AnimatePresence>
        {phase === 'dark' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Ponto de luz pulsante */}
            <motion.div
              className="w-3 h-3 rounded-full mb-6"
              style={{ background: 'rgba(201,168,76,0.9)', boxShadow: '0 0 24px rgba(201,168,76,0.7)' }}
              animate={{
                scale:  [1, 2.4, 1, 2.2, 1],
                opacity:[0.8, 1, 0.6, 1, 0.8],
              }}
              transition={{ duration: 0.85, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            />

            <motion.p
              className="text-white/20 text-[11px] uppercase tracking-[0.5em]"
              animate={{ opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
            >
              algo único está chegando
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fase: text — GOAT reveal ── */}
      <AnimatePresence>
        {phase === 'text' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 0.4 }}
          >
            {/* Subtítulo acima */}
            <motion.p
              className="text-[11px] tracking-[0.6em] text-white/35 uppercase mb-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              Incrivelmente raro
            </motion.p>

            {/* GOAT — letra por letra */}
            <div className="flex items-end" style={{ perspective: '600px' }}>
              {['G', 'O', 'A', 'T'].map((letter, i) => (
                <motion.span
                  key={letter + i}
                  className="font-display leading-none"
                  style={{
                    fontSize: 80,
                    display: 'inline-block',
                    background: 'linear-gradient(160deg, #fff 0%, #c9a84c 55%, #e6c85a 100%)',
                    WebkitBackgroundClip:   'text',
                    WebkitTextFillColor:    'transparent',
                    filter: 'drop-shadow(0 0 22px rgba(201,168,76,0.7))',
                    textShadow: 'none',
                  }}
                  initial={{ opacity: 0, y: 48, rotateX: -90, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                  transition={{
                    delay:     0.22 + i * 0.10,
                    type:      'spring',
                    stiffness: 260,
                    damping:   16,
                  }}
                >
                  {letter}
                </motion.span>
              ))}
            </div>

            {/* Linha decorativa */}
            <motion.div
              className="mt-5 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #c9a84c, rgba(240,244,255,0.8), #c9a84c, transparent)', width: 160 }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.65, duration: 0.6, ease: 'easeOut' }}
            />

            {/* Instrução sutil */}
            <motion.p
              className="text-white/20 text-[10px] mt-8 tracking-widest"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              toque para avançar
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fase: card + burst + hold ── */}
      <AnimatePresence>
        {(phase === 'card' || phase === 'burst' || phase === 'hold') && (
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 70, scale: 0.65, rotateY: -40 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }}
            transition={{ type: 'spring', stiffness: 95, damping: 13 }}
          >
            {/* Carta */}
            <div
              className="relative w-52 h-72 rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #04040a, #0a0812, #110e1a)',
                border:     '2px solid rgba(240,244,255,0.85)',
                boxShadow:  '0 0 50px rgba(240,244,255,0.35), 0 0 120px rgba(201,168,76,0.2), 0 30px 80px rgba(0,0,0,0.8)',
              }}
            >
              {/* Platinum shimmer */}
              <motion.div
                className="absolute inset-0 goat-shimmer-overlay pointer-events-none"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
              />

              {/* Rainbow subtle */}
              <div className="absolute inset-0 ultra-rainbow-overlay opacity-12 pointer-events-none" />

              {/* Pulse ring on card border */}
              {phase === 'hold' && (
                <motion.div
                  className="absolute -inset-1 rounded-2xl border-2 border-white/20 pointer-events-none"
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              )}

              {/* Card content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                <p className="text-[8px] font-black tracking-widest text-white/50 uppercase mb-1">
                  World Cup Hero
                </p>

                <motion.p
                  className="font-display leading-none"
                  style={{
                    fontSize: 70,
                    background: 'linear-gradient(180deg, #fff 0%, #c9a84c 55%, #e6c85a 100%)',
                    WebkitBackgroundClip:   'text',
                    WebkitTextFillColor:    'transparent',
                    filter: 'drop-shadow(0 0 18px rgba(201,168,76,0.9))',
                  }}
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                >
                  {card.card.overall}
                </motion.p>

                <div
                  className="mt-2 mb-4 h-px w-24"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(240,244,255,0.6), transparent)' }}
                />

                {/* Nome do jogador (hold: letra por letra) */}
                {phase === 'hold' ? (
                  <div className="flex flex-wrap justify-center">
                    {nameLetters.map((letter, i) => (
                      <motion.span
                        key={i}
                        className="text-white font-bold text-sm leading-tight"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay:    0.3 + i * 0.045,
                          duration: 0.25,
                          ease:     'easeOut',
                        }}
                      >
                        {letter === ' ' ? ' ' : letter}
                      </motion.span>
                    ))}
                  </div>
                ) : (
                  <p className="text-white font-bold text-sm leading-tight">
                    {card.card.displayName}
                  </p>
                )}

                <p className="text-white/40 text-[9px] mt-1">
                  {card.card.flagEmoji} {card.card.position} · {card.card.era}
                </p>
              </div>
            </div>

            {/* Label e informações */}
            <div className="text-center flex flex-col items-center gap-1.5">
              <motion.p
                className="font-display text-2xl tracking-[0.3em]"
                style={{
                  background: 'linear-gradient(90deg, #c9a84c, #fff, #c9a84c)',
                  WebkitBackgroundClip:   'text',
                  WebkitTextFillColor:    'transparent',
                }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              >
                LENDA SUPREMA
              </motion.p>

              {/* Hold: informações finais */}
              {phase === 'hold' && (
                <>
                  <motion.p
                    className="text-white/20 text-[10px] tracking-[0.3em] uppercase"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    mais raro que 0.1% dos packs
                  </motion.p>

                  <motion.p
                    className="text-white/25 text-xs mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    Toque para continuar
                  </motion.p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pulse rings dourados — burst/hold ── */}
      {(phase === 'burst' || phase === 'hold') &&
        [0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border pointer-events-none"
            style={{ borderColor: i % 2 === 0 ? 'rgba(201,168,76,0.45)' : 'rgba(240,244,255,0.2)' }}
            initial={{ width: 80, height: 80, opacity: 0.9 }}
            animate={{ width: 800, height: 800, opacity: 0 }}
            transition={{
              duration: 2.2,
              delay:    i * 0.5,
              repeat:   Number.POSITIVE_INFINITY,
              ease:     'easeOut',
            }}
          />
        ))}
    </motion.div>
  );
}
