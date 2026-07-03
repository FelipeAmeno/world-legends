import { describe, expect, it } from 'vitest';
import { calculateOverall } from '../../src/overall/overall';
import type { AttributeSet } from '../../src/overall/types';

// Conjunto base com TODOS os 19 atributos preenchidos — cada teste só se
// importa com os atributos relevantes à posição testada; o resto fica em
// um valor neutro (50) que não deveria, por si só, influenciar o
// resultado de posições que não os usam.
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

describe('calculateOverall — testes unitários', () => {
  it('com todos os atributos relevantes em 50, o overall é 50 (média ponderada de um valor constante)', () => {
    // Para QUALQUER posição, se todo atributo usado tem o mesmo valor V,
    // a média ponderada é V (pesos somam 1.0) — propriedade da própria
    // definição de média ponderada, independente da tabela de pesos.
    expect(calculateOverall(attrs({}), 'ST')).toBe(50);
    expect(calculateOverall(attrs({}), 'CB')).toBe(50);
    expect(calculateOverall(attrs({}), 'GK')).toBe(50);
    expect(calculateOverall(attrs({}), 'CAM')).toBe(50);
  });

  it('GK usa os atributos de goleiro, ignorando atributos de campo', () => {
    const input = attrs({
      gk_reflexes: 90,
      gk_positioning: 80,
      gk_handling: 70,
      gk_kicking: 60,
      composure: 60,
      // atributos de campo deliberadamente extremos — não devem influenciar o GK
      finishing: 1,
      pace: 1,
    });
    // 90*.35 + 80*.25 + 70*.20 + 60*.10 + 60*.10 = 31.5+20+14+6+6 = 77.5 -> 78
    expect(calculateOverall(input, 'GK')).toBe(78);
  });

  it('ST e CF compartilham a mesma tabela de pesos (doc 09 §1.3 os agrupa)', () => {
    const input = attrs({
      finishing: 88,
      shot_power: 75,
      pace: 80,
      dribbling: 70,
      heading: 65,
      physical: 72,
    });
    const st = calculateOverall(input, 'ST');
    const cf = calculateOverall(input, 'CF');
    expect(st).toBe(cf);
  });

  it('LB e RB compartilham a mesma tabela de pesos', () => {
    const input = attrs({
      pace: 78,
      defending: 82,
      physical: 74,
      passing: 70,
      dribbling: 66,
      heading: 60,
    });
    expect(calculateOverall(input, 'LB')).toBe(calculateOverall(input, 'RB'));
  });

  it('LWB e RWB compartilham a mesma tabela de pesos', () => {
    const input = attrs({
      pace: 80,
      defending: 70,
      dribbling: 75,
      passing: 78,
      physical: 65,
      heading: 55,
    });
    expect(calculateOverall(input, 'LWB')).toBe(calculateOverall(input, 'RWB'));
  });

  it('LM e RM compartilham a mesma tabela de pesos', () => {
    const input = attrs({
      pace: 75,
      dribbling: 78,
      passing: 76,
      finishing: 70,
      defending: 60,
      physical: 65,
    });
    expect(calculateOverall(input, 'LM')).toBe(calculateOverall(input, 'RM'));
  });

  it('LW e RW compartilham a mesma tabela de pesos', () => {
    const input = attrs({ pace: 88, dribbling: 86, finishing: 80, passing: 74, composure: 72 });
    expect(calculateOverall(input, 'LW')).toBe(calculateOverall(input, 'RW'));
  });

  it('aumentar um atributo de peso positivo na posição nunca reduz o overall', () => {
    const baseline = attrs({
      finishing: 70,
      shot_power: 70,
      pace: 70,
      dribbling: 70,
      heading: 70,
      physical: 70,
    });
    const improved = attrs({ ...baseline, finishing: 90 });
    expect(calculateOverall(improved, 'ST')).toBeGreaterThanOrEqual(
      calculateOverall(baseline, 'ST'),
    );
  });

  it('retorna sempre um número inteiro', () => {
    const input = attrs({
      defending: 77,
      physical: 81,
      heading: 63,
      passing: 59,
      pace: 68,
      composure: 71,
    });
    const overall = calculateOverall(input, 'CB');
    expect(Number.isInteger(overall)).toBe(true);
  });
});
