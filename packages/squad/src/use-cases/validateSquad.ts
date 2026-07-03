import { canPlayInSlot } from '../positions/compatibility';
/**
 * `validateSquad` — Valida que um Squad está pronto para uma partida.
 *
 * Validações (doc 09 §1, doc 13 §11):
 *   TC-SQUAD-20 Exatamente 11 titulares preenchidos.
 *   TC-SQUAD-21 Exatamente 1 goleiro entre os titulares.
 *   TC-SQUAD-22 Banco com 5–7 jogadores.
 *   TC-SQUAD-23 Nenhum userCardId duplicado (titulares + banco).
 *   TC-SQUAD-24 Todas as posições compatíveis com o slot.
 *   TC-SQUAD-25 Nenhum jogador lesionado entre titulares.
 *   TC-SQUAD-26 Nenhum jogador suspenso entre titulares.
 *   TC-SQUAD-27 Todos os jogadores pertencem ao userId do squad.
 *
 * Retorna todos os erros encontrados de uma vez (não para no primeiro).
 */
import type { PlayerInfo, Squad } from '../types/types';

export type SquadValidationError = Readonly<{
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}>;

export type SquadValidationResult = Readonly<{
  readonly valid: boolean;
  readonly errors: readonly SquadValidationError[];
}>;

export type ValidateSquadInput = Readonly<{
  readonly squad: Squad;
  readonly resolvePlayer: (userCardId: string) => PlayerInfo | null;
  /** Tamanho mínimo de banco exigido (padrão = 5, doc 09 §12.1). */
  readonly minBenchSize?: number;
}>;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: validation logic requires multiple checks
export function validateSquad(input: ValidateSquadInput): SquadValidationResult {
  const { squad, resolvePlayer, minBenchSize = 5 } = input;
  const errors: SquadValidationError[] = [];

  const addErr = (code: string, message: string, field?: string): void => {
    errors.push(
      field !== undefined
        ? Object.freeze({ code, message, field })
        : Object.freeze({ code, message }),
    );
  };

  // ── TC-SQUAD-20: 11 titulares preenchidos ──────────────────────────────────
  const filledSlots = squad.starters.filter((s) => s.userCardId !== null);
  if (filledSlots.length !== 11) {
    addErr(
      'INCOMPLETE_STARTERS',
      `Squad precisa de 11 titulares; preenchidos: ${filledSlots.length}`,
      'starters',
    );
  }

  // ── TC-SQUAD-21: exatamente 1 GK ──────────────────────────────────────────
  const gkSlots = squad.starters.filter(
    (s) => s.requiredPosition === 'GK' && s.userCardId !== null,
  );
  if (gkSlots.length !== 1) {
    addErr(
      'INVALID_GK_COUNT',
      `Exatamente 1 goleiro necessário; encontrado: ${gkSlots.length}`,
      'starters',
    );
  }

  // ── TC-SQUAD-22: banco 5–7 ─────────────────────────────────────────────────
  if (squad.bench.length < minBenchSize) {
    addErr(
      'BENCH_TOO_SMALL',
      `Banco mínimo: ${minBenchSize} jogadores; atual: ${squad.bench.length}`,
      'bench',
    );
  }
  if (squad.bench.length > 7) {
    addErr('BENCH_TOO_LARGE', `Banco máximo: 7 jogadores; atual: ${squad.bench.length}`, 'bench');
  }

  // ── TC-SQUAD-23: sem duplicatas ────────────────────────────────────────────
  const allCardIds = [
    ...squad.starters.map((s) => s.userCardId).filter(Boolean),
    ...squad.bench,
  ] as string[];
  const seen = new Set<string>();
  for (const id of allCardIds) {
    if (seen.has(id)) {
      addErr('DUPLICATE_PLAYER', `UserCard duplicado no squad: ${id}`, 'starters');
    }
    seen.add(id);
  }

  // ── TC-SQUAD-24/25/26/27: validar cada titular ────────────────────────────
  for (const slot of filledSlots) {
    // biome-ignore lint/style/noNonNullAssertion: filledSlots already filtered null userCardId
    const uid = slot.userCardId!;
    const player = resolvePlayer(uid);

    if (!player) {
      addErr('PLAYER_NOT_FOUND', `UserCard não encontrado: ${uid}`, slot.slotId);
      continue;
    }

    // TC-SQUAD-27: ownership
    if (player.userId !== squad.userId) {
      addErr('OWNERSHIP_MISMATCH', `UserCard ${uid} não pertence ao userId do squad`, slot.slotId);
    }

    // TC-SQUAD-24: compatibilidade de posição
    if (!canPlayInSlot(player.naturalPosition, slot.requiredPosition)) {
      addErr(
        'INCOMPATIBLE_POSITION',
        `Jogador ${uid} (${player.naturalPosition}) não pode atuar em ${slot.requiredPosition}`,
        slot.slotId,
      );
    }

    // TC-SQUAD-25: lesionado
    if (player.isInjured) {
      addErr('PLAYER_INJURED', `Jogador ${uid} está lesionado e não pode ser titular`, slot.slotId);
    }

    // TC-SQUAD-26: suspenso
    if (player.suspendedMatches > 0) {
      addErr(
        'PLAYER_SUSPENDED',
        `Jogador ${uid} está suspenso por ${player.suspendedMatches} partida(s)`,
        slot.slotId,
      );
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors),
  });
}
