import { describe, expect, it } from 'vitest';
import { CardMasteryService } from '../src/service.js';

const svc = new CardMasteryService();

describe('CardMasteryService.computeState', () => {
  it('new card starts at level 0, 0 XP', () => {
    const s = svc.computeState('pelé-world_cup_hero', 0);
    expect(s.level).toBe(0);
    expect(s.xp).toBe(0);
    expect(s.xpToNextLevel).toBe(50);
    expect(s.progressPct).toBe(0);
  });

  it('exactly at level 1 threshold', () => {
    const s = svc.computeState('card', 50);
    expect(s.level).toBe(1);
    expect(s.xpToNextLevel).toBe(100);
    expect(s.progressPct).toBe(0);
  });

  it('halfway through level 2 → 50% progress', () => {
    // Level 2: 150–350, midpoint = 250
    const s = svc.computeState('card', 250);
    expect(s.level).toBe(2);
    expect(s.progressPct).toBe(50);
  });

  it('at max level 5: xpToNextLevel is null, progress 100%', () => {
    const s = svc.computeState('card', 2000);
    expect(s.level).toBe(5);
    expect(s.xpToNextLevel).toBeNull();
    expect(s.progressPct).toBe(100);
  });
});

describe('CardMasteryService.computeXpGain', () => {
  it('match_played gives 10 XP', () => {
    const result = svc.computeXpGain(['match_played']);
    expect(result.totalXp).toBe(10);
    expect(result.entries[0]?.amount).toBe(10);
  });

  it('match_win gives 15 XP', () => {
    const result = svc.computeXpGain(['match_win']);
    expect(result.totalXp).toBe(15);
  });

  it('combined: played + win + goal', () => {
    const result = svc.computeXpGain(['match_played', 'match_win', 'goal']);
    expect(result.totalXp).toBe(28); // 10 + 15 + 3
    expect(result.entries.length).toBe(3);
  });

  it('mvp gives 20 XP', () => {
    expect(svc.computeXpGain(['mvp']).totalXp).toBe(20);
  });

  it('clean_sheet gives 8 XP', () => {
    expect(svc.computeXpGain(['clean_sheet']).totalXp).toBe(8);
  });

  it('empty sources → 0 XP', () => {
    expect(svc.computeXpGain([]).totalXp).toBe(0);
  });
});

describe('CardMasteryService.applyXpGain', () => {
  it('levels up when crossing threshold', () => {
    const gain = svc.computeXpGain(['match_played', 'match_win', 'mvp']); // 45 XP
    // Start at 10 XP (level 0), add 45 → 55 XP → level 1
    const result = svc.applyXpGain(10, gain);
    expect(result.newXp).toBe(55);
    expect(result.oldLevel).toBe(0);
    expect(result.newLevel).toBe(1);
    expect(result.leveledUp).toBe(true);
  });

  it('no level up within same tier', () => {
    const gain = svc.computeXpGain(['match_played']); // 10 XP
    const result = svc.applyXpGain(50, gain); // 50 + 10 = 60, still level 1
    expect(result.leveledUp).toBe(false);
    expect(result.newLevel).toBe(1);
  });

  it('already at max level, XP still accumulates', () => {
    const gain = svc.computeXpGain(['match_played']);
    const result = svc.applyXpGain(2000, gain);
    expect(result.newXp).toBe(2010);
    expect(result.newLevel).toBe(5);
    expect(result.leveledUp).toBe(false);
  });
});
