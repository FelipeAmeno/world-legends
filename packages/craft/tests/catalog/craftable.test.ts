import { describe, expect, it } from 'vitest';
import {
  CRAFTABLE_RARITIES,
  NON_CRAFTABLE_RARITIES,
  checkCraftEligibility,
} from '../../src/catalog/craftable';

describe('checkCraftEligibility — raridades craftáveis', () => {
  it('common/rare/elite/legendary/ultra são craftáveis', () => {
    for (const rarity of CRAFTABLE_RARITIES) {
      const result = checkCraftEligibility(rarity, 'base');
      expect(result.eligible).toBe(true);
    }
  });

  it('edição prime sobre raridade craftável é elegível', () => {
    expect(checkCraftEligibility('legendary', 'prime').eligible).toBe(true);
  });

  it('edição event sobre raridade craftável é elegível', () => {
    expect(checkCraftEligibility('elite', 'event').eligible).toBe(true);
  });
});

describe('TC-CRAFT-06 — World Cup Hero bloqueado', () => {
  it('world_cup_hero retorna eligible=false', () => {
    const r = checkCraftEligibility('world_cup_hero', 'base');
    expect(r.eligible).toBe(false);
  });

  it('world_cup_hero retorna NotCraftable com reason exclusive_event_drop', () => {
    const r = checkCraftEligibility('world_cup_hero', 'base');
    if (!r.eligible) {
      expect(r.error.kind).toBe('NotCraftable');
      expect(r.error.reason).toBe('exclusive_event_drop');
      expect(r.error.rarityCode).toBe('world_cup_hero');
    }
  });

  it('world_cup_hero bloqueado mesmo com edição base/prime/event (raridade prevalece)', () => {
    for (const edition of ['base', 'prime', 'event'] as const) {
      expect(checkCraftEligibility('world_cup_hero', edition).eligible).toBe(false);
    }
  });
});

describe('TC-CRAFT-07 — edição GOAT bloqueada', () => {
  it('edição goat retorna eligible=false independente da raridade', () => {
    for (const rarity of CRAFTABLE_RARITIES) {
      const r = checkCraftEligibility(rarity, 'goat');
      expect(r.eligible).toBe(false);
    }
  });

  it('edição goat retorna NotCraftable com reason exclusive_achievement', () => {
    const r = checkCraftEligibility('ultra', 'goat');
    if (!r.eligible) {
      expect(r.error.kind).toBe('NotCraftable');
      expect(r.error.reason).toBe('exclusive_achievement');
    }
  });

  it('world_cup_hero + goat: razão de bloqueio é exclusive_achievement (goat verificado primeiro)', () => {
    const r = checkCraftEligibility('world_cup_hero', 'goat');
    if (!r.eligible) {
      expect(r.error.reason).toBe('exclusive_achievement');
    }
  });
});

describe('CRAFTABLE_RARITIES / NON_CRAFTABLE_RARITIES', () => {
  it('CRAFTABLE_RARITIES tem exatamente 5 raridades', () => {
    expect(CRAFTABLE_RARITIES.length).toBe(5);
  });

  it('world_cup_hero está em NON_CRAFTABLE_RARITIES', () => {
    expect(NON_CRAFTABLE_RARITIES.includes('world_cup_hero')).toBe(true);
  });

  it('conjuntos são disjuntos', () => {
    for (const r of CRAFTABLE_RARITIES) {
      expect(NON_CRAFTABLE_RARITIES.includes(r)).toBe(false);
    }
  });
});
