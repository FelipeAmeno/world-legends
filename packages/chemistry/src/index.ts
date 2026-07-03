/**
 * @world-legends/chemistry — T033 Chemistry System.
 *
 * API pública:
 *   calculateChemistry(input)   Calcula SquadChemistry para N jogadores.
 *   buildLink(a, b)             Cria ChemistryLink entre dois jogadores.
 *   nationalityBonus(a, b)      Bônus de nacionalidade (0 | 2).
 *   competitionBonus(a, b)      Bônus de competição (0 | 1).
 *   eraBonus(a, b)              Bônus de era (0 | 1).
 */

// ── Tipos ─────────────────────────────────────────────────────────────────────
export type {
  PlayerChemistryInput,
  ChemistryLink,
  SquadChemistry,
  EraCode,
  CompetitionCode,
} from './types/types';
export {
  NATIONALITY_BONUS,
  COMPETITION_BONUS,
  ERA_BONUS,
  MAX_LINK_BONUS,
  MAX_SQUAD_CHEMISTRY,
} from './types/types';
export type {
  AdjacencyPair,
  AdjacencyPair as _AdjacencyPair,
  ChemistryCalculatorInput,
} from './calculator/calculator';

// ── Regras ────────────────────────────────────────────────────────────────────
export {
  nationalityBonus,
  competitionBonus,
  eraBonus,
  buildLink,
} from './rules/link-rules';

// ── Calculator ────────────────────────────────────────────────────────────────
export { calculateChemistry } from './calculator/calculator';
export type { ChemistryCalculatorInput as CalculatorInput } from './calculator/calculator';
