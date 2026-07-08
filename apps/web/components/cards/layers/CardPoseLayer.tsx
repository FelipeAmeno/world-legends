'use client';

/**
 * Layer nova (Sprint 19) — Pose. Pose/silhueta completa do jogador,
 * alternativa ao retrato de Player Art (Layer 5) pra quando existir uma
 * arte de corpo inteiro em vez de retrato. Hoje sem nenhum asset —
 * fallback null, camisa (Kit) continua sendo a protagonista visual.
 * Ver WORLD_LEGENDS_ART_PIPELINE.md pra convenção de nome.
 */

import { resolvePose } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardPoseLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('pose')) return null;

  return (
    <ImageLayer
      asset={resolvePose(ctx.card.playerId)}
      alt={ctx.card.displayName}
      className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none"
      style={{ zIndex: 5 }}
      fallback={null}
    />
  );
}
