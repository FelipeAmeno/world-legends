import { Err, Ok, type Result } from '@world-legends/shared';
/**
 * ProfileRepository — Porta + Adapter Supabase.
 *
 * Porta: interface definida em termos do domínio (sem referências a Supabase).
 * Adapter: implementação Supabase que satisfaz a porta.
 *
 * REGRA (doc 18 §3): packages de domínio definem a Porta (interface).
 * packages/db fornece o Adapter. A composição acontece em apps/*.
 * Aqui, Porta e Adapter vivem no mesmo arquivo por conveniência —
 * em produção, a Porta seria importada de @world-legends/collection etc.
 */
import type { DbClient, TableRow, TableUpdate } from '../../adapters/supabase-client';

// ─── Tipos de domínio (aqui simplificados — em prod vêm de packages de domínio)

export type ProfileRow = Readonly<{
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  countryCode: string;
  softCurrency: number;
  hardCurrency: number;
  fragmentBalance: number;
  eloRating: number;
  createdAt: Date;
  updatedAt: Date;
}>;

export type CreateProfileInput = Readonly<{
  id: string;
  username: string;
  displayName?: string;
  countryCode?: string;
}>;

export type UpdateProfileInput = Readonly<{
  displayName?: string;
  avatarUrl?: string;
  softCurrency?: number;
  hardCurrency?: number;
  fragmentBalance?: number;
  eloRating?: number;
}>;

export type DbError = Readonly<{ code: string; message: string }>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface IProfileRepository {
  findById(id: string): Promise<Result<ProfileRow | null, DbError>>;
  findByUsername(username: string): Promise<Result<ProfileRow | null, DbError>>;
  create(input: CreateProfileInput): Promise<Result<ProfileRow, DbError>>;
  update(id: string, input: UpdateProfileInput): Promise<Result<ProfileRow, DbError>>;
  creditSoftCurrency(id: string, amount: number): Promise<Result<number, DbError>>;
  debitSoftCurrency(id: string, amount: number): Promise<Result<number, DbError>>;
  creditFragments(id: string, amount: number): Promise<Result<number, DbError>>;
  debitFragments(id: string, amount: number): Promise<Result<number, DbError>>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toProfileRow(row: TableRow<'profiles'>): ProfileRow {
  return Object.freeze({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    countryCode: row.country_code,
    softCurrency: row.soft_currency,
    hardCurrency: row.hard_currency,
    fragmentBalance: row.fragment_balance,
    eloRating: row.elo_rating,
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

export class SupabaseProfileRepository implements IProfileRepository {
  constructor(private readonly db: DbClient) {}

  async findById(id: string): Promise<Result<ProfileRow | null, DbError>> {
    const { data, error } = await this.db.from('profiles').select('*').eq('id', id).maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toProfileRow(data) : null);
  }

  async findByUsername(username: string): Promise<Result<ProfileRow | null, DbError>> {
    const { data, error } = await this.db
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toProfileRow(data) : null);
  }

  async create(input: CreateProfileInput): Promise<Result<ProfileRow, DbError>> {
    const { data, error } = await this.db
      .from('profiles')
      .insert({
        id: input.id,
        username: input.username,
        display_name: input.displayName ?? null,
        country_code: input.countryCode ?? 'BR',
        soft_currency: 500,
        hard_currency: 0,
        fragment_balance: 0,
        elo_rating: 1000,
      })
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toProfileRow(data));
  }

  async update(id: string, input: UpdateProfileInput): Promise<Result<ProfileRow, DbError>> {
    const patch: Record<string, unknown> = {};
    if (input.displayName !== undefined) patch.display_name = input.displayName;
    if (input.avatarUrl !== undefined) patch.avatar_url = input.avatarUrl;
    if (input.softCurrency !== undefined) patch.soft_currency = input.softCurrency;
    if (input.hardCurrency !== undefined) patch.hard_currency = input.hardCurrency;
    if (input.fragmentBalance !== undefined) patch.fragment_balance = input.fragmentBalance;
    if (input.eloRating !== undefined) patch.elo_rating = input.eloRating;
    patch.updated_at = new Date().toISOString();

    const { data, error } = await this.db
      .from('profiles')
      .update(patch as TableUpdate<'profiles'>)
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toProfileRow(data));
  }

  async creditSoftCurrency(id: string, amount: number): Promise<Result<number, DbError>> {
    type AnyRpc = {
      rpc(
        fn: string,
        args: Record<string, unknown>,
      ): Promise<{ data: unknown; error: { code?: string; message?: string } | null }>;
    };
    const { data, error } = await (this.db as unknown as AnyRpc).rpc('credit_soft_currency', {
      p_profile_id: id,
      p_amount: amount,
    });
    if (error) return Err(dbErr(error));
    return Ok(data as number);
  }

  async debitSoftCurrency(id: string, amount: number): Promise<Result<number, DbError>> {
    // Verificar saldo antes de debitar (saldo nunca negativo — doc 17 §9)
    const profile = await this.findById(id);
    if (!profile.ok) return profile;
    if (profile.value === null)
      return Err(dbErr({ code: 'NOT_FOUND', message: 'Profile não encontrado' }));
    if (profile.value.softCurrency < amount) {
      return Err(
        Object.freeze({ code: 'INSUFFICIENT_FUNDS', message: 'Saldo insuficiente de Créditos' }),
      );
    }
    return this.update(id, { softCurrency: profile.value.softCurrency - amount }).then((r) =>
      r.ok ? Ok(r.value.softCurrency) : Err(r.error),
    );
  }

  async creditFragments(id: string, amount: number): Promise<Result<number, DbError>> {
    const profile = await this.findById(id);
    if (!profile.ok) return profile;
    if (profile.value === null)
      return Err(dbErr({ code: 'NOT_FOUND', message: 'Profile não encontrado' }));
    return this.update(id, { fragmentBalance: profile.value.fragmentBalance + amount }).then((r) =>
      r.ok ? Ok(r.value.fragmentBalance) : Err(r.error),
    );
  }

  async debitFragments(id: string, amount: number): Promise<Result<number, DbError>> {
    const profile = await this.findById(id);
    if (!profile.ok) return profile;
    if (profile.value === null)
      return Err(dbErr({ code: 'NOT_FOUND', message: 'Profile não encontrado' }));
    if (profile.value.fragmentBalance < amount) {
      return Err(
        Object.freeze({ code: 'INSUFFICIENT_FUNDS', message: 'Saldo insuficiente de Fragmentos' }),
      );
    }
    return this.update(id, { fragmentBalance: profile.value.fragmentBalance - amount }).then((r) =>
      r.ok ? Ok(r.value.fragmentBalance) : Err(r.error),
    );
  }
}
