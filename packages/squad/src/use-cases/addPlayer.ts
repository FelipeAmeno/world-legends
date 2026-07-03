/**
 * `addPlayer` — Adiciona um UserCard a um slot de titular ou ao banco.
 *
 * Validações (titulares):
 *   TC-SQUAD-03 Slot encontrado na formação.
 *   TC-SQUAD-04 Slot não está ocupado.
 *   TC-SQUAD-05 Posição do jogador compatível com o slot.
 *   TC-SQUAD-06 Jogador não está duplicado (titulares + banco).
 *   TC-SQUAD-07 Jogador pertence ao userId do squad.
 *   TC-SQUAD-08 Jogador lesionado não pode ser TITULAR (pode ser banco).
 *   TC-SQUAD-09 Jogador suspenso não pode ser TITULAR.
 *
 * Validações (banco):
 *   TC-SQUAD-10 Banco não pode exceder 7 jogadores.
 *   TC-SQUAD-11 Jogador não está duplicado.
 *   TC-SQUAD-12 Jogador pertence ao userId.
 *
 * Porta injetada: `resolvePlayer` — retorna PlayerInfo ou null.
 */
import { Err, Ok, type Result } from '@world-legends/shared';
import { canPlayInSlot } from '../positions/compatibility';
import type { PlayerInfo, Squad, SquadError } from '../types/types';

export const MAX_BENCH_SIZE = 7;

export type AddPlayerInput = Readonly<{
  readonly squad: Squad;
  readonly userCardId: string;
  /** slotId (ex: "CB-2") para adicionar como titular. Omitir = banco. */
  readonly slotId?: string;
  readonly resolvePlayer: (userCardId: string) => PlayerInfo | null;
}>;

export function addPlayer(input: AddPlayerInput): Result<Squad, SquadError> {
  const { squad, userCardId, slotId, resolvePlayer } = input;

  // ── Resolver jogador ─────────────────────────────────────────────────────────
  const player = resolvePlayer(userCardId);
  if (!player) {
    return Err({ kind: 'PlayerNotFound', userCardId } as const);
  }

  // ── Verificar ownership ──────────────────────────────────────────────────────
  if (player.userId !== squad.userId) {
    return Err({ kind: 'PlayerOwnershipMismatch', userCardId } as const);
  }

  // ── Verificar duplicata global (titulares + banco) ────────────────────────────
  const alreadyInStarters = squad.starters.some((s) => s.userCardId === userCardId);
  const alreadyOnBench = squad.bench.includes(userCardId);

  if (alreadyInStarters || alreadyOnBench) {
    return Err({ kind: 'PlayerAlreadyInSquad', userCardId } as const);
  }

  // ─── BANCO ───────────────────────────────────────────────────────────────────
  if (slotId === undefined) {
    if (squad.bench.length >= MAX_BENCH_SIZE) {
      return Err({ kind: 'BenchFull' } as const);
    }

    const updated: Squad = Object.freeze({
      ...squad,
      bench: Object.freeze([...squad.bench, userCardId]),
      updatedAt: new Date(),
    });
    return Ok(updated);
  }

  // ─── TITULAR ─────────────────────────────────────────────────────────────────

  // Encontrar slot
  const slotIndex = squad.starters.findIndex((s) => s.slotId === slotId);
  if (slotIndex === -1) {
    return Err({ kind: 'SlotNotFound', slotId } as const);
  }

  // biome-ignore lint/style/noNonNullAssertion: slotIndex comes from findIndex, guaranteed valid
  const slot = squad.starters[slotIndex]!;

  // Slot ocupado?
  if (slot.userCardId !== null) {
    return Err({ kind: 'SlotOccupied', slotId } as const);
  }

  // Compatibilidade de posição
  if (!canPlayInSlot(player.naturalPosition, slot.requiredPosition)) {
    return Err({
      kind: 'IncompatiblePosition',
      playerPos: player.naturalPosition,
      slotPos: slot.requiredPosition,
    } as const);
  }

  // Lesionado não pode ser titular
  if (player.isInjured) {
    return Err({ kind: 'PlayerInjured', userCardId } as const);
  }

  // Suspenso não pode ser titular
  if (player.suspendedMatches > 0) {
    return Err({ kind: 'PlayerSuspended', userCardId, matches: player.suspendedMatches } as const);
  }

  // Atualizar slot
  const newStarters = squad.starters.map((s, i) =>
    i === slotIndex ? Object.freeze({ ...s, userCardId }) : s,
  );

  const updated: Squad = Object.freeze({
    ...squad,
    starters: Object.freeze(newStarters),
    updatedAt: new Date(),
  });

  return Ok(updated);
}
