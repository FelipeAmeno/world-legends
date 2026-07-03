import { createSeed, unwrapResult } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { calculateOverall } from '../../src/overall/overall';
import type { AttributeKey, AttributeSet, Position } from '../../src/overall/types';
import { RNG } from '../../src/rng/rng';

const ATTRIBUTE_KEYS: readonly AttributeKey[] = [
  'pace',
  'stamina',
  'physical',
  'heading',
  'finishing',
  'shot_power',
  'passing',
  'vision',
  'dribbling',
  'penalty_kicks',
  'defending',
  'composure',
  'aggression',
  'leadership',
  'gk_reflexes',
  'gk_positioning',
  'gk_handling',
  'gk_kicking',
  'gk_penalty_save',
];

const ALL_POSITIONS: readonly Position[] = [
  'GK',
  'CB',
  'LB',
  'RB',
  'LWB',
  'RWB',
  'CDM',
  'CM',
  'CAM',
  'LM',
  'RM',
  'LW',
  'RW',
  'CF',
  'ST',
];

/**
 * `calculateOverall` não tem nenhuma aleatoriedade própria — é uma
 * função pura e determinística (doc 09 §0.1). "Monte Carlo", aqui,
 * significa outra coisa: usamos o RNG da Tarefa T003 (seedado, portanto
 * 100% reproduzível) para amostrar uma grande quantidade de conjuntos de
 * atributos aleatórios e verificar que INVARIANTES estruturais da
 * fórmula (limites, monotonicidade, paridade entre posições-espelho)
 * seguem valendo em todo o espaço de entrada — não só nos casos
 * pontuais já cobertos pelos testes unitários e de regressão.
 */
function randomAttributeSet(rng: ReturnType<typeof RNG>): AttributeSet {
  const entries = ATTRIBUTE_KEYS.map((key) => [key, rng.nextInt(1, 99)] as const);
  return Object.fromEntries(entries) as AttributeSet;
}

describe('calculateOverall — testes Monte Carlo', () => {
  it('para 5000 conjuntos de atributos aleatórios e todas as 15 posições, o overall está sempre em [40, 99]', () => {
    const rng = RNG(unwrapResult(createSeed('monte-carlo-overall-limites')));
    const N = 5000;
    for (let i = 0; i < N; i += 1) {
      const sample = randomAttributeSet(rng);
      for (const position of ALL_POSITIONS) {
        const overall = calculateOverall(sample, position);
        expect(overall).toBeGreaterThanOrEqual(40);
        expect(overall <= 99).toBe(true);
        expect(Number.isInteger(overall)).toBe(true);
      }
    }
  });

  it('aumentar um atributo de peso positivo nunca reduz o overall daquela posição (monotonicidade)', () => {
    const rng = RNG(unwrapResult(createSeed('monte-carlo-overall-monotonicidade')));
    const N = 2000;
    for (let i = 0; i < N; i += 1) {
      const baseline = randomAttributeSet(rng);
      const position = ALL_POSITIONS[rng.nextInt(0, ALL_POSITIONS.length - 1)]!;
      const attributeToRaise = ATTRIBUTE_KEYS[rng.nextInt(0, ATTRIBUTE_KEYS.length - 1)]!;

      const baselineOverall = calculateOverall(baseline, position);
      const currentValue = baseline[attributeToRaise];
      const raisedValue = Math.min(99, currentValue + rng.nextInt(1, 20));
      const raised: AttributeSet = { ...baseline, [attributeToRaise]: raisedValue };
      const raisedOverall = calculateOverall(raised, position);

      // Toda a tabela de pesos (doc 09 §1.3) usa pesos >= 0 — nenhum
      // peso negativo existe na especificação — então aumentar qualquer
      // atributo nunca pode diminuir a média ponderada.
      expect(raisedOverall).toBeGreaterThanOrEqual(baselineOverall);
    }
  });

  it('pares de posições-espelho (LB/RB, LWB/RWB, LM/RM, LW/RW, CF/ST) produzem sempre o mesmo overall', () => {
    const rng = RNG(unwrapResult(createSeed('monte-carlo-overall-espelhos')));
    const mirrorPairs: ReadonlyArray<readonly [Position, Position]> = [
      ['LB', 'RB'],
      ['LWB', 'RWB'],
      ['LM', 'RM'],
      ['LW', 'RW'],
      ['CF', 'ST'],
    ];
    const N = 1000;
    for (let i = 0; i < N; i += 1) {
      const sample = randomAttributeSet(rng);
      for (const [a, b] of mirrorPairs) {
        expect(calculateOverall(sample, a)).toBe(calculateOverall(sample, b));
      }
    }
  });

  it('um conjunto de atributos uniformemente no máximo (99) sempre produz overall 99, em qualquer posição amostrada', () => {
    const rng = RNG(unwrapResult(createSeed('monte-carlo-overall-teto')));
    const maximal: AttributeSet = Object.fromEntries(
      ATTRIBUTE_KEYS.map((key) => [key, 99] as const),
    ) as AttributeSet;
    for (let i = 0; i < 500; i += 1) {
      const position = ALL_POSITIONS[rng.nextInt(0, ALL_POSITIONS.length - 1)]!;
      expect(calculateOverall(maximal, position)).toBe(99);
    }
  });

  it('a função é determinística: a mesma amostra aleatória produz sempre o mesmo overall ao ser recalculada', () => {
    const rng = RNG(unwrapResult(createSeed('monte-carlo-overall-determinismo')));
    const N = 1000;
    for (let i = 0; i < N; i += 1) {
      const sample = randomAttributeSet(rng);
      const position = ALL_POSITIONS[rng.nextInt(0, ALL_POSITIONS.length - 1)]!;
      const first = calculateOverall(sample, position);
      const second = calculateOverall(sample, position);
      const third = calculateOverall(sample, position);
      expect(first).toBe(second);
      expect(second).toBe(third);
    }
  });
});
