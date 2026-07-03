import { describe, expect, it } from 'vitest';
import { rarityMeetsMinimum } from '../../src/drop-table/drop-table';
import {
  CLASSIC_PACK,
  COPA_HERO_PACK,
  ELITE_PACK,
  LEGEND_PACK,
  PRIME_PACK,
} from '../../src/pack/pack-definitions';

describe('CLASSIC_PACK — estrutura (doc 10 §14, TC-PACK-01)', () => {
  it('tem exatamente 5 slots', () => {
    expect(CLASSIC_PACK.cardsPerPack).toBe(5);
    expect(CLASSIC_PACK.dropTable.slots.length).toBe(5);
  });

  it('slot 0 tem garantia Rare-ou-melhor', () => {
    const slot0 = CLASSIC_PACK.dropTable.slots[0]!;
    expect(slot0.guaranteedMinRarity).toBe('rare');
  });

  it('WCH tem peso 0 em todos os slots (não cai em pack clássico)', () => {
    for (const slot of CLASSIC_PACK.dropTable.slots) {
      expect(slot.rarityWeights.world_cup_hero).toBe(0);
    }
  });

  it('slots 1-4 não têm garantia própria', () => {
    for (let i = 1; i < 5; i++) {
      expect(CLASSIC_PACK.dropTable.slots[i]?.guaranteedMinRarity).toBeUndefined();
    }
  });
});

describe('ELITE_PACK — estrutura (doc 10 §14, TC-PACK-02)', () => {
  it('tem exatamente 5 slots', () => {
    expect(ELITE_PACK.cardsPerPack).toBe(5);
    expect(ELITE_PACK.dropTable.slots.length).toBe(5);
  });

  it('slots 0 e 1 têm garantia Elite-ou-melhor', () => {
    expect(ELITE_PACK.dropTable.slots[0]?.guaranteedMinRarity).toBe('elite');
    expect(ELITE_PACK.dropTable.slots[1]?.guaranteedMinRarity).toBe('elite');
  });

  it('slots 0-1 têm common=0 e rare=0 (não desperdiça garantia em raridades baixas)', () => {
    for (let i = 0; i < 2; i++) {
      const slot = ELITE_PACK.dropTable.slots[i]!;
      expect(slot.rarityWeights.common).toBe(0);
      expect(slot.rarityWeights.rare).toBe(0);
    }
  });
});

describe('LEGEND_PACK — estrutura (doc 10 §14, TC-PACK-03)', () => {
  it('tem exatamente 3 slots', () => {
    expect(LEGEND_PACK.cardsPerPack).toBe(3);
    expect(LEGEND_PACK.dropTable.slots.length).toBe(3);
  });

  it('slot 0 é o "hit": garantia Legendary-ou-melhor', () => {
    const hit = LEGEND_PACK.dropTable.slots[0]!;
    expect(hit.guaranteedMinRarity).toBe('legendary');
    // Common/Rare/Elite têm peso 0 no slot hit
    expect(hit.rarityWeights.common).toBe(0);
    expect(hit.rarityWeights.rare).toBe(0);
    expect(hit.rarityWeights.elite).toBe(0);
  });

  it('slot hit permite WCH (WCH ≥ Legendary — é um resultado ainda melhor, não deve ser bloqueado)', () => {
    // Decisão: WCH tem peso positivo no slot hit do Lenda (5%)
    expect(LEGEND_PACK.dropTable.slots[0]?.rarityWeights.world_cup_hero).toBeGreaterThan(0);
  });
});

describe('PRIME_PACK — estrutura (doc 10 §14, TC-PACK-04)', () => {
  it('tem exatamente 3 slots', () => {
    expect(PRIME_PACK.cardsPerPack).toBe(3);
    expect(PRIME_PACK.dropTable.slots.length).toBe(3);
  });

  it('slot 0 tem editionWeights prime=100 (garante edição Prime)', () => {
    const primeSlot = PRIME_PACK.dropTable.slots[0]!;
    expect(primeSlot.editionWeights?.prime).toBe(100);
    expect(primeSlot.guaranteedMinRarity).toBe('rare');
  });

  it('slot prime só sorteia raridades válidas para Prime: rare/elite/legendary (doc 10 §9)', () => {
    const slot = PRIME_PACK.dropTable.slots[0]!;
    expect(slot.rarityWeights.common).toBe(0);
    expect(slot.rarityWeights.ultra).toBe(0);
    expect(slot.rarityWeights.world_cup_hero).toBe(0);
    // rare, elite, legendary têm peso > 0
    expect(slot.rarityWeights.rare).toBeGreaterThan(0);
    expect(slot.rarityWeights.elite).toBeGreaterThan(0);
    expect(slot.rarityWeights.legendary).toBeGreaterThan(0);
  });
});

describe('COPA_HERO_PACK — estrutura (doc 10 §14, TC-PACK-05)', () => {
  it('tem exatamente 2 slots', () => {
    expect(COPA_HERO_PACK.cardsPerPack).toBe(2);
    expect(COPA_HERO_PACK.dropTable.slots.length).toBe(2);
  });

  it('slot 0 tem peso 100 em world_cup_hero e garantia WCH', () => {
    const wchSlot = COPA_HERO_PACK.dropTable.slots[0]!;
    expect(wchSlot.rarityWeights.world_cup_hero).toBe(100);
    expect(wchSlot.guaranteedMinRarity).toBe('world_cup_hero');
  });

  it('slot 1 é livre sem WCH', () => {
    expect(COPA_HERO_PACK.dropTable.slots[1]?.rarityWeights.world_cup_hero).toBe(0);
  });
});
