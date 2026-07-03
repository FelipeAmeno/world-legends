'use client';

import { RARITY_VISUAL } from '@/lib/collection-data';
import type { DrawnCard } from '@/lib/pack-logic';
import type { RevealEffect } from '@/lib/pack-logic';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Props = {
  drawn: DrawnCard;
  flipped: boolean;
  onFlip: () => void;
};

// ─── Configuração de efeito por raridade ──────────────────────────────────────

const RARITY_FLIP_DUR: Record<RevealEffect, number> = {
  common: 0.55,
  rare: 0.65,
  elite: 0.7,
  legendary: 0.85,
  ultra: 1.0,
  world_cup_hero: 0, // handled by GoatReveal
};

const RARITY_SPRING: Record<RevealEffect, { stiffness: number; damping: number }> = {
  common: { stiffness: 260, damping: 22 },
  rare: { stiffness: 240, damping: 20 },
  elite: { stiffness: 220, damping: 18 },
  legendary: { stiffness: 180, damping: 14 },
  ultra: { stiffness: 140, damping: 12 },
  world_cup_hero: { stiffness: 100, damping: 10 },
};

// Cor da face traseira (hint de raridade)
const BACK_COLORS: Record<RevealEffect, { border: string; glow: string; bg: string }> = {
  common: { border: 'rgba(107,114,128,0.5)', glow: 'rgba(107,114,128,0.2)', bg: '#0c0d0f' },
  rare: { border: 'rgba(147,51,234,0.6)', glow: 'rgba(147,51,234,0.25)', bg: '#0a0018' },
  elite: { border: 'rgba(59,130,246,0.7)', glow: 'rgba(59,130,246,0.3)', bg: '#000d20' },
  legendary: { border: 'rgba(201,168,76,0.8)', glow: 'rgba(201,168,76,0.35)', bg: '#120900' },
  ultra: { border: 'rgba(236,72,153,0.9)', glow: 'rgba(236,72,153,0.4)', bg: '#1a0012' },
  world_cup_hero: { border: 'rgba(240,244,255,1)', glow: 'rgba(240,244,255,0.5)', bg: '#04040a' },
};

// ─── Partículas de revelação ──────────────────────────────────────────────────

const REVEAL_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  tx: Math.round(Math.cos((i / 16) * Math.PI * 2) * (30 + (i % 4) * 12)),
  ty: Math.round(Math.sin((i / 16) * Math.PI * 2) * (30 + (i % 4) * 12)),
  size: 2 + (i % 3),
  delay: i * 30,
  dur: 0.5 + (i % 3) * 0.1,
}));

// ─── Component ───────────────────────────────────────────────────────────────

