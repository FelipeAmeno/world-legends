'use client';

/**
 * Layer nova (Sprint 21 — Cinematic Scene Engine). O centro da carta deixa
 * de ser só a camisa: quando existe um cenário completo pro jogador
 * (`scene-{playerId}.webp` — estádio, ambiente, iluminação), ele renderiza
 * por trás da camisa/arte/pose, como um cenário cinematográfico de verdade.
 *
 * Sem asset (hoje — nenhum ainda existe): não renderiza nada, fallback
 * `null` (mesmo padrão de Player Art/Pattern/Pose antes da primeira
 * entrega de arte) — o centro da carta continua exatamente como sempre foi.
 *
 * Mesmo pipeline de sempre: `resolveScene` lê o manifesto gerado
 * automaticamente, sidecar JSON opcional pra scale/offset/rotation.
 */

import { resolveScene } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardSceneLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('scene')) return null;

  return (
    <ImageLayer
      asset={resolveScene(ctx.card.playerId)}
      alt=""
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ zIndex: 4 }}
      fallback={null}
    />
  );
}
