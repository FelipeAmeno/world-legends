import { describe, expect, it } from 'vitest';
import { DAILY_SCHEDULE, STREAK_MILESTONES } from '../src/rewards.js';

describe('DAILY_SCHEDULE', () => {
  it('has exactly 7 entries', () => {
    expect(DAILY_SCHEDULE).toHaveLength(7);
  });

  it('days are numbered 1–7 in order', () => {
    const days = DAILY_SCHEDULE.map((d) => d.day);
    expect(days).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('only day 7 is a milestone', () => {
    for (const entry of DAILY_SCHEDULE) {
      if (entry.day === 7) {
        expect(entry.isMilestone).toBe(true);
      } else {
        expect(entry.isMilestone).toBe(false);
      }
    }
  });

  it('each day has at least 1 reward', () => {
    for (const entry of DAILY_SCHEDULE) {
      expect(entry.rewards.length).toBeGreaterThan(0);
    }
  });

  it('all reward amounts are positive', () => {
    for (const entry of DAILY_SCHEDULE) {
      for (const reward of entry.rewards) {
        expect(reward.amount).toBeGreaterThan(0);
      }
    }
  });

  it('day 3 contains a pack reward', () => {
    const day3 = DAILY_SCHEDULE.find((d) => d.day === 3);
    expect(day3).toBeDefined();
    const hasPack = day3?.rewards.some((r) => r.kind === 'pack');
    expect(hasPack).toBe(true);
  });

  it('day 6 contains an elite pack', () => {
    const day6 = DAILY_SCHEDULE.find((d) => d.day === 6);
    expect(day6).toBeDefined();
    const hasElite = day6?.rewards.some((r) => r.kind === 'pack' && r.packId === 'elite');
    expect(hasElite).toBe(true);
  });

  it('day 7 contains a legend pack AND credits >= 2000', () => {
    const day7 = DAILY_SCHEDULE.find((d) => d.day === 7);
    expect(day7).toBeDefined();
    const hasLegend = day7?.rewards.some((r) => r.kind === 'pack' && r.packId === 'legend');
    expect(hasLegend).toBe(true);
    const creditsReward = day7?.rewards.find((r) => r.kind === 'credits');
    expect(creditsReward).toBeDefined();
    expect(creditsReward?.amount).toBeGreaterThanOrEqual(2000);
  });

  it('day 7 has milestone theme', () => {
    const day7 = DAILY_SCHEDULE.find((d) => d.day === 7);
    expect(day7?.theme).toBe('milestone');
  });
});

describe('STREAK_MILESTONES', () => {
  it('are sorted ascending by atDays', () => {
    const days = STREAK_MILESTONES.map((m) => m.atDays);
    const sorted = [...days].sort((a, b) => a - b);
    expect(days).toEqual(sorted);
  });

  it('has a milestone at 14 days with an elite pack', () => {
    const m14 = STREAK_MILESTONES.find((m) => m.atDays === 14);
    expect(m14).toBeDefined();
    expect(m14?.bonus.kind).toBe('pack');
    expect(m14?.bonus.packId).toBe('elite');
  });

  it('has a milestone at 30 days with a legend pack', () => {
    const m30 = STREAK_MILESTONES.find((m) => m.atDays === 30);
    expect(m30).toBeDefined();
    expect(m30?.bonus.kind).toBe('pack');
    expect(m30?.bonus.packId).toBe('legend');
  });
});
