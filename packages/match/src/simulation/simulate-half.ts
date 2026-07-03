/**
 * `simulate-half.ts` — acesso aos eventos de um intervalo de minutos.
 *
 * Não simula nada — a simulação completa já foi feita por `simulateMatch`.
 * Este módulo permite que a UI "reproduza" o jogo progressivamente,
 * pedindo os eventos de uma fase de cada vez (doc 09 §22: replay é a lista).
 */
import type { MatchEvent } from '@world-legends/engine';
import { buildTimeline, replayUpToMinute } from '../timeline/timeline';
import type { StructuredTimeline } from '../timeline/timeline';

export type HalfInput = Readonly<{
  readonly events: readonly MatchEvent[];
  readonly upToMinute: number;
}>;

/** Retorna eventos do 1T (minuto 0–45). */
export function getFirstHalfEvents(events: readonly MatchEvent[]): readonly MatchEvent[] {
  return replayUpToMinute(events, 45).filter((e) => !('minute' in e) || e.minute <= 45);
}

/** Retorna eventos do 2T (minuto 46–90). */
export function getSecondHalfEvents(events: readonly MatchEvent[]): readonly MatchEvent[] {
  return events.filter((e) => 'minute' in e && e.minute > 45 && e.minute <= 90);
}

/** Retorna eventos da prorrogação (minuto 91–120). */
export function getExtraTimeEvents(events: readonly MatchEvent[]): readonly MatchEvent[] {
  return events.filter((e) => 'minute' in e && e.minute > 90);
}

/** Retorna eventos de pênaltis (type = 'penalty'). */
export function getPenaltyEvents(events: readonly MatchEvent[]): readonly MatchEvent[] {
  return events.filter((e) => e.type === 'penalty');
}

/** Constrói a timeline estruturada por fase. */
export { buildTimeline };
export type { StructuredTimeline };

/** Replay progressivo: eventos até o minuto dado. */
export { replayUpToMinute };
