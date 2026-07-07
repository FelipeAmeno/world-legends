import { Err, Ok, type Result } from '@world-legends/shared';
/**
 * UserCardRepository + CardRepository — Portas e Adapters Supabase.
 * Gerencia a coleção de cartas do usuário (doc 02 §3, doc 17 §3/§4).
 */
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import type { DbError } from '../profiles/profile-repository';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type UserCardRow = Readonly<{
  id: string;
  profileId: string;
  cardId: string;
  level: number;
  form: number;
  isInjured: boolean;
  injuryReturnsAtRound: number | null;
  suspendedMatches: number;
  yellowCardsAccum: number;
  acquiredVia: string;
  acquiredAt: Date;
}>;

export type CreateUserCardInput = Readonly<{
  profileId: string;
  cardId: string;
  acquiredVia: 'pack' | 'draft' | 'reward' | 'trade' | 'starter' | 'craft' | 'achievement';
}>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface IUserCardRepository {
  findByProfile(profileId: string): Promise<Result<readonly UserCardRow[], DbError>>;
  findById(id: string): Promise<Result<UserCardRow | null, DbError>>;
  findByProfileAndCard(
    profileId: string,
    cardId: string,
  ): Promise<Result<UserCardRow | null, DbError>>;
  create(input: CreateUserCardInput): Promise<Result<UserCardRow, DbError>>;
  updateForm(id: string, form: number): Promise<Result<UserCardRow, DbError>>;
  setInjured(
    id: string,
    injured: boolean,
    returnsAtRound?: number,
  ): Promise<Result<UserCardRow, DbError>>;
  addYellowCard(id: string): Promise<Result<UserCardRow, DbError>>;
  delete(id: string): Promise<Result<void, DbError>>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toUserCardRow(row: TableRow<'user_cards'>): UserCardRow {
  return Object.freeze({
    id: row.id,
    profileId: row.profile_id,
    cardId: row.card_id,
    level: row.level,
    form: row.form,
    isInjured: row.is_injured,
    injuryReturnsAtRound: row.injury_returns_at_round,
    suspendedMatches: row.suspended_matches,
    yellowCardsAccum: row.yellow_cards_accum,
    acquiredVia: row.acquired_via,
    acquiredAt: new Date(row.acquired_at),
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? 'Erro no banco',
  });
}

// ─── Adapter Supabase ─────────────────────────────────────────────────────────

export class SupabaseUserCardRepository implements IUserCardRepository {
  constructor(private readonly db: DbClient) {}

  async findByProfile(profileId: string): Promise<Result<readonly UserCardRow[], DbError>> {
    const { data, error } = await this.db
      .from('user_cards')
      .select('*')
      .eq('profile_id', profileId)
      .order('acquired_at', { ascending: false });
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map(toUserCardRow)));
  }

  async findById(id: string): Promise<Result<UserCardRow | null, DbError>> {
    const { data, error } = await this.db.from('user_cards').select('*').eq('id', id).maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toUserCardRow(data) : null);
  }

  async findByProfileAndCard(
    profileId: string,
    cardId: string,
  ): Promise<Result<UserCardRow | null, DbError>> {
    const { data, error } = await this.db
      .from('user_cards')
      .select('*')
      .eq('profile_id', profileId)
      .eq('card_id', cardId)
      .maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toUserCardRow(data) : null);
  }

  async create(input: CreateUserCardInput): Promise<Result<UserCardRow, DbError>> {
    const { data, error } = await this.db
      .from('user_cards')
      .insert({
        profile_id: input.profileId,
        card_id: input.cardId,
        acquired_via: input.acquiredVia,
        level: 1,
        form: 0,
        is_injured: false,
        suspended_matches: 0,
        yellow_cards_accum: 0,
      })
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toUserCardRow(data));
  }

  async updateForm(id: string, form: number): Promise<Result<UserCardRow, DbError>> {
    if (form < -2 || form > 2) {
      return Err(
        Object.freeze({
          code: 'INVALID_FORM',
          message: `Form deve estar em [-2, +2], recebido: ${form}`,
        }),
      );
    }
    const { data, error } = await this.db
      .from('user_cards')
      .update({ form })
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toUserCardRow(data));
  }

  async setInjured(
    id: string,
    injured: boolean,
    returnsAtRound?: number,
  ): Promise<Result<UserCardRow, DbError>> {
    const { data, error } = await this.db
      .from('user_cards')
      .update({ is_injured: injured, injury_returns_at_round: returnsAtRound ?? null })
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toUserCardRow(data));
  }

  async addYellowCard(id: string): Promise<Result<UserCardRow, DbError>> {
    const found = await this.findById(id);
    if (!found.ok) return found;
    if (!found.value)
      return Err(Object.freeze({ code: 'NOT_FOUND', message: 'UserCard não encontrado' }));
    const newAccum = found.value.yellowCardsAccum + 1;
    const suspended = found.value.suspendedMatches + (newAccum >= 3 ? 1 : 0);
    const { data, error } = await this.db
      .from('user_cards')
      .update({ yellow_cards_accum: newAccum % 3, suspended_matches: suspended })
      .eq('id', id)
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toUserCardRow(data));
  }

  async delete(id: string): Promise<Result<void, DbError>> {
    const { error } = await this.db.from('user_cards').delete().eq('id', id);
    if (error) return Err(dbErr(error));
    return Ok(undefined);
  }
}
