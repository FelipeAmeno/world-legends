import { describe, expect, it } from 'vitest';
import {
  CRAFT_COSTS,
  calculateCraftCost,
  canAffordCraft,
  resolveCraftCost,
} from '../../src/costs/craft-cost';

describe('resolveCraftCost — elegibilidade + custo em um passo', () => {
  it('common retorna Ok(50)', () => {
    const r = resolveCraftCost('common', 'base');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(50);
  });

  it('rare retorna Ok(200)', () => {
    const r = resolveCraftCost('rare', 'base');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(200);
  });

  it('elite retorna Ok(600)', () => {
    const r = resolveCraftCost('elite', 'base');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(600);
  });

  it('legendary retorna Ok(1500)', () => {
    const r = resolveCraftCost('legendary', 'base');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(1_500);
  });

  it('ultra retorna Ok(4000)', () => {
    const r = resolveCraftCost('ultra', 'base');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(4_000);
  });

  it('TC-CRAFT-06: world_cup_hero retorna Err NotCraftable', () => {
    const r = resolveCraftCost('world_cup_hero', 'base');
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.kind === 'NotCraftable') {
      expect(r.error.reason).toBe('exclusive_event_drop');
    }
  });

  it('TC-CRAFT-07: edição goat retorna Err NotCraftable exclusive_achievement', () => {
    const r = resolveCraftCost('legendary', 'goat');
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.kind === 'NotCraftable') {
      expect(r.error.reason).toBe('exclusive_achievement');
    }
  });

  it('goat prevalece sobre world_cup_hero na ordem de verificação', () => {
    const r = resolveCraftCost('world_cup_hero', 'goat');
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.kind === 'NotCraftable') {
      expect(r.error.reason).toBe('exclusive_achievement');
    }
  });

  it('custo cresce com a raridade — custo(n) < custo(n+1)', () => {
    const rarities = ['common', 'rare', 'elite', 'legendary', 'ultra'] as const;
    const costs = rarities.map((r) => {
      const result = resolveCraftCost(r, 'base');
      return result.ok ? result.value : -1;
    });
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1]!);
    }
  });
});

describe('calculateCraftCost — valores unitários (reexportado de economy)', () => {
  it('todos os valores batem com a tabela do doc 10 §17', () => {
    expect(calculateCraftCost('common').fragmentCost).toBe(50);
    expect(calculateCraftCost('rare').fragmentCost).toBe(200);
    expect(calculateCraftCost('elite').fragmentCost).toBe(600);
    expect(calculateCraftCost('legendary').fragmentCost).toBe(1_500);
    expect(calculateCraftCost('ultra').fragmentCost).toBe(4_000);
    expect(calculateCraftCost('world_cup_hero').isCraftable).toBe(false);
  });
});

describe('canAffordCraft — saldo suficiente / insuficiente', () => {
  it('saldo exato = affordable', () => {
    expect(canAffordCraft(1_500, 'legendary').affordable).toBe(true);
  });

  it('saldo maior = affordable', () => {
    expect(canAffordCraft(9_999, 'ultra').affordable).toBe(true);
  });

  it('saldo insuficiente = não affordable, shortfall correto', () => {
    const { affordable, shortfall } = canAffordCraft(1_000, 'legendary');
    expect(affordable).toBe(false);
    expect(shortfall).toBe(500);
  });

  it('WCH = não affordable mesmo com saldo infinito', () => {
    expect(canAffordCraft(999_999, 'world_cup_hero').affordable).toBe(false);
  });

  it('saldo zero para common = shortfall de 50', () => {
    const { affordable, shortfall } = canAffordCraft(0, 'common');
    expect(affordable).toBe(false);
    expect(shortfall).toBe(50);
  });
});

describe('CRAFT_COSTS — integridade da tabela exportada', () => {
  it('todos os custos definidos são inteiros positivos', () => {
    for (const [, cost] of Object.entries(CRAFT_COSTS)) {
      if (cost !== undefined) {
        expect(Number.isInteger(cost)).toBe(true);
        expect(cost).toBeGreaterThan(0);
      }
    }
  });
});
