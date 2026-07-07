import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_CATALOG, ALL_SET_CODES, VALID_CARD_IDS } from '../src/definitions.js';
import { AchievementService } from '../src/service.js';
import type { AchievementCheckInput } from '../src/types.js';

const service = new AchievementService();

function emptyInput(overrides: Partial<AchievementCheckInput> = {}): AchievementCheckInput {
  return {
    cardsOwnedIds: [],
    completedSetCodes: [],
    matchesPlayed: 0,
    wins: 0,
    goals: 0,
    currentWinStreak: 0,
    packsOpened: 0,
    streakDays: 0,
    dailyMissionsCompleted: 0,
    starterClaimed: false,
    ...overrides,
  };
}

// ─── checkCondition — cards_owned_count ────────────────────────────────────────

describe('checkCondition — cards_owned_count', () => {
  it('returns true when cardsOwnedIds.length === min (exact boundary)', () => {
    const input = emptyInput({ cardsOwnedIds: ['a', 'b', 'c'] });
    expect(service.checkCondition({ type: 'cards_owned_count', min: 3 }, input)).toBe(true);
  });

  it('returns false when cardsOwnedIds.length < min', () => {
    const input = emptyInput({ cardsOwnedIds: ['a', 'b'] });
    expect(service.checkCondition({ type: 'cards_owned_count', min: 3 }, input)).toBe(false);
  });

  it('returns true when cardsOwnedIds.length > min', () => {
    const input = emptyInput({ cardsOwnedIds: ['a', 'b', 'c', 'd'] });
    expect(service.checkCondition({ type: 'cards_owned_count', min: 3 }, input)).toBe(true);
  });
});

// ─── checkCondition — specific_cards_owned ────────────────────────────────────

describe('checkCondition — specific_cards_owned', () => {
  it('returns true when all specified cards are owned', () => {
    const input = emptyInput({
      cardsOwnedIds: ['pelé-world_cup_hero', 'ronaldo-ultra', 'ronaldinho-ultra'],
    });
    expect(
      service.checkCondition(
        {
          type: 'specific_cards_owned',
          cardIds: ['pelé-world_cup_hero', 'ronaldo-ultra'],
        },
        input,
      ),
    ).toBe(true);
  });

  it('returns false when one specified card is missing', () => {
    const input = emptyInput({ cardsOwnedIds: ['pelé-world_cup_hero'] });
    expect(
      service.checkCondition(
        {
          type: 'specific_cards_owned',
          cardIds: ['pelé-world_cup_hero', 'ronaldo-ultra'],
        },
        input,
      ),
    ).toBe(false);
  });
});

// ─── checkCondition — all_sets_completed ──────────────────────────────────────

describe('checkCondition — all_sets_completed', () => {
  it('returns true when all 6 set codes are in completedSetCodes', () => {
    const input = emptyInput({ completedSetCodes: [...ALL_SET_CODES] });
    expect(service.checkCondition({ type: 'all_sets_completed' }, input)).toBe(true);
  });

  it('returns false when a set code is missing', () => {
    const incomplete = ALL_SET_CODES.slice(0, ALL_SET_CODES.length - 1);
    const input = emptyInput({ completedSetCodes: [...incomplete] });
    expect(service.checkCondition({ type: 'all_sets_completed' }, input)).toBe(false);
  });
});

// ─── checkCondition — rarity_owned_count ─────────────────────────────────────

describe('checkCondition — rarity_owned_count', () => {
  it('returns true when owned legendary cards meet min', () => {
    const input = emptyInput({ cardsOwnedIds: ['zico-legendary', 'romario-legendary'] });
    expect(
      service.checkCondition({ type: 'rarity_owned_count', rarity: 'legendary', min: 2 }, input),
    ).toBe(true);
  });

  it('returns false when owned rarity count is below min', () => {
    const input = emptyInput({ cardsOwnedIds: ['zico-legendary'] });
    expect(
      service.checkCondition({ type: 'rarity_owned_count', rarity: 'legendary', min: 2 }, input),
    ).toBe(false);
  });

  it('high_rarity counts legendary + ultra + world_cup_hero together', () => {
    const input = emptyInput({
      cardsOwnedIds: ['zico-legendary', 'ronaldo-ultra', 'pelé-world_cup_hero'],
    });
    expect(
      service.checkCondition({ type: 'rarity_owned_count', rarity: 'high_rarity', min: 3 }, input),
    ).toBe(true);
  });
});

// ─── checkCondition — sets_completed ─────────────────────────────────────────

describe('checkCondition — sets_completed', () => {
  it('returns true when all specified set codes are completed', () => {
    const input = emptyInput({ completedSetCodes: ['artilheiros', 'copa_2002', 'lendas_br'] });
    expect(
      service.checkCondition(
        { type: 'sets_completed', setCodes: ['artilheiros', 'copa_2002'] },
        input,
      ),
    ).toBe(true);
  });
});

// ─── checkCondition — gameplay conditions ────────────────────────────────────

