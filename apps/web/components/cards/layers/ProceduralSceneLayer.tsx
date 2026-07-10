'use client';

/**
 * components/cards/layers/ProceduralSceneLayer.tsx — Sprint 27
 * (Procedural Scene Engine) + Sprint 28 (Pose System)
 *
 * O fallback final de `CardSceneLayer.tsx` quando a carta não tem Scene
 * real nem Pose real — Sprint 26 removeu de vez o antigo fallback de
 * Kit/Jersey/Pattern (a "carta antiga"). A partir desta sprint, TODA
 * carta sem asset real ganha uma cena gerada (Background + Light +
 * Particles + Country Pattern + Pose), nunca mais uma camisa genérica.
 *
 * 100% determinístico — `generateProceduralScene` (que este componente
 * só CONSOME, nunca recalcula sozinho) usa um seed derivado de
 * playerId+nacionalidade+raridade+posição; a mesma carta sempre produz
 * a mesma cena.
 */

import { v3ToResolvedCardAsset } from '@/lib/card-v3/adapter';
import type { CardV3Composition } from '@/lib/card-v3/types';
import { getKitColors } from '@/lib/kit-data';
import { generateProceduralScene } from '@/lib/procedural-scene/SceneGenerator';
import type { NationalityCode, Position } from '@world-legends/types';
import type { CardVisualCtx } from '../card-types';
import { PoseFigure } from '../pose/PoseFigure';
import { ImageLayer } from './ImageLayer';

const SCENE_Z = 5;

type Props = {
  ctx: CardVisualCtx;
  /** Sprint 34 — composição v3 opcional. Cada canal presente (background/
   * pattern/light/particles/player) substitui a peça procedural equivalente
   * por um asset real; qualquer canal ausente continua 100% procedural.
   * Nunca tudo-ou-nada — arte real parcial já é suportada. */
  v3?: CardV3Composition | null;
};

