'use client';

/**
 * Layer 4 — Scene (Sprint 21, consolidada na Sprint 24 — Card Composition
 * Refactor). O centro da carta é UMA camada só agora, não cinco brigando
 * pelo mesmo espaço — antes desta sprint, `PlayerCard` renderizava Scene +
 * Kit + Pattern + Player Art + Pose como cinco camadas irmãs empilhadas,
 * cada uma com sua própria lógica de fallback, e o bloco da camisa vivia
 * numa `<div>` própria com posicionamento/escala manual — essa mistura
 * ("carta antiga" por trás do frame novo) é exatamente o que a Sprint 24
 * eliminou.
 *
 * Cadeia de prioridade (só uma renderiza, nunca mais de uma ao mesmo tempo):
 * 1. Scene real (`scene-{playerId}.webp`) — cenário completo, ocupa TODA
 *    a área central da moldura (`inset-0`, `object-cover`).
 * 2. Player Art real (retrato) — mesma área, `object-top`.
 * 3. Pose real (corpo inteiro) — mesma área, `object-bottom`.
 * 4. Fallback final: camisa (Kit + Pattern) — mesmo visual/posicionamento
 *    de sempre (área confinada, `dim.jerseyScale`, drop-shadow por
 *    raridade) preservado pixel a pixel pra zero regressão hoje, já que
 *    nenhum asset de Scene/Player Art/Pose existe ainda. `JerseyArt` (SVG
 *    procedural, Sprint 17) é o fallback de fallback quando nem o Kit tem
 *    asset real.
 */

import {
  resolveKit,
  resolvePattern,
  resolvePlayerArt,
  resolvePose,
  resolveScene,
} from '@/lib/card-asset-loader';
import { JerseyArt } from '../JerseyArt';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';

const SCENE_Z = 5;

export function CardSceneLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('scene')) return null;
  const { card, dim, accent } = ctx;

  const scene = resolveScene(card.playerId);
  if (scene) {
    return (
      <ImageLayer
        asset={scene}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: SCENE_Z }}
        fallback={null}
      />
    );
  }

  const playerArt = resolvePlayerArt(card.playerId);
  if (playerArt) {
    return (
      <ImageLayer
        asset={playerArt}
        alt={card.displayName}
        className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
        style={{ zIndex: SCENE_Z }}
        fallback={null}
      />
    );
  }

  const pose = resolvePose(card.playerId);
  if (pose) {
    return (
      <ImageLayer
        asset={pose}
        alt={card.displayName}
        className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none"
        style={{ zIndex: SCENE_Z }}
        fallback={null}
      />
    );
  }

  // Fallback final: camisa (Kit + Pattern) — visual idêntico ao de sempre.
  return (
    <div
      style={{
        position: 'absolute',
        top: dim.card.height * 0.06,
        left: 0,
        right: 0,
        bottom: dim.card.height * 0.19,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflow: 'visible',
        zIndex: SCENE_Z,
      }}
    >
      <div
        style={{
          position: 'relative',
          transform: `scale(${dim.jerseyScale}) translate(calc(var(--px, 0) * 7px), calc(var(--py, 0) * 7px))`,
          transformOrigin: 'top center',
          filter: `drop-shadow(0 6px 14px rgba(0,0,0,0.6)) drop-shadow(0 0 18px ${accent}50)`,
        }}
      >
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
        <ImageLayer
          asset={resolvePattern(card.nationality)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ mixBlendMode: 'overlay' }}
          fallback={null}
        />
      </div>
    </div>
  );
}
