import type { MatchResult } from '@world-legends/engine';
import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { buildMatchSummary } from '../../src/result/match-result';

function fakeSeed() {
  const r = createSeed('test-seed');
  if (!r.ok) throw new Error('seed inválido');
  return r.value;
}

function makeEngineResult(overrides: Partial<MatchResult> = {}): MatchResult {
  return Object.freeze({
    homeScore: 2,
    awayScore: 1,
    events: Object.freeze([]),
    resolvedBySeedTiebreak: false,
    seed: fakeSeed(),
    engineVersion: '1.0.0-t010',
    ...overrides,
  }) as MatchResult;
}

describe('buildMatchSummary — outcomes corretos', () => {
  it('home_win quando homeScore > awayScore', () => {
    const s = buildMatchSummary({
      matchId: 'm1',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult({ homeScore: 2, awayScore: 0 }),
    });
    expect(s.outcome).toBe('home_win');
    expect(s.homeScore).toBe(2);
    expect(s.awayScore).toBe(0);
  });

  it('away_win quando awayScore > homeScore', () => {
    const s = buildMatchSummary({
      matchId: 'm2',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult({ homeScore: 0, awayScore: 3 }),
    });
    expect(s.outcome).toBe('away_win');
  });

  it('draw quando placar empatado sem pênaltis', () => {
    const s = buildMatchSummary({
      matchId: 'm3',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult({ homeScore: 1, awayScore: 1 }),
    });
    expect(s.outcome).toBe('draw');
  });

  it('home_win_penalties quando penaltyShootout.homeScore > awayScore', () => {
    const s = buildMatchSummary({
      matchId: 'm4',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult({
        homeScore: 1,
        awayScore: 1,
        penaltyShootout: Object.freeze({
          homeScore: 5,
          awayScore: 3,
          totalRounds: 5,
          resolvedBySeedTiebreak: false,
        }),
      }),
    });
    expect(s.outcome).toBe('home_win_penalties');
    expect(s.penaltyScore?.home).toBe(5);
    expect(s.penaltyScore?.away).toBe(3);
  });

  it('away_win_penalties quando penaltyShootout.awayScore > homeScore', () => {
    const s = buildMatchSummary({
      matchId: 'm5',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult({
        homeScore: 0,
        awayScore: 0,
        penaltyShootout: Object.freeze({
          homeScore: 2,
          awayScore: 4,
          totalRounds: 5,
          resolvedBySeedTiebreak: false,
        }),
      }),
    });
    expect(s.outcome).toBe('away_win_penalties');
  });

  it('home_walkover quando walkover.affectedTeamSide = home', () => {
    const s = buildMatchSummary({
      matchId: 'm6',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult({
        walkover: Object.freeze({ affectedTeamSide: 'home', minute: 65, remainingPlayers: 5 }),
      }),
    });
    expect(s.outcome).toBe('home_walkover');
  });

  it('away_walkover quando walkover.affectedTeamSide = away', () => {
    const s = buildMatchSummary({
      matchId: 'm7',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult({
        walkover: Object.freeze({ affectedTeamSide: 'away', minute: 65, remainingPlayers: 6 }),
      }),
    });
    expect(s.outcome).toBe('away_walkover');
  });
});

describe('buildMatchSummary — estrutura e imutabilidade', () => {
  it('preserva matchId e profileIds', () => {
    const s = buildMatchSummary({
      matchId: 'match-xyz',
      homeProfileId: 'player-home',
      awayProfileId: 'player-away',
      engineResult: makeEngineResult(),
    });
    expect(s.matchId).toBe('match-xyz');
    expect(s.homeProfileId).toBe('player-home');
    expect(s.awayProfileId).toBe('player-away');
  });

  it('resultado é imutável', () => {
    const s = buildMatchSummary({
      matchId: 'm',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult(),
    });
    expect(Object.isFrozen(s)).toBe(true);
  });

  it('participants tem exatamente 2 entradas', () => {
    const s = buildMatchSummary({
      matchId: 'm',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult(),
    });
    expect(s.participants.length).toBe(2);
    expect(s.participants[0]?.teamSide).toBe('home');
    expect(s.participants[1]?.teamSide).toBe('away');
  });

  it('preserva o engineResult original', () => {
    const engineResult = makeEngineResult({ homeScore: 3, awayScore: 1 });
    const s = buildMatchSummary({
      matchId: 'm',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult,
    });
    expect(s.engineResult).toBe(engineResult);
  });

  it('resolvedBySeedTiebreak = false sem pênaltis', () => {
    const s = buildMatchSummary({
      matchId: 'm',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult(),
    });
    expect(s.resolvedBySeedTiebreak).toBe(false);
  });

  it('propagates resolvedBySeedTiebreak de pênaltis', () => {
    const s = buildMatchSummary({
      matchId: 'm',
      homeProfileId: 'h',
      awayProfileId: 'a',
      engineResult: makeEngineResult({
        homeScore: 1,
        awayScore: 1,
        penaltyShootout: Object.freeze({
          homeScore: 3,
          awayScore: 2,
          totalRounds: 25,
          resolvedBySeedTiebreak: true,
        }),
      }),
    });
    expect(s.resolvedBySeedTiebreak).toBe(true);
  });
});
