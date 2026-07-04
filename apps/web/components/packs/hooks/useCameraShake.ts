'use client';

import { useCallback, useRef } from 'react';

export function useCameraShake() {
  const rafRef = useRef(0);
  const elRef  = useRef<HTMLDivElement | null>(null);

  const shake = useCallback((intensity = 8, duration = 400) => {
    const el = elRef.current;
    if (!el) return;

    const start = performance.now();

    const tick = (now: number) => {
      const t = now - start;
      if (t >= duration) {
        el.style.transform = '';
        return;
      }
      const decay = 1 - t / duration;
      const mag   = intensity * decay;
      const x = (Math.random() - 0.5) * mag * 2;
      const y = (Math.random() - 0.5) * mag * 2;
      el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  return { elRef, shake };
}
