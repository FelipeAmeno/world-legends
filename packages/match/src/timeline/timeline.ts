/**
 * `timeline.ts` — acesso estruturado à timeline de eventos do engine.
 *
 * A timeline do engine é uma `readonly MatchEvent[]` ordenada por minuto.
 * Este módulo oferece formas de consumir essa timeline:
 *
 * 1. `buildTimeline`   — agrupa por fase (1T / 2T / Prorrogação / Pênaltis).
 * 2. `replayUpToMinute`— retorna os eventos até um determinado minuto
 *                        (útil para replay progressivo na UI, doc 09 §22).
 * 3. `buildScoreboard` — placar minuto a minuto.
 */
import type { MatchEvent } from '@world-legends/engine';
import { filterEventsByMinuteRange } from '../events/match-events';

// ─── Fases da partida ─────────────────────────────────────────────────────────

export type MatchPhase = '1T' | '2T' | 'ET1' | 'ET2' | 'Penalties';

export type TimelinePhase = Readonly<{
  readonly phase: MatchPhase;
  readonly events: readonly MatchEvent[];
}>;

export type StructuredTimeline = Readonly<{
  readonly phases: readonly TimelinePhase[];
  readonly total: number;
}>;

/**
 * Agrupa a timeline por fase de jogo.
 * Usa os minutos para inferir a fase (doc 09 §16/§19).
 */
export function buildTimeline(events: readonly MatchEvent[]): StructuredTimeline {
  const allPhases: TimelinePhase[] = [
    Object.freeze<TimelinePhase>({ phase: '1T', events: filterEventsByMinuteRange(events, 0, 45) }),
    Object.freeze<TimelinePhase>({
      phase: '2T',
      events: filterEventsByMinuteRange(events, 46, 90),
    }),
    Object.freeze<TimelinePhase>({
      phase: 'ET1',
      events: filterEventsByMinuteRange(events, 91, 105),
    }),
    Object.freeze<TimelinePhase>({
      phase: 'ET2',
      events: filterEventsByMinuteRange(events, 106, 120),
    }),
    Object.freeze<TimelinePhase>({
      phase: 'Penalties',
      events: events.filter((e) => e.type === 'penalty'),
    }),
  ];
  const phases = allPhases.filter((p) => p.events.length > 0);

  return Object.freeze({
    phases: Object.freeze(phases.map((p) => Object.freeze(p))),
    total: events.length,
  });
}

// ─── Replay progressivo (doc 09 §22) ─────────────────────────────────────────

/**
 * Retorna os eventos da timeline até (inclusive) o minuto dado.
 * Permite que a UI reconstrua o estado de jogo minuto a minuto.
 * Idêntico ao replay descrito em doc 09 §22: "o replay é a própria lista de MatchEvent".
 */
export function replayUpToMinute(
  events: readonly MatchEvent[],
  upToMinute: number,
): readonly MatchEvent[] {
  return events.filter((e) => {
    if ('minute' in e) return e.minute <= upToMinute;
    // eventos sem minuto (improvável mas seguro): incluir sempre
    return true;
  });
}

// ─── Placar minuto a minuto ────────────────────────────────────────────────────

export type ScoreboardEntry = Readonly<{
  readonly minute: number;
  readonly homeScore: number;
  readonly awayScore: number;
  readonly eventType: string;
  readonly teamSide?: 'home' | 'away';
}>;

/**
 * Constrói o histórico de placar da partida — cada gol gera uma nova linha.
 * Útil para a animação de resultado na UI.
 */
export function buildScoreboard(events: readonly MatchEvent[]): readonly ScoreboardEntry[] {
  const entries: ScoreboardEntry[] = [];
  let homeScore = 0;
  let awayScore = 0;

  for (const event of events) {
    if (event.type === 'goal') {
      if (event.teamSide === 'home') homeScore += 1;
      else awayScore += 1;
      entries.push(
        Object.freeze({
          minute: event.minute,
          homeScore,
          awayScore,
          eventType: 'goal',
          teamSide: event.teamSide,
        }),
      );
    }
  }

  return Object.freeze(entries);
}
