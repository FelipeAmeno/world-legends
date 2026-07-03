import { Err, Ok, type Result } from '@world-legends/shared';
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import type { DbError } from '../profiles/profile-repository';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardMasteryRow = Readonly<{
  id: string;
  profileId: string;
  cardId: string;
  xp: number;
  masteryLevel: number;
  createdAt: Date;
  updatedAt: Date;
}>;

export type UpsertCardMasteryInput = Readonly<{
  profileId: string;
  cardId: string;
  xp: number;
  masteryLevel: number;
}>;

// ─── Port ─────────────────────────────────────────────────────────────────────

export interface ICardMasteryRepository {
  findAllByProfile(profileId: string): Promise<Result<readonly CardMasteryRow[], DbError>>;
  findByCard(profileId: string, cardId: string): Promise<Result<CardMasteryRow | null, DbError>>;
  upsert(input: UpsertCardMasteryInput): Promise<Result<CardMasteryRow, DbError>>;
  addXp(
    profileId: string,
    cardId: string,
    deltaXp: number,
  ): Promise<Result<CardMasteryRow, DbError>>;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

function toRow(row: TableRow<'card_mastery'>): CardMasteryRow {
  return Object.freeze({
    id: row.id,
    profileId: row.profile_id,
    cardId: row.card_id,
    xp: row.xp,
    masteryLevel: row.mastery_level,
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

// ─── XP thresholds per level ─────────────────────────────────────────────────

const MASTERY_THRESHOLDS = [0, 50, 150, 350, 750, 1500] as const;

function computeLevel(xp: number): number {
  let level = 0;
  for (let i = MASTERY_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= (MASTERY_THRESHOLDS[i] ?? 0)) {
      level = i;
      break;
    }
  }
  return Math.min(level, 5);
}

// ─── Supabase Adapter ─────────────────────────────────────────────────────────

export class SupabaseCardMasteryRepository implements ICardMasteryRepository {
  constructor(private readonly db: DbClient) {}

  async findAllByProfile(
    profileId: string,
  ): Promise<Result<readonly CardMasteryRow[], DbError>> {
    const { data, error } = await this.db
      .from('card_mastery')
      .select('*')
      .eq('profile_id', profileId);
    if (error) return Err(dbErr(error));
    return Ok((data ?? []).map(toRow));
  }

  async findByCard(
    profileId: string,
    cardId: string,
  ): Promise<Result<CardMasteryRow | null, DbError>> {
    const { data, error } = await this.db
      .from('card_mastery')
      .select('*')
      .eq('profile_id', profileId)
      .eq('card_id', cardId)
      .maybeSingle();
    if (error) return Err(dbErr(error));
    return Ok(data ? toRow(data) : null);
  }

  async upsert(input: UpsertCardMasteryInput): Promise<Result<CardMasteryRow, DbError>> {
    const { data, error } = await this.db
      .from('card_mastery')
      .upsert(
        {
          profile_id: input.profileId,
          card_id: input.cardId,
          xp: input.xp,
          mastery_level: input.masteryLevel,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,card_id' },
      )
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toRow(data));
  }

  async addXp(
    profileId: string,
    cardId: string,
    deltaXp: number,
  ): Promise<Result<CardMasteryRow, DbError>> {
    // Fetch current, compute new XP + level, upsert
    const existing = await this.findByCard(profileId, cardId);
    if (!existing.ok) return existing;

    const currentXp = existing.value?.xp ?? 0;
    const newXp = currentXp + deltaXp;
    const newLevel = computeLevel(newXp);

    return this.upsert({
      profileId,
      cardId,
      xp: newXp,
      masteryLevel: newLevel,
    });
  }
}
