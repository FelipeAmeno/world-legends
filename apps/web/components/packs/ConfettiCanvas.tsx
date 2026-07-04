'use client';

import { useEffect, useRef } from 'react';

type Piece = {
  x: number; y: number; vx: number; vy: number;
  angle: number; av: number;
  w: number; h: number;
  color: string; alpha: number;
};

const GOLD_COLORS   = ['#c9a84c','#e6c85a','#f5e098','#ffffff','#e6c85a'];
const EPIC_COLORS   = ['#a855f7','#ec4899','#c9a84c','#ffffff','#3b82f6'];
const GOAT_COLORS   = ['#c9a84c','#e6c85a','#ffffff','#f0f4ff','#a855f7'];

const PRESET: Record<string, string[]> = {
  legendary: GOLD_COLORS,
  ultra:     EPIC_COLORS,
  world_cup_hero: GOAT_COLORS,
};

type Props = {
  rarity?: string;
  count?:  number;
};

export function ConfettiCanvas({ rarity = 'legendary', count = 110 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const colors = PRESET[rarity] ?? GOLD_COLORS;

    const pieces: Piece[] = Array.from({ length: count }, () => ({
      x:  Math.random() * W,
      y: -20 - Math.random() * 120,
      vx: (Math.random() - 0.5) * 4,
      vy:  1.5 + Math.random() * 4.5,
      angle: Math.random() * Math.PI * 2,
      av:   (Math.random() - 0.5) * 0.18,
      w:  7 + Math.random() * 9,
      h:  3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      alpha: 1,
    }));

    let raf = 0;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      let any = false;

      for (const p of pieces) {
        if (p.alpha <= 0) continue;

        p.x     += p.vx;
        p.y     += p.vy;
        p.vy    += 0.09;
        p.vx    *= 0.995;
        p.angle += p.av;

        // fade in bottom 30%
        if (p.y > H * 0.7) p.alpha -= 0.025;
        if (p.y > H + 10)  { p.alpha = 0; continue; }

        any = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle   = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (any) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ctx.clearRect(0, 0, W, H); };
  }, [rarity, count]);

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 160, width: '100%', height: '100%' }}
    />
  );
}
