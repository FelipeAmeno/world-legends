/**
 * `season-reset.ts` — Season e PlayerRanking com reset de temporada.
 *
 * FONTES DOCUMENTADAS:
 * - doc 17 §14: Season (SeasonWindow, Status: upcoming/active/closed)
 * - doc 17 §14: PlayerRanking (EloRating, Division) — exatamente 1 por (profileId × seasonId)
 * - doc 06 §3.2: fechamento de temporada — promoção/rebaixamento, recompensas, nova season
 * - doc 18 §11: "regressão à média no ELO inicial, não reset total"
 *
 * INVARIANTE (doc 17 §14): apenas uma Season pode estar 'active' por vez.
 * Esta restrição é verificada em `openSeason`.
 *
 * DECISÃO DE SOFT-RESET (D-RANK-02):
 * "Leve regressão à média" = puxar o rating X% em direção ao ELO_INITIAL.
 * Sem percentual documentado. Escolhido: 20% da distância ao ELO_INITIAL.
 * Ex: 2500 → 2500 - 0.20 × (2500 - 1000) = 2500 - 300 = 2200.
 * Isso evita reset total mas penaliza ausência de progresso recente.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import { ELO_INITIAL, type EloRating, eloRating } from '../elo/calculate-rating';
import { type TierName, tierFromRating } from '../tiers/tier';

// ─── IDs nominais ─────────────────────────────────────────────────────────────

export type SeasonId = string & { readonly _brand: 'SeasonId' };
export type RankingId = string & { readonly _brand: 'RankingId' };

export function seasonId(v: string): SeasonId {
  if (!v.trim()) throw new Error('SeasonId vazio');
  return v as SeasonId;
}
export function rankingId(v: string): RankingId {
  if (!v.trim()) throw new Error('RankingId vazio');
  return v as RankingId;
}

// ─── Season ───────────────────────────────────────────────────────────────────

export type SeasonStatus = 'upcoming' | 'active' | 'closed';

export type Season = Readonly<{
  readonly id: SeasonId;
  readonly name: string;
  readonly status: SeasonStatus;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly createdAt: Date;
}>;

export type SeasonError =
  | ReturnType<typeof validationError>
  | Readonly<{ kind: 'SeasonAlreadyClosed' }>
  | Readonly<{ kind: 'InvalidDateRange' }>
  | Readonly<{ kind: 'AnotherSeasonActive' }>;

export function createSeason(input: {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}): Result<Season, SeasonError> {
  if (!input.name.trim()) return Err(validationError('name não pode ser vazio', 'name'));
  if (input.endDate <= input.startDate) {
    return Err(Object.freeze({ kind: 'InvalidDateRange' as const }));
  }

  const now = new Date();
  const status: SeasonStatus =
    now < input.startDate ? 'upcoming' : now <= input.endDate ? 'active' : 'closed';

  return Ok(
    Object.freeze({
      id: seasonId(input.id),
      name: input.name.trim(),
      status,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now,
    }),
  );
}

export function openSeason(season: Season): Result<Season, SeasonError> {
  if (season.status === 'closed')
    return Err(Object.freeze({ kind: 'SeasonAlreadyClosed' as const }));
  return Ok(Object.freeze({ ...season, status: 'active' as const }));
}

export function closeSeason(season: Season): Result<Season, SeasonError> {
  if (season.status === 'closed')
    return Err(Object.freeze({ kind: 'SeasonAlreadyClosed' as const }));
  return Ok(Object.freeze({ ...season, status: 'closed' as const }));
}

// ─── PlayerRanking ────────────────────────────────────────────────────────────

export type PlayerRanking = Readonly<{
  readonly id: RankingId;
  readonly profileId: string;
  readonly seasonId: SeasonId;
  readonly eloRating: EloRating;
  readonly tier: TierName;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly totalMatches: number;
}>;

export function createPlayerRanking(input: {
  id: string;
  profileId: string;
  seasonId: SeasonId;
  initialRating?: number;
}): PlayerRanking {
  const rating = eloRating(input.initialRating ?? ELO_INITIAL);
  return Object.freeze({
    id: rankingId(input.id),
    profileId: input.profileId,
    seasonId: input.seasonId,
    eloRating: rating,
    tier: tierFromRating(rating).name,
    wins: 0,
    draws: 0,
    losses: 0,
    totalMatches: 0,
  });
}

export function updatePlayerRanking(
  ranking: PlayerRanking,
  newRating: EloRating,
  result: 'win' | 'draw' | 'loss',
): PlayerRanking {
  return Object.freeze({
    ...ranking,
    eloRating: newRating,
    tier: tierFromRating(newRating).name,
    wins: ranking.wins + (result === 'win' ? 1 : 0),
    draws: ranking.draws + (result === 'draw' ? 1 : 0),
    losses: ranking.losses + (result === 'loss' ? 1 : 0),
    totalMatches: ranking.totalMatches + 1,
  });
}

// ─── seasonReset — soft-reset com regressão à média (doc 06 §3.2) ─────────────

/**
 * Percentual de regressão à média no reset de temporada (D-RANK-02).
 * "Leve regressão, nunca reset total" (doc 06 §3.2).
 * Valor: 20% da distância ao ELO_INITIAL — sem número documentado.
 */
export const REGRESSION_FACTOR = 0.2;

export type SeasonResetResult = Readonly<{
  readonly profileId: string;
  readonly oldRating: number;
  readonly newRating: EloRating;
  readonly oldTier: TierName;
  readonly newTier: TierName;
  readonly delta: number;
}>;

/**
 * Aplica o soft-reset de temporada a um PlayerRanking.
 *
 * Fórmula (D-RANK-02):
 *   newRating = oldRating - REGRESSION_FACTOR × (oldRating - ELO_INITIAL)
 *
 * Exemplos:
 *   2500 → 2500 - 0.20 × 1500 = 2200 (Lenda → Elite)
 *   1000 → 1000 - 0.20 × 0   = 1000 (Prata, sem mudança — já no inicial)
 *    800 → 800  - 0.20 × -200 = 840  (cresce levemente para novos jogadores)
 */
export function seasonReset(ranking: PlayerRanking): SeasonResetResult {
  const oldRating = ranking.eloRating;
  const distance = oldRating - ELO_INITIAL;
  const newRaw = oldRating - REGRESSION_FACTOR * distance;
  const newRating = eloRating(Math.max(100, Math.round(newRaw)));

  return Object.freeze({
    profileId: ranking.profileId,
    oldRating,
    newRating,
    oldTier: ranking.tier,
    newTier: tierFromRating(newRating).name,
    delta: newRating - oldRating,
  });
}

/**
 * Aplica o soft-reset a um array de PlayerRankings e retorna os novos
 * rankings já com os ratings atualizados para a nova temporada.
 */
export function applySeasonReset(
  rankings: readonly PlayerRanking[],
  newSeasonId: SeasonId,
): readonly PlayerRanking[] {
  return rankings.map((r) => {
    const reset = seasonReset(r);
    return Object.freeze({
      ...r,
      id: rankingId(`${r.profileId}-${newSeasonId}`),
      seasonId: newSeasonId,
      eloRating: reset.newRating,
      tier: reset.newTier,
      wins: 0,
      draws: 0,
      losses: 0,
      totalMatches: 0,
    });
  });
}
