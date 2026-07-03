'use client';

import { motion } from 'framer-motion';

// ─── Configuração determinística (sem Math.random → SSR safe) ────────────────

const COLORS = [
  '#c9a84c',
  '#10b981',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#f59e0b',
  '#ef4444',
  '#e2e8f0',
  '#22d3ee',
  '#84cc16',
  '#fb7185',
  '#fbbf24',
];

const SHAPES = ['rect', 'circle', 'rect', 'rect', 'circle'] as const;
type Shape = (typeof SHAPES)[number];

type Piece = {
  id: number;
  x: number; // vw
  color: string;
  size: number; // px
  shape: Shape;
  delay: number; // s
  dur: number; // s
  rotStart: number; // deg
  rotEnd: number; // deg
  drift: number; // vw drift horizontal
};

const PIECES: Piece[] = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100, // golden-angle distribution
  color: COLORS[i % COLORS.length]!,
  size: 5 + (i % 7),
  shape: SHAPES[i % SHAPES.length]!,
  delay: (i % 12) * 0.09,
  dur: 1.8 + (i % 5) * 0.3,
  rotStart: (i * 37) % 360,
  rotEnd: (i * 37 + (i % 2 === 0 ? 540 : -720)) % 720,
  drift: ((i % 9) - 4) * 6, // -24..+24 vw
}));

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  active: boolean;
  origin?: 'top' | 'center';
};

export function ConfettiSystem({ active, origin = 'top' }: Props) {
  if (!active) return null;

  const startY = origin === 'center' ? '40vh' : '-20px';

  return (
    <div className="fixed inset-0 pointer-events-none z-[80] overflow-hidden">
      {PIECES.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}vw`,
            top: startY,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            boxShadow: `0 0 ${p.size}px ${p.color}60`,
          }}
          initial={{
            y: 0,
            x: 0,
            rotate: p.rotStart,
            opacity: 1,
            scale: 1,
          }}
          animate={{
            y: ['0vh', '120vh'],
            x: [0, p.drift * 10],
            rotate: [p.rotStart, p.rotEnd],
            opacity: [1, 1, 1, 0.6, 0],
            scale: [1, 1, 0.8, 0.6],
          }}
          transition={{
            duration: p.dur,
            delay: p.delay,
            ease: [0.4, 0, 1, 1],
            repeat: 2,
            repeatDelay: p.delay * 0.5,
          }}
        />
      ))}
    </div>
  );
}
