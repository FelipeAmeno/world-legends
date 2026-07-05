'use client';

import { RARITY_VISUAL } from '@/lib/collection-data';
import { vibrate, RARITY_HAPTIC } from '@/lib/haptics';
import type { DrawnCard, RevealEffect } from '@/lib/pack-logic';
import { SFX, RARITY_SFX } from '@/lib/sound-manager';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

type Props = {
  drawn:        DrawnCard;
  flipped:      boolean;
  onFlip:       () => void;
  onHighRarity?: (effect: RevealEffect) => void;
};

// ─── Timing por raridade ──────────────────────────────────────────────────────

const RARITY_FLIP_DUR: Record<RevealEffect, number> = {
  common:         0.50,
  rare:           0.60,
  elite:          0.68,
  legendary:      1.00,
  ultra:          1.25,
  world_cup_hero: 0,
};

const RARITY_SPRING: Record<RevealEffect, { stiffness: number; damping: number }> = {
  common:         { stiffness: 280, damping: 24 },
  rare:           { stiffness: 250, damping: 21 },
  elite:          { stiffness: 220, damping: 18 },
  legendary:      { stiffness: 140, damping: 12 },
  ultra:          { stiffness: 110, damping: 10 },
  world_cup_hero: { stiffness: 100, damping: 10 },
};

// ms de antecipação ANTES do flip visual começar
const ANTICIPATION_DUR: Record<RevealEffect, number> = {
  common:         0,
  rare:           0,
  elite:          0,
  legendary:      450,
  ultra:          650,
  world_cup_hero: 0,
};

const BACK_COLORS: Record<RevealEffect, { border: string; glow: string; bg: string }> = {
  common:         { border: 'rgba(107,114,128,0.5)', glow: 'rgba(107,114,128,0.2)', bg: '#0c0d0f' },
  rare:           { border: 'rgba(147,51,234,0.6)',  glow: 'rgba(147,51,234,0.25)', bg: '#0a0018' },
  elite:          { border: 'rgba(59,130,246,0.7)',  glow: 'rgba(59,130,246,0.3)',  bg: '#000d20' },
  legendary:      { border: 'rgba(201,168,76,0.9)',  glow: 'rgba(201,168,76,0.45)', bg: '#120900' },
  ultra:          { border: 'rgba(236,72,153,1)',     glow: 'rgba(236,72,153,0.5)', bg: '#1a0012' },
  world_cup_hero: { border: 'rgba(240,244,255,1)',   glow: 'rgba(240,244,255,0.5)', bg: '#04040a' },
};

const HIGH_RARITY: Set<RevealEffect> = new Set(['legendary', 'ultra', 'world_cup_hero']);

// ─── Partículas ───────────────────────────────────────────────────────────────

const PARTICLE_COUNT: Record<RevealEffect, number> = {
  common: 8, rare: 14, elite: 16, legendary: 26, ultra: 34, world_cup_hero: 0,
};

function buildParticles(count: number, effect: RevealEffect) {
  // Elite: angular (crystal shards at 45° intervals)
  // Legendary: mix of tight + wide spread
  // Ultra: full 360° dense burst
  return Array.from({ length: count }, (_, i) => {
    const spread = effect === 'ultra'
      ? 30 + (i % 6) * 18
      : effect === 'legendary'
        ? 24 + (i % 5) * 16
        : 22 + (i % 5) * 12;
    const baseAngle = (i / count) * Math.PI * 2;
    const jitter = effect === 'elite' ? (i % 4) * (Math.PI / 8) : 0;
    const angle = baseAngle + jitter;
    return {
      tx:    Math.round(Math.cos(angle) * spread),
      ty:    Math.round(Math.sin(angle) * spread),
      size:  effect === 'legendary' && i % 4 === 0 ? 5 + (i % 3) : 2 + (i % 3),
      delay: i * 20,
      dur:   0.4 + (i % 5) * 0.08,
    };
  });
}

// Gold rain for legendary (falls from top)
const GOLD_RAIN = Array.from({ length: 8 }, (_, i) => ({
  x: 8 + (i * 11) % 82,
  size: 2 + (i % 3),
  color: ['#c9a84c', '#e6c85a', '#f5e098', '#c9a84c', '#e6c85a'][i % 5]!,
  dur: 0.55 + (i % 3) * 0.12,
  delay: i * 0.075,
}));

// ─── Rarity badge labels ──────────────────────────────────────────────────────

const RARITY_BADGE: Partial<Record<RevealEffect, string>> = {
  elite:     '⚡ ELITE',
  legendary: '✦ LEGENDARY ✦',
  ultra:     '✦✦ ULTRA RARO ✦✦',
};

