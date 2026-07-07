'use server';

import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import {
  type ClaimDayPayload,
  DAILY_SCHEDULE,
  DailyLoginService,
} from '@world-legends/daily-login';
import { SupabaseDailyLoginRepository, SupabaseProfileRepository } from '@world-legends/db';
import type { ClaimDailyLoginResult, DailyLoginView } from './daily-login.types';

// ─── Service singleton ────────────────────────────────────────────────────────

const svc = new DailyLoginService();

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getDailyLoginAction(): Promise<DailyLoginView> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    const state = svc.computeState(null, 1, 0, new Date());
    return { state: { ...state, canClaimToday: false }, schedule: DAILY_SCHEDULE };
  }

  const db = getServiceDb();
  const repo = new SupabaseDailyLoginRepository(db);
  const result = await repo.findByProfile(userId);

  if (!result.ok || result.value === null) {
    const state = svc.computeState(null, 1, 0, new Date());
    return { state, schedule: DAILY_SCHEDULE };
  }

  const row = result.value;
  const state = svc.computeState(row.lastClaimAt, row.currentDay, row.streakDays, new Date());
  return { state, schedule: DAILY_SCHEDULE };
}

export async function claimDailyLoginAction(): Promise<ClaimDailyLoginResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const db = getServiceDb();
  const repo = new SupabaseDailyLoginRepository(db);
  const profileRepo = new SupabaseProfileRepository(db);

  // Load current state from DB
  const rowResult = await repo.findByProfile(userId);
  if (!rowResult.ok) return { ok: false, error: 'Erro ao carregar estado.' };

  const row = rowResult.value;
  const now = new Date();
  const currentDay = row?.currentDay ?? 1;
  const streakDays = row?.streakDays ?? 0;
  const lastClaimAt = row?.lastClaimAt ?? null;

  const state = svc.computeState(lastClaimAt, currentDay, streakDays, now);

  if (!state.canClaimToday) return { ok: false, error: 'Já coletou hoje.' };

  let payload: ClaimDayPayload;
  try {
    payload = svc.processClaim(state, currentDay, streakDays, now);
  } catch {
    return { ok: false, error: 'Não foi possível processar o claim.' };
  }

  // Persist new state
  const upsertResult = await repo.upsert({
    profileId: userId,
    currentDay: payload.nextState.nextDay,
    streakDays: payload.nextState.nextStreak,
    lastClaimAt: payload.nextState.claimedAt,
  });
  if (!upsertResult.ok) return { ok: false, error: 'Erro ao salvar progresso.' };

  // Credit all monetary rewards — pack rewards converted to credit equivalent
  const PACK_CREDIT_VALUE: Record<string, number> = {
    starter: 75,
    classic: 150,
    national: 250,
    elite: 400,
    hero: 700,
    legend: 1000,
    goat: 2500,
  };

  let totalCredits = 0;
  let newBalance = 0;

  const allRewards = [...payload.rewards];
  if (payload.streakBonus) allRewards.push(payload.streakBonus);

  for (const reward of allRewards) {
    if (reward.kind === 'credits') {
      totalCredits += reward.amount;
    } else if (reward.kind === 'pack' && reward.packId) {
      // Pack rewards credited as their credit equivalent until pack inventory is implemented
      totalCredits += (PACK_CREDIT_VALUE[reward.packId] ?? 150) * reward.amount;
    }
  }

  if (totalCredits > 0) {
    const creditResult = await profileRepo.creditSoftCurrency(userId, totalCredits);
    if (creditResult.ok) newBalance = creditResult.value;
  }

  return { ok: true, payload, newBalance };
}
