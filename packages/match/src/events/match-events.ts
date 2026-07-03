/**
 * Helpers de eventos — filtros tipados sobre a `MatchEvent[]` do engine.
 *
 * O engine (T010) já produz todos os eventos. Este módulo não adiciona
 * lógica de simulação — oferece funções de filtragem/enriquecimento para
 * consumo pela UI ou por outros packages.
 *
 * Cada função é pura: `(events: readonly MatchEvent[]) → subset tipado`.
 */
import type {
  AssistEvent,
  CardEvent,
  GoalEvent,
  InjuryEvent,
  MatchEvent,
  PenaltyEvent,
  SubstitutionEvent,
  WalkoverEvent,
} from '@world-legends/engine';

// ─── Filtragem de gols ────────────────────────────────────────────────────────

export function filterGoals(events: readonly MatchEvent[]): readonly GoalEvent[] {
  return events.filter((e): e is GoalEvent => e.type === 'goal');
}

export function filterGoalsByTeam(
  events: readonly MatchEvent[],
  teamSide: 'home' | 'away',
): readonly GoalEvent[] {
  return filterGoals(events).filter((e) => e.teamSide === teamSide);
}

export function countGoals(events: readonly MatchEvent[], teamSide: 'home' | 'away'): number {
  return filterGoalsByTeam(events, teamSide).length;
}

export function filterAssists(events: readonly MatchEvent[]): readonly AssistEvent[] {
  return events.filter((e): e is AssistEvent => e.type === 'assist');
}

// ─── Filtragem de cartões ─────────────────────────────────────────────────────

export function filterCards(events: readonly MatchEvent[]): readonly CardEvent[] {
  return events.filter((e): e is CardEvent => e.type === 'card');
}

export function filterYellowCards(events: readonly MatchEvent[]): readonly CardEvent[] {
  return filterCards(events).filter((e) => e.cardType === 'yellow');
}

export function filterRedCards(events: readonly MatchEvent[]): readonly CardEvent[] {
  return filterCards(events).filter((e) => e.cardType === 'red');
}

export function filterCardsByTeam(
  events: readonly MatchEvent[],
  teamSide: 'home' | 'away',
): readonly CardEvent[] {
  return filterCards(events).filter((e) => e.teamSide === teamSide);
}

// ─── Filtragem de lesões ──────────────────────────────────────────────────────

export function filterInjuries(events: readonly MatchEvent[]): readonly InjuryEvent[] {
  return events.filter((e): e is InjuryEvent => e.type === 'injury');
}

export function filterInjuriesByTeam(
  events: readonly MatchEvent[],
  teamSide: 'home' | 'away',
): readonly InjuryEvent[] {
  return filterInjuries(events).filter((e) => e.teamSide === teamSide);
}

// ─── Filtragem de substituições ───────────────────────────────────────────────

export function filterSubstitutions(events: readonly MatchEvent[]): readonly SubstitutionEvent[] {
  return events.filter((e): e is SubstitutionEvent => e.type === 'substitution');
}

// ─── W.O. ─────────────────────────────────────────────────────────────────────

export function filterWalkovers(events: readonly MatchEvent[]): readonly WalkoverEvent[] {
  return events.filter((e): e is WalkoverEvent => e.type === 'walkover');
}

export function wasWalkover(events: readonly MatchEvent[]): boolean {
  return filterWalkovers(events).length > 0;
}

// ─── Pênaltis ─────────────────────────────────────────────────────────────────

export function filterPenalties(events: readonly MatchEvent[]): readonly PenaltyEvent[] {
  return events.filter((e): e is PenaltyEvent => e.type === 'penalty');
}

// ─── Eventos por minuto ───────────────────────────────────────────────────────

export function filterEventsByMinuteRange(
  events: readonly MatchEvent[],
  from: number,
  to: number,
): readonly MatchEvent[] {
  return events.filter((e) => 'minute' in e && e.minute >= from && e.minute <= to);
}

export function filterFirstHalf(events: readonly MatchEvent[]): readonly MatchEvent[] {
  return filterEventsByMinuteRange(events, 0, 45);
}

export function filterSecondHalf(events: readonly MatchEvent[]): readonly MatchEvent[] {
  return filterEventsByMinuteRange(events, 46, 90);
}

export function filterExtraTime(events: readonly MatchEvent[]): readonly MatchEvent[] {
  return filterEventsByMinuteRange(events, 91, 120);
}
