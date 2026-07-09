'use client';

/**
 * Layer nova (Sprint 18.9) — Particle. Oficialmente asset-capable
 * (`resolveParticles`): com uma textura real, ela substitui o campo de
 * partículas procedural; sem asset (hoje), fallback idêntico ao
 * `CardParticles` da Sprint 18.7. Só renderiza pra legendary+ (mesmo
 * critério de `isLegendaryPlus` de sempre) — a própria camada decide isso,
 * em vez do `PlayerCard` condicionar a renderização por fora.
 *
 * Velocidade segue a mesma precedência de `CardReflectionLayer`: metadata
 * do asset > `ctx.debugOverride` (Dev Tool) > preset de animação da
 * raridade (`card-animation-presets.ts`).
 */

import { resolveParticles } from '@/lib/card-asset-loader';
import { CardParticles } from '../CardParticles';
import { RARITY_ANIMATION_PRESET } from '../card-animation-presets';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardParticleLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('particles')) return null;
  if (!ctx.isLegendaryPlus) return null;

  const asset = resolveParticles(ctx.rarityCode);
  const preset = RARITY_ANIMATION_PRESET[ctx.rarityCode];
  const speedMultiplier = asset
    ? asset.animationSpeed
    : (ctx.debugOverride?.animationSpeedMultiplier ?? preset.speedMultiplier);
  const isConfetti = ctx.rarityCode === 'world_cup_hero';

  return (
    <ImageLayer
      asset={asset}
      alt=""
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 4 }}
      fallback={
        <CardParticles
          cardId={ctx.card.cardId}
          accent={ctx.accent}
          speedMultiplier={speedMultiplier}
          confetti={isConfetti}
        />
      }
    />
  );
}
