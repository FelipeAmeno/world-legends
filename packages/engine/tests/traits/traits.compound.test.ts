import { isErr, isOk, unwrapResult } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import {
  createCapitaoMagnitude,
  createIronManMagnitude,
  createLeaderMagnitude,
} from '../../src/traits/traits';

describe('Capitão — teto composto (+6 moral, -30% queda de moral, doc 11 §7)', () => {
  it('aceita ambos os campos no teto exato', () => {
    expect(isOk(createCapitaoMagnitude(6, 30))).toBe(true);
  });

  it('aceita ambos os campos em 0', () => {
    expect(isOk(createCapitaoMagnitude(0, 0))).toBe(true);
  });

  it('rejeita quando SÓ initialMoralBonus excede seu teto (6)', () => {
    expect(isErr(createCapitaoMagnitude(7, 10))).toBe(true);
  });

  it('rejeita quando SÓ moralDecayReductionPercent excede seu teto (30)', () => {
    expect(isErr(createCapitaoMagnitude(3, 31))).toBe(true);
  });

  it('rejeita quando AMBOS os campos excedem seus tetos', () => {
    expect(isErr(createCapitaoMagnitude(99, 99))).toBe(true);
  });

  it('rejeita valores negativos em qualquer um dos dois campos', () => {
    expect(isErr(createCapitaoMagnitude(-1, 10))).toBe(true);
    expect(isErr(createCapitaoMagnitude(3, -1))).toBe(true);
  });

  it('o Value Object resultante é congelado e tem os dois campos', () => {
    const value = unwrapResult(createCapitaoMagnitude(6, 30));
    expect(Object.isFrozen(value)).toBe(true);
    expect(value).toEqual({
      trait: 'Capitão',
      initialMoralBonus: 6,
      moralDecayReductionPercent: 30,
    });
  });
});

describe('Iron Man — teto composto (-25% risco de lesão, -20% taxa de fadiga, doc 11 §7)', () => {
  it('aceita ambos os campos no teto exato', () => {
    expect(isOk(createIronManMagnitude(25, 20))).toBe(true);
  });

  it('rejeita quando SÓ injuryRiskReductionPercent excede seu teto (25)', () => {
    expect(isErr(createIronManMagnitude(26, 10))).toBe(true);
  });

  it('rejeita quando SÓ fatigueRateReductionPercent excede seu teto (20)', () => {
    expect(isErr(createIronManMagnitude(10, 21))).toBe(true);
  });

  it('os dois campos têm tetos INDEPENDENTES — um no teto e outro em 0 ainda é válido', () => {
    expect(isOk(createIronManMagnitude(25, 0))).toBe(true);
    expect(isOk(createIronManMagnitude(0, 20))).toBe(true);
  });

  it('o Value Object resultante tem os dois campos corretos', () => {
    const value = unwrapResult(createIronManMagnitude(25, 20));
    expect(value).toEqual({
      trait: 'Iron Man',
      injuryRiskReductionPercent: 25,
      fatigueRateReductionPercent: 20,
    });
  });
});

describe('Leader — sem teto percentual absoluto documentado (lacuna real, ver types.ts)', () => {
  it('aceita qualquer valor não-negativo, incluindo valores grandes', () => {
    expect(isOk(createLeaderMagnitude(0))).toBe(true);
    expect(isOk(createLeaderMagnitude(5))).toBe(true);
    expect(isOk(createLeaderMagnitude(1000))).toBe(true);
  });

  it('ainda assim rejeita valores negativos, NaN e Infinity', () => {
    expect(isErr(createLeaderMagnitude(-1))).toBe(true);
    expect(isErr(createLeaderMagnitude(Number.NaN))).toBe(true);
    expect(isErr(createLeaderMagnitude(Number.POSITIVE_INFINITY))).toBe(true);
  });

  it('o Value Object resultante é congelado', () => {
    expect(Object.isFrozen(unwrapResult(createLeaderMagnitude(4)))).toBe(true);
  });
});
