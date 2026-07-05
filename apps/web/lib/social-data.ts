/**
 * lib/social-data.ts
 *
 * Types, utilities, and mock data for the social system.
 * Real data lives in DB tables: friendships, social_activities,
 * private_leagues, league_members.
 */

// ─── Friend Code ──────────────────────────────────────────────────────────────

export function generateFriendCode(userId: string): string {
  const raw = userId.replace(/-/g, '').toUpperCase().slice(0, 8);
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

export function normalizeFriendCode(input: string): string {
  return input
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 8);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityType =
  | 'pack_opened'
  | 'goat_obtained'
  | 'legendary_obtained'
  | 'country_completed'
  | 'win_streak'
  | 'dream_team_completed'
  | 'league_won'
  | 'first_win';

export type SocialActivity = {
  id: string;
  userId: string;
  displayName: string;
  type: ActivityType;
  meta: {
    cardName?: string;
    rarityLabel?: string;
    country?: string;
    flagEmoji?: string;
    streakCount?: number;
    leagueName?: string;
    packCount?: number;
  };
  createdAt: string;
};

export type FriendProfile = {
  userId: string;
  displayName: string;
  friendCode: string;
  collectionCount: number;
  wins: number;
  topOvr: number;
  level: number;
};

export type FriendStatus = 'pending_sent' | 'pending_received' | 'accepted';

export type Friendship = {
  friendId: string;
  displayName: string;
  status: FriendStatus;
};

export type LeagueMember = {
  userId: string;
  displayName: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  rank: number;
};

export type PrivateLeague = {
  id: string;
  name: string;
  code: string;
  ownerId: string;
  members: LeagueMember[];
  createdAt: string;
  endsAt?: string;
};

// ─── Activity display helpers ─────────────────────────────────────────────────

export type ActivityDisplay = {
  icon: string;
  color: string;
  text: string;
  badge: string;
};

export function formatActivity(act: SocialActivity): ActivityDisplay {
  const { type, meta, displayName } = act;
  switch (type) {
    case 'goat_obtained':
      return {
        icon: '🏆',
        color: '#e2e8f0',
        badge: 'WCH',
        text: `${displayName} obteve um World Cup Hero: ${meta.cardName ?? '??'}`,
      };
    case 'legendary_obtained':
      return {
        icon: '✨',
        color: '#c9a84c',
        badge: 'LGD',
        text: `${displayName} conseguiu uma lenda: ${meta.cardName ?? '??'}`,
      };
    case 'pack_opened':
      return {
        icon: '📦',
        color: '#a855f7',
        badge: 'PACK',
        text: `${displayName} abriu ${meta.packCount ?? 1} pack${(meta.packCount ?? 1) > 1 ? 's' : ''}`,
      };
    case 'country_completed':
      return {
        icon: meta.flagEmoji ?? '🌍',
        color: '#10b981',
        badge: '100%',
        text: `${displayName} completou a coleção de ${meta.country ?? '??'}`,
      };
    case 'win_streak':
      return {
        icon: '🔥',
        color: '#ef4444',
        badge: `×${meta.streakCount ?? 3}`,
        text: `${displayName} está em uma sequência de ${meta.streakCount ?? 3} vitórias!`,
      };
    case 'dream_team_completed':
      return {
        icon: '⭐',
        color: '#f59e0b',
        badge: 'DREAM',
        text: `${displayName} completou o Dream Team com 11 lendas!`,
      };
    case 'league_won':
      return {
        icon: '👑',
        color: '#c9a84c',
        badge: '1º',
        text: `${displayName} venceu a liga "${meta.leagueName ?? '??'}"!`,
      };
    case 'first_win':
      return {
        icon: '🎉',
        color: '#34d399',
        badge: 'GG',
        text: `${displayName} venceu sua primeira partida!`,
      };
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 2) return 'agora mesmo';
  if (mins < 60) return `${mins}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
}

// ─── Mock data (used in dev / before DB tables are set up) ────────────────────

const NOW = new Date().toISOString();
const H = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const MOCK_ACTIVITIES: SocialActivity[] = [
  {
    id: 'a1',
    userId: 'u1',
    displayName: 'Guga_11',
    type: 'goat_obtained',
    meta: { cardName: 'Pelé', rarityLabel: 'WCH' },
    createdAt: H(0.5),
  },
  {
    id: 'a2',
    userId: 'u2',
    displayName: 'Felipe_BR',
    type: 'win_streak',
    meta: { streakCount: 5 },
    createdAt: H(1.2),
  },
  {
    id: 'a3',
    userId: 'u3',
    displayName: 'Maradona99',
    type: 'country_completed',
    meta: { country: 'Brasil', flagEmoji: '🇧🇷' },
    createdAt: H(3),
  },
  {
    id: 'a4',
    userId: 'u4',
    displayName: 'CR7Fan',
    type: 'pack_opened',
    meta: { packCount: 3 },
    createdAt: H(5),
  },
  {
    id: 'a5',
    userId: 'u5',
    displayName: 'LionelXI',
    type: 'legendary_obtained',
    meta: { cardName: 'Maradona', rarityLabel: 'LGD' },
    createdAt: H(8),
  },
  {
    id: 'a6',
    userId: 'u6',
    displayName: 'ZicoEterno',
    type: 'dream_team_completed',
    meta: {},
    createdAt: H(12),
  },
  {
    id: 'a7',
    userId: 'u1',
    displayName: 'Guga_11',
    type: 'pack_opened',
    meta: { packCount: 1 },
    createdAt: H(24),
  },
];

export const MOCK_FRIENDS: FriendProfile[] = [
  {
    userId: 'u1',
    displayName: 'Guga_11',
    friendCode: 'A1B2-C3D4',
    collectionCount: 47,
    wins: 23,
    topOvr: 91,
    level: 8,
  },
  {
    userId: 'u2',
    displayName: 'Felipe_BR',
    friendCode: 'E5F6-G7H8',
    collectionCount: 31,
    wins: 15,
    topOvr: 88,
    level: 6,
  },
  {
    userId: 'u3',
    displayName: 'Maradona99',
    friendCode: 'I9J0-K1L2',
    collectionCount: 62,
    wins: 41,
    topOvr: 95,
    level: 12,
  },
];

export const MOCK_LEAGUES: PrivateLeague[] = [
  {
    id: 'l1',
    name: 'Liga dos Amigos BR',
    code: 'LIG-AMIG',
    ownerId: 'u1',
    endsAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
    createdAt: NOW,
    members: [
      {
        userId: 'u3',
        displayName: 'Maradona99',
        wins: 8,
        draws: 2,
        losses: 1,
        points: 26,
        rank: 1,
      },
      { userId: 'u1', displayName: 'Guga_11', wins: 6, draws: 3, losses: 2, points: 21, rank: 2 },
      { userId: 'u2', displayName: 'Felipe_BR', wins: 5, draws: 1, losses: 5, points: 16, rank: 3 },
      { userId: 'u4', displayName: 'CR7Fan', wins: 3, draws: 2, losses: 6, points: 11, rank: 4 },
    ],
  },
];