// ─── Component ───────────────────────────────────────────────────────────────

export function RevealedCard({ drawn, flipped, onFlip, onHighRarity }: Props) {
  const [anticipating,    setAnticipating]    = useState(false);
  const [visuallyFlipped, setVisuallyFlipped] = useState(false);
  const [showParticles,   setShowParticles]   = useState(false);
  const [showFlash,       setShowFlash]       = useState(false);
  const [showBadge,       setShowBadge]       = useState(false);
  const [showGoldRain,    setShowGoldRain]    = useState(false);
  const [showUltraHalo,   setShowUltraHalo]   = useState(false);
  const [anticipRings,    setAnticipRings]    = useState(false);
  const [fastReveal,      setFastReveal]      = useState(false);
  const [animating,       setAnimating]       = useState(false);
  const lastTapRef = useRef(0);

  const { card, effect, glowColor, particleColor } = drawn;
  const isGoat   = effect === 'world_cup_hero';
  const visual   = RARITY_VISUAL[card.rarityCode];
  const back     = BACK_COLORS[effect];
  const flipDur  = RARITY_FLIP_DUR[effect];
  const spring   = RARITY_SPRING[effect];
  const partCount = PARTICLE_COUNT[effect];
  const particles = buildParticles(partCount, effect);

  // ── Quando `flipped` (pai) muda para true → inicia antecipação ou flip direto ──
  useEffect(() => {
    if (!flipped) return;
    const anticipDur = ANTICIPATION_DUR[effect];

    if (anticipDur > 0 && !fastReveal) {
      setAnticipating(true);
      setAnimating(true);

      // Ultra: mostrar anéis de antecipação + som de carga
      if (effect === 'ultra') {
        setAnticipRings(true);
        SFX.packCharge();
        vibrate('packCharge');
      }
      // Legendary: pequena vibração de alerta
      if (effect === 'legendary') {
        vibrate('warning');
      }

      const t = setTimeout(() => {
        setAnticipating(false);
        setAnticipRings(false);
        setVisuallyFlipped(true);
      }, anticipDur);

      return () => clearTimeout(t);
    }

    setVisuallyFlipped(true);
  }, [flipped]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Quando flip visual ocorre → SFX + efeitos ────────────────────────────────
  useEffect(() => {
    if (!visuallyFlipped) return;
    setAnimating(true);

    // Som + vibração imediatos no reveal visual
    const sfxKey = RARITY_SFX[effect] ?? 'cardCommon';
    SFX[sfxKey]?.();
    vibrate(RARITY_HAPTIC[effect] ?? 'cardCommon');

    if (HIGH_RARITY.has(effect) && !isGoat) {
      onHighRarity?.(effect);
    }

    const midPoint = fastReveal ? 0 : (flipDur * 1000) / 2;
    const postPoint = fastReveal ? 80 : flipDur * 1000 + 80;

    // Flash mid-flip
    const tFlash = setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), effect === 'ultra' ? 380 : effect === 'legendary' ? 320 : 250);
    }, midPoint);

    // Partículas + efeitos pós-flip
    const tPost = setTimeout(() => {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), effect === 'ultra' ? 1100 : 950);
      setAnimating(false);

      if (effect === 'legendary') {
        setShowGoldRain(true);
        setShowBadge(true);
        setTimeout(() => setShowGoldRain(false), 1400);
        setTimeout(() => setShowBadge(false), 2000);
      }
      if (effect === 'ultra') {
        setShowUltraHalo(true);
        setShowBadge(true);
        setTimeout(() => setShowUltraHalo(false), 3200);
        setTimeout(() => setShowBadge(false), 2400);
      }
      if (effect === 'elite') {
        setShowBadge(true);
        setTimeout(() => setShowBadge(false), 1400);
      }
    }, postPoint);

    return () => { clearTimeout(tFlash); clearTimeout(tPost); };
  }, [visuallyFlipped]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tap handler ───────────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    const now = Date.now();

    if (!flipped) {
      setFastReveal(false);
      lastTapRef.current = now;
      onFlip();
      return;
    }

    // Pular antecipação com segundo toque
    if (anticipating) {
      setFastReveal(true);
      setAnticipating(false);
      setAnticipRings(false);
      setVisuallyFlipped(true);
      return;
    }

    // Double-tap durante flip → skip
    if (animating && now - lastTapRef.current < 500) {
      setFastReveal(true);
    }
  }, [flipped, anticipating, animating, onFlip]);

  // ── Carta GOAT: visual de mistério ───────────────────────────────────────────
  if (isGoat) {
    return (
      <motion.div
        className="relative w-[130px] h-[175px] rounded-xl overflow-hidden cursor-pointer"
        style={{
          background: back.bg,
          border: `2px solid ${back.border}`,
          boxShadow: `0 0 30px ${back.glow}, 0 0 60px ${back.glow}`,
        }}
        animate={{ boxShadow: [
          `0 0 20px ${back.glow}, 0 0 40px ${back.glow.replace(/[\d.]+\)$/, '0.3)')}`,
          `0 0 40px ${back.glow}, 0 0 80px ${back.glow.replace(/[\d.]+\)$/, '0.5)')}`,
          `0 0 20px ${back.glow}, 0 0 40px ${back.glow.replace(/[\d.]+\)$/, '0.3)')}`,
        ]}}
        transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        onClick={handleTap}
        whileTap={{ scale: 0.94 }}
      >
        {/* Scanner ring */}
        <motion.div
          className="absolute inset-0 rounded-xl border"
          style={{ borderColor: 'rgba(240,244,255,0.4)' }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />

        {/* Outer scanner */}
        <motion.div
          className="absolute -inset-1.5 rounded-xl border"
          style={{ borderColor: 'rgba(240,244,255,0.18)' }}
          animate={{ scale: [1, 1.08, 1], opacity: [0, 0.6, 0] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
        />

        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none goat-shimmer-overlay opacity-20"
        />

        {/* Red dot — alerta */}
        <motion.div
          className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500"
          animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY }}
        />

        {/* Conteúdo mistério */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            className="font-display text-5xl leading-none mb-2"
            style={{
              background: 'linear-gradient(180deg, rgba(240,244,255,0.9), rgba(201,168,76,0.5))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 12px rgba(240,244,255,0.7))',
            }}
            animate={{ scale: [1, 1.06, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY }}
          >
            ?
          </motion.p>

          <motion.p
            className="text-[7px] font-black uppercase tracking-[0.25em] text-center px-2"
            style={{ color: 'rgba(240,244,255,0.5)' }}
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            INCRIVELMENTE<br />RARO
          </motion.p>

          <div
            className="mt-3 h-px w-16"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(240,244,255,0.4), transparent)' }}
          />

          <p className="text-[7px] mt-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>
            toque para revelar
          </p>
        </div>
      </motion.div>
    );
  }

  // ── Transição 3D ─────────────────────────────────────────────────────────────
  const transition = fastReveal
    ? { duration: 0 }
    : visuallyFlipped
      ? { type: 'spring' as const, stiffness: spring.stiffness, damping: spring.damping }
      : anticipating
        ? {
            duration: ANTICIPATION_DUR[effect] / 1000,
            ease: 'easeInOut',
            times: [0, 0.14, 0.28, 0.42, 0.57, 0.71, 0.85, 1],
          }
        : { duration: 0 };

  const animateValues = visuallyFlipped
    ? { rotateY: 180 }
    : anticipating
      ? effect === 'legendary'
        ? {
            rotateZ: [0, -5, 5, -4, 4, -2, 2, 0],
            scale:   [1, 1.06, 0.96, 1.08, 0.95, 1.04, 0.99, 1],
          }
        : effect === 'ultra'
          ? { scale: [1, 1.1, 0.89, 1.12, 0.88, 1.07, 0.96, 1] }
          : { rotateY: 0 }
      : { rotateY: 0 };

  return (
    <div className="relative card-fm-scene" style={{ width: 130, height: 175 }}>

      {/* Anéis de antecipação — ultra */}
      <AnimatePresence>
        {anticipRings && (
          <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-xl border-2"
                style={{ borderColor: glowColor, inset: 0 }}
                initial={{ opacity: 0.9, scale: 1 }}
                animate={{ opacity: 0, scale: 2.4 }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.16,
                  ease: 'easeOut',
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 0.2,
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Flash de revelação */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none z-30"
            initial={{ opacity: 0 }}
            animate={{
              opacity: effect === 'ultra'
                ? [0, 1, 0.8, 0.4, 0]
                : effect === 'legendary'
                  ? [0, 0.9, 0]
                  : [0, 0.7, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: effect === 'ultra' ? 0.38 : 0.25,
              times: effect === 'ultra' ? [0, 0.1, 0.3, 0.6, 1] : [0, 0.15, 1],
            }}
            style={{
              background: effect === 'ultra'
                ? 'linear-gradient(45deg, #ec4899, #f59e0b, #3b82f6, #10b981, #ec4899)'
                : glowColor,
              mixBlendMode: 'screen',
            }}
          />
        )}
      </AnimatePresence>

      {/* Partículas pós-flip */}
      <AnimatePresence>
        {showParticles && (
          <div
            className="absolute pointer-events-none z-40 overflow-visible"
            style={{ top: '50%', left: '50%', width: 0, height: 0 }}
          >
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width:  p.size,
                  height: p.size,
                  top:   -p.size / 2,
                  left:  -p.size / 2,
                  background:  particleColor,
                  boxShadow: `0 0 ${p.size * 2.5}px ${particleColor}`,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: p.tx, y: p.ty, scale: [0, 2, 0], opacity: [1, 1, 0] }}
                transition={{ duration: p.dur, delay: p.delay / 1000, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Chuva dourada — legendary */}
      <AnimatePresence>
        {showGoldRain && (
          <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
            {GOLD_RAIN.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  background: p.color,
                  boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                  left: `${p.x}%`,
                  top: 0,
                  marginLeft: -p.size / 2,
                }}
                initial={{ y: 0, opacity: 1, scale: 1 }}
                animate={{ y: 180, opacity: 0, scale: 0.4 }}
                transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Halo arco-íris — ultra */}
      <AnimatePresence>
        {showUltraHalo && (
          <motion.div
            className="absolute -inset-1 rounded-xl pointer-events-none z-5"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              boxShadow: [
                '0 0 20px rgba(236,72,153,0.9), 0 0 40px rgba(236,72,153,0.5)',
                '0 0 20px rgba(59,130,246,0.9), 0 0 40px rgba(59,130,246,0.5)',
                '0 0 20px rgba(16,185,129,0.9), 0 0 40px rgba(16,185,129,0.5)',
                '0 0 20px rgba(245,158,11,0.9), 0 0 40px rgba(245,158,11,0.5)',
                '0 0 20px rgba(168,85,247,0.9), 0 0 40px rgba(168,85,247,0.5)',
                '0 0 20px rgba(236,72,153,0.9), 0 0 40px rgba(236,72,153,0.5)',
              ],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, boxShadow: { duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: 'linear' } }}
          />
        )}
      </AnimatePresence>

      {/* Badge de raridade (pós-reveal) */}
      <AnimatePresence>
        {showBadge && RARITY_BADGE[effect] && (
          <motion.div
            className="absolute -bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50"
            initial={{ opacity: 0, y: -4, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span
              className="text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 rounded-full whitespace-nowrap"
              style={{
                color: glowColor.replace(/[\d.]+\)$/, '1)'),
                background: glowColor.replace(/[\d.]+\)$/, '0.15)'),
                border: `1px solid ${glowColor.replace(/[\d.]+\)$/, '0.6)')}`,
                boxShadow: `0 0 10px ${glowColor.replace(/[\d.]+\)$/, '0.5)')}`,
              }}
            >
              {RARITY_BADGE[effect]}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Container 3D */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={animateValues}
        transition={transition}
        onClick={handleTap}
        whileTap={!visuallyFlipped && !anticipating ? { scale: 0.93 } : {}}
      >
        {/* ── FACE TRASEIRA ── */}
        <div
          className="absolute inset-0 rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden"
          style={{
            backfaceVisibility:       'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background:   back.bg,
            borderColor:  back.border,
            boxShadow:  visuallyFlipped ? undefined : `0 0 20px ${back.glow}, inset 0 0 30px ${back.glow}`,
          }}
        >
          {/* Texto WL */}
          <p className="font-display text-3xl z-10" style={{ color: back.border }}>WL</p>
          <p className="text-[7px] tracking-[0.35em] mt-0.5 z-10" style={{ color: `${back.border}80` }}>
            WORLD LEGENDS
          </p>

          {/* Sweep animado base */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.07) 50%,transparent 65%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPositionX: ['-100%', '200%'] }}
            transition={{
              duration: effect === 'ultra' ? 1.2 : effect === 'legendary' ? 1.8 : 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />

          {/* ── Efeito especial por raridade (face traseira, antes de flippar) ── */}

          {/* Rare: shimmer púrpura adicional */}
          {effect === 'rare' && !visuallyFlipped && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg,transparent 30%,rgba(147,51,234,0.08) 50%,transparent 70%)', backgroundSize: '200% 200%' }}
              animate={{ backgroundPositionX: ['-100%', '200%'], backgroundPositionY: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
          )}

          {/* Elite: pulso cristalino azul */}
          {effect === 'elite' && !visuallyFlipped && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              animate={{ boxShadow: ['0 0 0px rgba(59,130,246,0)', '0 0 18px rgba(59,130,246,0.5)', '0 0 0px rgba(59,130,246,0)'] }}
              transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
            />
          )}

          {/* Legendary: heartbeat dourado (fast-fast-pause) */}
          {effect === 'legendary' && !visuallyFlipped && (
            <>
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 0px rgba(201,168,76,0)',
                    '0 0 28px rgba(201,168,76,0.75)',
                    '0 0 6px rgba(201,168,76,0.18)',
                    '0 0 28px rgba(201,168,76,0.85)',
                    '0 0 0px rgba(201,168,76,0)',
                    '0 0 0px rgba(201,168,76,0)',
                  ],
                }}
                transition={{ duration: 1.8, times: [0, 0.15, 0.3, 0.45, 0.65, 1], repeat: Number.POSITIVE_INFINITY }}
              />
              {/* Partícula dourada flutuando */}
              {!anticipating && (
                <motion.div
                  className="absolute w-1 h-1 rounded-full"
                  style={{ background: '#c9a84c', boxShadow: '0 0 6px #c9a84c' }}
                  animate={{ y: [60, -60], opacity: [0, 1, 0], x: [0, 8, -8, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                />
              )}
            </>
          )}

          {/* Ultra: cycling chromatic glow */}
          {effect === 'ultra' && !visuallyFlipped && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              animate={{
                boxShadow: [
                  '0 0 22px rgba(236,72,153,0.7)',
                  '0 0 22px rgba(59,130,246,0.7)',
                  '0 0 22px rgba(16,185,129,0.7)',
                  '0 0 22px rgba(245,158,11,0.7)',
                  '0 0 22px rgba(236,72,153,0.7)',
                ],
              }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
          )}

          {/* "toque" indicator */}
          {!visuallyFlipped && !anticipating && (
            <p className="absolute bottom-2 text-[8px] opacity-40 uppercase tracking-widest z-10" style={{ color: back.border }}>
              toque
            </p>
          )}
        </div>

        {/* ── FACE FRONTAL ── */}
        <div
          className={['absolute inset-0 rounded-xl border-2 flex flex-col overflow-hidden', visual.bgClass, visual.borderClass].join(' ')}
          style={{
            backfaceVisibility:       'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform:   'rotateY(180deg)',
            boxShadow: visuallyFlipped
              ? `0 0 32px ${glowColor}, 0 0 70px ${glowColor.replace(/[\d.]+\)$/, '0.28)')}`
              : undefined,
          }}
        >
          {/* Overlay por raridade */}
          {effect === 'ultra' && (
            <div className="absolute inset-0 ultra-rainbow-overlay rounded-xl pointer-events-none opacity-25" />
          )}
          {effect === 'legendary' && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.14),transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPositionX: ['-100%', '200%'] }}
              transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
          )}
          {effect === 'elite' && visuallyFlipped && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(135deg,transparent,rgba(59,130,246,0.08),transparent)' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
            />
          )}

          {/* Header: rarity label + position */}
          <div className="flex items-start justify-between px-1.5 pt-1.5 z-10">
            <span className={`text-[7px] font-black uppercase tracking-widest ${visual.textClass}`}>
              {card.rarityCode === 'world_cup_hero' ? 'WCH' : card.rarityLabel.slice(0, 3).toUpperCase()}
            </span>
            <span className="text-[7px] font-bold text-white/40 bg-black/30 px-1 rounded">
              {card.position}
            </span>
          </div>

          {/* OVR central */}
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="text-center">
              <p
                className="font-display leading-none"
                style={{
                  fontSize: '46px',
                  background: `linear-gradient(180deg,#ffffff,${glowColor})`,
                  WebkitBackgroundClip:   'text',
                  WebkitTextFillColor:    'transparent',
                  filter: `drop-shadow(0 0 10px ${glowColor})`,
                }}
              >
                {card.overall}
              </p>
              {(effect === 'legendary' || effect === 'ultra') && (
                <motion.div
                  className="w-10 h-px mx-auto mt-1.5"
                  style={{ background: `linear-gradient(90deg,transparent,${glowColor},transparent)` }}
                  animate={{ scaleX: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                />
              )}
            </div>
          </div>

          {/* Footer: nome + flag + era */}
          <div className="px-1.5 pb-2 text-center z-10">
            <p className="text-parchment font-bold text-[10px] leading-tight truncate">{card.displayName}</p>
            <p className="text-white/30 text-[8px] mt-0.5">{card.flagEmoji} {card.era}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export { RARITY_SFX } from '@/lib/sound-manager';
