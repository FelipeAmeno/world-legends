import { DAILY_SCHEDULE, STREAK_MILESTONES } from './rewards.js';
import type {
  ClaimDayPayload,
  DailyLoginState,
  DailyReward,
} from './types.js';

// ── UTC calendar-day utilities ─────────────────────────────────────────────────

/** Returns the number of UTC calendar days since epoch for a given Date. */
function utcDayIndex(date: Date): number {
  return Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
}

// ── DailyLoginService ──────────────────────────────────────────────────────────

export class DailyLoginService {
  /**
   * Compute the current UI state based on persisted values and the current
   * wall-clock time. Pure — no I/O.
   */
  computeState(
    lastClaimAt: Date | null,
    currentDay: number,
    streakDays: number,
    now: Date,
  ): DailyLoginState {
    const nowDay = utcDayIndex(now);

    const alreadyClaimedToday =
      lastClaimAt !== null && utcDayIndex(lastClaimAt) === nowDay;

    const canClaimToday = !alreadyClaimedToday;

    let streakBroken = false;
    if (lastClaimAt !== null) {
      const lastDay = utcDayIndex(lastClaimAt);
      const gap = nowDay - lastDay;
      streakBroken = gap > 1;
    }

    const nextStreakMilestone =
      STREAK_MILESTONES.find((m) => m.atDays > streakDays)?.atDays ?? null;

    return {
      currentDay,
      streakDays,
      lastClaimAt,
      canClaimToday,
      alreadyClaimedToday,
      streakBroken,
      nextStreakMilestone,
    };
  }

  /**
   * Process a claim for the current day. Throws if the user cannot claim today.
   * Pure — no I/O.
   */
  processClaim(
    state: DailyLoginState,
    currentDay: number,
    streakDays: number,
    now: Date,
  ): ClaimDayPayload {
    if (!state.canClaimToday) {
      throw new Error('Cannot claim daily login reward: already claimed today');
    }

    // Look up today's scheduled rewards (day is 1-indexed)
    const dayIndex = ((currentDay - 1) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const dayConfig = DAILY_SCHEDULE[dayIndex];

    if (dayConfig === undefined) {
      throw new Error(`Invalid day index: ${dayIndex}`);
    }

    const rewards = dayConfig.rewards;

    // Compute next streak count
    const nextStreak = state.streakBroken ? 1 : streakDays + 1;

    // Check for streak milestone bonus
    let streakBonus: DailyReward | null = null;
    const milestone = STREAK_MILESTONES.find((m) => m.atDays === nextStreak);
    if (milestone !== undefined) {
      streakBonus = milestone.bonus;
    }

    // Next day in cycle (1–7, wraps)
    const nextDay = currentDay >= 7 ? 1 : currentDay + 1;

    return {
      day: currentDay,
      rewards,
      streakBonus,
      nextState: {
        nextDay,
        nextStreak,
        claimedAt: now,
      },
    };
  }
}
