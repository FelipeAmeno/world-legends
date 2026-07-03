import { describe, expect, it } from 'vitest';
import { DailyLoginService } from '../src/service.js';

const svc = new DailyLoginService();

// Helper: create a Date at a specific UTC calendar day offset from a base date
function daysAgo(n: number, base: Date = new Date('2024-06-15T12:00:00Z')): Date {
  return new Date(base.getTime() - n * 24 * 60 * 60 * 1000);
}

const NOW = new Date('2024-06-15T12:00:00Z');

// ── computeState ───────────────────────────────────────────────────────────────

describe('DailyLoginService.computeState', () => {
  it('first-time user: canClaimToday=true, streakBroken=false, currentDay=1', () => {
    const state = svc.computeState(null, 1, 0, NOW);
    expect(state.canClaimToday).toBe(true);
    expect(state.alreadyClaimedToday).toBe(false);
    expect(state.streakBroken).toBe(false);
    expect(state.currentDay).toBe(1);
    expect(state.streakDays).toBe(0);
    expect(state.lastClaimAt).toBeNull();
  });

  it('already claimed today: alreadyClaimedToday=true, canClaimToday=false', () => {
    // Same UTC calendar day as NOW
    const claimedAt = new Date('2024-06-15T08:00:00Z');
    const state = svc.computeState(claimedAt, 2, 1, NOW);
    expect(state.alreadyClaimedToday).toBe(true);
    expect(state.canClaimToday).toBe(false);
    expect(state.streakBroken).toBe(false);
  });

  it('claimed yesterday: canClaimToday=true, streakBroken=false', () => {
    const claimedAt = daysAgo(1);
    const state = svc.computeState(claimedAt, 2, 1, NOW);
    expect(state.canClaimToday).toBe(true);
    expect(state.alreadyClaimedToday).toBe(false);
    expect(state.streakBroken).toBe(false);
  });

  it('exactly 1 day gap (yesterday): not broken', () => {
    const yesterday = new Date('2024-06-14T23:59:59Z');
    const state = svc.computeState(yesterday, 3, 2, NOW);
    expect(state.streakBroken).toBe(false);
    expect(state.canClaimToday).toBe(true);
  });

  it('exactly 2 day gap: streakBroken=true', () => {
    const twoDaysAgo = new Date('2024-06-13T12:00:00Z');
    const state = svc.computeState(twoDaysAgo, 3, 2, NOW);
    expect(state.streakBroken).toBe(true);
    expect(state.canClaimToday).toBe(true);
  });

  it('more than 2 day gap: streakBroken=true', () => {
    const longAgo = daysAgo(10);
    const state = svc.computeState(longAgo, 3, 2, NOW);
    expect(state.streakBroken).toBe(true);
  });

  it('nextStreakMilestone is 14 when streakDays=0', () => {
    const state = svc.computeState(null, 1, 0, NOW);
    expect(state.nextStreakMilestone).toBe(14);
  });

  it('nextStreakMilestone is 14 when streakDays=13', () => {
    const state = svc.computeState(daysAgo(1), 1, 13, NOW);
    expect(state.nextStreakMilestone).toBe(14);
  });

  it('nextStreakMilestone is 30 when streakDays=14', () => {
    const state = svc.computeState(daysAgo(1), 1, 14, NOW);
    expect(state.nextStreakMilestone).toBe(30);
  });

  it('nextStreakMilestone is null when streakDays=30', () => {
    const state = svc.computeState(daysAgo(1), 1, 30, NOW);
    expect(state.nextStreakMilestone).toBeNull();
  });
});

// ── processClaim ───────────────────────────────────────────────────────────────

