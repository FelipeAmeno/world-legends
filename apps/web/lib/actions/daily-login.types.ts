/**
 * Tipos do fluxo de Daily Login — separados de daily-login.ts porque um
 * arquivo 'use server' só pode exportar funções async (Next.js/Turbopack).
 * Reexportar/definir tipos ali quebra o build em dev (Turbopack) mesmo
 * quando são só tipos apagados em compile-time.
 */
import type {
  ClaimDayPayload,
  DailyLoginState,
  DailyReward,
  DailyRewardKind,
  DayConfig,
} from '@world-legends/daily-login';

export type { ClaimDayPayload, DailyLoginState, DailyReward, DailyRewardKind, DayConfig };

export type DailyLoginView = Readonly<{
  state: DailyLoginState;
  schedule: readonly DayConfig[];
}>;

export type ClaimDailyLoginResult =
  | { ok: true; payload: ClaimDayPayload; newBalance: number }
  | { ok: false; error: string };
