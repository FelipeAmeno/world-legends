'use client';

/**
 * components/cards/PlayerCard.tsx — Sprint 18.5 (Card Rendering Engine) +
 * Sprint 18.7 (Premium Card Engine — tilt/parallax/glass/breathing/metallic)
 *
 * Motor de renderização em camadas. A API pública ({ card, size, glow }) é
 * idêntica à de antes da Sprint 18.5 — todo call site existente (Coleção,
 * Pack Opening, Squad Builder, Perfil, Hall of Legends, Match) continua
 * funcionando sem nenhuma mudança. Nenhuma arte existe ainda: cada camada
 * asset-capable cai no visual procedural (CSS/SVG) de sempre via onError,
 * então o resultado visual hoje é idêntico ao de antes das Sprints 18.5/18.7
 * quando o mouse não se move — ver SPRINT_18_7_REPORT.md.
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
} from './card-tokens';
import type { CardDebugOverride, CardLayerName, CardVisualCtx, PlayerCardData } from './card-types';
import { CardAmbientLightLayer } from './layers/CardAmbientLightLayer';
import { type CardAttributes, CardAttributesLayer } from './layers/CardAttributesLayer';
import { CardBackgroundLayer } from './layers/CardBackgroundLayer';
import { CardFrameLayer } from './layers/CardFrameLayer';
import { CardGlowLayer } from './layers/CardGlowLayer';
import { CardHudLayer } from './layers/CardHudLayer';
import { CardKitLayer } from './layers/CardKitLayer';
import { CardMaterialLayer } from './layers/CardMaterialLayer';
import { CardNameLayer } from './layers/CardNameLayer';
import { CardOvrLayer } from './layers/CardOvrLayer';
import { CardParticleLayer } from './layers/CardParticleLayer';
import { CardPatternLayer } from './layers/CardPatternLayer';
import { CardPlayerArtLayer } from './layers/CardPlayerArtLayer';
import { CardPoseLayer } from './layers/CardPoseLayer';
import { CardPositionLayer } from './layers/CardPositionLayer';
import { CardRarityEffectLayer } from './layers/CardRarityEffectLayer';
import { CardReflectionLayer } from './layers/CardReflectionLayer';
import { CardSceneLayer } from './layers/CardSceneLayer';
import { CardShineLayer } from './layers/CardShineLayer';
import { useCardTilt } from './use-card-tilt';

export type { PlayerCardData };

type Props = {
  card: PlayerCardData;
  size?: CardSize;
  glow?: boolean;
  /** Layer 11 (opcional, off por padrão) — nenhum call site existente precisa passar isso. */
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
    // no mesmo elemento faria um sobrescrever o outro.
    <div
      className={isLegendaryPlus ? 'card-breathe' : undefined}
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
        {/* Layer 1 */}
        <CardBackgroundLayer ctx={ctx} />
        {/* Material (Sprint 19) — bezel físico da raridade, por cima do fundo ambiente */}
        <CardMaterialLayer ctx={ctx} />
        {/* Ambient Light (Sprint 19) — luz suave constante, intensidade por material */}
        <CardAmbientLightLayer ctx={ctx} />
        {/* Layer 2 */}
        <CardRarityEffectLayer ctx={ctx} />
        {/* Layer 3 — aditiva; a moldura real é a classe CSS no container acima */}
        <CardFrameLayer ctx={ctx} />
        {/* Scene (Sprint 21) — cenário cinematográfico por trás da camisa/arte; sem asset, não renderiza nada */}
        <CardSceneLayer ctx={ctx} />
        {/* Reflection (Sprint 19) — feixe de luz fixo, intensidade/nitidez por material */}
        <CardReflectionLayer ctx={ctx} />

        {/* Layer 4 (camisa) + Layer 5 (arte do jogador) + Layer 6 (glow), agrupadas
            no bloco central pois compartilham posicionamento/escala. */}
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
          }}
        >
          <CardGlowLayer ctx={ctx} />
          <div
            style={{
              position: 'relative',
              transform: `scale(${dim.jerseyScale}) translate(calc(var(--px, 0) * 7px), calc(var(--py, 0) * 7px))`,
              transformOrigin: 'top center',
              filter: `drop-shadow(0 6px 14px rgba(0,0,0,0.6)) drop-shadow(0 0 18px ${accent}50)`,
            }}
          >
            <CardKitLayer ctx={ctx} />
            {/* Pattern (Sprint 19) — textura reutilizável por cima do Kit, ponto de integração */}
            <CardPatternLayer ctx={ctx} />
          </div>
        </div>
        <CardPlayerArtLayer ctx={ctx} />
        {/* Pose (Sprint 19) — alternativa a Player Art, ponto de integração */}
        <CardPoseLayer ctx={ctx} />

        {/* Partículas (item 6, Sprint 18.7) — asset-capable desde a Sprint 18.9; a própria camada decide se renderiza (só legendary+) */}
        <CardParticleLayer ctx={ctx} />

        {/* Layer 7 (HUD/plates) recebe as Layers 8/9/10 (texto puro) como slots */}
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
        />

        {/* Layer 11 — opcional, off por padrão */}
        {attributes && <CardAttributesLayer ctx={ctx} attributes={attributes} />}

        {/* Shine/glass reagindo ao mouse (itens 3 + 8) — sempre por cima de tudo */}
        <CardShineLayer ctx={ctx} />
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
