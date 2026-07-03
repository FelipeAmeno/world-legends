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

/**
 * Testes de regressão: ao contrário dos unitários (comportamento) e dos
 * de casos extremos (limites), estes existem para PINAR valores
 * concretos, calculados manualmente a partir da fórmula do doc 09 §2 e
 * da tabela de pesos do doc 09 §1.3 — não derivados rodando o próprio
 * código. Servem de guarda contra uma futura mudança acidental na
 * tabela de pesos ou na fórmula (ex: alguém ajusta um peso pensando em
 * balanceamento e não percebe que está afetando este cálculo).
 *
 * Um caso para cada um dos 10 perfis de pesos distintos do doc 09 §1.3
 * (15 códigos de posição, mas só 10 perfis — os pares marcados com "/"
 * no doc compartilham a mesma tabela).
 */
describe('calculateOverall — testes de regressão', () => {
  it('ST/CF: finishing 95, shot_power 88, pace 90, dribbling 85, heading 80, physical 82 → 89', () => {
    // 95×.30 + 88×.15 + 90×.20 + 85×.10 + 80×.10 + 82×.15
    // = 28.5 + 13.2 + 18.0 + 8.5 + 8.0 + 12.3 = 88.5 → round → 89
    const input = attrs({
      finishing: 95,
      shot_power: 88,
      pace: 90,
      dribbling: 85,
      heading: 80,
      physical: 82,
    });
    expect(calculateOverall(input, 'ST')).toBe(89);
    expect(calculateOverall(input, 'CF')).toBe(89);
  });

  it('CB: defending 85, physical 80, heading 78, passing 65, pace 70, composure 75 → 78', () => {
    // 85×.35 + 80×.20 + 78×.15 + 65×.10 + 70×.10 + 75×.10
    // = 29.75 + 16.0 + 11.7 + 6.5 + 7.0 + 7.5 = 78.45 → round → 78
    const input = attrs({
      defending: 85,
      physical: 80,
      heading: 78,
      passing: 65,
      pace: 70,
      composure: 75,
    });
    expect(calculateOverall(input, 'CB')).toBe(78);
  });

  it('GK: gk_reflexes 90, gk_positioning 85, gk_handling 82, gk_kicking 60, composure 75 → 83', () => {
    // 90×.35 + 85×.25 + 82×.20 + 60×.10 + 75×.10
    // = 31.5 + 21.25 + 16.4 + 6.0 + 7.5 = 82.65 → round → 83
    const input = attrs({
      gk_reflexes: 90,
      gk_positioning: 85,
      gk_handling: 82,
      gk_kicking: 60,
      composure: 75,
    });
    expect(calculateOverall(input, 'GK')).toBe(83);
  });

  it('LB/RB: pace 75, defending 80, physical 70, passing 72, dribbling 65, heading 60 → 72', () => {
    // 75×.20 + 80×.25 + 70×.15 + 72×.15 + 65×.10 + 60×.15
    // = 15.0 + 20.0 + 10.5 + 10.8 + 6.5 + 9.0 = 71.8 → round → 72
    const input = attrs({
      pace: 75,
      defending: 80,
      physical: 70,
      passing: 72,
      dribbling: 65,
      heading: 60,
    });
    expect(calculateOverall(input, 'LB')).toBe(72);
    expect(calculateOverall(input, 'RB')).toBe(72);
  });

  it('CDM: defending 78, passing 70, physical 75, composure 68, vision 60, aggression 55 → 71', () => {
    // 78×.30 + 70×.20 + 75×.20 + 68×.15 + 60×.10 + 55×.05
    // = 23.4 + 14.0 + 15.0 + 10.2 + 6.0 + 2.75 = 71.35 → round → 71
    const input = attrs({
      defending: 78,
      passing: 70,
      physical: 75,
      composure: 68,
      vision: 60,
      aggression: 55,
    });
    expect(calculateOverall(input, 'CDM')).toBe(71);
  });

  it('CM: passing 80, vision 75, defending 65, physical 70, dribbling 72, composure 68 → 73', () => {
    // 80×.25 + 75×.20 + 65×.15 + 70×.15 + 72×.15 + 68×.10
    // = 20.0 + 15.0 + 9.75 + 10.5 + 10.8 + 6.8 = 72.85 → round → 73
    const input = attrs({
      passing: 80,
      vision: 75,
      defending: 65,
      physical: 70,
      dribbling: 72,
      composure: 68,
    });
    expect(calculateOverall(input, 'CM')).toBe(73);
  });

  it('CAM: vision 85, passing 80, dribbling 82, finishing 70, composure 72, pace 65 → 78', () => {
    // 85×.25 + 80×.20 + 82×.20 + 70×.15 + 72×.15 + 65×.05
    // = 21.25 + 16.0 + 16.4 + 10.5 + 10.8 + 3.25 = 78.2 → round → 78
    const input = attrs({
      vision: 85,
      passing: 80,
      dribbling: 82,
      finishing: 70,
      composure: 72,
      pace: 65,
    });
    expect(calculateOverall(input, 'CAM')).toBe(78);
  });

  it('LWB/RWB: pace 80, defending 70, dribbling 75, passing 78, physical 65, heading 55 → 72', () => {
    // 80×.25 + 70×.15 + 75×.15 + 78×.20 + 65×.10 + 55×.15
    // = 20.0 + 10.5 + 11.25 + 15.6 + 6.5 + 8.25 = 72.1 → round → 72
    const input = attrs({
      pace: 80,
      defending: 70,
      dribbling: 75,
      passing: 78,
      physical: 65,
      heading: 55,
    });
    expect(calculateOverall(input, 'LWB')).toBe(72);
    expect(calculateOverall(input, 'RWB')).toBe(72);
  });

  it('LM/RM: pace 75, dribbling 78, passing 76, finishing 70, defending 60, physical 65 → 72', () => {
    // 75×.20 + 78×.20 + 76×.20 + 70×.15 + 60×.15 + 65×.10
    // = 15.0 + 15.6 + 15.2 + 10.5 + 9.0 + 6.5 = 71.8 → round → 72
    const input = attrs({
      pace: 75,
      dribbling: 78,
      passing: 76,
      finishing: 70,
      defending: 60,
      physical: 65,
    });
    expect(calculateOverall(input, 'LM')).toBe(72);
    expect(calculateOverall(input, 'RM')).toBe(72);
  });

  it('LW/RW: pace 88, dribbling 86, finishing 80, passing 74, composure 72 → 81', () => {
    // 88×.25 + 86×.25 + 80×.20 + 74×.15 + 72×.15
    // = 22.0 + 21.5 + 16.0 + 11.1 + 10.8 = 81.4 → round → 81
    const input = attrs({ pace: 88, dribbling: 86, finishing: 80, passing: 74, composure: 72 });
    expect(calculateOverall(input, 'LW')).toBe(81);
    expect(calculateOverall(input, 'RW')).toBe(81);
  });
});
