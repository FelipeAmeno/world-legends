import { describe, expect, it } from 'vitest';
import { calculateOverall } from '../../src/overall/overall';
import type { AttributeSet } from '../../src/overall/types';

function attrs(overrides: Partial<AttributeSet>): AttributeSet {
  const base: AttributeSet = {
    pace: 50,
    stamina: 50,
    physical: 50,
    heading: 50,
    finishing: 50,
    shot_power: 50,
    passing: 50,
    vision: 50,
    dribbling: 50,
    penalty_kicks: 50,
    defending: 50,
    composure: 50,
    aggression: 50,
    leadership: 50,
    gk_reflexes: 50,
    gk_positioning: 50,
    gk_handling: 50,
    gk_kicking: 50,
    gk_penalty_save: 50,
  };
  return { ...base, ...overrides };
}

const ALL_POSITIONS = [
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
] as const;

describe('calculateOverall — casos extremos', () => {
  it('com todos os atributos no mínimo (1), o overall é fixado no piso de 40 (clamp), para todas as posições', () => {
    const minimal: AttributeSet = {
      pace: 1,
      stamina: 1,
      physical: 1,
      heading: 1,
      finishing: 1,
      shot_power: 1,
      passing: 1,
      vision: 1,
      dribbling: 1,
      penalty_kicks: 1,
      defending: 1,
      composure: 1,
      aggression: 1,
      leadership: 1,
      gk_reflexes: 1,
      gk_positioning: 1,
      gk_handling: 1,
      gk_kicking: 1,
      gk_penalty_save: 1,
    };
    // soma_ponderada = 1 * (soma dos pesos da posição) = 1 * 1.0 = 1.0
    // clamp(1.0, 40, 99) = 40 — o piso entra em ação para todas as posições.
    for (const position of ALL_POSITIONS) {
      expect(calculateOverall(minimal, position)).toBe(40);
    }
  });

  it('com todos os atributos no máximo (99), o overall é exatamente 99, para todas as posições', () => {
    const maximal: AttributeSet = {
      pace: 99,
      stamina: 99,
      physical: 99,
      heading: 99,
      finishing: 99,
      shot_power: 99,
      passing: 99,
      vision: 99,
      dribbling: 99,
      penalty_kicks: 99,
      defending: 99,
      composure: 99,
      aggression: 99,
      leadership: 99,
      gk_reflexes: 99,
      gk_positioning: 99,
      gk_handling: 99,
      gk_kicking: 99,
      gk_penalty_save: 99,
    };
    // soma_ponderada = 99 * 1.0 = 99 — já dentro do teto, clamp não altera nada.
    for (const position of ALL_POSITIONS) {
      expect(calculateOverall(maximal, position)).toBe(99);
    }
  });

  it('um valor de atributo abaixo de 40 ainda pode resultar em overall acima de 40, se os demais atributos relevantes forem altos', () => {
    // O piso de 40 só age sobre a MÉDIA PONDERADA final, não sobre
    // atributos individuais — um único atributo baixo não "trava" o
    // resultado se os outros, com peso maior, forem altos.
    const input = attrs({
      finishing: 95,
      shot_power: 95,
      pace: 95,
      dribbling: 95,
      heading: 30,
      physical: 95,
    });
    const overall = calculateOverall(input, 'ST');
    expect(overall).toBeGreaterThan(40);
  });

  it('o piso de 40 nunca é violado, mesmo em combinações assimétricas de atributos baixos', () => {
    const input = attrs({
      defending: 5,
      physical: 5,
      heading: 5,
      passing: 5,
      pace: 5,
      composure: 5,
    });
    expect(calculateOverall(input, 'CB')).toBeGreaterThanOrEqual(40);
  });

  it('o teto de 99 nunca é ultrapassado, mesmo que a soma ponderada matematicamente chegasse a esse limite', () => {
    const input = attrs({
      gk_reflexes: 99,
      gk_positioning: 99,
      gk_handling: 99,
      gk_kicking: 99,
      composure: 99,
    });
    const overall = calculateOverall(input, 'GK');
    expect(overall).toBe(99);
    expect(overall <= 99).toBe(true);
  });

  it('todas as 15 posições produzem um overall dentro de [40, 99] para um conjunto de atributos heterogêneo', () => {
    const input = attrs({
      pace: 33,
      defending: 91,
      physical: 12,
      heading: 77,
      finishing: 5,
      shot_power: 88,
      passing: 64,
      vision: 19,
      dribbling: 99,
      composure: 1,
      gk_reflexes: 50,
    });
    for (const position of ALL_POSITIONS) {
      const overall = calculateOverall(input, position);
      expect(overall).toBeGreaterThanOrEqual(40);
      expect(overall <= 99).toBe(true);
      expect(Number.isInteger(overall)).toBe(true);
    }
  });
});
