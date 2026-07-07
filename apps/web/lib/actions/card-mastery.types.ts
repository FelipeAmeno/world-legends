/**
 * Tipos do fluxo de Card Mastery — separados de card-mastery.ts porque um
 * arquivo 'use server' só pode exportar funções async (Next.js/Turbopack).
 */
import type {
  CardMasteryState,
  MasteryLevelConfig,
  XpGainSource,
} from '@world-legends/card-mastery';

export type { CardMasteryState, MasteryLevelConfig, XpGainSource };

export type CardMasteryView = Readonly<{
  cardId: string;
  state: CardMasteryState;
  levelConfig: MasteryLevelConfig;
  nextLevelConfig: MasteryLevelConfig | null;
}>;

export type AllMasteryData = Readonly<{
  masteries: readonly CardMasteryView[];
}>;
