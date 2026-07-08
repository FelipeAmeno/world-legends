import type { KitColors } from '@/lib/kit-data';
import type { RarityCode } from '@world-legends/types';
import type { CardSize, SIZES } from './card-tokens';

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
};
