'use client';

/**
 * Layer nova (Sprint 19) — Reflection. Feixe de luz fixo (não reage ao
 * mouse — isso é o ShineLayer/glass da Sprint 18.7) que varre a carta em
 * loop, com intensidade/nitidez lidas de `ctx.material`
 * (`reflectionIntensity`/`reflectionSharpness`) — platina cromada reflete
 * forte e nítido; plástico fosco quase não reflete.
 *
 * Sprint 18.9: oficialmente asset-capable (`resolveReflection`) — com um
 * asset real, a textura substitui o feixe procedural; sem asset (hoje),
 * fallback continua 100% CSS/procedural (mesma paridade de pixel de
 * sempre — nenhum elemento novo, nenhuma cor nova, mesma composição).
 *
 * A ÚNICA coisa que muda mesmo sem asset é a VELOCIDADE do sweep, que
 * agora segue o preset de animação da raridade (`card-animation-presets.ts`
 * — item 4 do brief) em vez de uma constante única — mesmo padrão já
 * estabelecido pelo Sistema de Materiais da Sprint 19 (que também mudou o
 * visual padrão de todo card sem depender de asset real). Precedência:
 * `asset.animationSpeed` (sidecar, se existir asset real) > `ctx.debugOverride`
 * (só Dev Tool) > preset da raridade (padrão de produção).
 */

import { resolveReflection } from '@/lib/card-asset-loader';
import { RARITY_ANIMATION_PRESET } from '../card-animation-presets';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

const SHARPNESS_BLUR: Record<'soft' | 'medium' | 'sharp', number> = {
  soft: 6,
  medium: 3,
  sharp: 1,
};

const SHARPNESS_DURATION: Record<'soft' | 'medium' | 'sharp', number> = {
  soft: 5.5,
  medium: 4,
  sharp: 2.8,
};

export function CardReflectionLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('reflection')) return null;

  const intensity = ctx.debugOverride?.reflectionIntensity ?? ctx.material.reflectionIntensity;
  if (intensity <= 0) return null;

  const asset = resolveReflection(ctx.rarityCode);
  const preset = RARITY_ANIMATION_PRESET[ctx.rarityCode];
  const speedMultiplier = asset
    ? asset.animationSpeed
    : (ctx.debugOverride?.animationSpeedMultiplier ?? preset.speedMultiplier);
  const duration = SHARPNESS_DURATION[ctx.material.reflectionSharpness] * speedMultiplier;

  const style = {
    '--reflection-intensity': intensity,
    '--reflection-blur': `${SHARPNESS_BLUR[ctx.material.reflectionSharpness]}px`,
    '--reflection-duration': `${duration}s`,
    ...(ctx.debugOverride?.blendMode ? { mixBlendMode: ctx.debugOverride.blendMode } : {}),
  } as React.CSSProperties;

  return (
    <ImageLayer
      asset={asset}
      alt=""
      className="card-reflection-layer w-full h-full object-cover"
      style={style}
      fallback={<div className="card-reflection-layer" style={style} />}
    />
  );
}
