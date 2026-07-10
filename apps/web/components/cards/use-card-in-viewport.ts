'use client';

/**
 * components/cards/use-card-in-viewport.ts — Sprint 34 (Official Art Pack
 * Integration, item 9: "cards fora da viewport não animam").
 *
 * `IntersectionObserver` é a ferramenta certa aqui — dispara só quando o
 * card cruza a borda da viewport (mais uma margem de 200px, pra pausar
 * antes que o usuário perceba o "congelamento"), nunca por frame, ao
 * contrário de um listener de `scroll`. Custo real só em grades grandes
 * (Collection/stress-test com 50-200 cards) — exatamente onde pausar as
 * animações das cartas fora de tela mais importa pro FPS.
 */

import { useEffect, useRef, useState } from 'react';

export function useCardInViewport<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  // Assume visível até o observer confirmar o contrário — evita um "flash"
  // de animação pausada na primeira pintura, antes do observer conectar.
  const [inViewport, setInViewport] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => entry && setInViewport(entry.isIntersecting),
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inViewport };
}
