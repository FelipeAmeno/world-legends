import { describe, expect, it } from 'vitest';
import { getAllRarities, getRarity, isOverallInRange } from '../../src/rarity/rarity';

describe('getRarity (doc 10 §4)', () => {
  it('retorna a raridade correta para cada código', () => {
    expect(getRarity('common').label).toBe('Common');
    expect(getRarity('world_cup_hero').label).toBe('World Cup Hero');
  });

  it('todos os 6 códigos de raridade existem', () => {
    const all = getAllRarities();
    expect(all.length).toBe(6);
  });

  it('multiplicadores batem com a tabela do doc 10 §6', () => {
    expect(getRarity('common').attributeMultiplier).toBe(1.0);
    expect(getRarity('rare').attributeMultiplier).toBe(1.06);
    expect(getRarity('elite').attributeMultiplier).toBe(1.12);
    expect(getRarity('legendary').attributeMultiplier).toBe(1.18);
    expect(getRarity('ultra').attributeMultiplier).toBe(1.25);
    expect(getRarity('world_cup_hero').attributeMultiplier).toBe(1.3);
  });

  it('faixas de Overall batem com a tabela (doc 10 §4)', () => {
    expect(getRarity('common').overallFloor).toBe(55);
    expect(getRarity('common').overallCeiling).toBe(72);
    expect(getRarity('world_cup_hero').overallFloor).toBe(95);
    expect(getRarity('world_cup_hero').overallCeiling).toBe(99);
  });

  it('lança erro para código inválido', () => {
    expect(() => getRarity('invalid' as never)).toThrow();
  });
});

describe('isOverallInRange (invariante de Card, doc 17 §5)', () => {
  it('retorna true quando dentro da faixa', () => {
    expect(isOverallInRange(65, getRarity('common'))).toBe(true);
    expect(isOverallInRange(55, getRarity('common'))).toBe(true);
    expect(isOverallInRange(72, getRarity('common'))).toBe(true);
  });

  it('retorna false fora da faixa', () => {
    expect(isOverallInRange(54, getRarity('common'))).toBe(false);
    expect(isOverallInRange(73, getRarity('common'))).toBe(false);
  });
});
