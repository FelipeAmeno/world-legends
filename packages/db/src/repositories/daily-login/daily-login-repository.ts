import { Err, Ok, type Result } from '@world-legends/shared';
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import type { DbError } from '../profiles/profile-repository';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type DailyLoginRow = Readonly<{
  profileId: string;
  currentDay: number;
  streakDays: number;
  lastClaimAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type UpsertDailyLoginInput = Readonly<{
  profileId: string;
  currentDay: number;
  streakDays: number;
  lastClaimAt: Date;
}>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface IDailyLoginRepository {
  findByProfile(profileId: string): Promise<Result<DailyLoginRow | null, DbError>>;
  upsert(input: UpsertDailyLoginInput): Promise<Result<DailyLoginRow, DbError>>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toRow(row: TableRow<'daily_login'>): DailyLoginRow {
  return Object.freeze({
    profileId: row.profile_id,
    currentDay: row.current_day,
    streakDays: row.streak_days,
    lastClaimAt: row.last_claim_at ? new Date(row.last_claim_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? 'Erro desconhecido no banco de dados',
  });
}

// ─── Adapter Supabase ─────────────────────────────────────────────────────────

export class SupabaseDailyLoginRepository implements IDailyLoginRepository {
  constructor(private readonly db: DbClient) {}

  async findByProfile(profileId: string): Promise<Result<DailyLoginRow | null, DbError>> {
    const { data, error } = await this.db
      .from('daily_login')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toRow(data) : null);
  }

  async upsert(input: UpsertDailyLoginInput): Promise<Result<DailyLoginRow, DbError>> {
    const now = new Date().toISOString();
    const { data, error } = await this.db
      .from('daily_login')
      .upsert(
        {
          profile_id: input.profileId,
          current_day: input.currentDay,
          streak_days: input.streakDays,
          last_claim_at: input.lastClaimAt.toISOString(),
          updated_at: now,
        },
        { onConflict: 'profile_id' },
      )
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toRow(data));
  }
}
