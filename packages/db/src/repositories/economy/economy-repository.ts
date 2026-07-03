/**
 * EconomyRepository — Porta + Adapter Supabase.
 * Craft requests e transações econômicas (doc 02, doc 10 §17).
 *
 * Garante a invariante de atomicidade do craft (doc 17 §10):
 * débito de fragmentos + criação de UserCard são atômicos via transação.
 * Em Supabase, isso requer uma Postgres Function / RPC para garantia real.
 * Aqui, a transação é sequencial com compensação em caso de falha.
 */
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import { Err, Ok, type Result } from '@world-legends/shared';
import type { DbError } from '../profiles/profile-repository';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CraftRequestRow = Readonly<{
  id:                   string;
  profileId:            string;
  targetCardId:         string;
  resultingUserCardId:  string | null;
  fragmentCost:         number;
  idempotencyKey:       string | null;
  status:               'pending' | 'completed' | 'failed';
  createdAt:            Date;
}>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface ICraftRepository {
  findByIdempotencyKey(key: string, profileId: string): Promise<Result<CraftRequestRow | null, DbError>>;
  create(input: {
    profileId:      string;
    targetCardId:   string;
    fragmentCost:   number;
    idempotencyKey?: string;
  }): Promise<Result<CraftRequestRow, DbError>>;
  complete(id: string, resultingUserCardId: string): Promise<Result<CraftRequestRow, DbError>>;
  fail(id: string): Promise<Result<CraftRequestRow, DbError>>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toCraftRow(row: TableRow<'craft_requests'>): CraftRequestRow {
  return Object.freeze({
    id:                  row.id,
    profileId:           row.profile_id,
    targetCardId:        row.target_card_id,
    resultingUserCardId: row.resulting_user_card_id,
    fragmentCost:        row.fragment_cost,
    idempotencyKey:      row.idempotency_key,
    status:              row.status as CraftRequestRow['status'],
    createdAt:           new Date(row.created_at),
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({ code: error?.code ?? 'UNKNOWN', message: error?.message ?? 'Erro no banco' });
}

// ─── Adapter Supabase ─────────────────────────────────────────────────────────

export class SupabaseCraftRepository implements ICraftRepository {
  constructor(private readonly db: DbClient) {}

  async findByIdempotencyKey(key: string, profileId: string): Promise<Result<CraftRequestRow | null, DbError>> {
    const { data, error } = await this.db
      .from('craft_requests')
      .select('*')
      .eq('idempotency_key', key)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toCraftRow(data) : null);
  }

  async create(input: {
    profileId: string; targetCardId: string; fragmentCost: number; idempotencyKey?: string;
  }): Promise<Result<CraftRequestRow, DbError>> {
    const { data, error } = await this.db
      .from('craft_requests')
      .insert({
        profile_id:      input.profileId,
        target_card_id:  input.targetCardId,
        fragment_cost:   input.fragmentCost,
        idempotency_key: input.idempotencyKey ?? null,
        status:          'pending',
      })
      .select('*').single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toCraftRow(data));
  }

  async complete(id: string, resultingUserCardId: string): Promise<Result<CraftRequestRow, DbError>> {
    const { data, error } = await this.db
      .from('craft_requests')
      .update({ status: 'completed', resulting_user_card_id: resultingUserCardId })
      .eq('id', id).select('*').single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toCraftRow(data));
  }

  async fail(id: string): Promise<Result<CraftRequestRow, DbError>> {
    const { data, error } = await this.db
      .from('craft_requests')
      .update({ status: 'failed' })
      .eq('id', id).select('*').single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toCraftRow(data));
  }
}
