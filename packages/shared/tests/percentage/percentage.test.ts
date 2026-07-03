import { describe, expect, it } from 'vitest';
import {
  clampPercentage,
  createPercentage,
  equalsPercentage,
  toRatio,
} from '../../src/percentage/percentage';
import { isErr, isOk, unwrapResult } from '../../src/result/result';

describe('Percentage', () => {
  describe('createPercentage', () => {
    it('aceita 0 (limite inferior)', () => {
      const result = createPercentage(0);
      expect(isOk(result)).toBe(true);
      expect(unwrapResult(result)).toEqual({ value: 0 });
    });

    it('aceita 100 (limite superior)', () => {
      const result = createPercentage(100);
      expect(isOk(result)).toBe(true);
      expect(unwrapResult(result)).toEqual({ value: 100 });
    });

    it('aceita um valor intermediário', () => {
      const result = createPercentage(42.5);
      expect(unwrapResult(result)).toEqual({ value: 42.5 });
    });

    it('rejeita um valor negativo', () => {
      const result = createPercentage(-1);
      expect(isErr(result)).toBe(true);
    });

    it('rejeita um valor acima de 100', () => {
      const result = createPercentage(101);
      expect(isErr(result)).toBe(true);
    });

    it('rejeita NaN', () => {
      const result = createPercentage(Number.NaN);
      expect(isErr(result)).toBe(true);
    });

    it('o Value Object resultante é congelado (imutável)', () => {
      const result = createPercentage(50);
      expect(Object.isFrozen(unwrapResult(result))).toBe(true);
    });
  });

  describe('clampPercentage', () => {
    it('mantém um valor já dentro da faixa', () => {
      expect(clampPercentage(37)).toEqual({ value: 37 });
    });

    it('corta um valor negativo para 0', () => {
      expect(clampPercentage(-50)).toEqual({ value: 0 });
    });

    it('corta um valor acima de 100 para 100', () => {
      expect(clampPercentage(250)).toEqual({ value: 100 });
    });

    it('converte NaN em 0, em vez de propagar NaN', () => {
      expect(clampPercentage(Number.NaN)).toEqual({ value: 0 });
    });

    it('o Value Object resultante é congelado (imutável)', () => {
      expect(Object.isFrozen(clampPercentage(10))).toBe(true);
    });
  });

  describe('toRatio', () => {
    it('converte 0 para 0', () => {
      expect(toRatio(clampPercentage(0))).toBe(0);
    });

    it('converte 50 para 0.5', () => {
      expect(toRatio(clampPercentage(50))).toBe(0.5);
    });

    it('converte 100 para 1', () => {
      expect(toRatio(clampPercentage(100))).toBe(1);
    });
  });

  describe('equalsPercentage', () => {
    it('retorna true para duas Percentages com o mesmo valor', () => {
      expect(equalsPercentage(clampPercentage(30), clampPercentage(30))).toBe(true);
    });

    it('retorna false para duas Percentages com valores diferentes', () => {
      expect(equalsPercentage(clampPercentage(30), clampPercentage(31))).toBe(false);
    });
  });
});
