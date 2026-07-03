import { describe, expect, it } from 'vitest';
import {
  None,
  Some,
  andThenOption,
  fromNullable,
  isNone,
  isSome,
  mapOption,
  matchOption,
  toResult,
  unwrapOption,
  unwrapOptionOr,
} from '../../src/option/option';

describe('Option<T>', () => {
  describe('Some / None', () => {
    it('Some cria uma Option presente contendo o valor', () => {
      expect(Some('valor')).toEqual({ some: true, value: 'valor' });
    });

    it('None cria uma Option ausente', () => {
      expect(None()).toEqual({ some: false });
    });

    it('Some e None produzem objetos congelados (Value Object imutável)', () => {
      expect(Object.isFrozen(Some(1))).toBe(true);
      expect(Object.isFrozen(None())).toBe(true);
    });

    it('duas chamadas a None() são equivalentes por valor', () => {
      expect(None()).toEqual(None());
    });
  });

  describe('isSome / isNone', () => {
    it('isSome retorna true para presente e false para ausente', () => {
      expect(isSome(Some(1))).toBe(true);
      expect(isSome(None())).toBe(false);
    });

    it('isNone retorna true para ausente e false para presente', () => {
      expect(isNone(None())).toBe(true);
      expect(isNone(Some(1))).toBe(false);
    });
  });

  describe('mapOption', () => {
    it('transforma o valor quando a Option é presente', () => {
      expect(mapOption(Some(3), (value: number) => value * 2)).toEqual({ some: true, value: 6 });
    });

    it('não executa a função quando a Option é ausente', () => {
      let executou = false;
      const result = mapOption(None<number>(), (value: number) => {
        executou = true;
        return value * 2;
      });
      expect(executou).toBe(false);
      expect(result).toEqual({ some: false });
    });
  });

  describe('andThenOption', () => {
    it('encadeia para a próxima operação quando a Option é presente', () => {
      expect(andThenOption(Some(3), (value: number) => Some(value + 1))).toEqual({
        some: true,
        value: 4,
      });
    });

    it('encadeia para ausência quando a próxima operação resulta em None', () => {
      expect(andThenOption(Some(3), () => None<number>())).toEqual({ some: false });
    });

    it('nunca executa a próxima operação quando a Option já é ausente (short-circuit)', () => {
      let executou = false;
      const result = andThenOption(None<number>(), (value: number) => {
        executou = true;
        return Some(value + 1);
      });
      expect(executou).toBe(false);
      expect(result).toEqual({ some: false });
    });
  });

  describe('unwrapOption', () => {
    it('retorna o valor quando a Option é presente', () => {
      expect(unwrapOption(Some(8))).toBe(8);
    });

    it('lança uma exceção quando a Option é ausente', () => {
      expect(() => unwrapOption(None())).toThrow(/ausente/);
    });
  });

  describe('unwrapOptionOr', () => {
    it('retorna o valor quando a Option é presente', () => {
      expect(unwrapOptionOr(Some(8), 0)).toBe(8);
    });

    it('retorna o valor de reserva quando a Option é ausente', () => {
      expect(unwrapOptionOr(None<number>(), 0)).toBe(0);
    });
  });

  describe('matchOption', () => {
    it('chama o handler "some" quando a Option é presente', () => {
      const output = matchOption(Some(5), {
        some: (value) => `presente: ${value}`,
        none: () => 'ausente',
      });
      expect(output).toBe('presente: 5');
    });

    it('chama o handler "none" quando a Option é ausente', () => {
      const output = matchOption(None<number>(), {
        some: (value) => `presente: ${value}`,
        none: () => 'ausente',
      });
      expect(output).toBe('ausente');
    });
  });

  describe('fromNullable', () => {
    it('converte null em None', () => {
      expect(fromNullable(null)).toEqual({ some: false });
    });

    it('converte undefined em None', () => {
      expect(fromNullable(undefined)).toEqual({ some: false });
    });

    it('converte um valor presente em Some', () => {
      expect(fromNullable('ok')).toEqual({ some: true, value: 'ok' });
    });

    it('converte o número 0 em Some(0), não em None (0 não é nullish)', () => {
      expect(fromNullable(0)).toEqual({ some: true, value: 0 });
    });
  });

  describe('toResult', () => {
    it('converte Some em Ok', () => {
      expect(toResult(Some(9), 'sem valor')).toEqual({ ok: true, value: 9 });
    });

    it('converte None em Err, usando o erro fornecido', () => {
      expect(toResult(None<number>(), 'sem valor')).toEqual({ ok: false, error: 'sem valor' });
    });
  });
});
