import { createSeed, unwrapResult } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { RNG } from '../../src/rng/rng';

function seed(value: string) {
  return unwrapResult(createSeed(value));
}

/** Incrementa um contador em um Map, defensável sob noUncheckedIndexedAccess. */
function increment<K>(counts: Map<K, number>, key: K): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

/**
 * Estes testes usam amostras grandes para validar PROPRIEDADES
 * ESTATÍSTICAS da distribuição (média, uniformidade, proporcionalidade a
 * peso) — diferente dos testes unitários (comportamento exato, amostras
 * pequenas) e dos de reprodutibilidade (igualdade entre duas instâncias).
 *
 * Como o seed é sempre fixo, cada teste é 100% determinístico e
 * reproduzível — não há "flakiness" real, apesar de testarmos
 * propriedades de "aleatoriedade". As tolerâncias são generosas de
 * propósito: o objetivo é detectar um RNG estruturalmente quebrado (bias
 * grosseiro, item nunca sorteado, distribuição não-uniforme óbvia), não
 * fazer um teste estatístico rigoroso de qualidade do mulberry32 em si.
 */
describe('RNG — testes Monte Carlo', () => {
  describe('nextFloat — distribuição uniforme em [0, 1)', () => {
    const rng = RNG(seed('monte-carlo-float'));
    const N = 100_000;
    const samples = Array.from({ length: N }, () => rng.nextFloat());

    it('a média de uma amostra grande fica próxima de 0.5', () => {
      const mean = samples.reduce((sum, v) => sum + v, 0) / N;
      expect(mean).toBeGreaterThanOrEqual(0.49);
      expect(mean <= 0.51).toBe(true);
    });

    it('os valores se distribuem de forma razoavelmente uniforme em 10 baldes', () => {
      const buckets = new Map<number, number>();
      for (const value of samples) {
        const bucketIndex = Math.min(9, Math.floor(value * 10));
        increment(buckets, bucketIndex);
      }
      const expectedPerBucket = N / 10;
      for (let bucketIndex = 0; bucketIndex < 10; bucketIndex += 1) {
        const count = buckets.get(bucketIndex) ?? 0;
        // tolerância de 15% em torno do valor esperado por balde
        expect(count).toBeGreaterThanOrEqual(expectedPerBucket * 0.85);
        expect(count <= expectedPerBucket * 1.15).toBe(true);
      }
    });
  });

  describe('nextInt — distribuição uniforme em um intervalo discreto', () => {
    it('um "dado de 6 faces" simulado cai em cada face com frequência próxima de N/6', () => {
      const rng = RNG(seed('monte-carlo-dado'));
      const N = 60_000;
      const counts = new Map<number, number>();
      for (let i = 0; i < N; i += 1) {
        increment(counts, rng.nextInt(1, 6));
      }
      const expectedPerFace = N / 6;
      for (let face = 1; face <= 6; face += 1) {
        const count = counts.get(face) ?? 0;
        expect(count).toBeGreaterThanOrEqual(expectedPerFace * 0.9);
        expect(count <= expectedPerFace * 1.1).toBe(true);
      }
    });
  });

  describe('choice — distribuição uniforme entre os itens', () => {
    it('cada item de uma lista de 4 é escolhido com frequência próxima de N/4', () => {
      const rng = RNG(seed('monte-carlo-choice'));
      const items = ['comum', 'incomum', 'raro', 'lendário'];
      const N = 40_000;
      const counts = new Map<string, number>();
      for (let i = 0; i < N; i += 1) {
        increment(counts, rng.choice(items));
      }
      const expectedPerItem = N / items.length;
      for (const item of items) {
        const count = counts.get(item) ?? 0;
        expect(count).toBeGreaterThan(0);
        expect(count).toBeGreaterThanOrEqual(expectedPerItem * 0.9);
        expect(count <= expectedPerItem * 1.1).toBe(true);
      }
    });
  });

  describe('weightedChoice — frequência proporcional ao peso', () => {
    it('a frequência empírica de cada item se aproxima da proporção de seu peso', () => {
      const rng = RNG(seed('monte-carlo-weighted'));
      const items = [
        { value: 'comum', weight: 1 },
        { value: 'incomum', weight: 2 },
        { value: 'raro', weight: 3 },
        { value: 'lendário', weight: 4 },
      ];
      const totalWeight = 10; // 1 + 2 + 3 + 4
      const N = 50_000;
      const counts = new Map<string, number>();
      for (let i = 0; i < N; i += 1) {
        increment(counts, rng.weightedChoice(items));
      }
      for (const item of items) {
        const count = counts.get(item.value) ?? 0;
        const expectedCount = N * (item.weight / totalWeight);
        expect(count).toBeGreaterThanOrEqual(expectedCount * 0.85);
        expect(count <= expectedCount * 1.15).toBe(true);
      }
    });
  });

  describe('shuffle — cada posição final é igualmente provável para cada elemento', () => {
    it('um elemento fixo cai em cada uma das 4 posições com frequência próxima de N/4', () => {
      const root = RNG(seed('monte-carlo-shuffle'));
      const items = ['A', 'B', 'C', 'D'];
      const N = 20_000;
      const positionCounts = new Map<number, number>();
      for (let i = 0; i < N; i += 1) {
        // deriva um stream novo a cada rodada para evitar qualquer
        // correlação serial entre embaralhamentos sucessivos
        const shuffled = root.derive(`rodada-${i}`).shuffle(items);
        increment(positionCounts, shuffled.indexOf('A'));
      }
      const expectedPerPosition = N / 4;
      for (let position = 0; position < 4; position += 1) {
        const count = positionCounts.get(position) ?? 0;
        expect(count).toBeGreaterThanOrEqual(expectedPerPosition * 0.85);
        expect(count <= expectedPerPosition * 1.15).toBe(true);
      }
    });

    it('mais da metade das 24 permutações possíveis de 4 elementos aparece em 3000 embaralhamentos', () => {
      const root = RNG(seed('monte-carlo-permutacoes'));
      const items = ['A', 'B', 'C', 'D'];
      const N = 3000;
      const seen = new Set<string>();
      for (let i = 0; i < N; i += 1) {
        const shuffled = root.derive(`permutacao-${i}`).shuffle(items);
        seen.add(shuffled.join(''));
      }
      expect(seen.size).toBeGreaterThanOrEqual(13); // mais da metade de 24
    });
  });
});
