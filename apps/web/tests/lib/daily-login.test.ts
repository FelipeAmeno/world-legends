/**
 * tests/lib/daily-login.test.ts
 *
 * Integration-level tests for the daily-login domain as used from apps/web.
 * Exercises the DailyLoginService and reward schedule through the public
 * @world-legends/daily-login package API — no DB, no Server Actions.
 */

import {
  DAILY_SCHEDULE,
  DailyLoginService,
  type DailyLoginState,
  STREAK_MILESTONES,
} from '@world-legends/daily-login';
import { describe, expect, it } from 'vitest';

const svc = new DailyLoginService();

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(10, 0, 0, 0); // midday UTC to avoid edge cases
  return d;
}

// ─── DAILY_SCHEDULE contract ──────────────────────────────────────────────────

describe('DAILY_SCHEDULE', () => {
  it('contém exatamente 7 dias', () => {
    expect(DAILY_SCHEDULE.length).toBe(7);
  });

  it('dias são 1–7 em ordem crescente', () => {
    expect(DAILY_SCHEDULE.map((d) => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('somente o dia 7 é milestone', () => {
    const milestones = DAILY_SCHEDULE.filter((d) => d.isMilestone);
    expect(milestones.length).toBe(1);
    expect(milestones[0]?.day).toBe(7);
  });

  it('cada dia tem pelo menos 1 recompensa', () => {
    for (const d of DAILY_SCHEDULE) {
      expect(d.rewards.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('dia 7 tem créditos >= 2000 e um pack lenda', () => {
    const day7 = DAILY_SCHEDULE[6]!;
    const credits = day7.rewards.find((r) => r.kind === 'credits');
    const legendPack = day7.rewards.find((r) => r.kind === 'pack' && r.packId === 'legend');
    expect(credits?.amount).toBeGreaterThanOrEqual(2000);
    expect(legendPack).toBeDefined();
  });
});

// ─── STREAK_MILESTONES contract ────────────────────────────────────────────────

describe('STREAK_MILESTONES', () => {
  it('estão em ordem crescente de atDays', () => {
    const days = STREAK_MILESTONES.map((m) => m.atDays);
    const sorted = [...days].sort((a, b) => a - b);
    expect(days).toEqual(sorted);
  });

  it('bônus em 14 dias é um pack', () => {
    const m14 = STREAK_MILESTONES.find((m) => m.atDays === 14);
    expect(m14?.bonus.kind).toBe('pack');
  });

  it('bônus em 30 dias é um pack lenda', () => {
    const m30 = STREAK_MILESTONES.find((m) => m.atDays === 30);
    expect(m30?.bonus.packId).toBe('legend');
  });
});

// ─── DailyLoginService.computeState ───────────────────────────────────────────

describe('DailyLoginService.computeState', () => {
  const now = new Date();

  it('primeiro login: canClaimToday=true, streakBroken=false', () => {
    const state = svc.computeState(null, 1, 0, now);
    expect(state.canClaimToday).toBe(true);
    expect(state.alreadyClaimedToday).toBe(false);
    expect(state.streakBroken).toBe(false);
    expect(state.currentDay).toBe(1);
  });

  it('já coletou hoje: canClaimToday=false', () => {
    const today = new Date();
    today.setUTCHours(6, 0, 0, 0); // earlier today UTC
    const state = svc.computeState(today, 2, 1, now);
    expect(state.alreadyClaimedToday).toBe(true);
    expect(state.canClaimToday).toBe(false);
  });

  it('coletou ontem (1 dia): streakBroken=false, canClaimToday=true', () => {
    const state = svc.computeState(daysAgo(1), 3, 2, now);
    expect(state.streakBroken).toBe(false);
    expect(state.canClaimToday).toBe(true);
  });

  it('coletou há 2 dias: streakBroken=true', () => {
    const state = svc.computeState(daysAgo(2), 3, 2, now);
    expect(state.streakBroken).toBe(true);
  });

  it('nextStreakMilestone aponta para próximo marco', () => {
    const state = svc.computeState(daysAgo(1), 2, 5, now);
    expect(state.nextStreakMilestone).toBe(14);
  });

  it('nextStreakMilestone é null após todos os marcos', () => {
    const state = svc.computeState(daysAgo(1), 2, 35, now);
    expect(state.nextStreakMilestone).toBeNull();
  });
});

// ─── DailyLoginService.processClaim ───────────────────────────────────────────

describe('DailyLoginService.processClaim', () => {
  const now = new Date();

  function canClaimState(day = 1, streak = 0, broken = false): DailyLoginState {
    return {
      currentDay: day,
      streakDays: streak,
      lastClaimAt: broken ? daysAgo(2) : null,
      canClaimToday: true,
      alreadyClaimedToday: false,
      streakBroken: broken,
      nextStreakMilestone: 14,
    };
  }

  it('retorna as recompensas do dia correto', () => {
    const payload = svc.processClaim(canClaimState(3), 3, 0, now);
    expect(payload.day).toBe(3);
    expect(payload.rewards.some((r) => r.kind === 'pack' && r.packId === 'classic')).toBe(true);
  });

  it('incrementa streak em 1', () => {
    const payload = svc.processClaim(canClaimState(1, 5), 1, 5, now);
    expect(payload.nextState.nextStreak).toBe(6);
  });

  it('reseta streak para 1 se quebrado', () => {
    const payload = svc.processClaim(canClaimState(1, 5, true), 1, 5, now);
    expect(payload.nextState.nextStreak).toBe(1);
  });

  it('dia 7 → nextDay = 1 (reinicia ciclo)', () => {
    const payload = svc.processClaim(canClaimState(7, 6), 7, 6, now);
    expect(payload.nextState.nextDay).toBe(1);
  });

  it('dia 3 → nextDay = 4', () => {
    const payload = svc.processClaim(canClaimState(3, 2), 3, 2, now);
    expect(payload.nextState.nextDay).toBe(4);
  });

  it('streakBonus acionado em exatamente 14 dias', () => {
    // streakDays=13 → nextStreak=14 → milestone
    const payload = svc.processClaim(canClaimState(1, 13), 1, 13, now);
    expect(payload.streakBonus).not.toBeNull();
    expect(payload.streakBonus?.packId).toBe('elite');
  });

  it('streakBonus acionado em exatamente 30 dias', () => {
    const payload = svc.processClaim(canClaimState(2, 29), 2, 29, now);
    expect(payload.streakBonus?.packId).toBe('legend');
  });

  it('sem streakBonus em dias normais', () => {
    const payload = svc.processClaim(canClaimState(1, 3), 1, 3, now);
    expect(payload.streakBonus).toBeNull();
  });

  it('lança exceção se canClaimToday=false', () => {
    const lockedState: DailyLoginState = {
      ...canClaimState(),
      canClaimToday: false,
      alreadyClaimedToday: true,
    };
    expect(() => svc.processClaim(lockedState, 1, 0, now)).toThrow();
  });
});
