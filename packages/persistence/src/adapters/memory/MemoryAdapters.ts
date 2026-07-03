/**
 * src/adapters/memory/MemoryAdapters.ts
 *
 * Implementações in-memory de todos os repositórios.
 * Usadas agora (sem banco), em testes e como referência para os adapters Supabase.
 *
 * Características:
 *   - Funcionam 100% em memória (Map + array)
 *   - Persistência zero entre reloads (state local)
 *   - Simulam latência assíncrona (microtask via Promise.resolve)
 *   - IDs gerados com crypto.randomUUID() ou fallback sequencial
 *   - Operações atômicas (não há race conditions em single-thread JS)
 */

import { Err, Ok, type Result } from '@world-legends/shared';
import type {
  ICollectionRepository,
  IMatchRepository,
  IPackRepository,
  ISquadRepository,
  IUserRepository,
  MatchStats,
} from '../../ports/index';
import type {
  MatchInsert,
  MatchOutcome,
  MatchRecord,
  OwnedCardInsert,
  OwnedCardRecord,
  PackOpeningInsert,
  PackOpeningRecord,
  RepoError,
  SquadRecord,
  SquadSlotJson,
  SquadUpsert,
  UserInsert,
  UserRecord,
  UserUpdate,
} from '../../records/types';

// ─── Utils ────────────────────────────────────────────────────────────────────

