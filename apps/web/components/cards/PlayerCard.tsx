'use client';

/**
 * components/cards/PlayerCard.tsx — Sprint 18.5 (Card Rendering Engine) +
 * Sprint 18.7 (Premium Card Engine — tilt/parallax/glass/breathing/metallic) +
 * Sprint 24 (Card Composition Refactor)
 *
 * Motor de renderização em camadas. A API pública ({ card, size, glow }) é
 * idêntica à de antes da Sprint 18.5 — todo call site existente (Coleção,
 * Pack Opening, Squad Builder, Perfil, Hall of Legends, Match) continua
 * funcionando sem nenhuma mudança.
 *
 * Sprint 24 — "carta antiga" eliminada de vez: antes desta sprint, o centro
 * da carta era renderizado por CINCO camadas irmãs competindo pelo mesmo
 * espaço (Scene + Kit + Pattern + Player Art + Pose), com a camisa vivendo
 * numa `<div>` própria com posicionamento/escala manual — um resquício
 * literal do design pré-Sprint-18.5. Agora é uma composição de 9 camadas
 * limpas, cada uma dona de UM espaço z-index bem definido:
 *
 *   1. Background   4. Scene        7. Shine
 *   2. Ambient      5. Frame        8. HUD (+ Atributos)
 *   3. Particles    6. Reflection   9. Glow
 *
 * "Ambient" agrupa Material + Ambient Light + Efeito de raridade (mesma
 * camada conceitual: atmosfera por trás da cena). Scene agora é a ÚNICA
 * camada do centro — ela mesma decide, internamente, entre asset real de
 * Scene, Player Art, Pose, ou o fallback de camisa (ver CardSceneLayer.tsx)
 * — nunca mais de uma competindo ao mesmo tempo. Nome, OVR, Posição e
 * Atributos continuam 100% React (nunca fazem parte de nenhuma arte).
 */

import { getKitColors } from '@/lib/kit-data';
import { memo } from 'react';
import { RARITY_MATERIAL } from './card-materials';
import {
  type CardSize,
  RARITY_ACCENT,
  RARITY_BG_ALPHA,
  RARITY_DISPLAY_LABEL,
  RARITY_FRAME_CLASS,
  RARITY_GLOW_CLASS,
  RARITY_ICON,
  RIBBON_FONT,
  SIZES,
  SIZE_TO_MODE,
} from './card-tokens';
import type { CardDebugOverride, CardLayerName, CardVisualCtx, PlayerCardData } from './card-types';
import { CardAmbientLightLayer } from './layers/CardAmbientLightLayer';
import { type CardAttributes, CardAttributesLayer } from './layers/CardAttributesLayer';
import { CardBackgroundLayer } from './layers/CardBackgroundLayer';
import { CardFrameLayer } from './layers/CardFrameLayer';
import { CardGlowLayer } from './layers/CardGlowLayer';
import { CardHudLayer } from './layers/CardHudLayer';
import { CardMaterialLayer } from './layers/CardMaterialLayer';
import { CardNameLayer } from './layers/CardNameLayer';
import { CardOvrLayer } from './layers/CardOvrLayer';
import { CardParticleLayer } from './layers/CardParticleLayer';
import { CardPositionLayer } from './layers/CardPositionLayer';
import { CardRarityEffectLayer } from './layers/CardRarityEffectLayer';
import { CardReflectionLayer } from './layers/CardReflectionLayer';
import { CardSceneLayer } from './layers/CardSceneLayer';
import { CardShineLayer } from './layers/CardShineLayer';
import { useCardInViewport } from './use-card-in-viewport';
import { useCardTilt } from './use-card-tilt';

export type { PlayerCardData };

type Props = {
  card: PlayerCardData;
  size?: CardSize;
  glow?: boolean;
  /** Opcional, off por padrão — nenhum call site existente precisa passar isso. */
  attributes?: CardAttributes;
  /** Modo Visual Debug (Sprint 19) — só usado por /dev/card-assets, nenhum call site existente precisa passar isso. */
  hiddenLayers?: ReadonlySet<CardLayerName>;
  /** Dev Tool only (Sprint 18.9) — ver `CardDebugOverride`. Nenhum call site de produção precisa passar isso. */
  debugOverride?: CardDebugOverride;
};

