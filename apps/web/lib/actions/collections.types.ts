/**
 * Tipos do fluxo de Collections — separados de collections.ts porque um
 * arquivo 'use server' só pode exportar funções async (Next.js/Turbopack).
 */
import type { CollectionSetDef } from '@/lib/collection-sets';

export type CollectionSetView = Readonly<{
  def: CollectionSetDef;
  ownedCardIds: readonly string[];
  completionPct: number;
  isCompleted: boolean;
  isClaimed: boolean;
}>;

export type CollectionsData = Readonly<{
  views: readonly CollectionSetView[];
  totalCompleted: number;
}>;

export type ClaimCollectionResult =
  | { ok: true; creditsEarned: number; newBalance: number }
  | { ok: false; error: string };

export type CheckCollectionResult = Readonly<{
  newlyCompleted: readonly CollectionSetDef[];
}>;
