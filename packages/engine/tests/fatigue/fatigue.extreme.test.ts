import { describe, expect, it } from 'vitest';
import {
  applyFatigueToAttribute,
  calculateCalendarFatigue,
  calculateIntraMatchFatigue,
} from '../../src/fatigue/fatigue';

describe('calculateIntraMatchFatigue — extremos', () => {
  it('minuto extremamente negativo ainda se comporta como "antes dos 60" (0 de fadiga)', () => {
    // entrada fora do contrato documentado (minuto nunca deveria ser negativo
    // numa partida real), mas a fórmula não deveria produzir um valor absurdo.
    expect(
      calculateIntraMatchFatigue({
        minute: -10,
        staminaAttribute: 50,
        tacticalIntensity: 'equilibrado',
      }),
    ).toBe(0);
  });

  it('minuto muito alto (prorrogação + acréscimos, ex: 130) continua crescendo linearmente', () => {
    const at120 = calculateIntraMatchFatigue({
      minute: 120,
      staminaAttribute: 70,
      tacticalIntensity: 'equilibrado',
    });
    const at130 = calculateIntraMatchFatigue({
      minute: 130,
      staminaAttribute: 70,
      tacticalIntensity: 'equilibrado',
    });
    expect(at130).toBeGreaterThan(at120);
  });

  it('stamina no teto (99) produz a MENOR fadiga possível para um dado minuto/tática (resistência máxima)', () => {
    const fatigue = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 99,
      tacticalIntensity: 'equilibrado',
    });
    const fatigueAbaixo = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 98,
      tacticalIntensity: 'equilibrado',
    });
    expect(fatigue).toBeLessThan(fatigueAbaixo);
  });

  it('stamina no piso (1) produz fadiga muito próxima do dobro do decaimento base (quase nenhuma resistência)', () => {
    const fatigue = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 1,
      tacticalIntensity: 'equilibrado',
    });
    // decayBase=4.5, resistance=1/99≈0.0101 → fator≈0.99495 → fadiga≈4.4773
    expect(fatigue).toBeGreaterThan(4.47);
    expect(fatigue).toBeLessThan(4.5);
  });

  it('todas as 5 táticas produzem fadigas estritamente ordenadas, no mesmo minuto/stamina', () => {
    const params = { minute: 90, staminaAttribute: 70 } as const;
    const ultraDef = calculateIntraMatchFatigue({
      ...params,
      tacticalIntensity: 'ultra_defensivo',
    });
    const def = calculateIntraMatchFatigue({ ...params, tacticalIntensity: 'defensivo' });
    const equilibrado = calculateIntraMatchFatigue({ ...params, tacticalIntensity: 'equilibrado' });
    const of = calculateIntraMatchFatigue({ ...params, tacticalIntensity: 'ofensivo' });
    const ultraOf = calculateIntraMatchFatigue({ ...params, tacticalIntensity: 'ultra_ofensivo' });
    expect(ultraDef).toBeLessThan(def);
    expect(def).toBeLessThan(equilibrado);
    expect(equilibrado).toBeLessThan(of);
    expect(of).toBeLessThan(ultraOf);
  });
});

describe('calculateCalendarFatigue — extremos', () => {
  it('0 minutos jogados na última partida produz fadiga 0, em qualquer faixa de descanso', () => {
    expect(calculateCalendarFatigue({ restDays: 0, minutesPlayedLastMatch: 0 })).toBe(0);
    expect(calculateCalendarFatigue({ restDays: 3, minutesPlayedLastMatch: 0 })).toBe(0);
  });

  it('a fronteira exata de cada faixa de descanso (2/3 e 4/5) muda de comportamento corretamente', () => {
    expect(calculateCalendarFatigue({ restDays: 2, minutesPlayedLastMatch: 100 })).toBe(5);
    expect(calculateCalendarFatigue({ restDays: 3, minutesPlayedLastMatch: 100 })).toBe(2);
    expect(calculateCalendarFatigue({ restDays: 4, minutesPlayedLastMatch: 100 })).toBe(2);
    expect(calculateCalendarFatigue({ restDays: 5, minutesPlayedLastMatch: 100 })).toBe(0);
  });

  it('Iron Man no teto documentado (25%) é o maior alívio possível de fadiga de calendário', () => {
    const semTrait = calculateCalendarFatigue({ restDays: 0, minutesPlayedLastMatch: 90 });
    const comTeto = calculateCalendarFatigue({
      restDays: 0,
      minutesPlayedLastMatch: 90,
      ironManFatigueRateReductionPercent: 25,
    });
    expect(comTeto).toBe(semTrait * 0.75);
  });

  it('um valor de redução de Iron Man de 100% (hipotético, fora do teto real de 25%) zeraria a fadiga', () => {
    expect(
      calculateCalendarFatigue({
        restDays: 0,
        minutesPlayedLastMatch: 90,
        ironManFatigueRateReductionPercent: 100,
      }),
    ).toBe(0);
  });

  it('número muito grande de minutos jogados não quebra a fórmula', () => {
    const fatigue = calculateCalendarFatigue({ restDays: 0, minutesPlayedLastMatch: 10000 });
    expect(fatigue).toBe(500);
    expect(Number.isFinite(fatigue)).toBe(true);
  });
});

describe('applyFatigueToAttribute — extremos', () => {
  it('fadiga absurdamente alta sempre satura no piso (1), nunca produz negativo', () => {
    expect(applyFatigueToAttribute(99, 1000)).toBe(1);
    expect(applyFatigueToAttribute(1, 1000)).toBe(1);
  });

  it('atributo já no piso (1) com fadiga 0 permanece 1', () => {
    expect(applyFatigueToAttribute(1, 0)).toBe(1);
  });

  it('atributo no teto (99) com fadiga 0 permanece 99', () => {
    expect(applyFatigueToAttribute(99, 0)).toBe(99);
  });

  it('fadiga fracionária pequena ainda é aplicada corretamente, sem arredondamento implícito', () => {
    expect(applyFatigueToAttribute(50, 0.01)).toBeGreaterThan(49.98);
    expect(applyFatigueToAttribute(50, 0.01)).toBeLessThanOrEqual(49.99);
  });
});
