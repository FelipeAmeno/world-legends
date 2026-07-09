'use client';

/**
 * Layer 9 (Sprint 24 — Card Composition Refactor) — glow físico, reforçando
 * a cor de raridade. Movido de "atrás da camisa" (Sprint 18.5-21) pra
 * camada final, acima do HUD — no novo layer order de 9 camadas
 * (Background → Ambient → Particles → Scene → Frame → Reflection → Shine
 * → HUD → Glow), o glow é a fonte de luz que banha a composição inteira
 * por cima, não uma mancha atrás do jogador. Asset-capable
 * (`resolveGlow`); quando ausente, cai no glow radial procedural (Sprint
 * 18.7 "glow físico": núcleo branco no centro, difusão pra cor de
 * raridade, múltiplas camadas de drop-shadow).
 *
 * Antes vivia dentro do wrapper flex da camisa (centralização horizontal
 * vinha do pai); agora renderiza como filha direta do container da carta,
 * então centraliza via `left: 15%` (largura 70% → margem 15% de cada
 * lado) em vez de depender de um flex parent.
 *
 * O glow externo da carta (box-shadow no container) continua aplicado via
 * classe CSS (`RARITY_GLOW_CLASS`/`legendary-aura`) — depende de
 * pseudo-elementos ajustados nas Sprints 17/17.1/18, sem relação com esta
 * camada.
 */

import { resolveGlow } from '@/lib/card-asset-loader';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

export function CardGlowLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { accent, rarityCode, glow } = ctx;
  if (ctx.hiddenLayers?.has('glow')) return null;

  return (
    <ImageLayer
      asset={resolveGlow(rarityCode)}
      alt=""
      className="pointer-events-none card-parallax-glow"
      style={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '70%',
        height: '60%',
        zIndex: 10,
      }}
      fallback={
        <div
          className="card-parallax-glow"
          style={{
            position: 'absolute',
            top: '20%',
            left: '15%',
            width: '70%',
            height: '60%',
            zIndex: 10,
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
