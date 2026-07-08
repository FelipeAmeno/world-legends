'use client';

/**
 * Layer nova (Sprint 19) — Pattern. Textura reutilizável associada à
 * seleção (listras, xadrez etc.), pensada pra sobrepor o Kit — hoje sem
 * nenhum asset (fallback null, como Player Art/Pose antes da primeira
 * entrega de arte). Ponto de integração preparado, não uma camada visível
 * ainda: ver WORLD_LEGENDS_ART_PIPELINE.md pra convenção de nome.
 */

import { resolvePattern } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardPatternLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('pattern')) return null;

  return (
    <ImageLayer
      asset={resolvePattern(ctx.card.nationality)}
      alt=""
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ zIndex: 3, mixBlendMode: 'overlay' }}
      fallback={null}
    />
  );
}
