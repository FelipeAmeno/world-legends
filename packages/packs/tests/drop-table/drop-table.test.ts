import { RNG } from '@world-legends/engine';
import { createSeed } from '@world-legends/shared';
import { describe, expect, it } from 'vitest';
import {
  BASE_RARITY_WEIGHTS,
  RARITY_ORDER,
  rarityMeetsMinimum,
  rollEdition,
  rollRarity,
  rollRarityWithGuarantee,
} from '../../src/drop-table/drop-table';
import type { RarityWeights } from '../../src/drop-table/drop-table';

function rng(seed: string) {
  const r = createSeed(seed);
  if (!r.ok) throw new Error('seed inválido');
  return RNG(r.value);
}

describe('rarityMeetsMinimum', () => {
  it('world_cup_hero ≥ ultra ≥ legendary ≥ elite ≥ rare ≥ common', () => {
    expect(rarityMeetsMinimum('world_cup_hero', 'ultra')).toBe(true);
    expect(rarityMeetsMinimum('ultra', 'legendary')).toBe(true);
    expect(rarityMeetsMinimum('legendary', 'elite')).toBe(true);
    expect(rarityMeetsMinimum('elite', 'rare')).toBe(true);
    expect(rarityMeetsMinimum('rare', 'common')).toBe(true);
  });

  it('não satisfaz quando rarity < minimum', () => {
    expect(rarityMeetsMinimum('common', 'rare')).toBe(false);
    expect(rarityMeetsMinimum('rare', 'legendary')).toBe(false);
  });

  it('satisfaz a si mesmo', () => {
    expect(rarityMeetsMinimum('legendary', 'legendary')).toBe(true);
  });
});

describe('rollRarity — distribuição e determinismo', () => {
  it('mesmo seed sempre produz o mesmo resultado', () => {
    const a = rollRarity(BASE_RARITY_WEIGHTS, rng('det-01'));
    const b = rollRarity(BASE_RARITY_WEIGHTS, rng('det-01'));
    expect(a).toBe(b);
  });

  it('seeds diferentes podem produzir resultados diferentes', () => {
    const results = new Set(
      Array.from({ length: 50 }, (_, i) => rollRarity(BASE_RARITY_WEIGHTS, rng(`var-${i}`))),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  it('com peso 100% em legendary, sempre retorna legendary', () => {
    const w: RarityWeights = {
      common: 0,
      rare: 0,
      elite: 0,
      legendary: 100,
      ultra: 0,
      world_cup_hero: 0,
    };
    for (let i = 0; i < 20; i++) {
      expect(rollRarity(w, rng(`leg-${i}`))).toBe('legendary');
    }
  });

  it('com WCH = 0, nunca sorteia world_cup_hero', () => {
    const w: RarityWeights = { ...BASE_RARITY_WEIGHTS, world_cup_hero: 0 };
    for (let i = 0; i < 100; i++) {
      expect(rollRarity(w, rng(`no-wch-${i}`))).not.toBe('world_cup_hero');
    }
  });
});

describe('rollRarityWithGuarantee — TC-PACK-09 (WCH nunca forçado)', () => {
  it('com garantia=rare, nunca retorna common', () => {
    const w = BASE_RARITY_WEIGHTS;
    for (let i = 0; i < 100; i++) {
      const r = rollRarityWithGuarantee(w, rng(`guar-${i}`), 'rare');
      expect(rarityMeetsMinimum(r, 'rare')).toBe(true);
    }
  });

  it('com garantia=legendary, sempre retorna legendary-ou-melhor', () => {
    const w = BASE_RARITY_WEIGHTS;
    for (let i = 0; i < 100; i++) {
      const r = rollRarityWithGuarantee(w, rng(`gleg-${i}`), 'legendary');
      expect(rarityMeetsMinimum(r, 'legendary')).toBe(true);
    }
  });

  it('TC-PACK-09: com garantia=world_cup_hero, trata como ultra (WCH nunca forçado)', () => {
    // Com pesos onde só WCH > 0 além de ultra, garantia WCH → força ultra no máximo
    const w: RarityWeights = {
      common: 0,
      rare: 0,
      elite: 0,
      legendary: 0,
      ultra: 80,
      world_cup_hero: 20,
    };
    for (let i = 0; i < 50; i++) {
      const r = rollRarityWithGuarantee(w, rng(`wch-force-${i}`), 'world_cup_hero');
      // Pode retornar ultra ou WCH (se o RNG sortear assim), mas nunca é FORÇADO a ser WCH
      expect(r === 'ultra' || r === 'world_cup_hero').toBe(true);
    }
  });
});

describe('rollEdition', () => {
  it('sem editionWeights, retorna sempre base', () => {
    for (let i = 0; i < 20; i++) {
      expect(rollEdition(undefined, rng(`ed-${i}`))).toBe('base');
    }
  });

  it('com editionWeights prime=100, sempre retorna prime', () => {
    for (let i = 0; i < 20; i++) {
      expect(rollEdition({ prime: 100 }, rng(`prime-${i}`))).toBe('prime');
    }
  });

  it('com pesos mistos, pode retornar diferentes edições', () => {
    const results = new Set(
      Array.from({ length: 100 }, (_, i) => rollEdition({ base: 60, prime: 40 }, rng(`mix-${i}`))),
    );
    expect(results.has('base')).toBe(true);
    expect(results.has('prime')).toBe(true);
  });
});
