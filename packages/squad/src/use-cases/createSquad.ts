/**
 * `createSquad` — Cria um Squad vazio para o userId com a formação dada.
 *
 * Pré-condições:
 *   - `formation` deve ser uma das 8 formações válidas.
 *   - `userId` não pode ser vazio.
 *
 * Resultado: Squad com 11 slots vazios (userCardId = null) e banco vazio.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import { buildSquadSlots, isValidFormation } from '../formation/formation';
import { squadId } from '../types/types';
import type { Formation, Squad, SquadError } from '../types/types';

export type CreateSquadInput = Readonly<{
  readonly userId: string;
  readonly formation: string;
  readonly name?: string;
  /** Injetado para controle de ID — em produção usa uuid(); em testes pode ser determinístico. */
  readonly generateId?: () => string;
}>;

export function createSquad(input: CreateSquadInput): Result<Squad, SquadError> {
  // ── Validações de input ──────────────────────────────────────────────────────

  if (!input.userId.trim()) {
    return Err(validationError('userId não pode ser vazio', 'userId'));
  }

  if (!isValidFormation(input.formation)) {
    return Err({ kind: 'InvalidFormation', formation: input.formation } as const);
  }

  const formation = input.formation as Formation;
  const starters = buildSquadSlots(formation);
  const id = squadId((input.generateId ?? crypto.randomUUID.bind(crypto))());

  const squad: Squad = Object.freeze({
    id,
    userId: input.userId,
    formation,
    starters,
    bench: Object.freeze([]) as readonly string[],
    name: input.name ?? `Squad de ${input.userId}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return Ok(squad);
}
