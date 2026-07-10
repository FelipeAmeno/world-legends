'use client';

/**
 * Layer 4 — Scene (Sprint 21, consolidada na Sprint 24 — Card Composition
 * Refactor; legado eliminado de vez na Sprint 26 — Card Engine 2.0). O
 * centro da carta é UMA camada só — nunca mais duas competindo pelo
 * mesmo espaço.
 *
 * Cadeia de prioridade (só uma renderiza, nunca mais de uma ao mesmo tempo):
 * 1. Scene real (`scene-{playerId}.webp`) — cenário completo, ocupa TODA
 *    a área central da moldura (`inset-0`, `object-cover`).
 * 2. Pose real (asset fotográfico de corpo inteiro, se algum dia existir)
 *    — mesma área, `object-bottom`.
 * 3. Scene procedural (Sprint 27/28) — SEMPRE existe, nunca retorna nulo:
 *    Background + Lighting + Particles + Country Pattern (Sprint 27) +
 *    Pose articulada determinística (Sprint 28, `pose-engine`). Substitui
 *    de vez o antigo fallback de Kit/Jersey/Player Art/Pattern (a "carta
 *    antiga") — ver `SPRINT_26_CARD_ENGINE_2_LEGACY_REMOVAL.md` pro
 *    inventário completo do que foi removido.
 */

import { resolvePose, resolveScene } from '@/lib/card-asset-loader';
import { resolveCardV3 } from '@/lib/card-v3/resolver';
import type { CardVisualCtx } from '../card-types';
import { ImageLayer } from './ImageLayer';
import { ProceduralSceneLayer } from './ProceduralSceneLayer';

const SCENE_Z = 5;

export function CardSceneLayer({ ctx }: { ctx: CardVisualCtx }) {
  if (ctx.hiddenLayers?.has('scene')) return null;
  const { card } = ctx;

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

  // Fallback final: Scene procedural — nunca mais camisa/jersey. Sprint 34:
  // se a carta tiver uma composição v3 (validação/oficial), cada canal
  // presente nela substitui a peça procedural equivalente; sem composição
  // (toda carta real hoje), o comportamento é idêntico ao de antes.
  const v3 = card.v3CompositionId ? resolveCardV3(card.v3CompositionId) : null;
  return <ProceduralSceneLayer ctx={ctx} v3={v3} />;
}
