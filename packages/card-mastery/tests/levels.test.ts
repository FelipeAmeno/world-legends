import { describe, expect, it } from 'vitest';
import { MASTERY_LEVELS, getLevelConfig, getLevelForXp } from '../src/levels.js';

describe('MASTERY_LEVELS', () => {
  it('has exactly 6 levels (0–5)', () => {
    expect(MASTERY_LEVELS.length).toBe(6);
    expect(MASTERY_LEVELS.map((l) => l.level)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('thresholds are strictly increasing', () => {
    const xps = MASTERY_LEVELS.map((l) => l.xpRequired);
    for (let i = 1; i < xps.length; i++) {
      expect(xps[i]).toBeGreaterThan(xps[i - 1] ?? 0);
    }
  });

  it('level 0 requires 0 XP', () => {
    expect(MASTERY_LEVELS[0]?.xpRequired).toBe(0);
  });

  it('level 5 is World Class', () => {
    expect(MASTERY_LEVELS[5]?.name).toBe('World Class');
    expect(MASTERY_LEVELS[5]?.xpRequired).toBe(1500);
  });
});

describe('getLevelForXp', () => {
  it('0 XP → level 0', () => expect(getLevelForXp(0)).toBe(0));
  it('49 XP → level 0 (below silver)', () => expect(getLevelForXp(49)).toBe(0));
  it('50 XP → level 1', () => expect(getLevelForXp(50)).toBe(1));
  it('150 XP → level 2', () => expect(getLevelForXp(150)).toBe(2));
  it('350 XP → level 3', () => expect(getLevelForXp(350)).toBe(3));
  it('750 XP → level 4', () => expect(getLevelForXp(750)).toBe(4));
  it('1500 XP → level 5', () => expect(getLevelForXp(1500)).toBe(5));
  it('9999 XP → capped at level 5', () => expect(getLevelForXp(9999)).toBe(5));
});

describe('getLevelConfig', () => {
  it('returns correct config for level 3', () => {
    const cfg = getLevelConfig(3);
    expect(cfg.name).toBe('Platina');
    expect(cfg.effectUnlock).toBe('platinum_pulse');
  });

  it('throws for invalid level', () => {
    expect(() => getLevelConfig(6 as never)).toThrow();
  });
});
