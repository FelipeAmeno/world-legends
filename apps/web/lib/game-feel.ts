/**
 * lib/game-feel.ts — Sprint 19 (Game Feel & Immersion)
 *
 * `lib/motion-tokens.ts` já é a fonte única de verdade para spring/duration/
 * easing/variants ("Sempre importe... Nunca escreva durações diretamente
 * nos componentes" — regra já documentada lá). Este arquivo NÃO duplica
 * isso: re-exporta os tokens de microinteração mais usados pelos
 * componentes de "game feel" desta sprint (PremiumToast, FlyingRewards,
 * LevelUpModal, AchievementPopup) por conveniência de import, e acrescenta
 * só o que ainda não existia — matemática de trajetória para recompensas
 * "voando" até o HUD.
 */

export { SPRING, PRESS, VARIANTS, DURATION, EASE } from './motion-tokens';

// ─── Trajetória de voo (moedas/fragmentos até o contador do HUD) ───────────

export type Point = { x: number; y: number };

/**
 * Centro de um elemento pelo seu ref — usado para saber de onde (origem do
 * ganho) e para onde (pill do HUD) uma recompensa deve voar.
 */
export function centerOf(el: Element | null): Point | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/**
 * Pontos de controle para um arco suave entre origem e destino — keyframes
 * de `x`/`y` no framer-motion (mais orgânico que uma linha reta).
 */
export function flightArc(from: Point, to: Point): { x: number[]; y: number[] } {
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 60; // sobe antes de descer/chegar
  return {
    x: [from.x, midX, to.x],
    y: [from.y, midY, to.y],
  };
}
