/**
 * Layer nova (Sprint 19) — Material. Renderiza o "bezel" da carta com o
 * material físico da raridade (ver components/cards/card-materials.ts):
 * plástico fosco (common), metal anodizado (rare), carbono premium (elite),
 * ouro lapidado (legendary), platina cromada (ultra), cerâmica branca
 * premium (world_cup_hero). 100% CSS — sem asset de imagem por enquanto
 * (o material é uma textura procedural, diferente de Frame/Background que
 * são superfícies chapadas e por isso fazem mais sentido como PNG).
 */

import type { CardVisualCtx } from '../card-types';

export function CardMaterialLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('material')) return null;

  return <div className={`card-material-layer ${ctx.material.className}`} />;
}
