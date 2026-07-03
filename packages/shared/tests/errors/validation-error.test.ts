import { describe, expect, it } from 'vitest';
import { validationError } from '../../src/errors/validation-error';

describe('ValidationError', () => {
  it('cria um erro com mensagem e campo', () => {
    const error = validationError('valor inválido', 'value');
    expect(error).toEqual({ kind: 'ValidationError', message: 'valor inválido', field: 'value' });
  });

  it('cria um erro só com mensagem quando nenhum campo é informado', () => {
    const error = validationError('valor inválido');
    expect(error).toEqual({ kind: 'ValidationError', message: 'valor inválido' });
    expect('field' in error).toBe(false);
  });

  it('o erro resultante é congelado (imutável)', () => {
    expect(Object.isFrozen(validationError('x'))).toBe(true);
  });
});
