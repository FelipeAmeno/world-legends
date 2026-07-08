'use client';

/**
 * Layer 5 — arte do jogador (retrato/pose gerado pelo Gemini). Camada nova,
 * sem equivalente hoje: enquanto não existir o PNG, não renderiza nada (a
 * camisa, Layer 4, continua sendo a protagonista visual, como é hoje).
 * Pensada para ficar por cima da camisa e por baixo do HUD/texto.
 */

import { resolvePlayerArt } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardPlayerArtLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { card } = ctx;

  return (
    <ImageLayer
      asset={resolvePlayerArt(card.playerId)}
      alt={card.displayName}
      className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
      style={{ zIndex: 5 }}
      fallback={null}
    />
  );
}
