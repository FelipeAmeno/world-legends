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

import { getKitColors } from '@/lib/kit-data';
import { generateProceduralScene } from '@/lib/procedural-scene/SceneGenerator';
import type { NationalityCode, Position } from '@world-legends/types';
import type { CardVisualCtx } from '../card-types';
import { PoseFigure } from '../pose/PoseFigure';

const SCENE_Z = 5;

export function ProceduralSceneLayer({ ctx }: { ctx: CardVisualCtx }) {
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
      {/* Background — paleta de estádio da seleção (Sprint 27) */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(ellipse 120% 90% at 50% ${scene.background.glowCenterYPercent}%, ${scene.background.gradientMid}, transparent 70%)`,
            `linear-gradient(180deg, ${scene.background.gradientFrom} 0%, ${scene.background.gradientTo} 100%)`,
          ].join(', '),
        }}
      />

      {/* Country Pattern — listras/xadrez reais da seleção, 100% CSS */}
      {patternCss !== 'none' && (
        <div
          className="absolute inset-0"
          style={{ background: patternCss, opacity: scene.countryPattern.opacity }}
        />
      )}

      {/* Lighting — raios volumétricos, mesma técnica de VolumetricLight (Sprint 22) */}
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

      {/* Vinheta de profundidade */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 120% 90% at 50% 100%, rgba(0,0,0,${scene.background.vignetteOpacity}), transparent 55%)`,
        }}
      />

      {/* Particles — campo determinístico, escala com raridade (Sprint 27) */}
      {scene.particles.particles.map((p) => (
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
      ))}

      {/* Pose — silhueta articulada (Sprint 28, Pose Engine). Silhueta CLARA
          (não escura) de propósito: o fundo do estádio é sempre escuro
          (`getStadiumBg`), uma silhueta escura ficaria invisível em cima
          dele — o efeito pretendido é "atleta contra-luz", não sombra. */}
      <div
        style={{
          position: 'absolute',
          top: dim.card.height * 0.1,
          left: 0,
          right: 0,
          bottom: dim.card.height * 0.2,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: dim.card.width * 0.6,
            height: dim.card.width * 0.6 * 1.4,
            filter: `drop-shadow(0 6px 14px rgba(0,0,0,0.55)) drop-shadow(0 0 16px ${accent}60)`,
          }}
        >
          <PoseFigure
            pose={scene.pose}
            fillColor="#dfe1ea"
            accentColor={kit.primary}
            width="100%"
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
