'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

type Props = {
  packColor: string;
  packGlow: string;
  onComplete: () => void;
};

// ─── Partículas determinísticas ────────────────────────────────────────────────

function buildParticles(glowColor: string) {
  const COUNT = 64;
  return Array.from({ length: COUNT }, (_, i) => {
    const angle = (i / COUNT) * Math.PI * 2;
    const spread = 80 + (i % 5) * 40; // 80–240px
    const tx = Math.round(Math.cos(angle) * spread);
    const ty = Math.round(Math.sin(angle) * spread);
    const size = 3 + (i % 5);
    const dur = 0.5 + (i % 4) * 0.12;
    const delay = (i % 8) * 0.025;
    const isGold = i % 3 === 0;
    const isWhite = i % 7 === 0;
    const color = isWhite
      ? '#ffffff'
      : isGold
        ? '#c9a84c'
        : glowColor.replace(/rgba?\(([^)]+)\)/, (_, g) => `rgba(${g})`);
    const blur = i % 3 === 0 ? 2 : 0;
    return { tx, ty, size, dur, delay, color, blur };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExplosionOverlay({ packColor, packGlow, onComplete }: Props) {
  const particles = buildParticles(packGlow);

  // Notificar fim após 0.75s (flash + particles)
  useEffect(() => {
    const t = setTimeout(onComplete, 750);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* Flash branco — camada principal */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.8, 0] }}
        transition={{ duration: 0.65, times: [0, 0.12, 0.45, 1] }}
        style={{ background: '#ffffff' }}
      />

      {/* Flash colorido — segunda camada */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.55, times: [0, 0.15, 1] }}
        style={{
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${packGlow.replace(/[\d.]+\)$/, '0.8)')}, transparent)`,
        }}
      />

      {/* Partículas */}
      <div className="relative" style={{ width: 0, height: 0 }}>
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              top: -p.size / 2,
              left: -p.size / 2,
              filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
            animate={{
              x: p.tx,
              y: p.ty,
              scale: [0, 1.8, 0],
              opacity: [1, 1, 0],
            }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      {/* Ring de expansão */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{ borderColor: packColor }}
        initial={{ width: 60, height: 60, opacity: 0.9 }}
        animate={{ width: 600, height: 600, opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />

      {/* Ring secundário menor */}
      <motion.div
        className="absolute rounded-full border"
        style={{ borderColor: '#ffffff' }}
        initial={{ width: 40, height: 40, opacity: 0.7 }}
        animate={{ width: 400, height: 400, opacity: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: 0.05 }}
      />
    </div>
  );
}
