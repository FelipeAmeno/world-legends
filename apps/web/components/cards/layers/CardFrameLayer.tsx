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

import { getFrameAssetPath } from '@/lib/card-assets';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardFrameLayer({ ctx }: { ctx: CardVisualCtx }) {
  return (
    <ImageLayer
      src={getFrameAssetPath(ctx.rarityCode)}
      alt=""
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 11 }}
      fallback={null}
      eager
    />
  );
}
