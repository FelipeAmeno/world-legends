import type { BlendMode } from '@/lib/card-asset-loader';
import type { KitColors } from '@/lib/kit-data';
import type { RarityCode } from '@world-legends/types';
import type { FullArtworkStats } from '../dev/FullArtworkWorldLegendsCard';
import type { MaterialDef } from './card-materials';
import type { CardMode, CardSize, SIZES } from './card-tokens';

/**
 * Overrides ao vivo só usados pelo Dev Tool (`/dev/card-assets`) pra
 * experimentar intensidade/blend/velocidade antes de escrever um sidecar
 * JSON de verdade — nunca setado por nenhum call site de produção
 * (Sprint 18.9). `undefined` (padrão) = usa os valores de `material`/preset.
 */
export type CardDebugOverride = {
  reflectionIntensity?: number;
  ambientIntensity?: number;
  blendMode?: BlendMode;
  animationSpeedMultiplier?: number;
};

/** Sprint 35D.3 — categoriza a origem/tom do apelido, puramente informativo hoje (não muda renderização). */
export type PlayerNicknameType = 'legend' | 'official' | 'event' | 'meme';

export type PlayerCardData = {
  cardId: string;
  playerId: string;
  displayName: string;
  nationality: string;
  position: string;
  rarityCode: RarityCode;
  rarityLabel: string;
  overall: number;
  flagEmoji: string;
  era: string;
  /** Sprint 34 — ID de composição v3 opcional (`lib/card-v3/resolver.ts`).
   * `undefined` em toda carta real hoje (nenhum asset oficial ainda existe) —
   * só as 5 cartas de validação de `/dev/card-v3-gallery` setam isso. */
  v3CompositionId?: string;
  /** Sprint 35D.3 — nome curto opcional (não usado ainda pelo HUD do Card
   * Engine procedural, reservado pra telas compactas futuras). */
  shortName?: string;
  /** Sprint 35D.3 — apelido/título opcional, vem SEMPRE do dado da carta,
   * nunca da arte. `CardNameLayer` decide visibilidade por densidade
   * (Compact oculto, Standard/Showcase mostram se existir) — ver
   * `CardNameLayer.tsx`. Ausente = nenhum espaço reservado. */
  nickname?: string;
  nicknameType?: PlayerNicknameType;
  /** Sprint 35D.3 — ID de preset `full-card-artwork` opcional
   * (`lib/card-static/`). Quando presente e válido/elegível, o resolver
   * (`resolvePlayerCardRenderer`) escolhe `FullArtworkWorldLegendsCard`
   * em vez do Card Engine procedural — ver `PlayerCard.tsx`. Migração de
   * catálogo: só as 10 cartas GOAT/lendárias com artwork exclusivo
   * pronto (Pelé, Ronaldinho, Messi, Cristiano, Mbappé, Zidane, Ronaldo,
   * Beckenbauer, Maradona, Neymar) setam isso hoje — `lib/collection-data.ts`. */
  artworkPresetId?: string;
  /** Necessário só quando `artworkPresetId` está presente — stats brutos
   * (0-99) pro HUD do `FullArtworkWorldLegendsCard`. `undefined` = a carta
   * cai no Card Engine procedural mesmo com `artworkPresetId` setado
   * (nunca quebra por falta de dado). */
  stats?: FullArtworkStats;
};

/**
 * Contexto visual computado uma única vez por PlayerCard e repassado para
 * cada camada — nenhuma camada recalcula kit/accent/dim por conta própria.
 */
export type CardVisualCtx = {
  card: PlayerCardData;
  size: CardSize;
  /** Sprint 33 — Compact/Standard/Showcase, derivado de `size` (`SIZE_TO_MODE`). */
  mode: CardMode;
  glow: boolean;
  kit: KitColors;
  accent: string;
  dim: (typeof SIZES)[CardSize];
  icon: string;
  label: string;
  bgAlpha: string;
  isCommon: boolean;
  isElitePlus: boolean;
  isLegendaryPlus: boolean;
  isUltra: boolean;
  isGoat: boolean;
  rarityCode: RarityCode;
  material: MaterialDef;
  /** Visual Debug (Sprint 19) — camadas explicitamente desligadas para QA. `undefined` = todas ligadas. */
  hiddenLayers?: ReadonlySet<CardLayerName> | undefined;
  /** Dev Tool only (Sprint 18.9) — ver `CardDebugOverride`. */
  debugOverride?: CardDebugOverride | undefined;
};

/**
 * Nomes usados pelo modo Visual Debug pra ligar/desligar cada camada
 * individualmente — espelha exatamente as 9 camadas da composição real
 * (Sprint 24). `kit`/`playerArt`/`pose`/`pattern` foram absorvidos por
 * `scene` (ver CardSceneLayer.tsx) — não existem mais como camadas
 * independentes.
 */
export type CardLayerName =
  | 'background'
  | 'material'
  | 'ambientLight'
  | 'rarityEffect'
  | 'particles'
  | 'scene'
  | 'frame'
  | 'reflection'
  | 'shine'
  | 'hud'
  | 'glow';
