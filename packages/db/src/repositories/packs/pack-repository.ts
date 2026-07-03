/**
 * PackRepository — Porta + Adapter Supabase.
 * Packs, abertura e pity counters (doc 02 §7, doc 10 §15).
 */
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import { Err, Ok, type Result } from '@world-legends/shared';
import type { DbError } from '../profiles/profile-repository';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type PackRow = Readonly<{
  id:            string;
  code:          string;
  name:          string;
  priceSoft:     number | null;
  priceHard:     number | null;
  cardsPerPack:  number;
  dropTable:     Record<string, number>;
  isPurchasable: boolean;
  availableFrom: Date | null;
  availableTo:   Date | null;
}>;

export type PackOpeningRow = Readonly<{
  id:        string;
  profileId: string;
  packId:    string;
  rngSeed:   number;
  openedAt:  Date;
  cardIds:   readonly string[];  // IDs das cartas sorteadas (join)
}>;

export type PityCounterRow = Readonly<{
  profileId: string;
  pityType:  'legendary_plus' | 'ultra_plus';
  packCount: number;
}>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface IPackRepository {
  findByCode(code: string): Promise<Result<PackRow | null, DbError>>;
  findAvailable(now?: Date): Promise<Result<readonly PackRow[], DbError>>;
  recordOpening(input: {
    profileId: string; packId: string; rngSeed: number; cardIds: string[];
  }): Promise<Result<string, DbError>>;
  getPityCounter(profileId: string, pityType: 'legendary_plus' | 'ultra_plus'): Promise<Result<number, DbError>>;
  incrementPityCounter(profileId: string, pityType: 'legendary_plus' | 'ultra_plus'): Promise<Result<number, DbError>>;
  resetPityCounter(profileId: string, pityType: 'legendary_plus' | 'ultra_plus'): Promise<Result<void, DbError>>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toPackRow(row: TableRow<'packs'>): PackRow {
  return Object.freeze({
    id:            row.id,
    code:          row.code,
    name:          row.name,
    priceSoft:     row.price_soft,
    priceHard:     row.price_hard,
    cardsPerPack:  row.cards_per_pack,
    dropTable:     row.drop_table as Record<string, number>,
    isPurchasable: row.is_purchasable,
    availableFrom: row.available_from ? new Date(row.available_from) : null,
    availableTo:   row.available_to   ? new Date(row.available_to)   : null,
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({ code: error?.code ?? 'UNKNOWN', message: error?.message ?? 'Erro no banco' });
}

// ─── Adapter Supabase ─────────────────────────────────────────────────────────

export class SupabasePackRepository implements IPackRepository {
  constructor(private readonly db: DbClient) {}

  async findByCode(code: string): Promise<Result<PackRow | null, DbError>> {
    const { data, error } = await this.db
      .from('packs').select('*').eq('code', code).maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toPackRow(data) : null);
  }

  async findAvailable(now = new Date()): Promise<Result<readonly PackRow[], DbError>> {
    const iso = now.toISOString();
    const { data, error } = await this.db
      .from('packs')
      .select('*')
      .eq('is_purchasable', true)
      .or(`available_from.is.null,available_from.lte.${iso}`)
      .or(`available_to.is.null,available_to.gte.${iso}`);
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map(toPackRow)));
  }

  async recordOpening(input: {
    profileId: string; packId: string; rngSeed: number; cardIds: string[];
  }): Promise<Result<string, DbError>> {
    // 1. Inserir pack_opening
    const { data: po, error: poErr } = await this.db
      .from('pack_openings')
      .insert({ profile_id: input.profileId, pack_id: input.packId, rng_seed: input.rngSeed })
      .select('id').single();
    if (poErr || !po) return Err(dbErr(poErr));

    // 2. Não inserimos pack_opening_cards aqui pois user_cards são criados
    //    via Server Action (que usa service_role). Retorna o opening ID.
    return Ok(po.id);
  }

  async getPityCounter(profileId: string, pityType: 'legendary_plus' | 'ultra_plus'): Promise<Result<number, DbError>> {
    const { data, error } = await this.db
      .from('pity_counters')
      .select('pack_count')
      .eq('profile_id', profileId)
      .eq('pity_type', pityType)
      .maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data?.pack_count ?? 0);
  }

  async incrementPityCounter(profileId: string, pityType: 'legendary_plus' | 'ultra_plus'): Promise<Result<number, DbError>> {
    const current = await this.getPityCounter(profileId, pityType);
    if (!current.ok) return current;
    const newCount = current.value + 1;
    const r1 = await (this.db
      .from('pity_counters')
      .upsert({ profile_id: profileId, pity_type: pityType, pack_count: newCount },
               { onConflict: 'profile_id,pity_type' }) as unknown as Promise<{ error: { code?: string; message?: string } | null }>);
    if (r1.error) return Err(dbErr(r1.error));
    return Ok(newCount);
  }

  async resetPityCounter(profileId: string, pityType: 'legendary_plus' | 'ultra_plus'): Promise<Result<void, DbError>> {
    const r2 = await (this.db
      .from('pity_counters')
      .upsert({ profile_id: profileId, pity_type: pityType, pack_count: 0 },
               { onConflict: 'profile_id,pity_type' }) as unknown as Promise<{ error: { code?: string; message?: string } | null }>);
    if (r2.error) return Err(dbErr(r2.error));
    return Ok(undefined);
  }
}
