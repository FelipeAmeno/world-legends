'use client';

/**
 * components/ui/FlyingRewards.tsx — Sprint 19 (Game Feel & Immersion)
 *
 * "Quando ganhar moedas, elas voam até o contador. Quando ganhar
 * fragmentos, cristais voam." — genuinamente novo, não existia nada
 * parecido no app antes desta sprint.
 *
 * Uso:
 *   const fromRef = useRef<HTMLDivElement>(null);   // origem do ganho
 *   const toRef = useRef<HTMLDivElement>(null);      // pill de créditos no HUD
 *   const [burst, setBurst] = useState(0);
 *   // ...ao ganhar recompensa: setBurst((b) => b + 1)
 *   <FlyingRewards trigger={burst} fromRef={fromRef} toRef={toRef} kind="coin" />
 */

import { centerOf, flightArc } from '@/lib/game-feel';
import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

type RewardKind = 'coin' | 'fragment';

type Props = {
  /** Incremente este número para disparar um novo burst. */
  trigger: number;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  kind?: RewardKind;
  count?: number;
  onComplete?: () => void;
};

const ICON: Record<RewardKind, { glyph: string; color: string }> = {
  coin: { glyph: '●', color: '#e6c85a' },
  fragment: { glyph: '◆', color: '#60a5fa' },
};

type Particle = { id: number; delay: number; x: number[]; y: number[] };

let uid = 0;

export function FlyingRewards({
  trigger,
  fromRef,
  toRef,
  kind = 'coin',
  count = 6,
  onComplete,
}: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const lastTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;

    const from = centerOf(fromRef.current);
    const to = centerOf(toRef.current);
    if (!from || !to) return;

    const n = Math.max(1, Math.min(count, 10));
    const next: Particle[] = Array.from({ length: n }, (_, i) => {
      const jitteredFrom = { x: from.x + (i - n / 2) * 4, y: from.y };
      const arc = flightArc(jitteredFrom, to);
      return { id: uid++, delay: i * 0.06, x: arc.x, y: arc.y };
    });
    setParticles(next);

    const totalDur = 0.55 + n * 0.06 + 0.1;
    const t = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, totalDur * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const icon = ICON[kind];

  return (
    <div className="fixed inset-0 pointer-events-none z-[95]">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="absolute font-display"
            style={{
              left: 0,
              top: 0,
              fontSize: kind === 'coin' ? 14 : 12,
              color: icon.color,
              textShadow: `0 0 8px ${icon.color}`,
            }}
            initial={{ x: p.x[0] ?? 0, y: p.y[0] ?? 0, opacity: 0, scale: 0.4 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [0, 1, 1, 0],
              scale: [0.4, 1.1, 1, 0.5],
            }}
            transition={{ duration: 0.55, delay: p.delay, ease: 'easeIn' }}
          >
            {icon.glyph}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
