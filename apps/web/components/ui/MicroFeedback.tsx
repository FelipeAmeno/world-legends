'use client';

/**
 * components/ui/MicroFeedback.tsx — Sprint 3
 *
 * Wrapper que adiciona feedback visual premium a qualquer elemento interativo.
 *
 * Features:
 *   - Efeito ripple no clique (ondas se expandindo do ponto de toque)
 *   - Animação press (scale down/up via Framer Motion)
 *   - Haptic feedback opcional
 *   - Glow hint no hover
 *
 * Uso:
 *   <Tap>
 *     <button>Clique</button>
 *   </Tap>
 *
 *   <Tap haptic="packSelect" glow="gold">
 *     <div>Qualquer coisa</div>
 *   </Tap>
 */

import type { HapticKey } from '@/lib/haptics';
import { vibrate } from '@/lib/haptics';
import { PRESS, SPRING } from '@/lib/motion-tokens';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

// ─── Ripple ───────────────────────────────────────────────────────────────────

type RippleItem = { id: number; x: number; y: number; size: number };

type GlowColor = 'gold' | 'green' | 'red' | 'blue' | 'none';

const GLOW_COLORS: Record<GlowColor, string> = {
  gold:  'rgba(201,168,76,0.35)',
  green: 'rgba(16,185,129,0.35)',
  red:   'rgba(239,68,68,0.35)',
  blue:  'rgba(59,130,246,0.35)',
  none:  'transparent',
};

const RIPPLE_COLORS: Record<GlowColor, string> = {
  gold:  'rgba(201,168,76,0.25)',
  green: 'rgba(16,185,129,0.25)',
  red:   'rgba(239,68,68,0.25)',
  blue:  'rgba(59,130,246,0.25)',
  none:  'rgba(255,255,255,0.12)',
};

// ─── Props ────────────────────────────────────────────────────────────────────

type TapVariant = 'default' | 'hero' | 'subtle' | 'none';

type Props = {
  children:   ReactNode;
  variant?:   TapVariant;
  glow?:      GlowColor;
  haptic?:    HapticKey;
  ripple?:    boolean;
  className?: string;
  disabled?:  boolean;
  onClick?:   (e: React.MouseEvent) => void;
  as?:        'div' | 'button' | 'li';
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Tap({
  children,
  variant   = 'default',
  glow      = 'none',
  haptic,
  ripple    = true,
  className = '',
  disabled  = false,
  onClick,
  as        = 'div',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples]       = useState<RippleItem[]>([]);
  const [isHovered, setIsHovered]   = useState(false);
  const counterRef = useRef(0);

  const addRipple = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container || !ripple || disabled) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;
    const id = ++counterRef.current;

    setRipples((prev) => [...prev, { id, x, y, size }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 700);
  }, [ripple, disabled]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    addRipple(e);
    if (haptic) vibrate(haptic);
    onClick?.(e);
  }, [disabled, addRipple, haptic, onClick]);

  const pressProps = variant === 'none' ? {} :
    variant === 'hero'   ? { whileHover: PRESS.heroHover,   whileTap: PRESS.heroTap } :
    variant === 'subtle' ? { whileHover: PRESS.subtleHover, whileTap: PRESS.subtleTap } :
                           { whileHover: PRESS.whileHover,  whileTap: PRESS.whileTap };

  const glowStyle: React.CSSProperties = isHovered && glow !== 'none'
    ? { boxShadow: `0 0 20px ${GLOW_COLORS[glow]}`, transition: 'box-shadow 0.2s ease' }
    : { transition: 'box-shadow 0.2s ease' };

  const MotionEl = motion[as] as typeof motion.div;

  return (
    <MotionEl
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`relative overflow-hidden ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={glowStyle as any}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      {...pressProps}
    >
      {children}

      {/* Ripples */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x - r.size / 2,
            top:  r.y - r.size / 2,
            width: r.size,
            height: r.size,
            background: RIPPLE_COLORS[glow],
            animation: 'wl-ripple 0.65s ease-out forwards',
          }}
        />
      ))}
    </MotionEl>
  );
}

// ─── Simpler press-only wrapper (no ripple, just scale) ───────────────────────

export function Press({
  children,
  scale    = 0.96,
  className = '',
  onClick,
}: {
  children:   ReactNode;
  scale?:     number;
  className?: string;
  onClick?:   () => void;
}) {
  return (
    <motion.div
      className={`cursor-pointer ${className}`}
      whileTap={{ scale, transition: SPRING.snappy }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
