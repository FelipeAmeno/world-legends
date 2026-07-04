'use client';

/**
 * components/fx/Particles.tsx — Sprint 3
 *
 * Sistema de partículas reutilizável baseado em Framer Motion.
 * Sem dependência de Canvas — usa motion.div para cada partícula.
 *
 * Presets disponíveis:
 *   gold      — moedas/faíscas douradas (recompensas)
 *   sparkle   — brilhos brancos pequenos (carta rara)
 *   smoke     — círculos desfocados cinza (impacto)
 *   sparks    — riscos finos elétricos (carta elite)
 *   confetti  — retângulos coloridos (vitória, nível up)
 *   energy    — pulsos de energia neon (ação especial)
 *
 * Uso:
 *   <Particles preset="gold" count={20} origin={{ x: 50, y: 50 }} />
 *   <Particles preset="confetti" count={35} autoPlay burst />
 */

import { EASE } from '@/lib/motion-tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type ParticlePreset = 'gold' | 'sparkle' | 'smoke' | 'sparks' | 'confetti' | 'energy';

type Particle = {
  id:    number;
  x:     number;  // initial x offset %
  y:     number;  // initial y offset %
  vx:    number;  // velocity x (px)
  vy:    number;  // velocity y (px, negative = up)
  size:  number;  // px
  color: string;
  rot:   number;  // initial rotation deg
  rotV:  number;  // rotation velocity deg
  delay: number;  // seconds
  dur:   number;  // animation duration seconds
  shape: 'circle' | 'rect' | 'line' | 'star';
};

type Props = {
  preset:    ParticlePreset;
  count?:    number;
  /** Origin as percentage of container (default center 50%,50%) */
  origin?:   { x: number; y: number };
  /** Auto-start on mount */
  autoPlay?: boolean;
  /** Single burst (fire once then stop) vs continuous */
  burst?:    boolean;
  /** External trigger: increment to re-fire */
  trigger?:  number;
  className?: string;
};

// ─── Preset configs ───────────────────────────────────────────────────────────

type PresetConfig = {
  colors:  string[];
  shapes:  Particle['shape'][];
  sizeMin: number;
  sizeMax: number;
  spread:  number;   // angle spread in degrees (360 = all directions)
  speedMin:number;
  speedMax:number;
  durMin:  number;
  durMax:  number;
  gravity: number;   // px/s² downward
};

const PRESETS: Record<ParticlePreset, PresetConfig> = {
  gold: {
    colors:   ['#e6c85a', '#c9a84c', '#f5e098', '#f7d060', '#8c6f27'],
    shapes:   ['circle', 'star'],
    sizeMin:  4,   sizeMax:  10,
    spread:   160, speedMin: 60,  speedMax: 160,
    durMin:   0.7, durMax:   1.3,
    gravity:  120,
  },
  sparkle: {
    colors:   ['#ffffff', '#e0e8ff', '#c8d8ff', '#fffde0', '#f0f4ff'],
    shapes:   ['star', 'circle'],
    sizeMin:  2,   sizeMax:  6,
    spread:   360, speedMin: 40,  speedMax: 100,
    durMin:   0.5, durMax:   1.0,
    gravity:  30,
  },
  smoke: {
    colors:   ['rgba(120,120,120,0.3)', 'rgba(80,80,80,0.2)', 'rgba(160,160,160,0.15)'],
    shapes:   ['circle'],
    sizeMin:  12,  sizeMax:  32,
    spread:   120, speedMin: 20,  speedMax: 60,
    durMin:   0.8, durMax:   1.6,
    gravity:  -20, // rises
  },
  sparks: {
    colors:   ['#60a5fa', '#93c5fd', '#3b82f6', '#a5f3fc', '#06b6d4'],
    shapes:   ['line', 'rect'],
    sizeMin:  2,   sizeMax:  5,
    spread:   180, speedMin: 80,  speedMax: 200,
    durMin:   0.3, durMax:   0.7,
    gravity:  80,
  },
  confetti: {
    colors:   ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#a855f7', '#ef4444', '#e6c85a'],
    shapes:   ['rect', 'circle'],
    sizeMin:  5,   sizeMax:  12,
    spread:   360, speedMin: 50,  speedMax: 180,
    durMin:   0.9, durMax:   1.8,
    gravity:  140,
  },
  energy: {
    colors:   ['#c9a84c', '#e6c85a', '#f5e098', 'rgba(201,168,76,0.4)'],
    shapes:   ['circle', 'line'],
    sizeMin:  3,   sizeMax:  8,
    spread:   360, speedMin: 60,  speedMax: 140,
    durMin:   0.4, durMax:   0.9,
    gravity:  0,
  },
};

