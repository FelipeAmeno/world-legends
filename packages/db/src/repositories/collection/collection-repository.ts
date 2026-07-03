import { Err, Ok, type Result } from '@world-legends/shared';
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import type { DbError } from '../profiles/profile-repository';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CollectionSetRow = Readonly<{
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  theme: string;
  sortOrder: number;
  requiredCardIds: readonly string[];
  rewardPackId: string | null;
  rewardSoftCurrency: number;
}>;

export type CollectionProgressRow = Readonly<{
  profileId: string;
  collectionSetId: string;
  completedAt: Date | null;
}>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface ICollectionRepository {
  getAllSets(): Promise<Result<readonly CollectionSetRow[], DbError>>;
  getCompletedSetIds(profileId: string): Promise<Result<readonly string[], DbError>>;
  getOwnedCardIds(profileId: string): Promise<Result<readonly string[], DbError>>;
  markSetComplete(profileId: string, setId: string): Promise<Result<void, DbError>>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toSetRow(row: TableRow<'collection_sets'>): CollectionSetRow {
  return Object.freeze({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    icon: row.icon,
    theme: row.theme,
    sortOrder: row.sort_order,
    requiredCardIds: Object.freeze(row.required_card_ids),
    rewardPackId: row.reward_pack_id,
    rewardSoftCurrency: row.reward_soft_currency,
  });
}

function toProgressRow(row: TableRow<'collection_progress'>): CollectionProgressRow {
  return Object.freeze({
    profileId: row.profile_id,
    collectionSetId: row.collection_set_id,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? 'Erro desconhecido no banco de dados',
  });
}

// ─── Adapter Supabase ─────────────────────────────────────────────────────────

export class SupabaseCollectionRepository implements ICollectionRepository {
  constructor(private readonly db: DbClient) {}

  async getAllSets(): Promise<Result<readonly CollectionSetRow[], DbError>> {
    const { data, error } = await this.db
      .from('collection_sets')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map(toSetRow)));
  }

  async getCompletedSetIds(profileId: string): Promise<Result<readonly string[], DbError>> {
    const { data, error } = await this.db
      .from('collection_progress')
      .select('collection_set_id')
      .eq('profile_id', profileId)
      .not('completed_at', 'is', null);
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map((r) => r.collection_set_id)));
  }

  async getOwnedCardIds(profileId: string): Promise<Result<readonly string[], DbError>> {
    const { data, error } = await this.db
      .from('user_cards')
      .select('card_id')
      .eq('profile_id', profileId);
    if (error) return Err(dbErr(error));
    // Deduplicate — user may own multiple copies of the same card
    const unique = [...new Set((data ?? []).map((r) => r.card_id))];
    return Ok(Object.freeze(unique));
  }

  async markSetComplete(profileId: string, setId: string): Promise<Result<void, DbError>> {
    const { error } = await this.db.from('collection_progress').upsert(
      {
        profile_id: profileId,
        collection_set_id: setId,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id,collection_set_id' },
    );
    if (error) return Err(dbErr(error));
    return Ok(undefined);
  }
}
