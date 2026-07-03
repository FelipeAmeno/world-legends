import { describe, expect, it } from 'vitest';
import {
  calculateChemistryBonus,
  calculateMoraleBonus,
  calculateTeamPower,
} from '../../src/match/team-power';
import { buildTeamSnapshot } from './fixtures';

describe('calculateChemistryBonus (doc 09 §4)', () => {
  it('retorna -3 exatamente quando química <= 20', () => {
    expect(calculateChemistryBonus(20, false)).toBe(-3);
    expect(calculateChemistryBonus(0, false)).toBe(-3);
  });

  it('retorna +4 exatamente quando química >= 85', () => {
    expect(calculateChemistryBonus(85, false)).toBe(4);
    expect(calculateChemistryBonus(100, false)).toBe(4);
  });

  it('interpola linearmente entre os dois pontos-âncora', () => {
    const meio = calculateChemistryBonus((20 + 85) / 2, false);
    expect(meio).toBeGreaterThan(-3);
    expect(meio).toBeLessThan(4);
  });

  it('TC-EXT-03 (adaptado): soma o bônus de Time Histórico Completo (+8) por cima, mesmo no teto de química', () => {
    const semBonus = calculateChemistryBonus(100, false);
    const comBonus = calculateChemistryBonus(100, true);
    expect(comBonus - semBonus).toBe(8);
  });
});

describe('calculateMoraleBonus (doc 09 §5)', () => {
  it('mapeia os extremos para -6 e +6', () => {
    expect(calculateMoraleBonus(-100)).toBe(-6);
    expect(calculateMoraleBonus(100)).toBe(6);
  });

  it('retorna 0 para moral neutra', () => {
    expect(calculateMoraleBonus(0)).toBe(0);
  });

  it('é linear (dobrar a moral dobra o bônus)', () => {
    expect(calculateMoraleBonus(50)).toBe(calculateMoraleBonus(100) / 2);
  });
});

describe('calculateTeamPower (doc 09 §3)', () => {
  it('nunca sai do intervalo [1, 99] mesmo em extremos', () => {
    const fortissimo = buildTeamSnapshot({
      isHomeTeam: true,
      attributeOverrides: {
        finishing: 99,
        defending: 99,
        gk_reflexes: 99,
        passing: 99,
        vision: 99,
        physical: 99,
        pace: 99,
        dribbling: 99,
        shot_power: 99,
        heading: 99,
        composure: 99,
      },
    });
    const power = calculateTeamPower({
      starters: fortissimo.starters,
      tacticalIntensity: 'ultra_ofensivo',
      chemistry: 100,
      isCompleteHistoricalSquad: true,
      moraleMinus100To100: 100,
      isHomeTeam: true,
      isNeutralVenue: false,
      averageFatiguePoints: 0,
    });
    expect(power).toBeLessThanOrEqual(99);

    const fraquissimo = buildTeamSnapshot({
      isHomeTeam: false,
      attributeOverrides: {
        finishing: 1,
        defending: 1,
        gk_reflexes: 1,
        passing: 1,
        vision: 1,
        physical: 1,
        pace: 1,
        dribbling: 1,
        shot_power: 1,
        heading: 1,
        composure: 1,
      },
    });
    const powerBaixo = calculateTeamPower({
      starters: fraquissimo.starters,
      tacticalIntensity: 'ultra_defensivo',
      chemistry: 0,
      isCompleteHistoricalSquad: false,
      moraleMinus100To100: -100,
      isHomeTeam: false,
      isNeutralVenue: false,
      averageFatiguePoints: 50,
    });
    expect(powerBaixo).toBeGreaterThanOrEqual(1);
  });

  it('doc 09 §9: bônus de mando (+3) só se aplica ao mandante em campo não-neutro', () => {
    const snapshot = buildTeamSnapshot({ isHomeTeam: true });
    const inputBase = {
      starters: snapshot.starters,
      tacticalIntensity: 'equilibrado' as const,
      chemistry: 50,
      isCompleteHistoricalSquad: false,
      moraleMinus100To100: 0,
      averageFatiguePoints: 0,
    };
    const comoMandanteEmCasa = calculateTeamPower({
      ...inputBase,
      isHomeTeam: true,
      isNeutralVenue: false,
    });
    const comoMandanteEmCampoNeutro = calculateTeamPower({
      ...inputBase,
      isHomeTeam: true,
      isNeutralVenue: true,
    });
    const comoVisitante = calculateTeamPower({
      ...inputBase,
      isHomeTeam: false,
      isNeutralVenue: false,
    });

    expect(comoMandanteEmCasa - comoMandanteEmCampoNeutro).toBe(3);
    expect(comoMandanteEmCampoNeutro).toBe(comoVisitante);
  });

  it('fadiga média é subtraída diretamente da Força de Time (doc 09 §3)', () => {
    const snapshot = buildTeamSnapshot({ isHomeTeam: true });
    const inputBase = {
      starters: snapshot.starters,
      tacticalIntensity: 'equilibrado' as const,
      chemistry: 50,
      isCompleteHistoricalSquad: false,
      moraleMinus100To100: 0,
      isHomeTeam: true,
      isNeutralVenue: false,
    };
    const semFadiga = calculateTeamPower({ ...inputBase, averageFatiguePoints: 0 });
    const comFadiga = calculateTeamPower({ ...inputBase, averageFatiguePoints: 10 });
    expect(semFadiga - comFadiga).toBe(10);
  });
});
