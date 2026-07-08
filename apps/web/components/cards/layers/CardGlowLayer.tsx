'use client';

/**
 * Layer 6 — glow por trás da camisa/arte, reforçando a cor de raridade.
 * Asset-capable (`getGlowAssetPath`); quando ausente, cai no glow radial
 * procedural de hoje. O glow externo da carta (box-shadow no container)
 * continua aplicado via classe CSS (`RARITY_GLOW_CLASS`/`legendary-aura`)
 * porque depende de pseudo-elementos ajustados nas Sprints 17/17.1/18 —
 * ver nota de arquitetura no relatório da sprint.
 */

import { getGlowAssetPath } from '@/lib/card-assets';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardGlowLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { accent, rarityCode } = ctx;

  return (
    <ImageLayer
      src={getGlowAssetPath(rarityCode)}
      alt=""
      className="pointer-events-none"
      style={{ position: 'absolute', top: '20%', width: '70%', height: '60%' }}
      fallback={
        <div
          style={{
            position: 'absolute',
            top: '20%',
            width: '70%',
            height: '60%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${accent}45, transparent 72%)`,
            filter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        />
      }
    />
  );
}
