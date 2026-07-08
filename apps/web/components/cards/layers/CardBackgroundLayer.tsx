'use client';

/** Layer 1 — fundo ambiente atrás de tudo, por raridade + cor nacional. */

import { resolveBackground } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardBackgroundLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { kit, bgAlpha, rarityCode } = ctx;
  if (ctx.hiddenLayers?.has('background')) return null;

  return (
    <div className="card-parallax-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <ImageLayer
        asset={resolveBackground(rarityCode)}
        alt=""
        className="w-full h-full object-cover"
        fallback={
          <div
            style={{
              position: 'absolute',
              inset: 0,
              // Identidade nacional: gradiente de duas cores reais do kit (não só
              // uma tinta genérica), com intensidade que cresce por raridade — uma
              // Common e uma Legendary do MESMO país já parecem cartas diferentes
              // antes mesmo de olhar pra camisa.
              background: [
                `radial-gradient(ellipse 100% 70% at 50% 0%, ${kit.primary}${bgAlpha}, transparent 68%)`,
                `radial-gradient(ellipse 90% 60% at 50% 100%, ${kit.secondary}${bgAlpha}, transparent 62%)`,
                '#06060c',
              ].join(', '),
            }}
          />
        }
      />
    </div>
  );
}
