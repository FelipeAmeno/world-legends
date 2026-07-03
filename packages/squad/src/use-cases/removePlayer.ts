/**
 * `removePlayer` — Remove um jogador de um slot titular ou do banco.
 *
 * Pode remover por:
 *   - `slotId` (ex: "CB-2") → remove do slot específico de titular.
 *   - `userCardId` → remove de qualquer posição (titular ou banco).
 *
 * Se o slot já estiver vazio ou o userCardId não for encontrado, retorna erro.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import type { Squad, SquadError } from '../types/types';

export type RemovePlayerInput = Readonly<{
  readonly squad: Squad;
  /** Remove pelo slotId do titular (ex: "ST-1"). Preferido quando se sabe o slot. */
  readonly slotId?: string;
  /** Remove por userCardId (busca em titulares e banco). */
  readonly userCardId?: string;
}>;

export function removePlayer(input: RemovePlayerInput): Result<Squad, SquadError> {
  const { squad, slotId, userCardId } = input;

  if (!slotId && !userCardId) {
    return Err(validationError('Forneça slotId ou userCardId para remover.', 'input'));
  }

  // ─── Remover por slotId (titular) ────────────────────────────────────────────
  if (slotId) {
    const slotIndex = squad.starters.findIndex((s) => s.slotId === slotId);
    if (slotIndex === -1) {
      return Err({ kind: 'SlotNotFound', slotId } as const);
    }

    // biome-ignore lint/style/noNonNullAssertion: slotIndex comes from findIndex, guaranteed valid
    const slot = squad.starters[slotIndex]!;
    if (slot.userCardId === null) {
      // Slot já vazio — nada a remover; retorna squad sem alteração (idempotente)
      return Ok(squad);
    }

    const newStarters = squad.starters.map((s, i) =>
      i === slotIndex ? Object.freeze({ ...s, userCardId: null }) : s,
    );

    return Ok(
      Object.freeze({
        ...squad,
        starters: Object.freeze(newStarters),
        updatedAt: new Date(),
      }),
    );
  }

  // ─── Remover por userCardId (busca em titulares e banco) ─────────────────────
  // biome-ignore lint/style/noNonNullAssertion: slotId is null here, so userCardId must be provided
  const uid = userCardId!;

  // Titular?
  const starterIdx = squad.starters.findIndex((s) => s.userCardId === uid);
  if (starterIdx !== -1) {
    const newStarters = squad.starters.map((s, i) =>
      i === starterIdx ? Object.freeze({ ...s, userCardId: null }) : s,
    );
    return Ok(
      Object.freeze({
        ...squad,
        starters: Object.freeze(newStarters),
        updatedAt: new Date(),
      }),
    );
  }

  // Banco?
  const benchIdx = squad.bench.indexOf(uid);
  if (benchIdx !== -1) {
    const newBench = squad.bench.filter((id) => id !== uid);
    return Ok(
      Object.freeze({
        ...squad,
        bench: Object.freeze(newBench),
        updatedAt: new Date(),
      }),
    );
  }

  // Não encontrado em nenhum lugar
  return Err({ kind: 'PlayerNotFound', userCardId: uid } as const);
}
