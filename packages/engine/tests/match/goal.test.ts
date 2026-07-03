import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { calculateGoalProbability, selectAssister, selectShooter } from '../../src/match/goal';
import type { StartingSlot } from '../../src/match/types';
import { RNG } from '../../src/rng/rng';
import { makeAttributes, makePlayer } from './fixtures';

function seed(value: string) {
  const result = createSeed(value);
  if (!result.ok) throw new Error('seed inválido no teste');
  return result.value;
}

describe('calculateGoalProbability (doc 09 §17) — TC-ME-02', () => {
  it('nunca sai do intervalo documentado [0.03, 0.55], mesmo em extremos de atributo (0 ou 99)', () => {
    const piorCenario = calculateGoalProbability({
      shooterAttributes: makeAttributes({ finishing: 1, shot_power: 1, dribbling: 1 }),
      goalkeeperGkReflexes: 99,
      defendingSectorStrength: 99,
      attackingSectorStrength: 1,
      weather: 'ensolarado',
    });
    expect(piorCenario).toBeGreaterThanOrEqual(0.03);

    const melhorCenario = calculateGoalProbability({
      shooterAttributes: makeAttributes({ finishing: 99, shot_power: 99, dribbling: 99 }),
      goalkeeperGkReflexes: 1,
      defendingSectorStrength: 1,
      attackingSectorStrength: 99,
      weather: 'ensolarado',
    });
    expect(melhorCenario).toBeLessThanOrEqual(0.55);
  });

  it('bate com a fórmula exata do doc 09 §17 num caso conhecido (clima neutro, sem Matador)', () => {
    const finishingQuality = (70 * 0.5 + 60 * 0.2 + 50 * 0.15 + 65 * 0.15) / 99;
    const defensiveQuality = (55 * 0.6 + 45 * 0.4) / 99;
    const expected = Math.min(
      0.55,
      Math.max(0.03, finishingQuality * (1 - defensiveQuality * 0.7)),
    );

    const actual = calculateGoalProbability({
      shooterAttributes: makeAttributes({ finishing: 70, shot_power: 60, dribbling: 50 }),
      goalkeeperGkReflexes: 45,
      defendingSectorStrength: 55,
      attackingSectorStrength: 65,
      weather: 'ensolarado',
    });
    expect(Math.abs(actual - expected)).toBeLessThan(0.0001);
  });

  it('bônus do trait Matador aumenta o xG final', () => {
    const semMatador = calculateGoalProbability({
      shooterAttributes: makeAttributes({ finishing: 70 }),
      goalkeeperGkReflexes: 50,
      defendingSectorStrength: 50,
      attackingSectorStrength: 50,
      weather: 'ensolarado',
    });
    const comMatador = calculateGoalProbability({
      shooterAttributes: makeAttributes({ finishing: 70 }),
      goalkeeperGkReflexes: 50,
      defendingSectorStrength: 50,
      attackingSectorStrength: 50,
      weather: 'ensolarado',
      matadorBonusPercent: 12,
    });
    expect(comMatador).toBeGreaterThan(semMatador);
  });

  it('chuva reduz o xG em relação ao mesmo cenário sob sol (eixo "precisão", -8%)', () => {
    const base = {
      shooterAttributes: makeAttributes({ finishing: 70 }),
      goalkeeperGkReflexes: 50,
      defendingSectorStrength: 50,
      attackingSectorStrength: 50,
    };
    const sol = calculateGoalProbability({ ...base, weather: 'ensolarado' });
    const chuva = calculateGoalProbability({ ...base, weather: 'chuva' });
    expect(chuva).toBeLessThan(sol);
  });
});

describe('selectShooter/selectAssister', () => {
  function buildStarters(): StartingSlot[] {
    return [
      { slotId: 's0', formationPosition: 'GK', player: makePlayer({ primaryPosition: 'GK' }) },
      {
        slotId: 's1',
        formationPosition: 'ST',
        player: makePlayer({ primaryPosition: 'ST', attributes: { finishing: 99 } }),
      },
      {
        slotId: 's2',
        formationPosition: 'CB',
        player: makePlayer({ primaryPosition: 'CB', attributes: { finishing: 1 } }),
      },
    ];
  }

  it('selectShooter nunca escolhe o goleiro', () => {
    const starters = buildStarters();
    for (let i = 0; i < 50; i += 1) {
      const shooter = selectShooter(starters, RNG(seed(`shooter-${i}`)));
      expect(shooter.formationPosition).not.toBe('GK');
    }
  });

  it('selectShooter favorece fortemente quem tem maior finishing', () => {
    const starters = buildStarters();
    let stCount = 0;
    const trials = 200;
    for (let i = 0; i < trials; i += 1) {
      const shooter = selectShooter(starters, RNG(seed(`shooter-peso-${i}`)));
      if (shooter.formationPosition === 'ST') stCount += 1;
    }
    expect(stCount / trials).toBeGreaterThan(0.8);
  });

  it('selectAssister nunca escolhe o próprio autor do gol', () => {
    const starters = buildStarters();
    const scorer = starters[1]!.player;
    for (let i = 0; i < 50; i += 1) {
      const assister = selectAssister(starters, scorer.userCardId, RNG(seed(`assist-${i}`)));
      if (assister !== null) {
        expect(assister.userCardId).not.toBe(scorer.userCardId);
      }
    }
  });
});
