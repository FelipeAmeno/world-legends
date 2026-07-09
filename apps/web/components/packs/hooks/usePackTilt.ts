'use client';

/**
 * components/packs/hooks/usePackTilt.ts — Sprint 22 (Pack Experience 2.0)
 *
 * Tilt 3D real do pack reagindo ao ponteiro — mesma técnica de
 * `components/cards/use-card-tilt.ts` (CSS custom properties escritas
 * direto no DOM via `style.setProperty`, zero re-render React), adaptada
 * pro pack: escreve `--pack-rx`/`--pack-ry` (graus) e `--pack-px`/
 * `--pack-py` (posição normalizada -1..1, usada pra reorientar a luz
 * volumétrica na direção do "olhar"). Só desktop com ponteiro fino —
 * touch não ganha tilt (mesma decisão do card tilt).
 */

import { useEffect, useRef } from 'react';
import { PACK_TILT_MAX_DEG } from '../pack-cinematic-tokens';

export function usePackTilt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer) return;

    let rect: DOMRect | null = null;

    const handleEnter = () => {
      rect = el.getBoundingClientRect();
    };

    const handleMove = (e: PointerEvent) => {
      if (!rect) rect = el.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      const nx = px * 2 - 1;
      const ny = py * 2 - 1;

      el.style.setProperty('--pack-px', nx.toFixed(3));
      el.style.setProperty('--pack-py', ny.toFixed(3));
      el.style.setProperty('--pack-rx', `${(nx * PACK_TILT_MAX_DEG).toFixed(2)}deg`);
      el.style.setProperty('--pack-ry', `${(-ny * PACK_TILT_MAX_DEG).toFixed(2)}deg`);
    };

    const handleLeave = () => {
      rect = null;
      el.style.setProperty('--pack-px', '0');
      el.style.setProperty('--pack-py', '0');
      el.style.setProperty('--pack-rx', '0deg');
      el.style.setProperty('--pack-ry', '0deg');
    };

    el.addEventListener('pointerenter', handleEnter);
    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);

    return () => {
      el.removeEventListener('pointerenter', handleEnter);
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
    };
  }, []);

  return ref;
}
