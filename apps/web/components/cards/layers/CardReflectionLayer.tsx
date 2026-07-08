/**
 * Layer nova (Sprint 19) — Reflection. Feixe de luz fixo (não reage ao
 * mouse — isso é o ShineLayer/glass da Sprint 18.7) que varre a carta em
 * loop, com intensidade/nitidez/velocidade lidas de `ctx.material`
 * (`ReflectionIntensity`/`reflectionSharpness`) — platina cromada reflete
 * forte e nítido; plástico fosco quase não reflete. Representa a
 * característica física do material, não uma interação do usuário.
 */

import type { CardVisualCtx } from '../card-types';

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
  if (ctx.material.reflectionIntensity <= 0) return null;

  return (
    <div
      className="card-reflection-layer"
      style={
        {
          '--reflection-intensity': ctx.material.reflectionIntensity,
          '--reflection-blur': `${SHARPNESS_BLUR[ctx.material.reflectionSharpness]}px`,
          '--reflection-duration': `${SHARPNESS_DURATION[ctx.material.reflectionSharpness]}s`,
        } as React.CSSProperties
      }
    />
  );
}
