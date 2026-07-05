// lib/retention-store.ts
// Pure localStorage tracker for daily activity — no React dependencies.

const KEY = {
  date: 'wl_today_date',
  login: 'wl_today_login',
  pack: 'wl_today_pack',
  win: 'wl_today_win',
  mission: 'wl_today_mission',
  reward: 'wl_today_reward',
} as const;

export type TodayAction = 'login' | 'pack' | 'win' | 'mission' | 'reward';
export type TodayProgress = Record<TodayAction, boolean>;

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function guardDay(): void {
  if (localStorage.getItem(KEY.date) !== todayString()) {
    localStorage.setItem(KEY.date, todayString());
    localStorage.removeItem(KEY.login);
    localStorage.removeItem(KEY.pack);
    localStorage.removeItem(KEY.win);
    localStorage.removeItem(KEY.mission);
    localStorage.removeItem(KEY.reward);
  }
}

export function markTodayAction(action: TodayAction): void {
  if (typeof window === 'undefined') return;
  guardDay();
  localStorage.setItem(KEY[action], '1');
  window.dispatchEvent(new Event('wl:retention-update'));
}

export function getTodayProgress(): TodayProgress {
  if (typeof window === 'undefined') {
    return { login: false, pack: false, win: false, mission: false, reward: false };
  }
  guardDay();
  return {
    login: localStorage.getItem(KEY.login) === '1',
    pack: localStorage.getItem(KEY.pack) === '1',
    win: localStorage.getItem(KEY.win) === '1',
    mission: localStorage.getItem(KEY.mission) === '1',
    reward: localStorage.getItem(KEY.reward) === '1',
  };
}
