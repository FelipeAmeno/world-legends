'use client';

/**
 * Layer 3 — moldura. A moldura/borda de hoje é aplicada via classes CSS no
 * container (`card-frame-*`, `card-holo`, `legendary-aura` em
 * app/globals.css) porque depende de pseudo-elementos (::before/::after)
 * já ajustados nas Sprints 17/17.1/18 — mover isso para um `<img>` separado
 * arriscaria quebrar esse acabamento fino sem ganho nenhum hoje. Esta camada
 * é aditiva: só aparece por cima de tudo quando existir um PNG de moldura
 * ornamentada; até lá, não renderiza nada (a moldura CSS continua sendo a
 * moldura real da carta).
 */

import { resolveFrame } from '@/lib/card-asset-loader';
import { v3ToResolvedCardAsset } from '@/lib/card-v3/adapter';
import { resolveCardV3 } from '@/lib/card-v3/resolver';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardFrameLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('frame')) return null;

  // Sprint 34 — moldura de uma composição v3 tem prioridade sobre a moldura
  // por raridade de sempre; sem composição (toda carta real hoje), cai no
  // `resolveFrame` de sempre, comportamento idêntico ao de antes.
  const v3 = ctx.card.v3CompositionId ? resolveCardV3(ctx.card.v3CompositionId) : null;
  const asset = v3?.frame
    ? v3ToResolvedCardAsset(v3.frame.src, v3.frame.meta)
    : resolveFrame(ctx.rarityCode);

  return (
    <ImageLayer
      asset={asset}
      alt=""
      className="absolute inset-0 w-full h-full pointer-events-none card-parallax-frame"
      style={{ zIndex: 6 }}
      fallback={null}
      eager
    />
  );
}
