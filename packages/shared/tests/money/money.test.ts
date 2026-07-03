import { describe, expect, it } from 'vitest';
import {
  ZERO_CREDITS,
  ZERO_FRAGMENTS,
  ZERO_PREMIUM,
  addMoney,
  createMoney,
  subtractMoney,
} from '../../src/money/money';

describe('Money', () => {
  describe('createMoney', () => {
    it('cria um Money válido com inteiro não-negativo', () => {
      const result = createMoney(100, 'credits');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.amount).toBe(100);
        expect(result.value.currency).toBe('credits');
      }
    });

    it('aceita zero como amount', () => {
      const result = createMoney(0, 'fragments');
      expect(result.ok).toBe(true);
    });

    it('retorna Err para amount não-inteiro', () => {
      const result = createMoney(1.5, 'credits');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe('amount');
      }
    });

    it('retorna Err para amount negativo', () => {
      const result = createMoney(-1, 'credits');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.field).toBe('amount');
      }
    });

    it('o valor resultante é imutável (frozen)', () => {
      const result = createMoney(50, 'premium');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(Object.isFrozen(result.value)).toBe(true);
      }
    });
  });

  describe('addMoney', () => {
    it('soma dois Money da mesma moeda', () => {
      const a = createMoney(100, 'credits');
      const b = createMoney(50, 'credits');
      if (!a.ok || !b.ok) throw new Error('setup');

      const result = addMoney(a.value, b.value);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.amount).toBe(150);
        expect(result.value.currency).toBe('credits');
      }
    });

    it('retorna Err ao somar moedas diferentes', () => {
      const a = createMoney(100, 'credits');
      const b = createMoney(50, 'fragments');
      if (!a.ok || !b.ok) throw new Error('setup');

      const result = addMoney(a.value, b.value);
      expect(result.ok).toBe(false);
    });
  });

  describe('subtractMoney', () => {
    it('subtrai b de a quando há saldo suficiente', () => {
      const a = createMoney(100, 'credits');
      const b = createMoney(30, 'credits');
      if (!a.ok || !b.ok) throw new Error('setup');

      const result = subtractMoney(a.value, b.value);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.amount).toBe(70);
      }
    });

    it('retorna Err quando saldo é insuficiente', () => {
      const a = createMoney(10, 'credits');
      const b = createMoney(50, 'credits');
      if (!a.ok || !b.ok) throw new Error('setup');

      const result = subtractMoney(a.value, b.value);
      expect(result.ok).toBe(false);
    });

    it('retorna Err ao subtrair moedas diferentes', () => {
      const a = createMoney(100, 'credits');
      const b = createMoney(50, 'fragments');
      if (!a.ok || !b.ok) throw new Error('setup');

      const result = subtractMoney(a.value, b.value);
      expect(result.ok).toBe(false);
    });
  });

  describe('constantes zero', () => {
    it('ZERO_CREDITS é amount=0 currency=credits', () => {
      expect(ZERO_CREDITS).toEqual({ amount: 0, currency: 'credits' });
      expect(Object.isFrozen(ZERO_CREDITS)).toBe(true);
    });

    it('ZERO_FRAGMENTS é amount=0 currency=fragments', () => {
      expect(ZERO_FRAGMENTS).toEqual({ amount: 0, currency: 'fragments' });
    });

    it('ZERO_PREMIUM é amount=0 currency=premium', () => {
      expect(ZERO_PREMIUM).toEqual({ amount: 0, currency: 'premium' });
    });
  });
});
