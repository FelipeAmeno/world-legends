import type {
  AttributeSet,
  MatchPlayer,
  StartingSlot,
  TacticalIntensity,
  TeamSnapshot,
  TraitMagnitude,
} from '@world-legends/engine';
/**
 * `build-team-snapshot.ts` — converte dados de coleção/cartas em
 * `TeamSnapshot` (formato que `engine.simulateMatch` espera).
 *
 * É a "ponte" entre o bounded context de Coleção (UserCard, Card) e o
 * bounded context de Engine (TeamSnapshot, MatchPlayer).
 *
 * O chamador fornece a resolução de atributos via `CardAttributeResolver`
 * — uma porta injetada que retorna os atributos finais de uma carta a
 * partir do userCardId, sem que `match` precise importar `cards` diretamente
 * para fazer a lookup (Ports & Adapters, doc 18 §3.2).
 */
import type { Position } from '@world-legends/types';
import type { LineupSlot } from './validate-lineup';

// ─── Porta injetada ───────────────────────────────────────────────────────────

/**
 * Resolve os atributos e traits de um userCardId.
 * Implementado pela camada de aplicação usando `packages/cards`.
 */
export type CardAttributeResolver = (userCardId: string) => {
  attributes: AttributeSet;
  primaryPosition: Position;
  traits: readonly TraitMagnitude[];
} | null;

// ─── buildTeamSnapshot ────────────────────────────────────────────────────────

export type BuildTeamSnapshotInput = Readonly<{
  readonly starters: readonly LineupSlot[];
  readonly bench: readonly LineupSlot[];
  readonly adjacentPairs: readonly { slotIdA: string; slotIdB: string }[];
  readonly tacticalIntensity: TacticalIntensity;
  readonly isHomeTeam: boolean;
  readonly resolver: CardAttributeResolver;
}>;

export type BuildSnapshotError = Readonly<{
  kind: 'CardNotResolved';
  userCardId: string;
  slotId: string;
}>;

export function buildTeamSnapshot(
  input: BuildTeamSnapshotInput,
): { ok: true; snapshot: TeamSnapshot } | { ok: false; error: BuildSnapshotError } {
  const resolveSlot = (slot: LineupSlot): MatchPlayer | BuildSnapshotError => {
    const data = input.resolver(slot.userCardId);
    if (data === null) {
      return { kind: 'CardNotResolved', userCardId: slot.userCardId, slotId: slot.slotId };
    }
    return Object.freeze({
      userCardId: slot.userCardId,
      attributes: data.attributes,
      primaryPosition: data.primaryPosition,
      traits: data.traits,
    });
  };

  const starters: StartingSlot[] = [];
  for (const slot of input.starters) {
    const player = resolveSlot(slot);
    if ('kind' in player) return { ok: false, error: player };
    starters.push(
      Object.freeze({
        slotId: slot.slotId,
        formationPosition: slot.formationPosition,
        player,
      }),
    );
  }

  const bench: MatchPlayer[] = [];
  for (const slot of input.bench) {
    const player = resolveSlot(slot);
    if ('kind' in player) return { ok: false, error: player };
    bench.push(player);
  }

  const snapshot: TeamSnapshot = Object.freeze({
    starters: Object.freeze(starters),
    bench: Object.freeze(bench),
    adjacentPairs: Object.freeze(input.adjacentPairs),
    tacticalIntensity: input.tacticalIntensity,
    isHomeTeam: input.isHomeTeam,
  });

  return { ok: true, snapshot };
}