function PlayerCardImpl({
  card,
  size = 'md',
  glow,
  attributes,
  hiddenLayers,
  debugOverride,
}: Props) {
  const tiltRef = useCardTilt<HTMLDivElement>();
  const { ref: viewportRef, inViewport } = useCardInViewport<HTMLDivElement>();
  const kit = getKitColors(card.nationality);
  const accent = RARITY_ACCENT[card.rarityCode];
  const dim = SIZES[size];
  const icon = RARITY_ICON[card.rarityCode];
  const label = RARITY_DISPLAY_LABEL[card.rarityCode];
  const isCommon = card.rarityCode === 'common';
  const isGoat = card.rarityCode === 'world_cup_hero';
  const isUltra = card.rarityCode === 'ultra';
  const isLegendaryPlus = card.rarityCode === 'legendary' || isUltra || isGoat;
  const isElitePlus = card.rarityCode === 'elite' || isLegendaryPlus;
  const bgAlpha = RARITY_BG_ALPHA[card.rarityCode];
  const metallicSuffix =
    card.rarityCode === 'ultra'
      ? 'ultra'
      : card.rarityCode === 'world_cup_hero'
        ? 'wch'
        : card.rarityCode;
  const metallicClass = isCommon ? '' : `card-metallic card-metallic-${metallicSuffix}`;

  const ctx: CardVisualCtx = {
    card,
    size,
    mode: SIZE_TO_MODE[size],
    glow: Boolean(glow),
    kit,
    accent,
    dim,
    icon,
    label,
    bgAlpha,
    isCommon,
    isElitePlus,
    isLegendaryPlus,
    isUltra,
    isGoat,
    rarityCode: card.rarityCode,
    material: RARITY_MATERIAL[card.rarityCode],
    hiddenLayers,
    debugOverride,
  };

  return (
    // Wrapper de respiração (item 4, Sprint 18.7) — separado do container de
    // tilt abaixo porque uma animação CSS de `transform` substitui o valor
    // inteiro da propriedade; misturar scale (respiração) com rotate (tilt)
    // no mesmo elemento faria um sobrescrever o outro. Sprint 34: também o
    // wrapper que carrega `.card-offscreen` (via `useCardInViewport`) — as
    // animações de TODOS os descendentes pausam juntas quando o card sai da
    // viewport (item 9 do brief).
    <div
      ref={viewportRef}
      className={[isLegendaryPlus ? 'card-breathe' : '', inViewport ? '' : 'card-offscreen']
        .filter(Boolean)
        .join(' ')}
      style={{ display: 'inline-block' }}
    >
      <div
        ref={tiltRef}
        className={[
          'noise relative shrink-0 overflow-hidden card-tilt-root',
          RARITY_FRAME_CLASS[card.rarityCode],
          glow ? RARITY_GLOW_CLASS[card.rarityCode] : '',
          isLegendaryPlus ? 'card-holo' : '',
          card.rarityCode === 'legendary' && glow ? 'legendary-aura' : '',
          metallicClass,
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          width: dim.card.width,
          height: dim.card.height,
          borderRadius: Math.round(dim.card.width * 0.09),
          overflow: 'hidden',
        }}
      >
        {/* Layer 1 — Background */}
        <CardBackgroundLayer ctx={ctx} />

        {/* Layer 2 — Ambient (Material + Ambient Light + Efeito de raridade) */}
        <CardMaterialLayer ctx={ctx} />
        <CardAmbientLightLayer ctx={ctx} />
        <CardRarityEffectLayer ctx={ctx} />

        {/* Layer 3 — Particles (só legendary+; a própria camada decide) */}
        <CardParticleLayer ctx={ctx} />

        {/* Layer 4 — Scene (única camada do centro: scene real > player art >
            pose > camisa, nunca mais de uma ao mesmo tempo — ver CardSceneLayer.tsx) */}
        <CardSceneLayer ctx={ctx} />

        {/* Layer 5 — Frame (moldura, por cima da Scene como um frame físico) */}
        <CardFrameLayer ctx={ctx} />

        {/* Layer 6 — Reflection */}
        <CardReflectionLayer ctx={ctx} />

        {/* Layer 7 — Shine/glass reagindo ao mouse */}
        <CardShineLayer ctx={ctx} />

        {/* Layer 8 — HUD (100% React: OVR, posição, ribbon de raridade, nome) */}
        <CardHudLayer
          ctx={ctx}
          ovrSlot={<CardOvrLayer ctx={ctx} />}
          positionSlot={<CardPositionLayer ctx={ctx} />}
          ribbonSlot={
            isCommon ? null : (
              <>
                <span style={{ fontSize: RIBBON_FONT[size], lineHeight: 1 }}>{icon}</span>
                {size !== 'xs' && (
                  <span
                    style={{
                      fontSize: RIBBON_FONT[size] - 1.5,
                      fontWeight: 800,
                      color: accent,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {label}
                  </span>
                )}
              </>
            )
          }
          nameSlot={<CardNameLayer ctx={ctx} />}
          attributesSlot={
            attributes ? <CardAttributesLayer ctx={ctx} attributes={attributes} /> : undefined
          }
        />

        {/* Layer 9 — Glow (fonte de luz final, por cima de tudo) */}
        <CardGlowLayer ctx={ctx} />
      </div>
    </div>
  );
}

function areEqual(prev: Props, next: Props): boolean {
  return (
    prev.card.cardId === next.card.cardId &&
    prev.card.rarityCode === next.card.rarityCode &&
    prev.card.overall === next.card.overall &&
    prev.card.displayName === next.card.displayName &&
    prev.card.nationality === next.card.nationality &&
    prev.card.position === next.card.position &&
    prev.card.flagEmoji === next.card.flagEmoji &&
    prev.card.era === next.card.era &&
    prev.size === next.size &&
    prev.glow === next.glow &&
    prev.attributes === next.attributes &&
    prev.hiddenLayers === next.hiddenLayers &&
    prev.debugOverride === next.debugOverride
  );
}

export const PlayerCard = memo(PlayerCardImpl, areEqual);
