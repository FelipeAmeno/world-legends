import { createSeed, unwrapResult } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { RNG } from '../../src/rng/rng';

function seed(value: string) {
  return unwrapResult(createSeed(value));
}

describe('RNG — testes unitários', () => {
  it('expõe os seis métodos esperados', () => {
    const rng = RNG(seed('teste-superficie'));
    expect(typeof rng.nextFloat).toBe('function');
    expect(typeof rng.nextInt).toBe('function');
    expect(typeof rng.derive).toBe('function');
    expect(typeof rng.shuffle).toBe('function');
    expect(typeof rng.choice).toBe('function');
    expect(typeof rng.weightedChoice).toBe('function');
  });

  describe('nextFloat', () => {
    it('sempre retorna um número no intervalo [0, 1)', () => {
      const rng = RNG(seed('floats-em-faixa'));
      for (let i = 0; i < 1000; i += 1) {
        const value = rng.nextFloat();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value < 1).toBe(true);
      }
    });

    it('avança o estado interno — chamadas consecutivas praticamente nunca repetem o valor', () => {
      const rng = RNG(seed('estado-avanca'));
      const a = rng.nextFloat();
      const b = rng.nextFloat();
      expect(a).not.toBe(b);
    });
  });

  describe('nextInt', () => {
    it('retorna sempre um inteiro dentro de [min, max], inclusive', () => {
      const rng = RNG(seed('int-em-faixa'));
      for (let i = 0; i < 500; i += 1) {
        const value = rng.nextInt(3, 9);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(3);
        expect(value <= 9).toBe(true);
      }
    });

    it('quando min === max, sempre retorna esse único valor', () => {
      const rng = RNG(seed('int-faixa-unica'));
      for (let i = 0; i < 20; i += 1) {
        expect(rng.nextInt(7, 7)).toBe(7);
      }
    });

    it('lança uma exceção quando max < min', () => {
      const rng = RNG(seed('int-faixa-invalida'));
      expect(() => rng.nextInt(10, 5)).toThrow(/max.*min/);
    });
  });

  describe('derive', () => {
    it('retorna uma nova instância de RNG, com a mesma superfície pública', () => {
      const rng = RNG(seed('pai'));
      const derived = rng.derive('events');
      expect(typeof derived.nextFloat).toBe('function');
      expect(derived).not.toBe(rng);
    });
  });

  describe('shuffle', () => {
    it('retorna uma lista com o mesmo tamanho e os mesmos elementos (multiset)', () => {
      const rng = RNG(seed('shuffle-multiset'));
      const original = [1, 2, 3, 4, 5];
      const shuffled = rng.shuffle(original);
      expect(shuffled).toHaveLength(original.length);
      expect([...shuffled].sort()).toEqual([...original].sort());
    });

    it('nunca modifica a lista de entrada (imutabilidade)', () => {
      const rng = RNG(seed('shuffle-imutavel'));
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      rng.shuffle(original);
      expect(original).toEqual(originalCopy);
    });

    it('lida corretamente com listas vazias e de um único elemento', () => {
      const rng = RNG(seed('shuffle-bordas'));
      expect(rng.shuffle([])).toEqual([]);
      expect(rng.shuffle(['único'])).toEqual(['único']);
    });
  });

  describe('choice', () => {
    it('sempre retorna um elemento pertencente à lista de entrada', () => {
      const rng = RNG(seed('choice-pertence'));
      const items = ['a', 'b', 'c'];
      for (let i = 0; i < 100; i += 1) {
        expect(items).toContain(rng.choice(items));
      }
    });

    it('lança uma exceção quando a lista é vazia', () => {
      const rng = RNG(seed('choice-vazia'));
      expect(() => rng.choice([])).toThrow(/vazia/);
    });
  });

  describe('weightedChoice', () => {
    it('com um único item de peso positivo, sempre escolhe esse item', () => {
      const rng = RNG(seed('weighted-unico'));
      const items = [
        { value: 'raro', weight: 0 },
        { value: 'certo', weight: 1 },
        { value: 'impossivel', weight: 0 },
      ];
      for (let i = 0; i < 50; i += 1) {
        expect(rng.weightedChoice(items)).toBe('certo');
      }
    });

    it('lança uma exceção quando a lista é vazia', () => {
      const rng = RNG(seed('weighted-vazia'));
      expect(() => rng.weightedChoice([])).toThrow(/vazia/);
    });

    it('lança uma exceção quando algum peso é negativo', () => {
      const rng = RNG(seed('weighted-negativo'));
      expect(() =>
        rng.weightedChoice([
          { value: 'a', weight: 1 },
          { value: 'b', weight: -1 },
        ]),
      ).toThrow(/negativo/);
    });

    it('lança uma exceção quando todos os pesos são zero', () => {
      const rng = RNG(seed('weighted-zero'));
      expect(() =>
        rng.weightedChoice([
          { value: 'a', weight: 0 },
          { value: 'b', weight: 0 },
        ]),
      ).toThrow(/peso positivo/);
    });
  });
});
