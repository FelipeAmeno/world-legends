'use client';

/**
 * Layer 4 — camisa da seleção. Asset-capable (`getKitAssetPath`); quando
 * ausente, cai na camisa SVG procedural (`JerseyArt`, já existente desde a
 * Sprint 17 "Card Art Revolution").
 */

import { resolveKit } from '@/lib/card-asset-loader';
import { JerseyArt } from '../JerseyArt';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardKitLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { card, dim } = ctx;

  return (
    <ImageLayer
      asset={resolveKit(card.nationality, card.rarityCode)}
      alt={`Camisa ${card.nationality}`}
      style={{ width: dim.card.width * 0.62, height: 'auto' }}
      fallback={
        <JerseyArt
          playerId={card.playerId}
          displayName={card.displayName}
          nationality={card.nationality}
          position={card.position}
          rarityCode={card.rarityCode}
          size={dim.jersey}
        />
      }
    />
  );
}
