import type { BlendMode } from '@/lib/card-asset-loader';
import type { KitColors } from '@/lib/kit-data';
import type { RarityCode } from '@world-legends/types';
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