describe('checkCondition — gameplay conditions', () => {
  it('matches_played: returns true when count meets min', () => {
    expect(
      service.checkCondition(
        { type: 'matches_played', min: 10 },
        emptyInput({ matchesPlayed: 10 }),
      ),
    ).toBe(true);
  });

  it('wins: returns true when wins meets min', () => {
    expect(service.checkCondition({ type: 'wins', min: 50 }, emptyInput({ wins: 51 }))).toBe(true);
  });

  it('goals: returns true when goals meets min', () => {
    expect(service.checkCondition({ type: 'goals', min: 500 }, emptyInput({ goals: 500 }))).toBe(
      true,
    );
  });

  it('win_streak: returns true when currentWinStreak meets min', () => {
    expect(
      service.checkCondition({ type: 'win_streak', min: 10 }, emptyInput({ currentWinStreak: 10 })),
    ).toBe(true);
  });
});

// ─── checkCondition — packs / seasons ────────────────────────────────────────

describe('checkCondition — packs and seasons', () => {
  it('packs_opened: returns true when count meets min', () => {
    expect(
      service.checkCondition({ type: 'packs_opened', min: 50 }, emptyInput({ packsOpened: 50 })),
    ).toBe(true);
  });

  it('streak_days: returns true when streakDays meets min', () => {
    expect(
      service.checkCondition({ type: 'streak_days', min: 7 }, emptyInput({ streakDays: 7 })),
    ).toBe(true);
  });

  it('daily_missions_completed: returns true when count meets min', () => {
    expect(
      service.checkCondition(
        { type: 'daily_missions_completed', min: 10 },
        emptyInput({ dailyMissionsCompleted: 10 }),
      ),
    ).toBe(true);
  });

  it('starter_claimed: returns starterClaimed boolean directly', () => {
    expect(
      service.checkCondition({ type: 'starter_claimed' }, emptyInput({ starterClaimed: true })),
    ).toBe(true);
    expect(
      service.checkCondition({ type: 'starter_claimed' }, emptyInput({ starterClaimed: false })),
    ).toBe(false);
  });
});

// ─── computeNewlyUnlocked ─────────────────────────────────────────────────────

describe('computeNewlyUnlocked', () => {
  it('excludes defs that are already in alreadyUnlockedIds', () => {
    // event_starter and season_first_login both use starter_claimed
    const input = emptyInput({ starterClaimed: true });
    const alreadyUnlocked = new Set(['event_starter', 'season_first_login']);
    const result = service.computeNewlyUnlocked(input, alreadyUnlocked);
    const ids = result.map((d) => d.id);
    expect(ids).not.toContain('event_starter');
    expect(ids).not.toContain('season_first_login');
  });

  it('with starterClaimed=true and empty otherwise, returns event_starter', () => {
    const input = emptyInput({ starterClaimed: true });
    const result = service.computeNewlyUnlocked(input, new Set());
    const ids = result.map((d) => d.id);
    expect(ids).toContain('event_starter');
    expect(ids).toContain('season_first_login');
  });
});

// ─── buildViews ───────────────────────────────────────────────────────────────

describe('buildViews', () => {
  it('returns correct locked/unlocked state for each def', () => {
    const defs = ACHIEVEMENT_CATALOG.slice(0, 3);
    const now = new Date();
    const first = defs[0];
    if (!first) throw new Error('expected at least one achievement def');
    const unlockedMap = new Map([[first.id, { unlockedAt: now, rewardClaimed: true }]]);
    const views = service.buildViews(defs, unlockedMap);

    expect(views.length).toBe(3);
    expect(views[0]?.unlocked).toBe(true);
    expect(views[0]?.unlockedAt).toBe(now);
    expect(views[0]?.rewardClaimed).toBe(true);
    expect(views[1]?.unlocked).toBe(false);
    expect(views[1]?.unlockedAt).toBeNull();
    expect(views[1]?.rewardClaimed).toBe(false);
  });
});

// ─── groupByCategory ──────────────────────────────────────────────────────────

describe('groupByCategory', () => {
  it('returns a map with exactly 7 category groups when all achievements are present', () => {
    const views = service.buildViews(ACHIEVEMENT_CATALOG, new Map());
    const groups = service.groupByCategory(views);
    expect(groups.size).toBe(7);
    expect(groups.has('collection')).toBe(true);
    expect(groups.has('gameplay')).toBe(true);
    expect(groups.has('seasons')).toBe(true);
    expect(groups.has('events')).toBe(true);
    expect(groups.has('packs')).toBe(true);
    expect(groups.has('legends')).toBe(true);
    expect(groups.has('goat')).toBe(true);
  });
});

// ─── Full integration ─────────────────────────────────────────────────────────

describe('integration', () => {
  it('owner of all cards unlocks goat_supreme', () => {
    const input = emptyInput({ cardsOwnedIds: [...VALID_CARD_IDS] });
    const result = service.computeNewlyUnlocked(input, new Set());
    const ids = result.map((d) => d.id);
    expect(ids).toContain('goat_supreme');
  });
});
