/**
 * @world-legends/squad — Squad Builder Domain (doc 17 §11).
 *
 * Exports públicos do bounded context Squad:
 *   - createSquad()           Cria squad vazio com formação
 *   - addPlayer()             Adiciona jogador a slot ou banco
 *   - removePlayer()          Remove jogador de slot ou banco
 *   - validateSquad()         Valida squad completo para partida
 *   - calculateChemistryUseCase() Calcula química do squad
 *
 * Tipos:
 *   Squad, SquadSlot, Formation, SquadError, ChemistryScore, PlayerInfo
 *
 * Internals exportados apenas para testing:
 *   buildSquadSlots, formationPositions, isValidFormation
 *   checkPositionFit, canPlayInSlot, positionFitScore
 *   calculateChemistry (serviço puro)
 */

// ── Tipos ────────────────────────────────────────────────────────────────────
export type {
  Squad,
  SquadId,
  SquadSlot,
  Formation,
  SquadError,
  ChemistryScore,
  PlayerInfo,
} from './types/types';
export {
  squadId,
  ALL_FORMATIONS,
} from './types/types';

// ── Formation ────────────────────────────────────────────────────────────────
export {
  buildSquadSlots,
  formationPositions,
  isValidFormation,
} from './formation/formation';

// ── Position compatibility ───────────────────────────────────────────────────
export {
  PositionFit,
  checkPositionFit,
  canPlayInSlot,
  positionFitScore,
} from './positions/compatibility';

// ── Chemistry ────────────────────────────────────────────────────────────────
export { calculateChemistry } from './chemistry/chemistry';
export type { PlayerInfoResolver } from './chemistry/chemistry';

// ── Use-cases ────────────────────────────────────────────────────────────────
export { createSquad } from './use-cases/createSquad';
export type { CreateSquadInput } from './use-cases/createSquad';

export { addPlayer, MAX_BENCH_SIZE } from './use-cases/addPlayer';
export type { AddPlayerInput } from './use-cases/addPlayer';

export { removePlayer } from './use-cases/removePlayer';
export type { RemovePlayerInput } from './use-cases/removePlayer';

export { validateSquad } from './use-cases/validateSquad';
export type {
  ValidateSquadInput,
  SquadValidationResult,
  SquadValidationError,
} from './use-cases/validateSquad';

export { calculateChemistryUseCase } from './use-cases/calculateChemistry';
export type { CalculateChemistryInput } from './use-cases/calculateChemistry';

// ── Constantes ───────────────────────────────────────────────────────────────
export { MAX_BENCH_SIZE as BENCH_MAX } from './use-cases/addPlayer';
