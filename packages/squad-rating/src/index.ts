/**
 * @world-legends/squad-rating — T034 Squad Overall Rating.
 *
 * API pública:
 *   calculateSquadRating(input)  Calcula overall, attack, midfield, defense.
 *   chemistryMultiplier(chem)    Multiplicador de química (0.95–1.05).
 *   sectorOf(position)           Setor tático de uma posição.
 *   aggregateTraitBonuses(...)   Bônus de traits por setor.
 *   getBonusForTrait(id)         Bônus de um trait específico.
 */

// ── Calculador ────────────────────────────────────────────────────────────────
export { calculateSquadRating, chemistryMultiplier } from './calculator/rating';

// ── Sectores ──────────────────────────────────────────────────────────────────
export { sectorOf, isDefense, isMidfield, isAttack } from './sectors/sectors';

// ── Traits ────────────────────────────────────────────────────────────────────
export { aggregateTraitBonuses, getBonusForTrait, TRAIT_BONUS_TABLE } from './traits/trait-bonuses';
export type { TraitSectorBonus, AggregatedTraitBonus } from './traits/trait-bonuses';

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type {
  RatedPlayer,
  SquadRatingInput,
  SquadRating,
  TacticalSector,
} from './types/types';
export {
  MAX_RATING,
  MIN_RATING,
  MAX_TRAIT_BONUS_PER_SECTOR,
  SECTOR_WEIGHTS,
} from './types/types';
