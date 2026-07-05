/**
 * tests/lib/achievements.test.ts
 *
 * Tests for the @world-legends/achievements domain as used from apps/web.
 * No DB, no Server Actions — pure domain logic.
 */

import {
  ACHIEVEMENT_CATALOG,
  type AchievementCheckInput,
  AchievementService,
} from '@world-legends/achievements';
import { describe, expect, it } from 'vitest';

const svc = new AchievementService();

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const EMPTY_INPUT: AchievementCheckInput = {
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
};

const ALL_CARDS = [
  'pelé-world_cup_hero',
  'ronaldo-ultra',
  'ronaldinho-ultra',
  'maradona-world_cup_hero',
  'zico-legendary',
  'romario-legendary',
  'roberto-carlos-legendary',
  'kaka-legendary',
  'cafu-legendary',
  'rivaldo-legendary',
  'taffarel-elite',
  'lucio-elite',
  'falcao-elite',
  'socrates-rare',
  'bebeto-rare',
  'adriano-elite',
];

const ALL_SETS = [
  'artilheiros',
  'meio_campo_de_ouro',
  'muralha_verde_amarela',
  'copa_2002',
  'lendas_do_brasil',
  'album_completo',
];

const FULL_INPUT: AchievementCheckInput = {
  cardsOwnedIds: ALL_CARDS,
  completedSetCodes: ALL_SETS,
  matchesPlayed: 100,
  wins: 100,
  goals: 500,
  currentWinStreak: 10,
  packsOpened: 100,
  streakDays: 30,
  dailyMissionsCompleted: 20,
  starterClaimed: true,
};

// ─── Catalog integrity ────────────────────────────────────────────────────────

describe('ACHIEVEMENT_CATALOG', () => {
  it('has exactly 42 achievements', () => {
    expect(ACHIEVEMENT_CATALOG.length).toBe(42);
  });

  it('IDs are unique', () => {
    const ids = new Set(ACHIEVEMENT_CATALOG.map((a) => a.id));
    expect(ids.size).toBe(42);
  });

  it('each category has exactly 6 achievements', () => {
    const categories = ['collection', 'gameplay', 'seasons', 'events', 'packs', 'legends', 'goat'];
    for (const cat of categories) {
      const count = ACHIEVEMENT_CATALOG.filter((a) => a.category === cat).length;
      expect(count, `${cat} should have 6`).toBe(6);
    }
  });

  it('all achievements have positive XP', () => {
    for (const a of ACHIEVEMENT_CATALOG) {
      expect(a.xp, `${a.id} should have positive XP`).toBeGreaterThan(0);
    }
  });

  it('GOAT rarity count is 1 (goat_supreme)', () => {
    const goatRarities = ACHIEVEMENT_CATALOG.filter((a) => a.rarity === 'goat');
    expect(goatRarities.length).toBe(1);
    expect(goatRarities[0]?.id).toBe('goat_supreme');
  });

  it('goat_supreme requires all 4 ultra/wcH cards', () => {
    const def = ACHIEVEMENT_CATALOG.find((a) => a.id === 'goat_supreme')!;
    expect(def.condition.type).toBe('specific_cards_owned');
    if (def.condition.type === 'specific_cards_owned') {
      expect(def.condition.cardIds).toContain('pelé-world_cup_hero');
      expect(def.condition.cardIds).toContain('ronaldo-ultra');
      expect(def.condition.cardIds).toContain('ronaldinho-ultra');
      expect(def.condition.cardIds).toContain('maradona-world_cup_hero');
      expect(def.condition.cardIds.length).toBe(4);
    }
  });

  it('coll_album_completo condition is all_sets_completed', () => {
    const def = ACHIEVEMENT_CATALOG.find((a) => a.id === 'coll_album_completo')!;
    expect(def.condition.type).toBe('all_sets_completed');
  });
});

// ─── AchievementService.checkCondition ───────────────────────────────────────

