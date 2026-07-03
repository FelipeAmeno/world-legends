import { createSeed, unwrapResult } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import { RNG } from '../../src/rng/rng';

function seed(value: string) {
  return unwrapResult(createSeed(value));
}

/**
 * Estes testes não validam comportamento (já cobertos em rng.test.ts), só
 * uma propriedade: dado o MESMO Seed, duas instâncias de RNG criadas de
 * forma totalmente independente produzem, sempre, a sequência idêntica de
 * resultados — em qualquer máquina, em qualquer execução, sem excessão.
 * Esta é a exigência central da Tarefa T003.
 */
describe('RNG — reprodutibilidade', () => {
  it('nextFloat: o mesmo seed produz a mesma sequência de N floats', () => {
    const a = RNG(seed('reproduzir-floats'));
    const b = RNG(seed('reproduzir-floats'));
    const sequenceA = Array.from({ length: 50 }, () => a.nextFloat());
    const sequenceB = Array.from({ length: 50 }, () => b.nextFloat());
    expect(sequenceA).toEqual(sequenceB);
  });

  it('nextInt: o mesmo seed produz a mesma sequência de N inteiros', () => {
    const a = RNG(seed('reproduzir-ints'));
    const b = RNG(seed('reproduzir-ints'));
    const sequenceA = Array.from({ length: 50 }, () => a.nextInt(1, 100));
    const sequenceB = Array.from({ length: 50 }, () => b.nextInt(1, 100));
    expect(sequenceA).toEqual(sequenceB);
  });

  it('shuffle: o mesmo seed produz exatamente o mesmo embaralhamento', () => {
    const items = ['Pelé', 'Maradona', 'Zidane', 'Ronaldo', 'Cruyff'];
    const a = RNG(seed('reproduzir-shuffle'));
    const b = RNG(seed('reproduzir-shuffle'));
    expect(a.shuffle(items)).toEqual(b.shuffle(items));
  });

  it('choice: o mesmo seed produz exatamente as mesmas escolhas em sequência', () => {
    const items = ['ouro', 'prata', 'bronze', 'nenhuma'];
    const a = RNG(seed('reproduzir-choice'));
    const b = RNG(seed('reproduzir-choice'));
    const picksA = Array.from({ length: 30 }, () => a.choice(items));
    const picksB = Array.from({ length: 30 }, () => b.choice(items));
    expect(picksA).toEqual(picksB);
  });

  it('weightedChoice: o mesmo seed produz exatamente as mesmas escolhas em sequência', () => {
    const items = [
      { value: 'comum', weight: 70 },
      { value: 'raro', weight: 25 },
      { value: 'épico', weight: 5 },
    ];
    const a = RNG(seed('reproduzir-weighted'));
    const b = RNG(seed('reproduzir-weighted'));
    const picksA = Array.from({ length: 30 }, () => a.weightedChoice(items));
    const picksB = Array.from({ length: 30 }, () => b.weightedChoice(items));
    expect(picksA).toEqual(picksB);
  });

  it('seeds diferentes produzem sequências diferentes', () => {
    const a = RNG(seed('seed-x'));
    const b = RNG(seed('seed-y'));
    expect(a.nextFloat()).not.toBe(b.nextFloat());
  });

  describe('derive', () => {
    it('o mesmo par (seed pai, rótulo) sempre deriva a mesma sequência', () => {
      const parentA = RNG(seed('partida-fixa'));
      const parentB = RNG(seed('partida-fixa'));
      const streamA = parentA.derive('events');
      const streamB = parentB.derive('events');
      const sequenceA = Array.from({ length: 30 }, () => streamA.nextFloat());
      const sequenceB = Array.from({ length: 30 }, () => streamB.nextFloat());
      expect(sequenceA).toEqual(sequenceB);
    });

    it('rótulos diferentes a partir do mesmo pai produzem sequências diferentes', () => {
      const parent = RNG(seed('partida-fixa'));
      const events = parent.derive('events');
      const weather = parent.derive('weather');
      expect(events.nextFloat()).not.toBe(weather.nextFloat());
    });

    it('a derivação é independente de quanto o RNG pai já foi consumido', () => {
      // Consumir o pai antes de derivar não deve alterar o stream derivado —
      // a derivação parte sempre do Seed original, nunca do estado numérico
      // atual (docs/09-match-engine-master.md, §21).
      const freshParent = RNG(seed('consumo-nao-afeta-derive'));
      const freshDerived = freshParent.derive('penalty_tiebreak');

      const consumedParent = RNG(seed('consumo-nao-afeta-derive'));
      consumedParent.nextFloat();
      consumedParent.nextFloat();
      consumedParent.nextFloat();
      const derivedAfterConsumption = consumedParent.derive('penalty_tiebreak');

      expect(freshDerived.nextFloat()).toBe(derivedAfterConsumption.nextFloat());
    });

    it('cobre todos os seis streams nomeados no doc 09 §21 sem colisão entre eles', () => {
      const parent = RNG(seed('todos-os-streams'));
      const labels = ['events', 'weather', 'cards', 'injuries', 'narrative', 'penalty_tiebreak'];
      const firstValues = labels.map((label) => parent.derive(label).nextFloat());
      expect(new Set(firstValues).size).toBe(labels.length);
    });
  });
});
