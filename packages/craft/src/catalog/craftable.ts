/**
 * `craftable.ts` — determina se uma carta é elegível para craft.
 *
 * Doc 10 §17: World Cup Hero e GOAT nunca são craftáveis.
 * TC-CRAFT-06: WCH bloqueado — "exclusiva de evento/pack, preserva prestígio".
 * TC-CRAFT-07: GOAT bloqueado — "exclusiva de conquista" (doc 10 §11).
 *
 * GOAT não é uma `RarityCode` no sistema (é uma `EditionCode`). Esta função
 * recebe ambos para cobrir os dois casos documentados:
 * - Raridade `world_cup_hero` → não craftável (TC-CRAFT-06)
 * - Edição `goat`            → não craftável (TC-CRAFT-07)
 *
 * Funções puras — sem efeito colateral.
 */
import type { EditionCode, RarityCode } from '@world-legends/types';
import type { CraftError } from '../types/types';

export type CraftEligibility =
  | Readonly<{ eligible: true }>
  | Readonly<{ eligible: false; error: Extract<CraftError, { kind: 'NotCraftable' }> }>;

/**
 * Verifica se uma carta é elegível para craft.
 * Deve ser chamado ANTES de qualquer verificação de saldo ou posse.
 */
export function checkCraftEligibility(
  rarityCode: RarityCode,
  editionCode: EditionCode,
): CraftEligibility {
  // TC-CRAFT-07: edição GOAT nunca craftável (doc 10 §11/§17)
  if (editionCode === 'goat') {
    return {
      eligible: false,
      error: Object.freeze({
        kind: 'NotCraftable' as const,
        rarityCode,
        reason: 'exclusive_achievement' as const,
      }),
    };
  }

  // TC-CRAFT-06: raridade World Cup Hero nunca craftável (doc 10 §17)
  if (rarityCode === 'world_cup_hero') {
    return {
      eligible: false,
      error: Object.freeze({
        kind: 'NotCraftable' as const,
        rarityCode,
        reason: 'exclusive_event_drop' as const,
      }),
    };
  }

  return { eligible: true };
}

/** Todas as raridades craftáveis (doc 10 §17). */
export const CRAFTABLE_RARITIES: readonly RarityCode[] = [
  'common',
  'rare',
  'elite',
  'legendary',
  'ultra',
] as const;

/** Raridades NÃO craftáveis (doc 10 §17). */
export const NON_CRAFTABLE_RARITIES: readonly RarityCode[] = ['world_cup_hero'] as const;
