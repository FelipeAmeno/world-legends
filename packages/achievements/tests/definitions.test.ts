import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENT_CATALOG,
  ALL_SET_CODES,
  VALID_CARD_IDS,
} from '../src/definitions.js';
import type { AchievementCategory } from '../src/types.js';

describe('ACHIEVEMENT_CATALOG — definitions', () => {
  it('has exactly 42 achievements', () => {
    expect(ACHIEVEMENT_CATALOG.length).toBe(42);
  });

  it('all IDs are unique', () => {
    const ids = ACHIEVEMENT_CATALOG.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(42);
  });

  it('each category has exactly 6 achievements', () => {
    const categories: AchievementCategory[] = [
      'collection',
      'gameplay',
      'seasons',
      'events',
      'packs',
      'legends',
      'goat',
    ];
    for (const cat of categories) {
      const count = ACHIEVEMENT_CATALOG.filter((a) => a.category === cat).length;
      expect(count, `category "${cat}" should have 6 achievements`).toBe(6);
    }
  });

  it('each achievement has positive xp and a defined reward', () => {
    for (const def of ACHIEVEMENT_CATALOG) {
      expect(def.xp, `"${def.id}" xp should be > 0`).toBeGreaterThan(0);
      expect(def.reward, `"${def.id}" should have a reward`).toBeDefined();
      expect(def.reward.amount, `"${def.id}" reward.amount should be > 0`).toBeGreaterThan(0);
    }
  });

  it('GOAT rarity count is exactly 1', () => {
    const goatRarityDefs = ACHIEVEMENT_CATALOG.filter((a) => a.rarity === 'goat');
    expect(goatRarityDefs.length).toBe(1);
    expect(goatRarityDefs[0]?.id).toBe('goat_supreme');
  });

  it('legendary rarity count is at least 5', () => {
    const legendaryCount = ACHIEVEMENT_CATALOG.filter((a) => a.rarity === 'legendary').length;
    expect(legendaryCount).toBeGreaterThanOrEqual(5);
  });

  it('all sortOrder values are positive', () => {
    for (const def of ACHIEVEMENT_CATALOG) {
      expect(def.sortOrder, `"${def.id}" sortOrder should be > 0`).toBeGreaterThan(0);
    }
  });

  it('goat_supreme requires all 4 ultra/wcH cards', () => {
    const supreme = ACHIEVEMENT_CATALOG.find((a) => a.id === 'goat_supreme');
    expect(supreme).toBeDefined();
    expect(supreme?.condition.type).toBe('specific_cards_owned');
    if (supreme?.condition.type === 'specific_cards_owned') {
      const requiredIds = supreme.condition.cardIds;
      expect(requiredIds).toContain('pelé-world_cup_hero');
      expect(requiredIds).toContain('ronaldo-ultra');
      expect(requiredIds).toContain('ronaldinho-ultra');
      expect(requiredIds).toContain('maradona-world_cup_hero');
      expect(requiredIds.length).toBe(4);
    }
  });

  it('coll_album_completo condition type is all_sets_completed', () => {
    const albumCompleto = ACHIEVEMENT_CATALOG.find((a) => a.id === 'coll_album_completo');
    expect(albumCompleto).toBeDefined();
    expect(albumCompleto?.condition.type).toBe('all_sets_completed');
  });

  it('all specific_cards_owned conditions reference valid card IDs', () => {
    const validIds = new Set<string>(VALID_CARD_IDS);
    const specificCardAchievements = ACHIEVEMENT_CATALOG.filter(
      (a) => a.condition.type === 'specific_cards_owned',
    );
    expect(specificCardAchievements.length).toBeGreaterThan(0);
    for (const def of specificCardAchievements) {
      if (def.condition.type === 'specific_cards_owned') {
        for (const cardId of def.condition.cardIds) {
          expect(
            validIds.has(cardId),
            `"${def.id}" references unknown cardId "${cardId}"`,
          ).toBe(true);
        }
      }
    }
  });
});

describe('ALL_SET_CODES', () => {
  it('has exactly 6 set codes', () => {
    expect(ALL_SET_CODES.length).toBe(6);
  });
});
