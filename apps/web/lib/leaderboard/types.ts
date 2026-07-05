/**
 * lib/leaderboard/types.ts — T064
 *
 * Tipos do sistema de Leaderboards do World Legends.
 *
 * Preparado para:
 *   - Backend real (substituir mock por fetch)
 *   - Sistema de amigos (friends tab)
 *   - Temporadas rolantes
 *   - Múltiplas métricas por perfil
 */

// ─── Categorias ───────────────────────────────────────────────────────────────

export type LeaderboardCategory =
  | 'global_wins' // mais vitórias (global)
  | 'global_ovr' // maior OVR do squad (global)
  | 'global_collection' // mais cartas (global)
  | 'country_wins' // mais vitórias por país
  | 'friends_wins' // amigos — mais vitórias
  | 'season'; // ranking da temporada atual

export type LeaderboardMetric =
  | 'wins'
  | 'ovr'
  | 'cards'
  | 'points' // pontos da temporada
  | 'winRate';

// ─── Entrada ──────────────────────────────────────────────────────────────────

export type LeaderboardEntry = {
  readonly rank: number; // 1-based
  readonly userId: string;
  readonly username: string;
  readonly avatarInitial: string; // primeira letra do nome
  readonly nationality: string; // código do país (BR, AR, etc.)
  readonly flagEmoji: string;
  readonly level: number;

  // Métricas
  readonly wins: number;
  readonly losses: number;
  readonly winRate: number; // 0–100
  readonly squadOvr: number; // OVR máximo do squad
  readonly totalCards: number;
  readonly seasonPoints: number;

  // Visual
  readonly topCard?: {
    // melhor carta (para OVR leaderboard)
    name: string;
    ovr: number;
    rarityCode: string;
  };

  // Flags
  readonly isCurrentUser: boolean;
  readonly isFriend: boolean;
  readonly isOnline: boolean;
};

// ─── Config por categoria ─────────────────────────────────────────────────────

export type CategoryConfig = {
  readonly id: LeaderboardCategory;
  readonly icon: string;
  readonly label: string;
  readonly metric: LeaderboardMetric;
  readonly metricLabel: string;
  readonly formatter: (entry: LeaderboardEntry) => string;
  readonly description: string;
};

export const CATEGORY_CONFIGS: Record<LeaderboardCategory, CategoryConfig> = {
  global_wins: {
    id: 'global_wins',
    icon: '🏆',
    label: 'Vitórias',
    metric: 'wins',
    metricLabel: 'V',
    formatter: (e) => `${e.wins} vitórias`,
    description: 'Jogadores com mais vitórias em partidas',
  },
  global_ovr: {
    id: 'global_ovr',
    icon: '⚽',
    label: 'OVR',
    metric: 'ovr',
    metricLabel: 'OVR',
    formatter: (e) => `${e.squadOvr} OVR`,
    description: 'Jogadores com maior OVR do squad',
  },
  global_collection: {
    id: 'global_collection',
    icon: '🃏',
    label: 'Coleção',
    metric: 'cards',
    metricLabel: 'cartas',
    formatter: (e) => `${e.totalCards} cartas`,
    description: 'Colecionadores com mais cartas',
  },
  country_wins: {
    id: 'country_wins',
    icon: '🌍',
    label: 'País',
    metric: 'wins',
    metricLabel: 'V',
    formatter: (e) => `${e.wins}V · ${e.winRate}%`,
    description: 'Top jogadores do seu país',
  },
  friends_wins: {
    id: 'friends_wins',
    icon: '👥',
    label: 'Amigos',
    metric: 'wins',
    metricLabel: 'V',
    formatter: (e) => `${e.wins} vitórias`,
    description: 'Ranking dos seus amigos',
  },
  season: {
    id: 'season',
    icon: '🗓️',
    label: 'Temporada',
    metric: 'points',
    metricLabel: 'pts',
    formatter: (e) => `${e.seasonPoints} pts`,
    description: 'Ranking da temporada atual',
  },
};

// ─── Temporada ────────────────────────────────────────────────────────────────

export type SeasonInfo = {
  readonly number: number;
  readonly name: string;
  readonly startsAt: string; // ISO
  readonly endsAt: string; // ISO
  readonly reward1st: string;
  readonly reward2nd: string;
  readonly reward3rd: string;
};

// ─── Resposta da API (futura) ─────────────────────────────────────────────────

export type LeaderboardResponse = {
  readonly category: LeaderboardCategory;
  readonly entries: LeaderboardEntry[];
  readonly currentUser: LeaderboardEntry | null;
  readonly totalPlayers: number;
  readonly updatedAt: string;
  readonly season?: SeasonInfo;
};
