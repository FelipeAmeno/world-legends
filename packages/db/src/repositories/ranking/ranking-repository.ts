import { Err, Ok, type Result } from '@world-legends/shared';
/**
 * RankingRepository + SeasonRepository — Portas e Adapters Supabase.
 * Ranking Elo, temporadas e leaderboard (doc 02 §6, doc 06 §3).
 */
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import type { DbError } from '../profiles/profile-repository';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SeasonRow = Readonly<{
  id: string;
  code: string;
  startsAt: Date;
  endsAt: Date;
  status: 'upcoming' | 'active' | 'closed';
}>;

export type RankingRow = Readonly<{
  id: string;
  seasonId: string;
  profileId: string;
  division: number;
  eloRating: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  finalPosition: number | null;
  rewardClaimed: boolean;
}>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface ISeasonRepository {
  findActive(): Promise<Result<SeasonRow | null, DbError>>;
  findById(id: string): Promise<Result<SeasonRow | null, DbError>>;
  create(input: { code: string; startsAt: Date; endsAt: Date }): Promise<
    Result<SeasonRow, DbError>
  >;
}

export interface IRankingRepository {
  findBySeasonAndProfile(
    seasonId: string,
    profileId: string,
  ): Promise<Result<RankingRow | null, DbError>>;
  findLeaderboard(
    seasonId: string,
    limit?: number,
  ): Promise<Result<readonly RankingRow[], DbError>>;
  upsert(input: Omit<RankingRow, 'id'>): Promise<Result<RankingRow, DbError>>;
  updateElo(
    seasonId: string,
    profileId: string,
    newElo: number,
    result: 'win' | 'draw' | 'loss',
  ): Promise<Result<RankingRow, DbError>>;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toSeasonRow(row: TableRow<'seasons'>): SeasonRow {
  return Object.freeze({
    id: row.id,
    code: row.code,
    startsAt: new Date(row.starts_at),
    endsAt: new Date(row.ends_at),
    status: row.status as SeasonRow['status'],
  });
}

function toRankingRow(row: TableRow<'rankings'>): RankingRow {
  return Object.freeze({
    id: row.id,
    seasonId: row.season_id,
    profileId: row.profile_id,
    division: row.division,
    eloRating: row.elo_rating,
    matchesPlayed: row.matches_played,
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    finalPosition: row.final_position,
    rewardClaimed: row.reward_claimed,
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? 'Erro no banco',
  });
}

// ─── Adapters Supabase ────────────────────────────────────────────────────────

export class SupabaseSeasonRepository implements ISeasonRepository {
  constructor(private readonly db: DbClient) {}

  async findActive(): Promise<Result<SeasonRow | null, DbError>> {
    const { data, error } = await this.db
      .from('seasons')
      .select('*')
      .eq('status', 'active')
      .maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toSeasonRow(data) : null);
  }

  async findById(id: string): Promise<Result<SeasonRow | null, DbError>> {
    const { data, error } = await this.db.from('seasons').select('*').eq('id', id).maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toSeasonRow(data) : null);
  }

  async create(input: { code: string; startsAt: Date; endsAt: Date }): Promise<
    Result<SeasonRow, DbError>
  > {
    const { data, error } = await this.db
      .from('seasons')
      .insert({
        code: input.code,
        starts_at: input.startsAt.toISOString(),
        ends_at: input.endsAt.toISOString(),
      })
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toSeasonRow(data));
  }
}

export class SupabaseRankingRepository implements IRankingRepository {
  constructor(private readonly db: DbClient) {}

  async findBySeasonAndProfile(
    seasonId: string,
    profileId: string,
  ): Promise<Result<RankingRow | null, DbError>> {
    const { data, error } = await this.db
      .from('rankings')
      .select('*')
      .eq('season_id', seasonId)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toRankingRow(data) : null);
  }

  async findLeaderboard(
    seasonId: string,
    limit = 100,
  ): Promise<Result<readonly RankingRow[], DbError>> {
    const { data, error } = await this.db
      .from('rankings')
      .select('*')
      .eq('season_id', seasonId)
      .order('elo_rating', { ascending: false })
      .limit(limit);
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map(toRankingRow)));
  }

  async upsert(input: Omit<RankingRow, 'id'>): Promise<Result<RankingRow, DbError>> {
    const { data, error } = await this.db
      .from('rankings')
      .upsert(
        {
          season_id: input.seasonId,
          profile_id: input.profileId,
          division: input.division,
          elo_rating: input.eloRating,
          matches_played: input.matchesPlayed,
          wins: input.wins,
          draws: input.draws,
          losses: input.losses,
          final_position: input.finalPosition ?? null,
          reward_claimed: input.rewardClaimed,
        },
        { onConflict: 'season_id,profile_id' },
      )
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toRankingRow(data));
  }

  async updateElo(
    seasonId: string,
    profileId: string,
    newElo: number,
    result: 'win' | 'draw' | 'loss',
  ): Promise<Result<RankingRow, DbError>> {
    const current = await this.findBySeasonAndProfile(seasonId, profileId);
    if (!current.ok) return current;

    const row = current.value ?? {
      seasonId,
      profileId,
      division: 5,
      eloRating: 1000,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      finalPosition: null,
      rewardClaimed: false,
    };

    return this.upsert({
      ...row,
      eloRating: newElo,
      matchesPlayed: row.matchesPlayed + 1,
      wins: row.wins + (result === 'win' ? 1 : 0),
      draws: row.draws + (result === 'draw' ? 1 : 0),
      losses: row.losses + (result === 'loss' ? 1 : 0),
    });
  }
}
