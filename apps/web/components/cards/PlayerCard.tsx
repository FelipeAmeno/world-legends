'use client';

/**
 * components/cards/PlayerCard.tsx — Sprint 18.5 (Card Rendering Engine)
 *
 * Motor de renderização em camadas. A API pública ({ card, size, glow }) é
 * idêntica à de antes da Sprint 18.5 — todo call site existente (Coleção,
 * Pack Opening, Squad Builder, Perfil, Hall of Legends, Match) continua
 * funcionando sem nenhuma mudança. Nenhuma arte existe ainda: cada camada
 * asset-capable cai no visual procedural (CSS/SVG) de sempre via onError,
 * então o resultado visual hoje é idêntico ao de antes desta sprint — ver
 * SPRINT_18_5_REPORT.md para a lista de assets esperados pelo Gemini.
 */

import { getKitColors } from '@/lib/kit-data';
import { memo } from 'react';
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
import type { CardVisualCtx, PlayerCardData } from './card-types';
import { type CardAttributes, CardAttributesLayer } from './layers/CardAttributesLayer';
import { CardBackgroundLayer } from './layers/CardBackgroundLayer';
import { CardFrameLayer } from './layers/CardFrameLayer';
import { CardGlowLayer } from './layers/CardGlowLayer';
import { CardHudLayer } from './layers/CardHudLayer';
import { CardKitLayer } from './layers/CardKitLayer';
import { CardNameLayer } from './layers/CardNameLayer';
import { CardOvrLayer } from './layers/CardOvrLayer';
import { CardPlayerArtLayer } from './layers/CardPlayerArtLayer';
import { CardPositionLayer } from './layers/CardPositionLayer';
import { CardRarityEffectLayer } from './layers/CardRarityEffectLayer';

export type { PlayerCardData };

type Props = {
  card: PlayerCardData;
  size?: CardSize;
  glow?: boolean;
  /** Layer 11 (opcional, off por padrão) — nenhum call site existente precisa passar isso. */
  attributes?: CardAttributes;
};

function PlayerCardImpl({ card, size = 'md', glow, attributes }: Props) {
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
  };

  return (
    <div
      className={[
        'noise relative shrink-0 overflow-hidden',
        RARITY_FRAME_CLASS[card.rarityCode],
        glow ? RARITY_GLOW_CLASS[card.rarityCode] : '',
        isLegendaryPlus ? 'card-holo' : '',
        card.rarityCode === 'legendary' && glow ? 'legendary-aura' : '',
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
      {/* Layer 2 */}
      <CardRarityEffectLayer ctx={ctx} />
      {/* Layer 3 — aditiva; a moldura real é a classe CSS no container acima */}
      <CardFrameLayer ctx={ctx} />

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
            transform: `scale(${dim.jerseyScale})`,
            transformOrigin: 'top center',
            filter: `drop-shadow(0 6px 14px rgba(0,0,0,0.6)) drop-shadow(0 0 18px ${accent}50)`,
          }}
        >
          <CardKitLayer ctx={ctx} />
        </div>
      </div>
      <CardPlayerArtLayer ctx={ctx} />

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
    prev.attributes === next.attributes
  );
}

export const PlayerCard = memo(PlayerCardImpl, areEqual);
