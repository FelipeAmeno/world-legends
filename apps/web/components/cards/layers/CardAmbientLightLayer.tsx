'use client';

/**
 * Layer nova (Sprint 19) — Ambient Light. Luz suave e constante vinda de
 * cima, intensidade lida de `ctx.material.ambientIntensity` — materiais
 * polidos (cerâmica, platina, ouro) "recebem" mais luz ambiente que
 * plástico fosco. Dá profundidade sem depender de mouse/interação.
 *
 * Sprint 18.9: oficialmente asset-capable (`resolveAmbient`) — mesmo
 * padrão fallback-first de toda outra camada; sem asset (hoje), visual
 * idêntico ao da Sprint 19.
 */

import { resolveAmbient } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardAmbientLightLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('ambientLight')) return null;

  const intensity = ctx.debugOverride?.ambientIntensity ?? ctx.material.ambientIntensity;
  const style = { '--ambient-intensity': intensity } as React.CSSProperties;

  return (
    <ImageLayer
      asset={resolveAmbient(ctx.rarityCode)}
      alt=""
      className="card-ambient-light-layer w-full h-full object-cover"
      style={style}
      fallback={<div className="card-ambient-light-layer" style={style} />}
    />
  );
}
