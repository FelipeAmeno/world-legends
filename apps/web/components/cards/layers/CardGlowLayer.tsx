'use client';

/**
 * Layer 6 — glow por trás da camisa/arte, reforçando a cor de raridade.
 * Asset-capable (`getGlowAssetPath`); quando ausente, cai no glow radial
 * procedural. O glow externo da carta (box-shadow no container) continua
 * aplicado via classe CSS (`RARITY_GLOW_CLASS`/`legendary-aura`) porque
 * depende de pseudo-elementos ajustados nas Sprints 17/17.1/18 — ver nota
 * de arquitetura no relatório da Sprint 18.5.
 *
 * Sprint 18.7 ("glow físico"): núcleo branco no centro, difusão pra cor
 * de raridade, e múltiplas camadas de drop-shadow — em vez de uma mancha
 * de cor só, mais parecido com uma fonte de luz de verdade.
 */

import { resolveGlow } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardGlowLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { accent, rarityCode, glow } = ctx;

  return (
    <ImageLayer
      asset={resolveGlow(rarityCode)}
      alt=""
      className="pointer-events-none card-parallax-glow"
      style={{ position: 'absolute', top: '20%', width: '70%', height: '60%' }}
      fallback={
        <div
          className="card-parallax-glow"
          style={{
            position: 'absolute',
            top: '20%',
            width: '70%',
            height: '60%',
            borderRadius: '50%',
            background: `radial-gradient(circle, #ffffff 0%, ${accent}dd 12%, ${accent}55 38%, transparent 70%)`,
            filter: glow
              ? `blur(4px) drop-shadow(0 0 8px ${accent}) drop-shadow(0 0 20px ${accent}80) drop-shadow(0 0 38px ${accent}40)`
              : 'blur(4px)',
            pointerEvents: 'none',
          }}
        />
      }
    />
  );
}