export function RevealedCard({ drawn, flipped, onFlip }: Props) {
  const [showParticles, setShowParticles] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  const { card, effect, glowColor, particleColor } = drawn;
  const isGoat = effect === 'world_cup_hero';
  const visual = RARITY_VISUAL[card.rarityCode];
  const back = BACK_COLORS[effect];
  const flipDur = RARITY_FLIP_DUR[effect];
  const spring = RARITY_SPRING[effect];

  useEffect(() => {
    if (!flipped) return;

    // Flash mid-flip
    const tFlash = setTimeout(
      () => {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 300);
      },
      (flipDur * 1000) / 2,
    );

    // Partículas pós-flip
    const tPart = setTimeout(
      () => {
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 800);
      },
      flipDur * 1000 + 50,
    );

    return () => {
      clearTimeout(tFlash);
      clearTimeout(tPart);
    };
  }, [flipped, flipDur]);

  if (isGoat) {
    return (
      <div
        className="w-[130px] h-[175px] rounded-xl border-2 flex items-center justify-center cursor-pointer"
        onClick={onFlip}
        style={{
          background: back.bg,
          borderColor: back.border,
          boxShadow: `0 0 30px ${back.glow}, inset 0 0 20px ${back.glow}`,
        }}
      >
        <span className="text-xs text-white/30 text-center font-mono px-2">
          ??? TAP TO
          <br />
          REVEAL
        </span>
      </div>
    );
  }

  return (
    <div className="relative card-fm-scene" style={{ width: 130, height: 175 }}>
      {/* Flash de revelação */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: glowColor, mixBlendMode: 'screen' }}
          />
        )}
      </AnimatePresence>

      {/* Partículas */}
      <AnimatePresence>
        {showParticles && (
          <div
            className="absolute inset-0 pointer-events-none z-40 overflow-visible"
            style={{ top: '50%', left: '50%', width: 0, height: 0 }}
          >
            {REVEAL_PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  top: -p.size / 2,
                  left: -p.size / 2,
                  background: particleColor,
                  boxShadow: `0 0 ${p.size * 2}px ${particleColor}`,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{ x: p.tx, y: p.ty, scale: [0, 1.5, 0], opacity: [1, 1, 0] }}
                transition={{ duration: p.dur, delay: p.delay / 1000, ease: 'easeOut' }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Container 3D */}
      <motion.div
        className="relative w-full h-full cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={
          flipped
            ? { type: 'spring', stiffness: spring.stiffness, damping: spring.damping }
            : { duration: 0 }
        }
        onClick={!flipped ? onFlip : undefined}
        whileTap={!flipped ? { scale: 0.95 } : {}}
      >
        {/* FACE TRASEIRA (face-down, visível antes do flip) */}
        <div
          className="absolute inset-0 rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: back.bg,
            borderColor: back.border,
            boxShadow: flipped ? undefined : `0 0 20px ${back.glow}, inset 0 0 30px ${back.glow}`,
          }}
        >
          {/* WL logo */}
          <p className="font-display text-3xl" style={{ color: back.border }}>
            WL
          </p>
          <p className="text-[7px] tracking-[0.35em] mt-0.5" style={{ color: `${back.border}80` }}>
            WORLD LEGENDS
          </p>

          {/* Sweep animado */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.07) 50%, transparent 65%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPositionX: ['-100%', '200%'] }}
            transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          />

          {!flipped && (
            <p
              className="absolute bottom-2 text-[8px] opacity-40 uppercase tracking-widest"
              style={{ color: back.border }}
            >
              toque
            </p>
          )}
        </div>

        {/* FACE FRONTAL (carta revelada) */}
        <div
          className={[
            'absolute inset-0 rounded-xl border-2 flex flex-col overflow-hidden',
            visual.bgClass,
            visual.borderClass,
          ].join(' ')}
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            boxShadow: flipped
              ? `0 0 28px ${glowColor}, 0 0 60px ${glowColor.replace(/[\d.]+\)$/, '0.25)')}`
              : undefined,
          }}
        >
          {/* Overlay por raridade */}
          {effect === 'ultra' && (
            <div className="absolute inset-0 ultra-rainbow-overlay rounded-xl pointer-events-none opacity-20" />
          )}
          {effect === 'legendary' && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(201,168,76,0.12), transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{ backgroundPositionX: ['-100%', '200%'] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
            />
          )}

          {/* Posição */}
          <div className="flex items-start justify-between px-1.5 pt-1.5 z-10">
            <span className={`text-[7px] font-black uppercase tracking-widest ${visual.textClass}`}>
              {card.rarityCode === 'world_cup_hero'
                ? 'WCH'
                : card.rarityLabel.slice(0, 3).toUpperCase()}
            </span>
            <span className="text-[7px] font-bold text-white/40 bg-black/30 px-1 rounded">
              {card.position}
            </span>
          </div>

          {/* OVR — elemento assinatura */}
          <div className="flex-1 flex items-center justify-center z-10">
            <div className="text-center">
              <p
                className="font-display leading-none"
                style={{
                  fontSize: '44px',
                  background: `linear-gradient(180deg, #ffffff, ${glowColor})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: `drop-shadow(0 0 8px ${glowColor})`,
                }}
              >
                {card.overall}
              </p>
              {(effect === 'legendary' || effect === 'ultra') && (
                <div
                  className="w-8 h-px mx-auto mt-1"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Nome */}
          <div className="px-1.5 pb-2 text-center z-10">
            <p className="text-parchment font-bold text-[10px] leading-tight truncate">
              {card.displayName}
            </p>
            <p className="text-white/30 text-[8px] mt-0.5">
              {card.flagEmoji} {card.era}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Sound integration ─────────────────────────────────────────────────────────
// Re-export para uso do CardRevealScene
export { RARITY_SFX } from '@/lib/sound-manager';
