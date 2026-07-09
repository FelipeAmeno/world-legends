'use client';

/**
 * components/packs/SmokeLayer.tsx — Sprint 22 (Pack Experience 2.0, item 4)
 *
 * Fumaça procedural na explosão do pack — puffs radiais borrados subindo e
 * dissipando, posições/atrasos determinísticos (baseados no índice, sem
 * `Math.random()` — mesma disciplina de `CardParticles.tsx`). 100% CSS/
 * Framer Motion, sem canvas.
 */

import { motion } from 'framer-motion';
import {
  SMOKE_MAX_OPACITY,
  SMOKE_MAX_SCALE,
  SMOKE_PUFF_COUNT,
  SMOKE_RISE_DURATION_MS,
} from './pack-cinematic-tokens';

export function SmokeLayer() {
  const puffs = Array.from({ length: SMOKE_PUFF_COUNT }, (_, i) => {
    const angle = (i / SMOKE_PUFF_COUNT) * Math.PI * 2;
    const dist = 30 + (i % 3) * 22;
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist * 0.4,
      size: 90 + (i % 3) * 30,
      delay: (i % 4) * 0.06,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {puffs.map((p) => (
        <motion.div
          key={`smoke-${p.x.toFixed(1)}-${p.delay.toFixed(2)}`}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(255,255,255,0.55), rgba(255,255,255,0) 70%)',
            filter: 'blur(12px)',
            x: p.x,
          }}
          initial={{ opacity: 0, scale: 0.35, y: p.y }}
          animate={{
            opacity: [0, SMOKE_MAX_OPACITY, 0],
            scale: [0.35, SMOKE_MAX_SCALE],
            y: p.y - 90,
          }}
          transition={{
            duration: SMOKE_RISE_DURATION_MS / 1000,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}
