/**
 * Layer nova (Sprint 19) — Ambient Light. Luz suave e constante vinda de
 * cima, intensidade lida de `ctx.material.ambientIntensity` — materiais
 * polidos (cerâmica, platina, ouro) "recebem" mais luz ambiente que
 * plástico fosco. Dá profundidade sem depender de mouse/interação.
 */

import type { CardVisualCtx } from '../card-types';

export function CardAmbientLightLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('ambientLight')) return null;

  return (
    <div
      className="card-ambient-light-layer"
      style={{ '--ambient-intensity': ctx.material.ambientIntensity } as React.CSSProperties}
    />
  );
}