// ─── Particle generator ───────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function generateParticles(preset: ParticlePreset, count: number, seed: number): Particle[] {
  const cfg = PRESETS[preset];
  const spreadRad = (cfg.spread / 2) * (Math.PI / 180);

  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + rand(-spreadRad, spreadRad);
    const speed = rand(cfg.speedMin, cfg.speedMax);
    const burstDelay = preset === 'confetti' ? rand(0, 0.15) : rand(0, 0.08);

    return {
      id:    seed * 1000 + i,
      x:     rand(-3, 3),
      y:     rand(-3, 3),
      vx:    Math.cos(angle) * speed,
      vy:    Math.sin(angle) * speed,
      size:  rand(cfg.sizeMin, cfg.sizeMax),
      color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)]!,
      rot:   rand(0, 360),
      rotV:  rand(-360, 360),
      delay: burstDelay,
      dur:   rand(cfg.durMin, cfg.durMax),
      shape: cfg.shapes[Math.floor(Math.random() * cfg.shapes.length)]!,
    };
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Particles({
  preset,
  count = 20,
  origin = { x: 50, y: 50 },
  autoPlay = false,
  burst = true,
  trigger,
  className = '',
}: Props) {
  const uid = useId();
  const [seed, setSeed] = useState(() => autoPlay ? 1 : 0);
  const triggerRef = useRef(trigger);

  // External trigger
  useEffect(() => {
    if (trigger !== undefined && trigger !== triggerRef.current) {
      triggerRef.current = trigger;
      setSeed((s) => s + 1);
    }
  }, [trigger]);

  const particles = useMemo(
    () => (seed > 0 ? generateParticles(preset, count, seed) : []),
    [preset, count, seed],
  );

  const cfg = PRESETS[preset];

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden
    >
      <AnimatePresence>
        {particles.map((p) => {
          const gravity = cfg.gravity;
          // Physics: end position = v * dur + 0.5 * g * dur²
          const endX = p.vx * p.dur;
          const endY = p.vy * p.dur + 0.5 * gravity * p.dur * p.dur;
          const endRot = p.rot + p.rotV * p.dur;

          const shapeStyle: React.CSSProperties =
            p.shape === 'rect'
              ? { borderRadius: 2, width: p.size, height: p.size * 0.5 }
              : p.shape === 'line'
              ? { borderRadius: 99, width: 2, height: p.size * 3 }
              : p.shape === 'star'
              ? { borderRadius: '50% 0 50% 0', width: p.size, height: p.size, transform: `rotate(${p.rot}deg)` }
              : { borderRadius: '50%', width: p.size, height: p.size };

          return (
            <motion.div
              key={`${uid}-${p.id}`}
              className="absolute"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              style={{
                left: `calc(${origin.x}% + ${p.x}px)`,
                top:  `calc(${origin.y}% + ${p.y}px)`,
                background: p.color,
                ...(preset === 'gold' ? { boxShadow: `0 0 4px ${p.color}` } : {}),
                ...(preset === 'sparkle' || preset === 'energy' ? { filter: 'blur(0.5px)' } : {}),
                ...shapeStyle,
              } as any}
              initial={{ opacity: 1, x: 0, y: 0, rotate: p.rot, scale: 1 }}
              animate={{
                opacity: [1, 1, 0],
                x: endX,
                y: endY,
                rotate: endRot,
                scale: preset === 'smoke' ? [1, 2.5] : [1, p.shape === 'circle' ? 0.3 : 0.1],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                ease: EASE.smooth as [number,number,number,number],
                opacity: { times: [0, 0.6, 1] },
              }}
              exit={{ opacity: 0 }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ─── Burst helper hook ────────────────────────────────────────────────────────

/** Returns a fire() function that triggers a single burst */
export function useBurst() {
  const [trigger, setTrigger] = useState(0);
  const fire = useCallback(() => setTrigger((t) => t + 1), []);
  return { trigger, fire };
}
