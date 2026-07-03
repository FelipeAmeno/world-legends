import { describe, expect, it } from 'vitest';
import * as shared from '../src/index';

// Confirma que o barril público do package (src/index.ts) realmente
// reexporta os quatro Value Objects da Tarefa T002 — não substitui os
// testes de comportamento de cada módulo (tests/result, tests/option,
// tests/percentage, tests/seed, tests/errors), apenas garante que a
// superfície pública do package está completa e estável.
describe('superfície pública de @world-legends/shared', () => {
  it('exporta os construtores de Result', () => {
    expect(typeof shared.Ok).toBe('function');
    expect(typeof shared.Err).toBe('function');
  });

  it('exporta os construtores de Option', () => {
    expect(typeof shared.Some).toBe('function');
    expect(typeof shared.None).toBe('function');
  });

  it('exporta os construtores de Percentage', () => {
    expect(typeof shared.createPercentage).toBe('function');
    expect(typeof shared.clampPercentage).toBe('function');
  });

  it('exporta os construtores de Seed', () => {
    expect(typeof shared.createSeed).toBe('function');
    expect(typeof shared.deriveStream).toBe('function');
  });

  it('exporta o construtor de ValidationError', () => {
    expect(typeof shared.validationError).toBe('function');
  });
});
