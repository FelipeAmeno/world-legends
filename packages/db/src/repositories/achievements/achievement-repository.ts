import { Err, Ok, type Result } from '@world-legends/shared';
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import type { DbError } from '../profiles/profile-repository';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlayerTrophyRow = Readonly<{
  id: string;
  profileId: string;
  achievementId: string;
  unlockedAt: Date;
  rewardClaimed: boolean;
}>;

export type InsertPlayerTrophyInput = Readonly<{
  profileId: string;
  achievementId: string;
}>;

// ─── Port ─────────────────────────────────────────────────────────────────────

export interface IAchievementRepository {
  findAllByProfile(profileId: string): Promise<Result<readonly PlayerTrophyRow[], DbError>>;
  insertTrophy(input: InsertPlayerTrophyInput): Promise<Result<PlayerTrophyRow, DbError>>;
  insertManyTrophies(
    inputs: readonly InsertPlayerTrophyInput[],
  ): Promise<Result<readonly PlayerTrophyRow[], DbError>>;
  markRewardClaimed(profileId: string, achievementId: string): Promise<Result<void, DbError>>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toRow(row: TableRow<'player_trophies'>): PlayerTrophyRow {
  return Object.freeze({
    id: row.id,
    profileId: row.profile_id,
    achievementId: row.achievement_id,
    unlockedAt: new Date(row.unlocked_at),
    rewardClaimed: row.reward_claimed,
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? 'Erro desconhecido no banco de dados',
  });
}

// ─── Supabase Adapter ─────────────────────────────────────────────────────────

export class SupabaseAchievementRepository implements IAchievementRepository {
  constructor(private readonly db: DbClient) {}

  async findAllByProfile(profileId: string): Promise<Result<readonly PlayerTrophyRow[], DbError>> {
    const { data, error } = await this.db
      .from('player_trophies')
      .select('*')
      .eq('profile_id', profileId)
      .order('unlocked_at', { ascending: true });
    if (error) return Err(dbErr(error));
    return Ok((data ?? []).map(toRow));
  }

  async insertTrophy(input: InsertPlayerTrophyInput): Promise<Result<PlayerTrophyRow, DbError>> {
    const { data, error } = await this.db
      .from('player_trophies')
      .insert({ profile_id: input.profileId, achievement_id: input.achievementId })
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toRow(data));
  }

  async insertManyTrophies(
    inputs: readonly InsertPlayerTrophyInput[],
  ): Promise<Result<readonly PlayerTrophyRow[], DbError>> {
    if (inputs.length === 0) return Ok([]);
    const rows = inputs.map((i) => ({
      profile_id: i.profileId,
      achievement_id: i.achievementId,
    }));
    const { data, error } = await this.db
      .from('player_trophies')
      .insert(rows as (typeof rows)[number][])
      .select('*');
    if (error) return Err(dbErr(error));
    return Ok((data ?? []).map(toRow));
  }

  async markRewardClaimed(
    profileId: string,
    achievementId: string,
  ): Promise<Result<void, DbError>> {
    const { error } = await this.db
      .from('player_trophies')
      .update({ reward_claimed: true })
      .eq('profile_id', profileId)
      .eq('achievement_id', achievementId);
    if (error) return Err(dbErr(error));
    return Ok(undefined);
  }
}
