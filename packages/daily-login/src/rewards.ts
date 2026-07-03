import type { DailyReward, DayConfig } from './types.js';

// ── 7-day reward schedule ──────────────────────────────────────────────────────

export const DAILY_SCHEDULE: readonly DayConfig[] = [
  {
    day: 1,
    isMilestone: false,
    theme: 'normal',
    rewards: [
      {
        kind: 'credits',
        amount: 150,
        packId: null,
        cardId: null,
        label: '150 Créditos',
        icon: '💰',
      },
    ],
  },
  {
    day: 2,
    isMilestone: false,
    theme: 'normal',
    rewards: [
      {
        kind: 'credits',
        amount: 300,
        packId: null,
        cardId: null,
        label: '300 Créditos',
        icon: '💰',
      },
      {
        kind: 'xp',
        amount: 50,
        packId: null,
        cardId: null,
        label: '50 XP',
        icon: '⭐',
      },
    ],
  },
  {
    day: 3,
    isMilestone: false,
    theme: 'premium',
    rewards: [
      {
        kind: 'pack',
        amount: 1,
        packId: 'classic',
        cardId: null,
        label: '1x Pacote Clássico',
        icon: '📦',
      },
    ],
  },
  {
    day: 4,
    isMilestone: false,
    theme: 'normal',
    rewards: [
      {
        kind: 'credits',
        amount: 600,
        packId: null,
        cardId: null,
        label: '600 Créditos',
        icon: '💰',
      },
      {
        kind: 'xp',
        amount: 100,
        packId: null,
        cardId: null,
        label: '100 XP',
        icon: '⭐',
      },
    ],
  },
  {
    day: 5,
    isMilestone: false,
    theme: 'premium',
    rewards: [
      {
        kind: 'pack',
        amount: 2,
        packId: 'classic',
        cardId: null,
        label: '2x Pacotes Clássicos',
        icon: '📦',
      },
    ],
  },
  {
    day: 6,
    isMilestone: false,
    theme: 'premium',
    rewards: [
      {
        kind: 'pack',
        amount: 1,
        packId: 'elite',
        cardId: null,
        label: '1x Pacote Elite',
        icon: '🎁',
      },
      {
        kind: 'xp',
        amount: 200,
        packId: null,
        cardId: null,
        label: '200 XP',
        icon: '⭐',
      },
    ],
  },
  {
    day: 7,
    isMilestone: true,
    theme: 'milestone',
    rewards: [
      {
        kind: 'credits',
        amount: 2000,
        packId: null,
        cardId: null,
        label: '2000 Créditos',
        icon: '💎',
      },
      {
        kind: 'pack',
        amount: 1,
        packId: 'legend',
        cardId: null,
        label: '1x Pacote Lenda',
        icon: '🏆',
      },
      {
        kind: 'xp',
        amount: 300,
        packId: null,
        cardId: null,
        label: '300 XP',
        icon: '⭐',
      },
    ],
  },
] as const;

// ── Streak milestones ──────────────────────────────────────────────────────────

export type StreakMilestone = Readonly<{
  atDays: number;
  bonus: DailyReward;
}>;

export const STREAK_MILESTONES: readonly StreakMilestone[] = [
  {
    atDays: 14,
    bonus: {
      kind: 'pack',
      amount: 1,
      packId: 'elite',
      cardId: null,
      label: '1x Pacote Elite (Bônus de Sequência)',
      icon: '🎁',
    },
  },
  {
    atDays: 30,
    bonus: {
      kind: 'pack',
      amount: 1,
      packId: 'legend',
      cardId: null,
      label: '1x Pacote Lenda (Bônus de Sequência)',
      icon: '🏆',
    },
  },
] as const;
