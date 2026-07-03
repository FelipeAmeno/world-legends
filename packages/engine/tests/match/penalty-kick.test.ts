import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { calculatePenaltyKickQuality, resolvePenaltyKick } from '../../src/match/penalty-kick';
import { RNG } from '../../src/rng/rng';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

describe('resolvePenaltyKick (doc 09 §18) — TC-ME-12 (Monte Carlo, 10k cobranças)', () => {
  it('taxa de conversão agregada com cobradores/goleiros de overall médio (60) cai entre 70%-85%', () => {
    let scored = 0;
    const trials = 10_000;
    for (let i = 0; i < trials; i += 1) {
      const outcome = resolvePenaltyKick({
        takerPenaltyKicks: 60,
        takerComposure: 60,
        goalkeeperGkPenaltySave: 60,
        goalkeeperGkReflexes: 60,
        rng: RNG(seed(`penalti-${i}`)),
      });
      if (outcome === 'scored') scored += 1;
    }
    const rate = scored / trials;
    expect(rate).toBeGreaterThan(0.7);
    expect(rate).toBeLessThan(0.85);
  });

  it('a chance de conversão nunca sai de [0.45, 0.93] mesmo em extremos de atributo', () => {
    let scoredPior = 0;
    let scoredMelhor = 0;
    const trials = 5000;
    for (let i = 0; i < trials; i += 1) {
      if (
        resolvePenaltyKick({
          takerPenaltyKicks: 1,
          takerComposure: 1,
          goalkeeperGkPenaltySave: 99,
          goalkeeperGkReflexes: 99,
          rng: RNG(seed(`pior-${i}`)),
        }) === 'scored'
      ) {
        scoredPior += 1;
      }
      if (
        resolvePenaltyKick({
          takerPenaltyKicks: 99,
          takerComposure: 99,
          goalkeeperGkPenaltySave: 1,
          goalkeeperGkReflexes: 1,
          rng: RNG(seed(`melhor-${i}`)),
        }) === 'scored'
      ) {
        scoredMelhor += 1;
      }
    }
    expect(scoredPior / trials).toBeGreaterThanOrEqual(0.45 - 0.04);
    expect(scoredMelhor / trials).toBeLessThanOrEqual(0.93 + 0.04);
  });
});

describe('resolvePenaltyKick — trait Gelo nas Veias (doc 11 §7) — TC-ME-13', () => {
  function taxaDeConversao(bonusPercent: number | undefined, trials = 8000): number {
    let scored = 0;
    for (let i = 0; i < trials; i += 1) {
      const outcome = resolvePenaltyKick({
        takerPenaltyKicks: 60,
        takerComposure: 60,
        goalkeeperGkPenaltySave: 60,
        goalkeeperGkReflexes: 60,
        rng: RNG(seed(`gelo-${bonusPercent ?? 'sem'}-${i}`)),
        ...(bonusPercent !== undefined ? { geloNasVeiasBonusPercent: bonusPercent } : {}),
      });
      if (outcome === 'scored') scored += 1;
    }
    return scored / trials;
  }

  it('aumenta a conversão, mas nunca em mais que +10pp (teto do trait)', () => {
    const sem = taxaDeConversao(undefined);
    const com = taxaDeConversao(10);
    expect(com).toBeGreaterThan(sem);
    expect(com - sem).toBeLessThanOrEqual(0.1 + 0.04); // +0.04 de folga estatística da amostra
  });
});

describe('calculatePenaltyKickQuality', () => {
  it('é estritamente crescente em penalty_kicks e composure', () => {
    expect(calculatePenaltyKickQuality(80, 50)).toBeGreaterThan(
      calculatePenaltyKickQuality(50, 50),
    );
    expect(calculatePenaltyKickQuality(50, 80)).toBeGreaterThan(
      calculatePenaltyKickQuality(50, 50),
    );
  });
});
