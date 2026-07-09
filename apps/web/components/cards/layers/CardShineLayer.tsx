'use client';

/**
 * Layer nova (Sprint 18.7) — Shine. Reservada para receber um asset de
 * holo/shine no futuro (`resolveShine`); hoje, sem asset, cai no reflexo
 * de vidro que reage ao mouse (`.card-shine-glass`, definido em
 * globals.css) — mesma técnica de "glass overlay" do Marvel Snap, movida
 * via as variáveis --px/--py setadas por useCardTilt (sem re-render).
 */

import { resolveShine } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardShineLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('shine')) return null;

  return (
    <ImageLayer
      asset={resolveShine(ctx.rarityCode)}
      alt=""
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ zIndex: 8 }}
      fallback={<div className="card-shine-glass" />}
    />
  );
}