let _seq = 0;
function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mem-${Date.now()}-${++_seq}`;
}

function now(): string {
  return new Date().toISOString();
}

function xpForLevel(level: number): number {
  return level * 100 + Math.floor(level * level * 5);
}

// ─── MemUserRepository ────────────────────────────────────────────────────────

export class MemUserRepository implements IUserRepository {
  private readonly store = new Map<string, UserRecord>();

  async findById(id: string): Promise<Result<UserRecord | null, RepoError>> {
    return Ok(this.store.get(id) ?? null);
  }

  async upsert(data: UserInsert): Promise<Result<UserRecord, RepoError>> {
    const ts = now();
    const existing = this.store.get(data.id);
    const record: UserRecord = {
      ...data,
      created_at: existing?.created_at ?? ts,
      updated_at: ts,
    };
    this.store.set(data.id, record);
    return Ok(record);
  }

  async updateProgress(id: string, update: UserUpdate): Promise<Result<UserRecord, RepoError>> {
    const existing = this.store.get(id);
    if (!existing) return Err({ kind: 'NotFound', entity: 'user', id } as const);

    const updated: UserRecord = { ...existing, ...update, updated_at: now() };
    this.store.set(id, updated);
    return Ok(updated);
  }

  async incrementStats(id: string, outcome: MatchOutcome): Promise<Result<UserRecord, RepoError>> {
    const existing = this.store.get(id);
    if (!existing) return Err({ kind: 'NotFound', entity: 'user', id } as const);

    const updated: UserRecord = {
      ...existing,
      wins: existing.wins + (outcome === 'win' ? 1 : 0),
      draws: existing.draws + (outcome === 'draw' ? 1 : 0),
      losses: existing.losses + (outcome === 'loss' ? 1 : 0),
      updated_at: now(),
    };
    this.store.set(id, updated);
    return Ok(updated);
  }

  async deductCredits(id: string, amount: number): Promise<Result<UserRecord, RepoError>> {
    const existing = this.store.get(id);
    if (!existing) return Err({ kind: 'NotFound', entity: 'user', id } as const);
    if (existing.credits < amount) {
      return Err({
        kind: 'Conflict',
        message: `Saldo insuficiente: ${existing.credits} < ${amount}`,
      } as const);
    }

    const updated: UserRecord = {
      ...existing,
      credits: existing.credits - amount,
      updated_at: now(),
    };
    this.store.set(id, updated);
    return Ok(updated);
  }

  async addReward(id: string, credits: number, xp: number): Promise<Result<UserRecord, RepoError>> {
    const existing = this.store.get(id);
    if (!existing) return Err({ kind: 'NotFound', entity: 'user', id } as const);

    // Level-up calculation
    let level = existing.level;
    let curXp = existing.current_xp + xp;
    let xpForNxt = existing.xp_for_next;

    while (curXp >= xpForNxt) {
      curXp -= xpForNxt;
      level += 1;
      xpForNxt = xpForLevel(level + 1);
    }

    const updated: UserRecord = {
      ...existing,
      credits: existing.credits + credits,
      current_xp: curXp,
      xp_for_next: xpForNxt,
      level,
      updated_at: now(),
    };
    this.store.set(id, updated);
    return Ok(updated);
  }
}

// ─── MemCollectionRepository ─────────────────────────────────────────────────

export class MemCollectionRepository implements ICollectionRepository {
  private readonly store = new Map<string, OwnedCardRecord>(); // id → record
  private readonly byUser = new Map<string, Set<string>>(); // userId → Set<id>

  private userSet(userId: string): Set<string> {
    if (!this.byUser.has(userId)) this.byUser.set(userId, new Set());
    // biome-ignore lint/style/noNonNullAssertion: set by has() check above
    return this.byUser.get(userId)!;
  }

  async findByUserId(userId: string): Promise<Result<OwnedCardRecord[], RepoError>> {
    const ids = this.userSet(userId);
    // biome-ignore lint/style/noNonNullAssertion: ids come from this.store keys
    const records = [...ids].map((id) => this.store.get(id)!).filter(Boolean);
    return Ok(records.sort((a, b) => a.obtained_at.localeCompare(b.obtained_at)));
  }

  async findById(id: string): Promise<Result<OwnedCardRecord | null, RepoError>> {
    return Ok(this.store.get(id) ?? null);
  }

  async addCard(data: OwnedCardInsert): Promise<Result<OwnedCardRecord, RepoError>> {
    const record: OwnedCardRecord = { id: uid(), ...data, obtained_at: now() };
    this.store.set(record.id, record);
    this.userSet(data.user_id).add(record.id);
    return Ok(record);
  }

  async addCards(
    userId: string,
    cardIds: readonly string[],
  ): Promise<Result<OwnedCardRecord[], RepoError>> {
    const results: OwnedCardRecord[] = [];
    const ts = now();
    for (const card_id of cardIds) {
      const record: OwnedCardRecord = {
        id: uid(),
        user_id: userId,
        card_id,
        evolution: 0,
        contracts: 7,
        obtained_at: ts,
      };
      this.store.set(record.id, record);
      this.userSet(userId).add(record.id);
      results.push(record);
    }
    return Ok(results);
  }

  async updateCard(
    id: string,
    update: { evolution?: number; contracts?: number },
  ): Promise<Result<OwnedCardRecord, RepoError>> {
    const existing = this.store.get(id);
    if (!existing) return Err({ kind: 'NotFound', entity: 'owned_card', id } as const);

    const updated: OwnedCardRecord = { ...existing, ...update };
    this.store.set(id, updated);
    return Ok(updated);
  }

  async removeCard(id: string): Promise<Result<void, RepoError>> {
    const existing = this.store.get(id);
    if (!existing) return Err({ kind: 'NotFound', entity: 'owned_card', id } as const);

    this.store.delete(id);
    this.userSet(existing.user_id).delete(id);
    return Ok(undefined);
  }

  async countByUserId(userId: string): Promise<Result<number, RepoError>> {
    return Ok(this.userSet(userId).size);
  }
}

// ─── MemSquadRepository ───────────────────────────────────────────────────────

export class MemSquadRepository implements ISquadRepository {
  private readonly byUser = new Map<string, SquadRecord>();

  async findByUserId(userId: string): Promise<Result<SquadRecord | null, RepoError>> {
    return Ok(this.byUser.get(userId) ?? null);
  }

  async upsert(data: SquadUpsert): Promise<Result<SquadRecord, RepoError>> {
    const existing = this.byUser.get(data.user_id);
    const record: SquadRecord = {
      id: existing?.id ?? uid(),
      user_id: data.user_id,
      formation: data.formation,
      slots: data.slots,
      bench_ids: data.bench_ids,
      updated_at: now(),
    };
    this.byUser.set(data.user_id, record);
    return Ok(record);
  }

  async updateSlots(
    userId: string,
    slots: SquadRecord['slots'],
    bench: SquadRecord['bench_ids'],
  ): Promise<Result<SquadRecord, RepoError>> {
    const existing = this.byUser.get(userId);
    if (!existing) return Err({ kind: 'NotFound', entity: 'squad', id: userId } as const);

    const updated: SquadRecord = {
      ...existing,
      slots,
      bench_ids: bench,
      updated_at: now(),
    };
    this.byUser.set(userId, updated);
    return Ok(updated);
  }

  async changeFormation(
    userId: string,
    formation: string,
  ): Promise<Result<SquadRecord, RepoError>> {
    const existing = this.byUser.get(userId);
    if (!existing) return Err({ kind: 'NotFound', entity: 'squad', id: userId } as const);

    const updated: SquadRecord = {
      ...existing,
      formation,
      slots: [], // reset — app reposiciona
      updated_at: now(),
    };
    this.byUser.set(userId, updated);
    return Ok(updated);
  }
}

// ─── MemMatchRepository ───────────────────────────────────────────────────────

export class MemMatchRepository implements IMatchRepository {
  private readonly store = new Map<string, MatchRecord>();
  private readonly byUser = new Map<string, string[]>(); // userId → id[]

  async findByUserId(
    userId: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<Result<MatchRecord[], RepoError>> {
    const ids = (this.byUser.get(userId) ?? []).slice().reverse(); // mais recente primeiro
    const sliced = ids.slice(opts.offset ?? 0, (opts.offset ?? 0) + (opts.limit ?? 50));
    // biome-ignore lint/style/noNonNullAssertion: ids come from this.store keys
    const records = sliced.map((id) => this.store.get(id)!).filter(Boolean);
    return Ok(records);
  }

  async create(data: MatchInsert): Promise<Result<MatchRecord, RepoError>> {
    const record: MatchRecord = { id: uid(), ...data, played_at: now() };
    this.store.set(record.id, record);

    const list = this.byUser.get(data.user_id) ?? [];
    list.push(record.id);
    this.byUser.set(data.user_id, list);
    return Ok(record);
  }

  async getStats(userId: string): Promise<Result<MatchStats, RepoError>> {
    const ids = this.byUser.get(userId) ?? [];
    // biome-ignore lint/style/noNonNullAssertion: ids come from this.store keys
    const records = ids.map((id) => this.store.get(id)!).filter(Boolean);

    const stats = records.reduce(
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
  }
}

// ─── MemPackRepository ────────────────────────────────────────────────────────

export class MemPackRepository implements IPackRepository {
  private readonly store = new Map<string, PackOpeningRecord>();
  private readonly byUser = new Map<string, string[]>();

  async findByUserId(
    userId: string,
    opts: { limit?: number } = {},
  ): Promise<Result<PackOpeningRecord[], RepoError>> {
    const ids = (this.byUser.get(userId) ?? []).slice().reverse();
    const sliced = ids.slice(0, opts.limit ?? 20);
    // biome-ignore lint/style/noNonNullAssertion: ids come from this.store keys
    const records = sliced.map((id) => this.store.get(id)!).filter(Boolean);
    return Ok(records);
  }

  async create(data: PackOpeningInsert): Promise<Result<PackOpeningRecord, RepoError>> {
    const record: PackOpeningRecord = { id: uid(), ...data, opened_at: now() };
    this.store.set(record.id, record);

    const list = this.byUser.get(data.user_id) ?? [];
    list.push(record.id);
    this.byUser.set(data.user_id, list);
    return Ok(record);
  }

  async countByPack(userId: string): Promise<Result<Record<string, number>, RepoError>> {
    const ids = this.byUser.get(userId) ?? [];
    // biome-ignore lint/style/noNonNullAssertion: ids come from this.store keys
    const records = ids.map((id) => this.store.get(id)!).filter(Boolean);
    const counts = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.pack_id] = (acc[r.pack_id] ?? 0) + 1;
      return acc;
    }, {});
    return Ok(counts);
  }
}

// ─── MemAchievementRepository ────────────────────────────────────────────────

import type { IAchievementRepository } from '../../ports/index';
import type { AchievementInsert, AchievementRecord } from '../../records/types';

export class MemAchievementRepository implements IAchievementRepository {
  private readonly store = new Map<string, AchievementRecord>();
  private readonly byUser = new Map<string, string[]>();

  private key(userId: string, achievementId: string, stage: number) {
    return `${userId}::${achievementId}::${stage}`;
  }

  async findByUserId(userId: string): Promise<Result<AchievementRecord[], RepoError>> {
    const ids = this.byUser.get(userId) ?? [];
    // biome-ignore lint/style/noNonNullAssertion: ids come from this.store keys
    const records = ids.map((id) => this.store.get(id)!).filter(Boolean);
    return Ok(records);
  }

  async isClaimedAt(
    userId: string,
    achievementId: string,
    stage: number,
  ): Promise<Result<boolean, RepoError>> {
    return Ok(this.store.has(this.key(userId, achievementId, stage)));
  }

  async claim(data: AchievementInsert): Promise<Result<AchievementRecord, RepoError>> {
    const k = this.key(data.user_id, data.achievement_id, data.stage);
    if (this.store.has(k)) {
      // biome-ignore lint/style/noNonNullAssertion: key existence verified by has() above
      return Ok(this.store.get(k)!); // idempotente
    }
    const record: AchievementRecord = {
      id: uid(),
      ...data,
      claimed_at: now(),
    };
    this.store.set(k, record);
    const list = this.byUser.get(data.user_id) ?? [];
    list.push(k);
    this.byUser.set(data.user_id, list);
    return Ok(record);
  }

  async getSummary(userId: string): Promise<Result<Record<string, number>, RepoError>> {
    const ids = this.byUser.get(userId) ?? [];
    const summary: Record<string, number> = {};
    for (const id of ids) {
      const r = this.store.get(id);
      if (!r) continue;
      const prev = summary[r.achievement_id] ?? 0;
      if (r.stage > prev) summary[r.achievement_id] = r.stage;
    }
    return Ok(summary);
  }
}
