import type { TacticalIntensity } from '@world-legends/engine';
import { simulateMatch as engineSimulateMatch } from '@world-legends/engine';
/**
 * `simulate-match.ts` — orquestrador completo de uma partida.
 *
 * Fluxo (doc 18 §18.2, adaptado para packages/match):
 *   1. Validar escalações (validateLineup)
 *   2. Construir TeamSnapshots (buildTeamSnapshot — resolve atributos via porta)
 *   3. Chamar engine.simulateMatch (determinístico, seed, doc 09 §25)
 *   4. Construir MatchSummary (buildMatchSummary)
 *   5. Publicar MatchSimulatedEvent (doc 18 §18.2)
 *   6. Retornar { summary, engineResult }
 *
 * Tudo puro: sem I/O, sem banco, sem relógio (simulatedAt vem de Date() — único
 * ponto "impuro", necessário para o contexto de aplicação).
 */
import {
  Err,
  type EventPublisher,
  Ok,
  type Result,
  type ValidationError,
  createDomainEvent,
  createSeed,
} from '@world-legends/shared';
import {
  type CardAttributeResolver,
  type LineupInput,
  buildTeamSnapshot,
  validateLineup,
} from '../lineups';
import { type MatchSummary, buildMatchSummary } from '../result/match-result';

// ─── Input ────────────────────────────────────────────────────────────────────

export type SimulateMatchInput = Readonly<{
  readonly matchId: string;
  readonly homeProfileId: string;
  readonly awayProfileId: string;
  readonly homeLineup: LineupInput & {
    adjacentPairs: readonly { slotIdA: string; slotIdB: string }[];
    tacticalIntensity: TacticalIntensity;
  };
  readonly awayLineup: LineupInput & {
    adjacentPairs: readonly { slotIdA: string; slotIdB: string }[];
    tacticalIntensity: TacticalIntensity;
  };
  readonly seed: string;
  readonly requiresWinner: boolean;
  readonly isNeutralVenue?: boolean;
  readonly cardResolver: CardAttributeResolver;
  readonly publisher: EventPublisher;
}>;

export type SimulateMatchError =
  | ValidationError
  | Readonly<{ kind: 'HomeLineupInvalid'; message: string; field: string }>
  | Readonly<{ kind: 'AwayLineupInvalid'; message: string; field: string }>
  | Readonly<{ kind: 'CardNotResolved'; userCardId: string; slotId: string }>
  | Readonly<{ kind: 'InvalidSeed'; seed: string }>;

// ─── Evento de domínio ────────────────────────────────────────────────────────

export type MatchSimulatedEvent = ReturnType<typeof createMatchSimulatedEvent>;

function createMatchSimulatedEvent(payload: {
  matchId: string;
  homeProfileId: string;
  awayProfileId: string;
  homeScore: number;
  awayScore: number;
  outcome: string;
  seed: string;
}) {
  return createDomainEvent('match_simulated', payload);
}

// ─── simulateMatch ────────────────────────────────────────────────────────────

export function simulateMatch(input: SimulateMatchInput): Result<MatchSummary, SimulateMatchError> {
  // 1. Validar escalações
  const homeLineupResult = validateLineup(input.homeLineup);
  if (!homeLineupResult.ok) {
    return Err(
      Object.freeze({
        kind: 'HomeLineupInvalid' as const,
        message: homeLineupResult.error.message,
        field: homeLineupResult.error.field ?? 'starters',
      }),
    );
  }

  const awayLineupResult = validateLineup(input.awayLineup);
  if (!awayLineupResult.ok) {
    return Err(
      Object.freeze({
        kind: 'AwayLineupInvalid' as const,
        message: awayLineupResult.error.message,
        field: awayLineupResult.error.field ?? 'starters',
      }),
    );
  }

  // 2. Construir TeamSnapshots
  const homeSnapshot = buildTeamSnapshot({
    starters: input.homeLineup.starters,
    bench: input.homeLineup.bench,
    adjacentPairs: input.homeLineup.adjacentPairs,
    tacticalIntensity: input.homeLineup.tacticalIntensity,
    isHomeTeam: true,
    resolver: input.cardResolver,
  });
  if (!homeSnapshot.ok) return Err(homeSnapshot.error);

  const awaySnapshot = buildTeamSnapshot({
    starters: input.awayLineup.starters,
    bench: input.awayLineup.bench,
    adjacentPairs: input.awayLineup.adjacentPairs,
    tacticalIntensity: input.awayLineup.tacticalIntensity,
    isHomeTeam: false,
    resolver: input.cardResolver,
  });
  if (!awaySnapshot.ok) return Err(awaySnapshot.error);

  // 3. Criar seed determinístico
  const seedResult = createSeed(input.seed);
  if (!seedResult.ok) {
    return Err(Object.freeze({ kind: 'InvalidSeed' as const, seed: input.seed }));
  }

  // 4. Chamar o engine (doc 09 §25)
  const engineResult = engineSimulateMatch({
    home: homeSnapshot.snapshot,
    away: awaySnapshot.snapshot,
    context: {
      requiresWinner: input.requiresWinner,
      ...(input.isNeutralVenue !== undefined ? { isNeutralVenue: input.isNeutralVenue } : {}),
    },
    seed: seedResult.value,
  });

  // 5. Construir MatchSummary
  const summary = buildMatchSummary({
    matchId: input.matchId,
    homeProfileId: input.homeProfileId,
    awayProfileId: input.awayProfileId,
    engineResult,
  });

  // 6. Publicar evento de domínio
  input.publisher(
    createMatchSimulatedEvent({
      matchId: input.matchId,
      homeProfileId: input.homeProfileId,
      awayProfileId: input.awayProfileId,
      homeScore: summary.homeScore,
      awayScore: summary.awayScore,
      outcome: summary.outcome,
      seed: input.seed,
    }),
  );

  return Ok(summary);
}
