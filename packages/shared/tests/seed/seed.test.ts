import { describe, expect, it } from 'vitest';
import { isErr, isOk, unwrapResult } from '../../src/result/result';
import { createSeed, deriveStream, equalsSeed, toUint32 } from '../../src/seed/seed';

describe('Seed', () => {
  describe('createSeed', () => {
    it('aceita uma string não-vazia', () => {
      const result = createSeed('partida-123');
      expect(isOk(result)).toBe(true);
      expect(unwrapResult(result)).toEqual({ value: 'partida-123' });
    });

    it('rejeita uma string vazia', () => {
      expect(isErr(createSeed(''))).toBe(true);
    });

    it('rejeita uma string contendo apenas espaços', () => {
      expect(isErr(createSeed('   '))).toBe(true);
    });

    it('o Value Object resultante é congelado (imutável)', () => {
      expect(Object.isFrozen(unwrapResult(createSeed('seed-x')))).toBe(true);
    });
  });

  describe('equalsSeed', () => {
    it('retorna true para dois Seeds com o mesmo valor', () => {
      const a = unwrapResult(createSeed('abc'));
      const b = unwrapResult(createSeed('abc'));
      expect(equalsSeed(a, b)).toBe(true);
    });

    it('retorna false para dois Seeds com valores diferentes', () => {
      const a = unwrapResult(createSeed('abc'));
      const b = unwrapResult(createSeed('xyz'));
      expect(equalsSeed(a, b)).toBe(false);
    });
  });

  describe('toUint32', () => {
    it('é determinístico — o mesmo Seed produz sempre o mesmo inteiro', () => {
      const seed = unwrapResult(createSeed('partida-fixa'));
      expect(toUint32(seed)).toBe(toUint32(seed));
    });

    it('Seeds diferentes tendem a produzir inteiros diferentes', () => {
      const a = unwrapResult(createSeed('seed-a'));
      const b = unwrapResult(createSeed('seed-b'));
      expect(toUint32(a)).not.toBe(toUint32(b));
    });

    it('produz sempre um inteiro não-negativo (unsigned 32-bit)', () => {
      const seed = unwrapResult(createSeed('qualquer-valor'));
      const result = toUint32(seed);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('deriveStream', () => {
    it('é determinístico — o mesmo par (pai, rótulo) produz sempre o mesmo Seed derivado', () => {
      const parent = unwrapResult(createSeed('partida-fixa'));
      const first = deriveStream(parent, 'events');
      const second = deriveStream(parent, 'events');
      expect(equalsSeed(first, second)).toBe(true);
    });

    it('rótulos diferentes produzem Seeds derivados diferentes a partir do mesmo pai', () => {
      const parent = unwrapResult(createSeed('partida-fixa'));
      const events = deriveStream(parent, 'events');
      const weather = deriveStream(parent, 'weather');
      expect(equalsSeed(events, weather)).toBe(false);
    });

    it('o mesmo rótulo a partir de pais diferentes produz Seeds derivados diferentes', () => {
      const parentA = unwrapResult(createSeed('partida-A'));
      const parentB = unwrapResult(createSeed('partida-B'));
      const fromA = deriveStream(parentA, 'penalty_tiebreak');
      const fromB = deriveStream(parentB, 'penalty_tiebreak');
      expect(equalsSeed(fromA, fromB)).toBe(false);
    });

    it('cobre todos os seis streams nomeados no doc 09 §21 sem colisão entre eles', () => {
      const parent = unwrapResult(createSeed('partida-completa'));
      const labels = ['events', 'weather', 'cards', 'injuries', 'narrative', 'penalty_tiebreak'];
      const derived = labels.map((label) => deriveStream(parent, label).value);
      const unique = new Set(derived);
      expect(unique.size).toBe(labels.length);
    });

    it('o Seed derivado resultante é congelado (imutável)', () => {
      const parent = unwrapResult(createSeed('partida-fixa'));
      expect(Object.isFrozen(deriveStream(parent, 'events'))).toBe(true);
    });
  });
});
