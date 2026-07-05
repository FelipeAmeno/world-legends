'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

type Props = {
  packColor: string;
  packGlow: string;
  onComplete: () => void;
};

// ─── Canvas burst — substitui 64 divs Framer Motion ──────────────────────────

function BurstCanvas({ glowColor }: { glowColor: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const COUNT = 72;
    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
    };

    const particles: P[] = Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.1;
      const spread = 80 + (i % 5) * 40;
      const speed = spread / 18;
      const isGold = i % 3 === 0;
      const isWhite = i % 7 === 0;
      const color = isWhite ? '#ffffff' : isGold ? '#c9a84c' : glowColor;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + (i % 5),
        color,
        alpha: 1,
      };
    });

    let raf = 0;
    let frame = 0;
    const TOTAL = 32;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      frame++;
      const progress = frame / TOTAL;
      let any = false;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, 1 - progress);
        if (p.alpha <= 0) continue;
        any = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (any && frame < TOTAL) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, W, H);
    };
  }, [glowColor]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ExplosionOverlay({ packColor, packGlow, onComplete }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, 750);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* Canvas particles */}
      <BurstCanvas glowColor={packGlow} />

      {/* Flash branco */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.8, 0] }}
        transition={{ duration: 0.65, times: [0, 0.12, 0.45, 1] }}
        style={{ background: '#ffffff' }}
      />

      {/* Flash colorido */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.55, times: [0, 0.15, 1] }}
        style={{
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${packGlow.replace(/[\d.]+\)$/, '0.8)')}, transparent)`,
        }}
      />

      {/* Ring de expansão */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{ borderColor: packColor }}
        initial={{ width: 60, height: 60, opacity: 0.9 }}
        animate={{ width: 600, height: 600, opacity: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />

      {/* Ring secundário */}
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
