import type { MatchEvent } from '@world-legends/engine';
import { describe, expect, it } from 'vitest';
import { buildScoreboard, buildTimeline, replayUpToMinute } from '../../src/timeline/timeline';

function goal(side: 'home' | 'away', minute: number): MatchEvent {
  return Object.freeze({
    type: 'goal' as const,
    minute,
    teamSide: side,
    scorerUserCardId: `s-${side}-${minute}`,
    isOwnGoal: false,
    description: 'gol',
  });
}

const EVENTS: readonly MatchEvent[] = [
  Object.freeze({ type: 'kickoff' as const, minute: 0 as const, description: 'início' }),
  goal('home', 15),
  goal('away', 38),
  Object.freeze({ type: 'half_time' as const, minute: 46, description: 'intervalo' }),
  goal('home', 67),
  goal('home', 89),
  Object.freeze({ type: 'full_time' as const, minute: 90, description: 'fim' }),
];

describe('buildTimeline — estrutura por fase', () => {
  it('produz apenas as fases com eventos', () => {
    const t = buildTimeline(EVENTS);
    const phaseNames = t.phases.map((p) => p.phase);
    expect(phaseNames).toContain('1T');
    expect(phaseNames).toContain('2T');
    expect(phaseNames).not.toContain('ET1');
    expect(phaseNames).not.toContain('ET2');
    expect(phaseNames).not.toContain('Penalties');
  });

  it('total reflete o número de eventos', () => {
    expect(buildTimeline(EVENTS).total).toBe(EVENTS.length);
  });

  it('resultado é imutável', () => {
    const t = buildTimeline(EVENTS);
    expect(Object.isFrozen(t)).toBe(true);
    expect(Object.isFrozen(t.phases)).toBe(true);
  });

  it('com eventos de prorrogação, gera fases ET1/ET2', () => {
    const withET: readonly MatchEvent[] = [...EVENTS, goal('away', 95), goal('home', 110)];
    const t = buildTimeline(withET);
    const names = t.phases.map((p) => p.phase);
    expect(names).toContain('ET1');
    expect(names).toContain('ET2');
  });

  it('com pênalti, gera fase Penalties', () => {
    const withPenalty: readonly MatchEvent[] = [
      ...EVENTS,
      Object.freeze({
        type: 'penalty' as const,
        minute: 95,
        teamSide: 'home' as const,
        takerUserCardId: 'pk-1',
        goalkeeperUserCardId: 'gk-a',
        outcome: 'scored' as const,
        context: 'shootout' as const,
        shootoutRound: 1,
        description: 'pênalti',
      }),
    ];
    const t = buildTimeline(withPenalty);
    expect(t.phases.map((p) => p.phase)).toContain('Penalties');
  });
});

describe('replayUpToMinute — replay progressivo (doc 09 §22)', () => {
  it('até minuto 0 retorna eventos do minuto 0', () => {
    const replay = replayUpToMinute(EVENTS, 0);
    expect(replay.some((e) => e.type === 'kickoff')).toBe(true);
  });

  it('até minuto 45 exclui eventos do 2T', () => {
    const replay = replayUpToMinute(EVENTS, 45);
    const minutes = replay.filter((e) => 'minute' in e).map((e) => (e as any).minute as number);
    expect(minutes.every((m) => m <= 45)).toBe(true);
    expect(minutes).not.toContain(67);
  });

  it('até minuto 90 inclui todos os eventos', () => {
    expect(replayUpToMinute(EVENTS, 90).length).toBe(EVENTS.length);
  });

  it('minuto negativo retorna apenas eventos sem minuto', () => {
    const replay = replayUpToMinute(EVENTS, -1);
    // Todos os eventos têm minuto → nenhum retornado com minuto < -1
    expect(replay.length).toBe(0);
  });
});

describe('buildScoreboard — placar minuto a minuto', () => {
  it('começa em 0-0', () => {
    const scores = buildScoreboard(EVENTS);
    // O scoreboard só tem entradas quando há gol
    // Antes do primeiro gol o placar implícito é 0-0
    expect(scores.length).toBe(4); // 4 gols em EVENTS
  });

  it('primeiro gol: home 1-0 no minuto 15', () => {
    const scores = buildScoreboard(EVENTS);
    expect(scores[0]?.minute).toBe(15);
    expect(scores[0]?.homeScore).toBe(1);
    expect(scores[0]?.awayScore).toBe(0);
  });

  it('segundo gol: empata em 1-1 no minuto 38', () => {
    const scores = buildScoreboard(EVENTS);
    expect(scores[1]?.homeScore).toBe(1);
    expect(scores[1]?.awayScore).toBe(1);
  });

  it('placar final reflete todos os gols', () => {
    const scores = buildScoreboard(EVENTS);
    const last = scores[scores.length - 1];
    expect(last?.homeScore).toBe(3);
    expect(last?.awayScore).toBe(1);
  });

  it('sem gols retorna scoreboard vazio', () => {
    const eventsNoGoals = EVENTS.filter((e) => e.type !== 'goal');
    expect(buildScoreboard(eventsNoGoals).length).toBe(0);
  });
});