export function ProceduralSceneLayer({ ctx, v3 }: Props) {
  const { card, dim, accent } = ctx;
  const scene = generateProceduralScene({
    playerId: card.playerId,
    nationality: card.nationality,
    rarityCode: card.rarityCode,
    position: card.position as Position,
  });
  const kit = getKitColors(card.nationality as NationalityCode);

  const stripeAngle = scene.countryPattern.angleDeg;
  const patternCss =
    scene.countryPattern.kind === 'checker'
      ? [
          `repeating-linear-gradient(${stripeAngle}deg, ${scene.countryPattern.colorA} 0 14px, transparent 14px 28px)`,
          `repeating-linear-gradient(${stripeAngle + 90}deg, ${scene.countryPattern.colorB} 0 14px, transparent 14px 28px)`,
        ].join(', ')
      : scene.countryPattern.kind === 'stripes'
        ? `repeating-linear-gradient(${stripeAngle}deg, ${scene.countryPattern.colorA} 0 10px, ${scene.countryPattern.colorB} 10px 20px)`
        : 'none';

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: SCENE_Z }}
      data-procedural-scene-seed={scene.seed}
    >
      {/* Background — arte real (v3) se existir, senão paleta de estádio
          procedural da seleção (Sprint 27) */}
      {v3?.background ? (
        <ImageLayer
          asset={v3ToResolvedCardAsset(v3.background, v3.meta)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fallback={null}
          eager
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: [
              `radial-gradient(ellipse 120% 90% at 50% ${scene.background.glowCenterYPercent}%, ${scene.background.gradientMid}, transparent 70%)`,
              `linear-gradient(180deg, ${scene.background.gradientFrom} 0%, ${scene.background.gradientTo} 100%)`,
            ].join(', '),
          }}
        />
      )}

      {/* Country Pattern — arte real (v3) se existir, senão listras/xadrez
          reais da seleção, 100% CSS */}
      {v3?.pattern ? (
        <ImageLayer
          asset={v3ToResolvedCardAsset(v3.pattern, v3.meta)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fallback={null}
        />
      ) : (
        patternCss !== 'none' && (
          <div
            className="absolute inset-0"
            style={{ background: patternCss, opacity: scene.countryPattern.opacity }}
          />
        )
      )}

      {/* Lighting — arte real (v3) se existir, senão raios volumétricos,
          mesma técnica de VolumetricLight (Sprint 22) */}
      {v3?.light ? (
        <ImageLayer
          asset={v3ToResolvedCardAsset(v3.light, v3.meta)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fallback={null}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: scene.lighting.opacity }}
        >
          <div
            className="volumetric-spin"
            style={{
              width: '200%',
              height: '200%',
              background: `repeating-conic-gradient(from ${scene.lighting.rotationStartDeg}deg, ${scene.lighting.color} 0deg, ${scene.lighting.color} ${(360 / scene.lighting.rayCount) * 0.18}deg, transparent ${(360 / scene.lighting.rayCount) * 0.18}deg, transparent ${360 / scene.lighting.rayCount}deg)`,
              WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 60%)',
              maskImage: 'radial-gradient(circle, black 0%, transparent 60%)',
              filter: 'blur(5px)',
              animationDuration: `${scene.lighting.spinDurationS}s`,
            }}
          />
        </div>
      )}

      {/* Vinheta de profundidade */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 90% at 50% 100%, rgba(0,0,0,${scene.background.vignetteOpacity}), transparent 55%)`,
        }}
      />

      {/* Pose — silhueta articulada (Sprint 28, Pose Engine). Silhueta CLARA
          (não escura) de propósito: o fundo do estádio é sempre escuro
          (`getStadiumBg`), uma silhueta escura ficaria invisível em cima
          dele — o efeito pretendido é "atleta contra-luz", não sombra.
          Sprint 33: área aumentada de 60% pra ~88% da largura pra bater
          com a referência (jogador ocupa quase a carta inteira). */}
      <div
        style={{
          position: 'absolute',
          top: dim.card.height * 0.04,
          left: 0,
          right: 0,
          bottom: dim.card.height * 0.16,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: dim.card.width * 0.88,
            height: dim.card.width * 0.88 * 1.4,
            filter: `drop-shadow(0 8px 18px rgba(0,0,0,0.6)) drop-shadow(0 0 20px ${accent}70)`,
          }}
        >
          {v3?.player ? (
            <ImageLayer
              asset={v3ToResolvedCardAsset(v3.player, v3.meta)}
              alt={card.displayName}
              className="w-full h-full object-contain object-bottom"
              fallback={null}
              eager
            />
          ) : (
            <PoseFigure
              pose={scene.pose}
              fillColor="#dfe1ea"
              accentColor={kit.primary}
              width="100%"
              height="100%"
            />
          )}
        </div>
      </div>

      {/* Particles — arte real (v3) se existir, senão campo determinístico
          (Sprint 27). Sprint 34: renderizadas DEPOIS da pose acima —
          "front particles" na frente do jogador, seguindo a ordem de
          composição do brief (04 Player Pose → 05 Front Particles). */}
      {v3?.particles ? (
        <ImageLayer
          asset={v3ToResolvedCardAsset(v3.particles, v3.meta)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fallback={null}
        />
      ) : (
        // Sprint 34 (item 9 do brief) — Compact reduz partículas
        // automaticamente (metade, arredondado pra cima): menos elementos
        // animados nas telas onde o card aparece em maior quantidade
        // (Squad grid, listas), sem precisar de nenhuma prop nova.
        (ctx.mode === 'compact'
          ? scene.particles.particles.slice(0, Math.ceil(scene.particles.particles.length / 2))
          : scene.particles.particles
        ).map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.xPercent}%`,
              top: `${p.yPercent}%`,
              width: p.size,
              height: p.size,
              background: scene.particles.color,
              boxShadow: `0 0 ${p.size * 2}px ${scene.particles.color}`,
              animation: `floatY ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          />
        ))
      )}
    </div>
  );
}
