import type { MatchEvent } from '@world-legends/engine';
import { describe, expect, it } from 'vitest';
import {
  countGoals,
  filterCards,
  filterEventsByMinuteRange,
  filterGoals,
  filterInjuries,
  filterRedCards,
  filterSubstitutions,
  filterYellowCards,
  wasWalkover,
} from '../../src/events/match-events';

function fakeGoal(side: 'home' | 'away', minute: number): MatchEvent {
  return Object.freeze({
    type: 'goal' as const,
    minute,
    teamSide: side,
    scorerUserCardId: `scorer-${side}`,
    isOwnGoal: false,
    description: 'gol',
  });
}

function fakeCard(side: 'home' | 'away', cardType: 'yellow' | 'red', minute: number): MatchEvent {
  return Object.freeze({
    type: 'card' as const,
    minute,
    teamSide: side,
    playerUserCardId: `p-${side}`,
    cardType,
    description: 'cartão',
    ...(cardType === 'red' ? { redCardReason: 'direct' as const } : {}),
  });
}

function fakeInjury(side: 'home' | 'away', minute: number): MatchEvent {
  return Object.freeze({
    type: 'injury' as const,
    minute,
    teamSide: side,
    playerUserCardId: `inj-${side}`,
    severity: 'leve' as const,
    recoveryDays: 5,
    isRelapse: false,
    description: 'lesão',
  });
}

const SAMPLE_EVENTS: readonly MatchEvent[] = [
  Object.freeze({ type: 'kickoff' as const, minute: 0 as const, description: 'início' }),
  fakeGoal('home', 23),
  fakeGoal('away', 55),
  fakeGoal('home', 78),
  fakeCard('home', 'yellow', 40),
  fakeCard('away', 'red', 60),
  fakeInjury('away', 72),
  Object.freeze({ type: 'half_time' as const, minute: 46, description: 'intervalo' }),
  Object.freeze({ type: 'full_time' as const, minute: 90, description: 'fim' }),
];

describe('filterGoals / countGoals', () => {
  it('retorna apenas eventos de gol', () => {
    expect(filterGoals(SAMPLE_EVENTS).length).toBe(3);
  });

  it('filtra por time', () => {
    expect(countGoals(SAMPLE_EVENTS, 'home')).toBe(2);
    expect(countGoals(SAMPLE_EVENTS, 'away')).toBe(1);
  });
});

describe('filterCards — amarelos e vermelhos', () => {
  it('filterYellowCards retorna só amarelos', () => {
    const yellows = filterYellowCards(SAMPLE_EVENTS);
    expect(yellows.length).toBe(1);
    expect(yellows[0]?.cardType).toBe('yellow');
  });

  it('filterRedCards retorna só vermelhos', () => {
    expect(filterRedCards(SAMPLE_EVENTS).length).toBe(1);
  });
});

describe('filterInjuries', () => {
  it('retorna apenas lesões', () => {
    expect(filterInjuries(SAMPLE_EVENTS).length).toBe(1);
  });
});

describe('filterEventsByMinuteRange', () => {
  it('filtra eventos dentro do intervalo', () => {
    const first45 = filterEventsByMinuteRange(SAMPLE_EVENTS, 0, 45);
    const minutes = first45
      .filter((e) => 'minute' in e)
      .map((e) => (e as { minute: number }).minute);
    expect(minutes.every((m) => m <= 45)).toBe(true);
  });

  it('intervalo vazio retorna array vazio', () => {
    expect(filterEventsByMinuteRange(SAMPLE_EVENTS, 200, 300).length).toBe(0);
  });
});

describe('wasWalkover', () => {
  it('retorna false quando não há W.O.', () => {
    expect(wasWalkover(SAMPLE_EVENTS)).toBe(false);
  });

  it('retorna true com evento walkover', () => {
    const wo: MatchEvent = Object.freeze({
      type: 'walkover' as const,
      minute: 65,
      affectedTeamSide: 'away' as const,
      remainingPlayers: 6,
      reason: 'insuficiência de elenco' as const,
      description: 'W.O.',
    });
    expect(wasWalkover([...SAMPLE_EVENTS, wo])).toBe(true);
  });
});
