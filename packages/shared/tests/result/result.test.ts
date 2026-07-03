import { describe, expect, it } from 'vitest';
import {
  Err,
  Ok,
  andThenResult,
  isErr,
  isOk,
  mapErr,
  mapResult,
  matchResult,
  unwrapResult,
  unwrapResultOr,
} from '../../src/result/result';

describe('Result<T, E>', () => {
  describe('Ok / Err', () => {
    it('Ok cria um Result de sucesso contendo o valor', () => {
      const result = Ok(42);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    it('Err cria um Result de falha contendo o erro', () => {
      const result = Err('algo deu errado');
      expect(result).toEqual({ ok: false, error: 'algo deu errado' });
    });

    it('Ok e Err produzem objetos congelados (Value Object imutável)', () => {
      expect(Object.isFrozen(Ok(1))).toBe(true);
      expect(Object.isFrozen(Err('x'))).toBe(true);
    });
  });

  describe('isOk / isErr', () => {
    it('isOk retorna true para sucesso e false para falha', () => {
      expect(isOk(Ok(1))).toBe(true);
      expect(isOk(Err('x'))).toBe(false);
    });

    it('isErr retorna true para falha e false para sucesso', () => {
      expect(isErr(Err('x'))).toBe(true);
      expect(isErr(Ok(1))).toBe(false);
    });
  });

  describe('mapResult', () => {
    it('transforma o valor quando o Result é sucesso', () => {
      const result = mapResult(Ok(2), (value: number) => value * 10);
      expect(result).toEqual({ ok: true, value: 20 });
    });

    it('não executa a função e passa o erro adiante quando o Result é falha', () => {
      const result = mapResult(Err<number, string>('falhou'), (value: number) => value * 10);
      expect(result).toEqual({ ok: false, error: 'falhou' });
    });
  });

  describe('mapErr', () => {
    it('transforma o erro quando o Result é falha', () => {
      const result = mapErr(Err('falhou'), (error: string) => error.toUpperCase());
      expect(result).toEqual({ ok: false, error: 'FALHOU' });
    });

    it('passa o sucesso adiante sem alteração quando o Result é sucesso', () => {
      const result = mapErr(Ok<number, string>(5), (error: string) => error.toUpperCase());
      expect(result).toEqual({ ok: true, value: 5 });
    });
  });

  describe('andThenResult', () => {
    it('encadeia para a próxima operação quando o Result é sucesso', () => {
      const result = andThenResult(Ok(2), (value: number) => Ok(value + 1));
      expect(result).toEqual({ ok: true, value: 3 });
    });

    it('encadeia para uma falha quando a próxima operação falha', () => {
      const result = andThenResult(Ok(2), () => Err('falhou na próxima etapa'));
      expect(result).toEqual({ ok: false, error: 'falhou na próxima etapa' });
    });

    it('nunca executa a próxima operação quando o Result já é falha (short-circuit)', () => {
      let executou = false;
      const result = andThenResult(Err<number, string>('falhou antes'), (value: number) => {
        executou = true;
        return Ok(value + 1);
      });
      expect(executou).toBe(false);
      expect(result).toEqual({ ok: false, error: 'falhou antes' });
    });
  });

  describe('unwrapResult', () => {
    it('retorna o valor quando o Result é sucesso', () => {
      expect(unwrapResult(Ok(99))).toBe(99);
    });

    it('lança uma exceção quando o Result é falha', () => {
      expect(() => unwrapResult(Err('motivo da falha'))).toThrow(/motivo da falha/);
    });
  });

  describe('unwrapResultOr', () => {
    it('retorna o valor quando o Result é sucesso', () => {
      expect(unwrapResultOr(Ok(7), 0)).toBe(7);
    });

    it('retorna o valor de reserva quando o Result é falha', () => {
      expect(unwrapResultOr(Err<number, string>('falhou'), 0)).toBe(0);
    });
  });

  describe('matchResult', () => {
    it('chama o handler de sucesso quando o Result é sucesso', () => {
      const output = matchResult(Ok(10), {
        ok: (value) => `valor: ${value}`,
        err: (error) => `erro: ${error}`,
      });
      expect(output).toBe('valor: 10');
    });

    it('chama o handler de falha quando o Result é falha', () => {
      const output = matchResult(Err<number, string>('xyz'), {
        ok: (value) => `valor: ${value}`,
        err: (error) => `erro: ${error}`,
      });
      expect(output).toBe('erro: xyz');
    });
  });
});
