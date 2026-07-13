'use client';

/**
 * components/cards/ResolvedWorldLegendsCard.tsx — Sprint 36 (Collection
 * Renderer Integration)
 *
 * ÚNICO lugar de produção que decide full-artwork vs. procedural — a
 * lógica que morava dentro de `PlayerCard.tsx` (Sprint 35D.6) foi
 * extraída pra cá. `PlayerCard` agora é uma fachada de compatibilidade
 * que delega 100% pra este componente (ver comentário nele) — nenhuma
 * tela precisa saber que essa decisão existe, nenhuma duplica a lógica.
 *
 * Fluxo: `card` → `resolvePlayerCardRenderer` (`lib/card-static/`) →
 *   'full-artwork'  → `FullArtworkWorldLegendsCard` (mesmo componente da dev tool, agora em components/cards/)
 *   'procedural'    → a composição de 9 camadas de sempre (Sprint 18.5/24)
 *
 * `density` é opcional e só afeta o branch full-artwork (qual variante
 * WebP buscar — compact/standard/showcase); o branch procedural sempre
 * usa `SIZE_TO_MODE[size]`, como sempre fez. Collection passa
 * `density="compact"` explicitamente pra nunca buscar assets
 * standard/showcase na grade, independente do `size` visual.
 */

import { CARD_STATIC_MANIFEST } from '@/lib/card-static/manifest.generated';
import { resolveGeneratedArtwork } from '@/lib/card-static/resolve-artwork';
import { resolvePlayerCardRenderer } from '@/lib/card-static/resolve-player-card-renderer';
import { getKitColors } from '@/lib/kit-data';
import { memo, useMemo } from 'react';
import {
  type FullArtworkDensity,
  FullArtworkWorldLegendsCard,
} from './FullArtworkWorldLegendsCard';
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

export type ResolvedWorldLegendsCardProps = {
  card: PlayerCardData;
  size?: CardSize;
  glow?: boolean;
  /** Opcional, off por padrão — nenhum call site existente precisa passar isso. */
  attributes?: CardAttributes;
  /** Só afeta o branch full-artwork — qual densidade de asset buscar.
   * `undefined` = `SIZE_TO_MODE[size]` (mesmo comportamento de sempre). */
  density?: FullArtworkDensity;
  /** Modo Visual Debug (Sprint 19) — só usado por /dev/card-assets, nenhum call site existente precisa passar isso. */
  hiddenLayers?: ReadonlySet<CardLayerName>;
  /** Dev Tool only (Sprint 18.9) — ver `CardDebugOverride`. Nenhum call site de produção precisa passar isso. */
  debugOverride?: CardDebugOverride;
};

function ResolvedWorldLegendsCardImpl({
  card,
  size = 'md',
  glow,
  attributes,
  density,
  hiddenLayers,
  debugOverride,
}: ResolvedWorldLegendsCardProps) {
  const tiltRef = useCardTilt<HTMLDivElement>();
  const { ref: viewportRef, inViewport } = useCardInViewport<HTMLDivElement>();

  const effectiveDensity = density ?? SIZE_TO_MODE[size];

  // Migração de catálogo (Sprint 35D.6/36) — resolver único, chamado
  // uma vez por render via useMemo. `artworkPresetId` só existe hoje
  // nas 10 cartas GOAT/lendárias com artwork exclusivo pronto
  // (`lib/collection-data.ts`); toda outra carta do jogo continua
  // 100% procedural, sem nenhuma mudança.
  //
  // `resolvePlayerCardRenderer` confirma que ALGUMA densidade foi
  // gerada (`hasAnyGeneratedOutput`), mas quem chama aqui pode pedir
  // uma densidade ESPECÍFICA (Collection sempre força `compact`) — se
  // só standard/showcase existirem, "full-artwork" seria verdade mas
  // não haveria asset compact real, e `FullArtworkWorldLegendsCard`
  // cairia no placeholder "artwork não gerado" em vez do procedural.
  // A segunda checagem (`resolveGeneratedArtwork` pra densidade exata)
  // fecha essa lacuna sem duplicar critério nenhum do resolver.
  const resolution = useMemo(() => {
    const base = resolvePlayerCardRenderer(
      {
        artworkPresetId: card.artworkPresetId,
        cardId: card.cardId,
        playerId: card.playerId,
        rarity: card.rarityCode,
      },
      CARD_STATIC_MANIFEST,
    );
    if (base.renderer !== 'full-artwork') return base;
    const hasDensityAsset = Boolean(
      resolveGeneratedArtwork(CARD_STATIC_MANIFEST, base.preset.id, effectiveDensity),
    );
    return hasDensityAsset
      ? base
      : ({ renderer: 'procedural', fallbackReason: 'artwork-output-not-found' } as const);
  }, [card.artworkPresetId, card.cardId, card.playerId, card.rarityCode, effectiveDensity]);

  if (resolution.renderer === 'full-artwork' && card.stats) {
    return (
      <FullArtworkWorldLegendsCard
        presetId={resolution.preset.id}
        density={effectiveDensity}
        displayName={card.displayName}
        overall={card.overall}
        position={card.position}
        countryFlag={card.flagEmoji}
        era={card.era}
        stats={card.stats}
        displayWidth={SIZES[size].card.width}
        {...(card.nickname ? { nickname: card.nickname } : {})}
      />
    );
  }

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

function areEqual(
  prev: ResolvedWorldLegendsCardProps,
  next: ResolvedWorldLegendsCardProps,
): boolean {
  return (
    prev.card.cardId === next.card.cardId &&
    prev.card.rarityCode === next.card.rarityCode &&
    prev.card.overall === next.card.overall &&
    prev.card.displayName === next.card.displayName &&
    prev.card.nationality === next.card.nationality &&
    prev.card.position === next.card.position &&
    prev.card.flagEmoji === next.card.flagEmoji &&
    prev.card.era === next.card.era &&
    prev.card.artworkPresetId === next.card.artworkPresetId &&
    prev.card.nickname === next.card.nickname &&
    prev.card.stats === next.card.stats &&
    prev.size === next.size &&
    prev.glow === next.glow &&
    prev.density === next.density &&
    prev.attributes === next.attributes &&
    prev.hiddenLayers === next.hiddenLayers &&
    prev.debugOverride === next.debugOverride
  );
}

export const ResolvedWorldLegendsCard = memo(ResolvedWorldLegendsCardImpl, areEqual);
