import { describe, expect, it } from 'vitest';
import {
  applyFatigueToAttribute,
  calculateCalendarFatigue,
  calculateIntraMatchFatigue,
} from '../../src/fatigue/fatigue';

describe('calculateIntraMatchFatigue (doc 09 §7)', () => {
  it('é 0 em qualquer minuto até 60 (inclusive)', () => {
    expect(
      calculateIntraMatchFatigue({
        minute: 0,
        staminaAttribute: 50,
        tacticalIntensity: 'equilibrado',
      }),
    ).toBe(0);
    expect(
      calculateIntraMatchFatigue({
        minute: 45,
        staminaAttribute: 50,
        tacticalIntensity: 'equilibrado',
      }),
    ).toBe(0);
    expect(
      calculateIntraMatchFatigue({
        minute: 60,
        staminaAttribute: 50,
        tacticalIntensity: 'equilibrado',
      }),
    ).toBe(0);
  });

  it('minuto 90, stamina 99, tática equilibrada: 4.5 × 1.0 × 0.5 = 2.25', () => {
    const fatigue = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 99,
      tacticalIntensity: 'equilibrado',
    });
    expect(fatigue).toBe(2.25);
  });

  it('stamina mais baixa produz fadiga maior (menos resistência)', () => {
    const lowStamina = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 1,
      tacticalIntensity: 'equilibrado',
    });
    const highStamina = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 99,
      tacticalIntensity: 'equilibrado',
    });
    expect(lowStamina).toBeGreaterThan(highStamina);
  });

  it('ultra ofensivo custa mais fadiga que ultra defensivo, no mesmo minuto/stamina', () => {
    const ultraOfensivo = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 70,
      tacticalIntensity: 'ultra_ofensivo',
    });
    const ultraDefensivo = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 70,
      tacticalIntensity: 'ultra_defensivo',
    });
    expect(ultraOfensivo).toBeGreaterThan(ultraDefensivo);
  });

  it('minuto 90, stamina 99, ultra ofensivo: 4.5 × 1.25 × 0.5 = 2.8125', () => {
    const fatigue = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 99,
      tacticalIntensity: 'ultra_ofensivo',
    });
    expect(fatigue).toBe(2.8125);
  });

  it('a fadiga cresce conforme o minuto avança além dos 60', () => {
    const at70 = calculateIntraMatchFatigue({
      minute: 70,
      staminaAttribute: 70,
      tacticalIntensity: 'equilibrado',
    });
    const at80 = calculateIntraMatchFatigue({
      minute: 80,
      staminaAttribute: 70,
      tacticalIntensity: 'equilibrado',
    });
    const at90 = calculateIntraMatchFatigue({
      minute: 90,
      staminaAttribute: 70,
      tacticalIntensity: 'equilibrado',
    });
    expect(at80).toBeGreaterThan(at70);
    expect(at90).toBeGreaterThan(at80);
  });
});

describe('calculateCalendarFatigue (doc 09 §7 — também a mecânica de recuperação)', () => {
  it('5 ou mais dias de descanso zeram a fadiga, independente dos minutos jogados', () => {
    expect(calculateCalendarFatigue({ restDays: 5, minutesPlayedLastMatch: 90 })).toBe(0);
    expect(calculateCalendarFatigue({ restDays: 10, minutesPlayedLastMatch: 90 })).toBe(0);
  });

  it('3 ou 4 dias de descanso: minutosJogados × 0.02', () => {
    expect(calculateCalendarFatigue({ restDays: 3, minutesPlayedLastMatch: 90 })).toBe(1.8);
    expect(calculateCalendarFatigue({ restDays: 4, minutesPlayedLastMatch: 90 })).toBe(1.8);
  });

  it('menos de 3 dias de descanso: minutosJogados × 0.05 (penalidade maior)', () => {
    expect(calculateCalendarFatigue({ restDays: 0, minutesPlayedLastMatch: 90 })).toBe(4.5);
    expect(calculateCalendarFatigue({ restDays: 2, minutesPlayedLastMatch: 90 })).toBe(4.5);
  });

  it('mais descanso nunca produz MAIS fadiga que menos descanso, para os mesmos minutos jogados', () => {
    const poucoDescanso = calculateCalendarFatigue({ restDays: 1, minutesPlayedLastMatch: 90 });
    const descansoMedio = calculateCalendarFatigue({ restDays: 3, minutesPlayedLastMatch: 90 });
    const descansoTotal = calculateCalendarFatigue({ restDays: 5, minutesPlayedLastMatch: 90 });
    expect(poucoDescanso).toBeGreaterThan(descansoMedio);
    expect(descansoMedio).toBeGreaterThan(descansoTotal);
  });

  it('Iron Man (doc 11 §7): 20% de redução reduz a fadiga de calendário em 20%', () => {
    const semIronMan = calculateCalendarFatigue({ restDays: 0, minutesPlayedLastMatch: 90 });
    const comIronMan = calculateCalendarFatigue({
      restDays: 0,
      minutesPlayedLastMatch: 90,
      ironManFatigueRateReductionPercent: 20,
    });
    expect(comIronMan).toBe(semIronMan * 0.8);
    expect(comIronMan).toBe(3.6);
  });

  it('sem o parâmetro de Iron Man, o comportamento é idêntico a passar 0', () => {
    const semParametro = calculateCalendarFatigue({ restDays: 1, minutesPlayedLastMatch: 90 });
    const comZero = calculateCalendarFatigue({
      restDays: 1,
      minutesPlayedLastMatch: 90,
      ironManFatigueRateReductionPercent: 0,
    });
    expect(semParametro).toBe(comZero);
  });
});

describe('applyFatigueToAttribute (doc 09 §3 — penalidade subtrativa, não percentual)', () => {
  it('subtrai os pontos de fadiga diretamente do atributo', () => {
    expect(applyFatigueToAttribute(80, 2.25)).toBe(77.75);
  });

  it('fadiga 0 não altera o atributo', () => {
    expect(applyFatigueToAttribute(65, 0)).toBe(65);
  });

  it('o resultado nunca fica abaixo de 1 (piso de doc 17, Invariantes)', () => {
    expect(applyFatigueToAttribute(5, 10)).toBe(1);
  });

  it('o resultado nunca ultrapassa 99 (teto de doc 17, Invariantes)', () => {
    expect(applyFatigueToAttribute(99, -5)).toBe(99); // fadiga "negativa" hipotética não deveria inflar acima do teto
  });
});
