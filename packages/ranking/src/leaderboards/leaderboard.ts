import type { PlayerRanking } from '../season/season-reset';
import type { SeasonId } from '../season/season-reset';
/**
 * `leaderboard.ts` — ranking de jogadores dentro de uma Season/Tier.
 *
 * Doc 17 §14: "Ranking final por elo_rating dentro de cada division."
 * Doc 06 §3.2: processado ao fechar uma Season.
 *
 * `buildLeaderboard` — ordena e pagina; critério de desempate por vitórias
 * (maior número de vitórias sobe em caso de rating idêntico, pois indica
 * mais partidas ganhas — decisão própria não contraditória aos docs).
 *
 * Funções puras: sem efeito colateral.
 */
import type { TierName } from '../tiers/tier';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type LeaderboardEntry = Readonly<{
  readonly rank: number;
  readonly profileId: string;
  readonly eloRating: number;
  readonly tier: TierName;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly totalMatches: number;
  readonly winRate: number; // [0, 1]
}>;

export type Leaderboard = Readonly<{
  readonly seasonId: SeasonId;
  readonly tier: TierName | 'all';
  readonly entries: readonly LeaderboardEntry[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}>;

// ─── buildLeaderboard ─────────────────────────────────────────────────────────

export function buildLeaderboard(input: {
  rankings: readonly PlayerRanking[];
  seasonId: SeasonId;
  tier?: TierName;
  page?: number;
  pageSize?: number;
}): Leaderboard {
  const { rankings, seasonId, tier, page = 1, pageSize = 50 } = input;

  // Filtrar por tier e season
  const filtered = rankings.filter(
    (r) => r.seasonId === seasonId && (tier === undefined || r.tier === tier),
  );

  // Ordenar: rating DESC, vitórias DESC (desempate), partidas totais DESC
  const sorted = [...filtered].sort((a, b) => {
    if (b.eloRating !== a.eloRating) return b.eloRating - a.eloRating;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return b.totalMatches - a.totalMatches;
  });

  // Atribuir ranks globais
  const withRanks: LeaderboardEntry[] = sorted.map((r, idx) =>
    Object.freeze({
      rank: idx + 1,
      profileId: r.profileId,
      eloRating: r.eloRating,
      tier: r.tier,
      wins: r.wins,
      draws: r.draws,
      losses: r.losses,
      totalMatches: r.totalMatches,
      winRate: r.totalMatches > 0 ? Math.round((r.wins / r.totalMatches) * 1000) / 1000 : 0,
    }),
  );

  // Paginação
  const startIdx = (page - 1) * pageSize;
  const pageEntries = withRanks.slice(startIdx, startIdx + pageSize);

  return Object.freeze({
    seasonId,
    tier: tier ?? 'all',
    entries: Object.freeze(pageEntries),
    totalCount: withRanks.length,
    page,
    pageSize,
  });
}

// ─── getPlayerRank ────────────────────────────────────────────────────────────

/**
 * Retorna o rank de um jogador específico no leaderboard global de uma season.
 * null se o jogador não tiver ranking na season.
 */
export function getPlayerRank(
  rankings: readonly PlayerRanking[],
  profileId: string,
  seasonId: SeasonId,
): number | null {
  const board = buildLeaderboard({ rankings, seasonId });
  const entry = board.entries.find((e) => e.profileId === profileId);
  return entry?.rank ?? null;
}

// ─── getTopN ──────────────────────────────────────────────────────────────────

/** Retorna os N melhores jogadores da season (opcionalmente por tier). */
export function getTopN(
  rankings: readonly PlayerRanking[],
  seasonId: SeasonId,
  n: number,
  tier?: TierName,
): readonly LeaderboardEntry[] {
  const input =
    tier !== undefined
      ? { rankings, seasonId, tier, page: 1 as const, pageSize: n }
      : { rankings, seasonId, page: 1 as const, pageSize: n };
  return buildLeaderboard(input).entries;
}
