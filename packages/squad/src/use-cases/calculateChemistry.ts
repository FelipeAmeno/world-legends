/**
 * `calculateChemistryUseCase` — Adaptor de use-case para o serviço de química.
 *
 * Valida que o squad tem jogadores suficientes antes de calcular.
 * Retorna ChemistryScore com 0 em squads vazios ou incompletos.
 *
 * Doc 11 §4.2: química só tem significado prático quando o squad está
 * completo (11 titulares). Em squads incompletos, retorna score parcial
 * sem erro — útil para preview durante montagem.
 */
import { Ok, type Result } from '@world-legends/shared';
import { type PlayerInfoResolver, calculateChemistry } from '../chemistry/chemistry';
import type { ChemistryScore, Squad, SquadError } from '../types/types';

export type CalculateChemistryInput = Readonly<{
  readonly squad: Squad;
  readonly resolvePlayer: PlayerInfoResolver;
}>;

export function calculateChemistryUseCase(
  input: CalculateChemistryInput,
): Result<ChemistryScore, SquadError> {
  return Ok(calculateChemistry(input.squad, input.resolvePlayer));
}