describe('DailyLoginService.processClaim', () => {
  function makeState(overrides: Partial<{
    canClaimToday: boolean;
    streakBroken: boolean;
  }> = {}): ReturnType<DailyLoginService['computeState']> {
    return {
      currentDay: 1,
      streakDays: 0,
      lastClaimAt: null,
      canClaimToday: overrides.canClaimToday ?? true,
      alreadyClaimedToday: !(overrides.canClaimToday ?? true),
      streakBroken: overrides.streakBroken ?? false,
      nextStreakMilestone: 14,
    };
  }

  it('throws when canClaimToday=false', () => {
    const state = makeState({ canClaimToday: false });
    expect(() => svc.processClaim(state, 1, 0, NOW)).toThrow();
  });

  it('returns correct day and rewards for day 1', () => {
    const state = makeState();
    const result = svc.processClaim(state, 1, 0, NOW);
    expect(result.day).toBe(1);
    expect(result.rewards.length).toBeGreaterThan(0);
    const credits = result.rewards.find((r) => r.kind === 'credits');
    expect(credits?.amount).toBe(150);
  });

  it('returns correct rewards for day 3 (classic pack)', () => {
    const state = makeState();
    const result = svc.processClaim(state, 3, 2, NOW);
    expect(result.day).toBe(3);
    const pack = result.rewards.find((r) => r.kind === 'pack');
    expect(pack?.packId).toBe('classic');
  });

  it('returns correct rewards for day 6 (elite pack)', () => {
    const state = makeState();
    const result = svc.processClaim(state, 6, 5, NOW);
    const pack = result.rewards.find((r) => r.kind === 'pack');
    expect(pack?.packId).toBe('elite');
  });

  it('day 7 wraps nextDay to 1', () => {
    const state = makeState();
    const result = svc.processClaim(state, 7, 6, NOW);
    expect(result.nextState.nextDay).toBe(1);
  });

  it('nextDay increments normally for days 1–6', () => {
    const state = makeState();
    const result = svc.processClaim(state, 4, 3, NOW);
    expect(result.nextState.nextDay).toBe(5);
  });

  it('streak increments by 1 when not broken', () => {
    const state = makeState({ streakBroken: false });
    const result = svc.processClaim(state, 1, 5, NOW);
    expect(result.nextState.nextStreak).toBe(6);
  });

  it('streak resets to 1 when broken', () => {
    const state = makeState({ streakBroken: true });
    const result = svc.processClaim(state, 1, 10, NOW);
    expect(result.nextState.nextStreak).toBe(1);
  });

  it('no streak bonus for regular days', () => {
    const state = makeState();
    const result = svc.processClaim(state, 1, 5, NOW);
    expect(result.streakBonus).toBeNull();
  });

  it('streak bonus triggered at 14 days (elite pack)', () => {
    // streakDays=13, not broken → nextStreak=14 → milestone hit
    const state = makeState({ streakBroken: false });
    const result = svc.processClaim(state, 2, 13, NOW);
    expect(result.nextState.nextStreak).toBe(14);
    expect(result.streakBonus).not.toBeNull();
    expect(result.streakBonus?.kind).toBe('pack');
    expect(result.streakBonus?.packId).toBe('elite');
  });

  it('streak bonus triggered at 30 days (legend pack)', () => {
    // streakDays=29, not broken → nextStreak=30 → milestone hit
    const state = makeState({ streakBroken: false });
    const result = svc.processClaim(state, 2, 29, NOW);
    expect(result.nextState.nextStreak).toBe(30);
    expect(result.streakBonus).not.toBeNull();
    expect(result.streakBonus?.kind).toBe('pack');
    expect(result.streakBonus?.packId).toBe('legend');
  });

  it('claimedAt in nextState equals the now parameter', () => {
    const state = makeState();
    const result = svc.processClaim(state, 1, 0, NOW);
    expect(result.nextState.claimedAt).toBe(NOW);
  });

  it('day 7 rewards contain credits >= 2000 and a legend pack', () => {
    const state = makeState();
    const result = svc.processClaim(state, 7, 6, NOW);
    const credits = result.rewards.find((r) => r.kind === 'credits');
    expect(credits?.amount).toBeGreaterThanOrEqual(2000);
    const pack = result.rewards.find((r) => r.kind === 'pack');
    expect(pack?.packId).toBe('legend');
  });
});
