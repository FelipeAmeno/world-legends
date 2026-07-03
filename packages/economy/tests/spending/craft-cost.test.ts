import { describe, expect, it } from 'vitest';
import { CRAFT_COSTS, calculateCraftCost, canAffordCraft } from '../../src/spending/craft-cost';

describe('calculateCraftCost — tabela exata doc 10 §17', () => {
  it('Common = 50 fragmentos', () => {
    const r = calculateCraftCost('common');
    expect(r.isCraftable).toBe(true);
    expect(r.fragmentCost).toBe(50);
  });

  it('Rare = 200 fragmentos', () => {
    const r = calculateCraftCost('rare');
    expect(r.fragmentCost).toBe(200);
  });

  it('Elite = 600 fragmentos', () => {
    expect(calculateCraftCost('elite').fragmentCost).toBe(600);
  });

  it('Legendary = 1500 fragmentos', () => {
    expect(calculateCraftCost('legendary').fragmentCost).toBe(1_500);
  });

  it('Ultra = 4000 fragmentos', () => {
    expect(calculateCraftCost('ultra').fragmentCost).toBe(4_000);
  });

  it('World Cup Hero: NÃO CRAFTÁVEL (doc 10 §17, TC-ECO-04)', () => {
    const r = calculateCraftCost('world_cup_hero');
    expect(r.isCraftable).toBe(false);
    expect(r.fragmentCost).toBe(0);
    expect(r.notCraftableReason).toBe('exclusive_event_drop');
  });

  it('custo cresce monotonamente com a raridade', () => {
    const costs = (['common', 'rare', 'elite', 'legendary', 'ultra'] as const).map(
      (r) => calculateCraftCost(r).fragmentCost,
    );
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1]!);
    }
  });

  it('retorna imutável (Object.freeze)', () => {
    expect(Object.isFrozen(calculateCraftCost('rare'))).toBe(true);
  });

  it('rarityCode é preservado no resultado', () => {
    expect(calculateCraftCost('legendary').rarityCode).toBe('legendary');
  });
});

describe('canAffordCraft — verificação de saldo', () => {
  it('saldo exatamente igual ao custo = affordable', () => {
    const { affordable, shortfall } = canAffordCraft(1_500, 'legendary');
    expect(affordable).toBe(true);
    expect(shortfall).toBe(0);
  });

  it('saldo maior que o custo = affordable, shortfall 0', () => {
    const { affordable, shortfall } = canAffordCraft(2_000, 'legendary');
    expect(affordable).toBe(true);
    expect(shortfall).toBe(0);
  });

  it('saldo menor que o custo = não affordable, shortfall correto', () => {
    const { affordable, shortfall } = canAffordCraft(1_000, 'legendary'); // precisa 1500
    expect(affordable).toBe(false);
    expect(shortfall).toBe(500);
  });

  it('World Cup Hero = não affordable independente do saldo (não craftável)', () => {
    const { affordable } = canAffordCraft(999_999, 'world_cup_hero');
    expect(affordable).toBe(false);
  });

  it('saldo zero para common (custo 50) = não affordable, shortfall = 50', () => {
    const { affordable, shortfall } = canAffordCraft(0, 'common');
    expect(affordable).toBe(false);
    expect(shortfall).toBe(50);
  });
});

describe('CRAFT_COSTS — integridade da tabela', () => {
  it('todos os custos são inteiros positivos', () => {
    for (const [, cost] of Object.entries(CRAFT_COSTS)) {
      if (cost !== undefined) {
        expect(Number.isInteger(cost)).toBe(true);
        expect(cost).toBeGreaterThan(0);
      }
    }
  });
});