describe('AchievementService.checkCondition', () => {
  it('cards_owned_count: passes when equal to min', () => {
    const result = svc.checkCondition(
      { type: 'cards_owned_count', min: 3 },
      { ...EMPTY_INPUT, cardsOwnedIds: ['a', 'b', 'c'] },
    );
    expect(result).toBe(true);
  });

  it('cards_owned_count: fails when below min', () => {
    const result = svc.checkCondition(
      { type: 'cards_owned_count', min: 5 },
      { ...EMPTY_INPUT, cardsOwnedIds: ['a', 'b'] },
    );
    expect(result).toBe(false);
  });

  it('specific_cards_owned: passes when all required cards present', () => {
    expect(
      svc.checkCondition(
        { type: 'specific_cards_owned', cardIds: ['pelé-world_cup_hero', 'ronaldo-ultra'] },
        { ...EMPTY_INPUT, cardsOwnedIds: ['pelé-world_cup_hero', 'ronaldo-ultra', 'extra-card'] },
      ),
    ).toBe(true);
  });

  it('specific_cards_owned: fails when one required card missing', () => {
    expect(
      svc.checkCondition(
        { type: 'specific_cards_owned', cardIds: ['pelé-world_cup_hero', 'ronaldo-ultra'] },
        { ...EMPTY_INPUT, cardsOwnedIds: ['pelé-world_cup_hero'] },
      ),
    ).toBe(false);
  });

  it('all_sets_completed: passes when all 6 sets in completedSetCodes', () => {
    expect(
      svc.checkCondition(
        { type: 'all_sets_completed' },
        { ...EMPTY_INPUT, completedSetCodes: ALL_SETS },
      ),
    ).toBe(true);
  });

  it('all_sets_completed: fails when one set missing', () => {
    expect(
      svc.checkCondition(
        { type: 'all_sets_completed' },
        { ...EMPTY_INPUT, completedSetCodes: ALL_SETS.slice(0, 5) },
      ),
    ).toBe(false);
  });

  it('matches_played: boundary check', () => {
    expect(
      svc.checkCondition(
        { type: 'matches_played', min: 10 },
        { ...EMPTY_INPUT, matchesPlayed: 10 },
      ),
    ).toBe(true);
    expect(
      svc.checkCondition({ type: 'matches_played', min: 10 }, { ...EMPTY_INPUT, matchesPlayed: 9 }),
    ).toBe(false);
  });

  it('win_streak: passes at threshold', () => {
    expect(
      svc.checkCondition({ type: 'win_streak', min: 10 }, { ...EMPTY_INPUT, currentWinStreak: 10 }),
    ).toBe(true);
  });

  it('starter_claimed: reflects input flag', () => {
    expect(
      svc.checkCondition({ type: 'starter_claimed' }, { ...EMPTY_INPUT, starterClaimed: true }),
    ).toBe(true);
    expect(
      svc.checkCondition({ type: 'starter_claimed' }, { ...EMPTY_INPUT, starterClaimed: false }),
    ).toBe(false);
  });
});

// ─── AchievementService.computeNewlyUnlocked ─────────────────────────────────

describe('AchievementService.computeNewlyUnlocked', () => {
  it('empty input → no achievements unlocked', () => {
    const result = svc.computeNewlyUnlocked(EMPTY_INPUT, new Set());
    expect(result.length).toBe(0);
  });

  it('full input → all 42 achievements unlocked', () => {
    const result = svc.computeNewlyUnlocked(FULL_INPUT, new Set());
    expect(result.length).toBe(42);
  });

  it('already-unlocked IDs are excluded', () => {
    const alreadyUnlocked = new Set(ACHIEVEMENT_CATALOG.map((a) => a.id));
    const result = svc.computeNewlyUnlocked(FULL_INPUT, alreadyUnlocked);
    expect(result.length).toBe(0);
  });

  it('owning pelé unlocks legend_pele', () => {
    const result = svc.computeNewlyUnlocked(
      { ...EMPTY_INPUT, cardsOwnedIds: ['pelé-world_cup_hero'] },
      new Set(),
    );
    expect(result.some((d) => d.id === 'legend_pele')).toBe(true);
  });

  it('goat_supreme requires all 4 cards', () => {
    // Only 3 cards — should NOT unlock goat_supreme
    const partial = svc.computeNewlyUnlocked(
      {
        ...EMPTY_INPUT,
        cardsOwnedIds: ['pelé-world_cup_hero', 'ronaldo-ultra', 'ronaldinho-ultra'],
      },
      new Set(),
    );
    expect(partial.some((d) => d.id === 'goat_supreme')).toBe(false);

    // All 4 — should unlock
    const full = svc.computeNewlyUnlocked(FULL_INPUT, new Set());
    expect(full.some((d) => d.id === 'goat_supreme')).toBe(true);
  });
});

// ─── AchievementService.groupByCategory ──────────────────────────────────────

describe('AchievementService.groupByCategory', () => {
  it('produces 7 category groups', () => {
    const views = svc.buildViews(ACHIEVEMENT_CATALOG, new Map());
    const groups = svc.groupByCategory(views);
    expect(groups.size).toBe(7);
  });

  it('each group has exactly 6 entries', () => {
    const views = svc.buildViews(ACHIEVEMENT_CATALOG, new Map());
    const groups = svc.groupByCategory(views);
    for (const [, group] of groups) {
      expect(group.length).toBe(6);
    }
  });
});
