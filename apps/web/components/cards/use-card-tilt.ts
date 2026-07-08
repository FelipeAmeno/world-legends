'use client';

/**
 * components/cards/use-card-tilt.ts — Sprint 18.7 (Premium Card Engine)
 *
 * Tilt 3D + parallax + glass reagindo ao mouse — tudo via CSS custom
 * properties setadas diretamente no elemento (`style.setProperty`), nunca
 * via `useState`. Zero re-render React por movimento de mouse (item 9 do
 * brief: "sem re-renderizações"). Só desktop com ponteiro fino
 * (`hover: hover` + `pointer: fine`) — em touch, não faz nada.
 *
 * O elemento recebe `--tilt-rx`/`--tilt-ry` (graus de rotação) e `--px`/
 * `--py` (posição do mouse normalizada -1..1) — o CSS em globals.css lê
 * essas variáveis pra rotacionar a carta, mover cada camada em velocidade
 * diferente (parallax) e posicionar o reflexo de vidro.
 */

import { useEffect, useRef } from 'react';

const MAX_TILT_DEG = 7; // "nunca exagerar" — item 1

export function useCardTilt<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!isFinePointer) return;

    let rect: DOMRect | null = null;

    const handleEnter = () => {
      rect = el.getBoundingClientRect();
      el.classList.add('card-tilt-active');
    };

    const handleMove = (e: PointerEvent) => {
      if (!rect) rect = el.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const py = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
      const nx = px * 2 - 1; // -1..1
      const ny = py * 2 - 1;

      el.style.setProperty('--px', nx.toFixed(3));
      el.style.setProperty('--py', ny.toFixed(3));
      el.style.setProperty('--tilt-rx', `${(nx * MAX_TILT_DEG).toFixed(2)}deg`);
      el.style.setProperty('--tilt-ry', `${(-ny * MAX_TILT_DEG).toFixed(2)}deg`);
    };

    const handleLeave = () => {
      rect = null;
      el.classList.remove('card-tilt-active');
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
      el.style.setProperty('--tilt-rx', '0deg');
      el.style.setProperty('--tilt-ry', '0deg');
    };

    const handlePress = () => {
      el.classList.remove('card-tilt-pressed');
      // força reflow pra permitir reiniciar a animação em cliques seguidos
      void el.offsetWidth;
      el.classList.add('card-tilt-pressed');
    };

    const handleAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === 'cardPressBounce') el.classList.remove('card-tilt-pressed');
    };

    el.addEventListener('pointerenter', handleEnter);
    el.addEventListener('pointermove', handleMove);
    el.addEventListener('pointerleave', handleLeave);
    el.addEventListener('pointerdown', handlePress);
    el.addEventListener('animationend', handleAnimEnd);

    return () => {
      el.removeEventListener('pointerenter', handleEnter);
      el.removeEventListener('pointermove', handleMove);
      el.removeEventListener('pointerleave', handleLeave);
      el.removeEventListener('pointerdown', handlePress);
      el.removeEventListener('animationend', handleAnimEnd);
    };
  }, []);

  return ref;
}
