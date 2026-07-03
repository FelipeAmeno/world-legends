/**
 * `match-result.ts` — MatchResult enriquecido com contexto de aplicação.
 *
 * O engine produz um `MatchResult` puro (sem profileIds, sem timestamps
 * de aplicação, sem identificação de quem eram os jogadores). Este módulo
 * adiciona essa camada sem tocar na lógica de simulação.
 *
 * `MatchSummary` é o que a UI consome; `MatchResult` de engine é o que
 * a replay e a auditoria consomem.
 */
import type { MatchEvent, MatchResult } from '@world-legends/engine';
import {
  countGoals,
  filterGoals,
  filterInjuries,
  filterRedCards,
  filterSubstitutions,
  filterYellowCards,
  wasWalkover,
} from '../events/match-events';

// ─── MatchSummary — resultado enriquecido ─────────────────────────────────────

export type MatchParticipant = Readonly<{
  readonly profileId: string;
  readonly teamSide: 'home' | 'away';
  readonly goals: number;
  readonly yellowCards: number;
  readonly redCards: number;
  readonly injuries: number;
  readonly substitutions: number;
}>;

export type MatchOutcomeLabel =
  | 'home_win'
  | 'away_win'
  | 'draw'
  | 'home_win_penalties'
  | 'away_win_penalties'
  | 'home_walkover'
  | 'away_walkover';

export type MatchSummary = Readonly<{
  /** ID único desta instância de partida (gerado pelo chamador). */
  readonly matchId: string;
  readonly homeProfileId: string;
  readonly awayProfileId: string;
  readonly outcome: MatchOutcomeLabel;
  readonly homeScore: number;
  readonly awayScore: number;
  /** Presente se foi a pênaltis. */
  readonly penaltyScore?: Readonly<{ home: number; away: number }>;
  /** true se o desempate foi pelo seed (DD-02, doc 09 §20.1). */
  readonly resolvedBySeedTiebreak: boolean;
  readonly participants: readonly [MatchParticipant, MatchParticipant];
  readonly seed: string;
  readonly engineVersion: string;
  readonly simulatedAt: Date;
  /** MatchResult bruto do engine — preservado para replay e auditoria. */
  readonly engineResult: MatchResult;
}>;

// ─── buildMatchSummary ────────────────────────────────────────────────────────

export function buildMatchSummary(input: {
  matchId: string;
  homeProfileId: string;
  awayProfileId: string;
  engineResult: MatchResult;
}): MatchSummary {
  const { engineResult: r } = input;
  const events: readonly MatchEvent[] = r.events;

  // Determinar outcome
  let outcome: MatchOutcomeLabel;
  if (r.walkover !== undefined) {
    outcome = r.walkover.affectedTeamSide === 'home' ? 'home_walkover' : 'away_walkover';
  } else if (r.penaltyShootout !== undefined) {
    outcome =
      r.penaltyShootout.homeScore > r.penaltyShootout.awayScore
        ? 'home_win_penalties'
        : 'away_win_penalties';
  } else if (r.homeScore > r.awayScore) {
    outcome = 'home_win';
  } else if (r.awayScore > r.homeScore) {
    outcome = 'away_win';
  } else {
    outcome = 'draw';
  }

  const makeParticipant = (side: 'home' | 'away'): MatchParticipant =>
    Object.freeze({
      profileId: side === 'home' ? input.homeProfileId : input.awayProfileId,
      teamSide: side,
      goals: countGoals(events, side),
      yellowCards: filterYellowCards(events).filter((e) => e.teamSide === side).length,
      redCards: filterRedCards(events).filter((e) => e.teamSide === side).length,
      injuries: filterInjuries(events).filter((e) => e.teamSide === side).length,
      substitutions: filterSubstitutions(events).filter((e) => e.teamSide === side).length,
    });

  const participants: readonly [MatchParticipant, MatchParticipant] = [
    makeParticipant('home'),
    makeParticipant('away'),
  ] as const;

  return Object.freeze({
    matchId: input.matchId,
    homeProfileId: input.homeProfileId,
    awayProfileId: input.awayProfileId,
    outcome,
    homeScore: r.homeScore,
    awayScore: r.awayScore,
    ...(r.penaltyShootout !== undefined
      ? {
          penaltyScore: Object.freeze({
            home: r.penaltyShootout.homeScore,
            away: r.penaltyShootout.awayScore,
          }),
        }
      : {}),
    resolvedBySeedTiebreak: r.penaltyShootout?.resolvedBySeedTiebreak ?? false,
    participants,
    seed: r.seed.value,
    engineVersion: r.engineVersion,
    simulatedAt: new Date(),
    engineResult: r,
  });
}
