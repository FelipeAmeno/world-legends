/**
 * `validate-lineup.ts` — valida que um conjunto de UserCards forma uma
 * escalação legal antes de ser enviado para `engine.simulateMatch`.
 *
 * Responsabilidades:
 * - Exatamente 11 titulares e 1 goleiro entre eles (doc 09 §1).
 * - Posições válidas (enum Position de @world-legends/types).
 * - Mínimo de 5 reservas para cobrir W.O. (doc 09 §12.1).
 * - Cada slotId único — sem duplicatas de mesmo jogador.
 *
 * NÃO decide qual tática ou formação usar — isso é do chamador.
 * NÃO converte UserCards em MatchPlayer — isso é de `build-team-snapshot.ts`.
 *
 * Funções puras: sem efeito colateral.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { Position } from '@world-legends/types';
import { ALL_POSITIONS } from '@world-legends/types';

// ─── Tipos de entrada ─────────────────────────────────────────────────────────

export type LineupSlot = Readonly<{
  readonly slotId: string;
  readonly userCardId: string;
  /** Posição em que este jogador vai atuar nesta partida (pode diferir da primaryPosition). */
  readonly formationPosition: Position;
}>;

export type LineupInput = Readonly<{
  readonly starters: readonly LineupSlot[];
  readonly bench: readonly LineupSlot[];
}>;

// ─── Constantes (doc 09 §12.1 e regras do futebol) ───────────────────────────

export const REQUIRED_STARTERS = 11;
export const REQUIRED_GK_COUNT = 1;
export const MIN_BENCH_SIZE = 5; // mínimo para cobrir W.O. eventual

// ─── validateLineup ───────────────────────────────────────────────────────────

export function validateLineup(input: LineupInput): Result<LineupInput, ValidationError> {
  // 1. Número exato de titulares
  if (input.starters.length !== REQUIRED_STARTERS) {
    return Err(
      validationError(
        `Escalação requer exatamente ${REQUIRED_STARTERS} titulares; recebido: ${input.starters.length}`,
        'starters',
      ),
    );
  }

  // 2. Exatamente 1 goleiro
  const gkCount = input.starters.filter((s) => s.formationPosition === 'GK').length;
  if (gkCount !== REQUIRED_GK_COUNT) {
    return Err(
      validationError(
        `Escalação requer exatamente 1 goleiro (GK); encontrado: ${gkCount}`,
        'starters',
      ),
    );
  }

  // 3. Todas as posições válidas
  for (const slot of [...input.starters, ...input.bench]) {
    if (!ALL_POSITIONS.includes(slot.formationPosition)) {
      return Err(
        validationError(
          `Posição inválida "${slot.formationPosition}" no slot "${slot.slotId}"`,
          'starters',
        ),
      );
    }
  }

  // 4. slotIds únicos em titulares
  const starterIds = input.starters.map((s) => s.slotId);
  if (new Set(starterIds).size !== starterIds.length) {
    return Err(validationError('slotIds duplicados nos titulares', 'starters'));
  }

  // 5. userCardIds únicos (mesmo jogador não pode estar em dois slots)
  const allCardIds = [...input.starters, ...input.bench].map((s) => s.userCardId);
  if (new Set(allCardIds).size !== allCardIds.length) {
    return Err(
      validationError('userCardId duplicado: mesmo jogador em múltiplos slots', 'starters'),
    );
  }

  // 6. Reservas mínimas
  if (input.bench.length < MIN_BENCH_SIZE) {
    return Err(
      validationError(
        `Banco mínimo: ${MIN_BENCH_SIZE} jogadores; recebido: ${input.bench.length}`,
        'bench',
      ),
    );
  }

  return Ok(input);
}
