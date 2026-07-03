/**
 * tests/lib/card-mastery.test.ts
 *
 * Tests for @world-legends/card-mastery domain as used from apps/web.
 * No DB, no Server Actions — pure domain logic.
 */

import { describe, expect, it } from 'vitest';
import {
  CardMasteryService,
  getLevelForXp,
  MASTERY_LEVELS,
  type XpGainSource,
} from '@world-legends/card-mastery';

const svc = new CardMasteryService();

// ─── MASTERY_LEVELS ───────────────────────────────────────────────────────────

describe('MASTERY_LEVELS catalog', () => {
  it('has 6 levels', () => {
    expect(MASTERY_LEVELS.length).toBe(6);
  });

  it('first is Bronze at 0 XP', () => {
    expect(MASTERY_LEVELS[0]!.name).toBe('Bronze');
    expect(MASTERY_LEVELS[0]!.xpRequired).toBe(0);
  });

  it('last is World Class at 1500 XP', () => {
    expect(MASTERY_LEVELS[5]!.name).toBe('World Class');
    expect(MASTERY_LEVELS[5]!.xpRequired).toBe(1500);
  });

  it('XP thresholds are strictly increasing', () => {
    for (let i = 1; i < MASTERY_LEVELS.length; i++) {
      expect(MASTERY_LEVELS[i]!.xpRequired).toBeGreaterThan(MASTERY_LEVELS[i - 1]!.xpRequired);
    }
  });

  it('level 4 (Diamond) unlocks diamond_aura effect', () => {
    expect(MASTERY_LEVELS[4]!.effectUnlock).toBe('diamond_aura');
  });
});

// ─── getLevelForXp ────────────────────────────────────────────────────────────

describe('getLevelForXp', () => {
  it.each([
    [0, 0],
    [49, 0],
    [50, 1],
    [149, 1],
    [150, 2],
    [349, 2],
    [350, 3],
    [749, 3],
    [750, 4],
    [1499, 4],
    [1500, 5],
    [99999, 5],
  ])('XP=%i → level %i', (xp, expected) => {
    expect(getLevelForXp(xp)).toBe(expected);
  });
});

// ─── CardMasteryService.computeState ─────────────────────────────────────────

describe('CardMasteryService.computeState', () => {
  it('new card: level 0, 50 XP to next, 0% progress', () => {
    const s = svc.computeState('pelé-world_cup_hero', 0);
    expect(s.level).toBe(0);
    expect(s.xp).toBe(0);
    expect(s.xpToNextLevel).toBe(50);
    expect(s.progressPct).toBe(0);
  });

  it('exactly at level 3 threshold: 0% progress within tier', () => {
    const s = svc.computeState('card', 350);
    expect(s.level).toBe(3);
    expect(s.progressPct).toBe(0);
  });

  it('halfway through level 2 (150-350): ~50% progress', () => {
    const s = svc.computeState('card', 250);
    expect(s.level).toBe(2);
    expect(s.progressPct).toBe(50);
  });

  it('max level 5: null xpToNextLevel, 100% progress', () => {
    const s = svc.computeState('card', 1500);
    expect(s.level).toBe(5);
    expect(s.xpToNextLevel).toBeNull();
    expect(s.progressPct).toBe(100);
  });

  it('cardId is passed through correctly', () => {
    const s = svc.computeState('ronaldo-ultra', 100);
    expect(s.cardId).toBe('ronaldo-ultra');
  });
});

// ─── CardMasteryService.computeXpGain ────────────────────────────────────────

describe('CardMasteryService.computeXpGain', () => {
  const cases: Array<[XpGainSource[], number]> = [
    [['match_played'], 10],
    [['match_win'], 15],
    [['goal'], 3],
    [['clean_sheet'], 8],
    [['mvp'], 20],
    [['match_played', 'match_win', 'goal'], 28],
    [[], 0],
  ];

  it.each(cases)('sources=%j → totalXp=%i', (sources, expected) => {
    expect(svc.computeXpGain(sources).totalXp).toBe(expected);
  });

  it('entries match sources', () => {
    const result = svc.computeXpGain(['match_played', 'mvp']);
    expect(result.entries.length).toBe(2);
    expect(result.entries[0]!.source).toBe('match_played');
    expect(result.entries[1]!.source).toBe('mvp');
  });
});

// ─── CardMasteryService.applyXpGain ──────────────────────────────────────────

describe('CardMasteryService.applyXpGain', () => {
  it('level up when crossing threshold', () => {
    const gain = svc.computeXpGain(['match_played', 'match_win', 'mvp']); // 45 XP
    const result = svc.applyXpGain(10, gain); // 10 + 45 = 55 → level 1
    expect(result.newXp).toBe(55);
    expect(result.oldLevel).toBe(0);
    expect(result.newLevel).toBe(1);
    expect(result.leveledUp).toBe(true);
  });

  it('no level up within same tier', () => {
    const gain = svc.computeXpGain(['goal']); // 3 XP
    const result = svc.applyXpGain(50, gain); // 53 → still level 1
    expect(result.leveledUp).toBe(false);
    expect(result.newLevel).toBe(1);
  });

  it('XP accumulates beyond max level', () => {
    const gain = svc.computeXpGain(['match_played']);
    const result = svc.applyXpGain(2000, gain);
    expect(result.newXp).toBe(2010);
    expect(result.newLevel).toBe(5);
    expect(result.leveledUp).toBe(false);
  });
});
