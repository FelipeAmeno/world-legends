/**
 * src/adapters/supabase/SupabaseAdapters.ts — T061
 *
 * Adapters Supabase REAIS para o @world-legends/persistence.
 * Substituem os stubs do T050 com queries Supabase completas.
 *
 * Cada método segue o padrão:
 *   try { query } catch → Err({ kind:'NetworkError', ... })
 *   sem dados → Err({ kind:'NotFound', ... })
 *   sucesso   → Ok(record)
 *
 * RPCs usadas (definidas em schema/supabase-schema.sql):
 *   deduct_credits(user_id, amount)
 *   add_reward(user_id, credits, xp)
 *   increment_match_stats(user_id, outcome)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { Err, Ok, type Result } from '@world-legends/shared';
import type {
  IAchievementRepository,
  ICollectionRepository,
  IMatchRepository,
  IPackRepository,
  ISquadRepository,
  IUserRepository,
  MatchStats,
} from '../../ports/index';
import type {
  AchievementInsert,
  AchievementRecord,
  MatchInsert,
  MatchOutcome,
  MatchRecord,
  OwnedCardInsert,
  OwnedCardRecord,
  PackOpeningInsert,
  PackOpeningRecord,
  RepoError,
  SquadRecord,
  SquadUpsert,
  UserInsert,
  UserRecord,
  UserUpdate,
} from '../../records/types';

// ─── Helper ───────────────────────────────────────────────────────────────────

function toNetErr(err: unknown, fallback = 'Erro inesperado'): RepoError {
  // biome-ignore lint/suspicious/noExplicitAny: unknown error shape
  const msg = (err as any)?.message ?? fallback;
  return { kind: 'NetworkError', message: msg, cause: err };
}

// ─── SupabaseUserRepository ───────────────────────────────────────────────────

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string): Promise<Result<UserRecord | null, RepoError>> {
    try {
      const { data, error } = await this.db.from('users').select('*').eq('id', id).maybeSingle();
      if (error) return Err(toNetErr(error));
      return Ok(data as UserRecord | null);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async upsert(data: UserInsert): Promise<Result<UserRecord, RepoError>> {
    try {
      const { data: row, error } = await this.db
        .from('users')
        .upsert(
          {
            ...data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        )
        .select()
        .single();
      if (error) return Err(toNetErr(error));
      return Ok(row as UserRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async updateProgress(id: string, update: UserUpdate): Promise<Result<UserRecord, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('users')
        .update({ ...update, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return Err(toNetErr(error));
      if (!data) return Err({ kind: 'NotFound', entity: 'user', id });
      return Ok(data as UserRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async incrementStats(id: string, outcome: MatchOutcome): Promise<Result<UserRecord, RepoError>> {
    try {
      const { data, error } = await this.db.rpc('increment_match_stats', {
        p_user_id: id,
        p_outcome: outcome,
      });
      if (error) return Err(toNetErr(error));
      if (!data) return Err({ kind: 'NotFound', entity: 'user', id });
      return Ok(data as UserRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async deductCredits(id: string, amount: number): Promise<Result<UserRecord, RepoError>> {
    try {
      const { data, error } = await this.db.rpc('deduct_credits', {
        p_user_id: id,
        p_amount: amount,
      });
      if (error) {
        // Erro de constraint → saldo insuficiente
        // biome-ignore lint/suspicious/noExplicitAny: Supabase error type lacks code field
        if ((error as any).code === '23514' || error.message.includes('insuficiente')) {
          return Err({ kind: 'Conflict', message: `Saldo insuficiente para deduzir ${amount}c` });
        }
        return Err(toNetErr(error));
      }
      if (!data) return Err({ kind: 'Conflict', message: 'Saldo insuficiente' });
      return Ok(data as UserRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async addReward(id: string, credits: number, xp: number): Promise<Result<UserRecord, RepoError>> {
    try {
      const { data, error } = await this.db.rpc('add_reward', {
        p_user_id: id,
        p_credits: credits,
        p_xp: xp,
      });
      if (error) return Err(toNetErr(error));
      if (!data) return Err({ kind: 'NotFound', entity: 'user', id });
      return Ok(data as UserRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }
}

// ─── SupabaseCollectionRepository ────────────────────────────────────────────

export class SupabaseCollectionRepository implements ICollectionRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Result<OwnedCardRecord[], RepoError>> {
    try {
      const { data, error } = await this.db
        .from('owned_cards')
        .select('*')
        .eq('user_id', userId)
        .order('obtained_at', { ascending: true });
      if (error) return Err(toNetErr(error));
      return Ok((data ?? []) as OwnedCardRecord[]);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async findById(id: string): Promise<Result<OwnedCardRecord | null, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('owned_cards')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) return Err(toNetErr(error));
      return Ok(data as OwnedCardRecord | null);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async addCard(data: OwnedCardInsert): Promise<Result<OwnedCardRecord, RepoError>> {
    try {
      const { data: row, error } = await this.db.from('owned_cards').insert(data).select().single();
      if (error) return Err(toNetErr(error));
      return Ok(row as OwnedCardRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async addCards(
    userId: string,
    cardIds: readonly string[],
  ): Promise<Result<OwnedCardRecord[], RepoError>> {
    try {
      const rows = cardIds.map((card_id) => ({
        user_id: userId,
        card_id,
        evolution: 0,
        contracts: 7,
      }));
      const { data, error } = await this.db.from('owned_cards').insert(rows).select();
      if (error) return Err(toNetErr(error));
      return Ok((data ?? []) as OwnedCardRecord[]);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async updateCard(
    id: string,
    update: { evolution?: number; contracts?: number },
  ): Promise<Result<OwnedCardRecord, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('owned_cards')
        .update(update)
        .eq('id', id)
        .select()
        .single();
      if (error) return Err(toNetErr(error));
      if (!data) return Err({ kind: 'NotFound', entity: 'owned_card', id });
      return Ok(data as OwnedCardRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async removeCard(id: string): Promise<Result<void, RepoError>> {
    try {
      const { error } = await this.db.from('owned_cards').delete().eq('id', id);
      if (error) return Err(toNetErr(error));
      return Ok(undefined);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async countByUserId(userId: string): Promise<Result<number, RepoError>> {
    try {
      const { count, error } = await this.db
        .from('owned_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (error) return Err(toNetErr(error));
      return Ok(count ?? 0);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }
}

// ─── SupabaseSquadRepository ──────────────────────────────────────────────────

export class SupabaseSquadRepository implements ISquadRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Result<SquadRecord | null, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('squads')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) return Err(toNetErr(error));
      return Ok(data as SquadRecord | null);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async upsert(data: SquadUpsert): Promise<Result<SquadRecord, RepoError>> {
    try {
      const { data: row, error } = await this.db
        .from('squads')
        .upsert(
          {
            ...data,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' },
        )
        .select()
        .single();
      if (error) return Err(toNetErr(error));
      return Ok(row as SquadRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async updateSlots(
    userId: string,
    slots: SquadRecord['slots'],
    bench: SquadRecord['bench_ids'],
  ): Promise<Result<SquadRecord, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('squads')
        .update({ slots, bench_ids: bench, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) return Err(toNetErr(error));
      if (!data) return Err({ kind: 'NotFound', entity: 'squad', id: userId });
      return Ok(data as SquadRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async changeFormation(
    userId: string,
    formation: string,
  ): Promise<Result<SquadRecord, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('squads')
        .update({ formation, slots: [], updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      if (error) return Err(toNetErr(error));
      if (!data) return Err({ kind: 'NotFound', entity: 'squad', id: userId });
      return Ok(data as SquadRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }
}

// ─── SupabaseMatchRepository ──────────────────────────────────────────────────

export class SupabaseMatchRepository implements IMatchRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(
    userId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<Result<MatchRecord[], RepoError>> {
    try {
      let query = this.db
        .from('match_history')
        .select('*')
        .eq('user_id', userId)
        .order('played_at', { ascending: false });
      if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
      else if (opts.limit) query = query.limit(opts.limit);
      const { data, error } = await query;
      if (error) return Err(toNetErr(error));
      return Ok((data ?? []) as MatchRecord[]);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async create(data: MatchInsert): Promise<Result<MatchRecord, RepoError>> {
    try {
      const { data: row, error } = await this.db
        .from('match_history')
        .insert(data)
        .select()
        .single();
      if (error) return Err(toNetErr(error));
      return Ok(row as MatchRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async getStats(userId: string): Promise<Result<MatchStats, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('match_history')
        .select('outcome, home_score, away_score')
        .eq('user_id', userId);
      if (error) return Err(toNetErr(error));
      const rows = (data ?? []) as Array<{
        outcome: string;
        home_score: number;
        away_score: number;
      }>;
      const stats = rows.reduce(
        (acc, r) => ({
          totalMatches: acc.totalMatches + 1,
          wins: acc.wins + (r.outcome === 'win' ? 1 : 0),
          draws: acc.draws + (r.outcome === 'draw' ? 1 : 0),
          losses: acc.losses + (r.outcome === 'loss' ? 1 : 0),
          goalsScored: acc.goalsScored + r.home_score,
          goalsConceded: acc.goalsConceded + r.away_score,
        }),
        { totalMatches: 0, wins: 0, draws: 0, losses: 0, goalsScored: 0, goalsConceded: 0 },
      );
      const winRate =
        stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0;
      return Ok({ ...stats, winRate });
    } catch (e) {
      return Err(toNetErr(e));
    }
  }
}

// ─── SupabasePackRepository ───────────────────────────────────────────────────

export class SupabasePackRepository implements IPackRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(
    userId: string,
    opts: { limit?: number } = {},
  ): Promise<Result<PackOpeningRecord[], RepoError>> {
    try {
      let query = this.db
        .from('pack_openings')
        .select('*')
        .eq('user_id', userId)
        .order('opened_at', { ascending: false });
      if (opts.limit) query = query.limit(opts.limit);
      const { data, error } = await query;
      if (error) return Err(toNetErr(error));
      return Ok((data ?? []) as PackOpeningRecord[]);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async create(data: PackOpeningInsert): Promise<Result<PackOpeningRecord, RepoError>> {
    try {
      const { data: row, error } = await this.db
        .from('pack_openings')
        .insert(data)
        .select()
        .single();
      if (error) return Err(toNetErr(error));
      return Ok(row as PackOpeningRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async countByPack(userId: string): Promise<Result<Record<string, number>, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('pack_openings')
        .select('pack_id')
        .eq('user_id', userId);
      if (error) return Err(toNetErr(error));
      const counts = ((data ?? []) as Array<{ pack_id: string }>).reduce<Record<string, number>>(
        (acc, r) => {
          acc[r.pack_id] = (acc[r.pack_id] ?? 0) + 1;
          return acc;
        },
        {},
      );
      return Ok(counts);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }
}

// ─── SupabaseAchievementRepository ───────────────────────────────────────────

export class SupabaseAchievementRepository implements IAchievementRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Result<AchievementRecord[], RepoError>> {
    try {
      const { data, error } = await this.db
        .from('achievements')
        .select('*')
        .eq('user_id', userId)
        .order('claimed_at', { ascending: true });
      if (error) return Err(toNetErr(error));
      return Ok((data ?? []) as AchievementRecord[]);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async isClaimedAt(
    userId: string,
    achievementId: string,
    stage: number,
  ): Promise<Result<boolean, RepoError>> {
    try {
      const { count, error } = await this.db
        .from('achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .eq('stage', stage);
      if (error) return Err(toNetErr(error));
      return Ok((count ?? 0) > 0);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async claim(data: AchievementInsert): Promise<Result<AchievementRecord, RepoError>> {
    try {
      // Upsert idempotente (unique constraint user_id + achievement_id + stage)
      const { data: row, error } = await this.db
        .from('achievements')
        .upsert(data, { onConflict: 'user_id,achievement_id,stage', ignoreDuplicates: true })
        .select()
        .single();
      if (error && !error.message.includes('duplicate')) return Err(toNetErr(error));
      // Se foi ignorado (duplicado), buscar o existente
      if (!row) {
        const { data: existing } = await this.db
          .from('achievements')
          .select()
          .eq('user_id', data.user_id)
          .eq('achievement_id', data.achievement_id)
          .eq('stage', data.stage)
          .single();
        return Ok(existing as AchievementRecord);
      }
      return Ok(row as AchievementRecord);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }

  async getSummary(userId: string): Promise<Result<Record<string, number>, RepoError>> {
    try {
      const { data, error } = await this.db
        .from('achievements')
        .select('achievement_id, stage')
        .eq('user_id', userId);
      if (error) return Err(toNetErr(error));
      const summary: Record<string, number> = {};
      for (const r of (data ?? []) as Array<{ achievement_id: string; stage: number }>) {
        if ((summary[r.achievement_id] ?? 0) < r.stage) summary[r.achievement_id] = r.stage;
      }
      return Ok(summary);
    } catch (e) {
      return Err(toNetErr(e));
    }
  }
}
