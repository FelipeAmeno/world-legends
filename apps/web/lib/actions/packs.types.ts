/**
 * Tipos do fluxo de Packs — separados de packs.ts porque um arquivo
 * 'use server' só pode exportar funções async (Next.js/Turbopack).
 */
import type { CollectionSetDef } from '@/lib/collection-sets';
import type { RarityCode } from '@world-legends/types';

export type DrawnCardInfo = {
  cardId: string;
  userCardId: string;
  rarityCode: RarityCode;
  isDuplicate: boolean;
  fragmentsGained: number;
};

export type OpenPackResult =
  | {
      ok: true;
      drawn: DrawnCardInfo[];
      newBalance: number;
      totalFragments: number;
      newlyCompletedSets: readonly CollectionSetDef[];
    }
  | { ok: false; error: string };
