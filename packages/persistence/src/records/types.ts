/**
 * packages/persistence/src/records/types.ts
 *
 * Tipos de linha do banco de dados (snake_case, espelham Supabase).
 * Correspondem 1:1 às tabelas do schema SQL.
 *
 * REGRA: estes tipos NÃO importam packages de domínio.
 * A conversão record ↔ domínio acontece nos adapters.
 */

// ─── UserRecord ───────────────────────────────────────────────────────────────

export type UserRecord = Readonly<{
  readonly id: string; // UUID (auth.uid no Supabase)
  readonly username: string;
  readonly level: number;
  readonly current_xp: number;
  readonly xp_for_next: number;
  readonly credits: number;
  readonly fragments: number;
  readonly wins: number;
  readonly draws: number;
  readonly losses: number;
  readonly created_at: string; // ISO 8601
  readonly updated_at: string;
}>;

export type UserInsert = Omit<UserRecord, 'created_at' | 'updated_at'>;
export type UserUpdate = Partial<Omit<UserRecord, 'id' | 'created_at' | 'updated_at'>>;

// ─── OwnedCardRecord ──────────────────────────────────────────────────────────

export type OwnedCardRecord = Readonly<{
  readonly id: string; // UUID
  readonly user_id: string;
  readonly card_id: string; // ref ao catálogo de cartas
  readonly evolution: number; // 0–4
  readonly contracts: number; // 0–99
  readonly obtained_at: string;
}>;

export type OwnedCardInsert = Omit<OwnedCardRecord, 'id' | 'obtained_at'>;

// ─── SquadRecord ──────────────────────────────────────────────────────────────

export type SquadSlotJson = {
  slot_id: string; // e.g. "GK-1", "CB-2"
  card_id: string | null;
};

export type SquadRecord = Readonly<{
  readonly id: string;
  readonly user_id: string;
  readonly formation: string; // "4-3-3", "4-4-2", …
  readonly slots: readonly SquadSlotJson[]; // JSONB
  readonly bench_ids: readonly string[]; // TEXT[]
  readonly updated_at: string;
}>;

export type SquadUpsert = Omit<SquadRecord, 'id'> & { id?: string };

// ─── MatchRecord ──────────────────────────────────────────────────────────────

export type MatchOutcome = 'win' | 'draw' | 'loss';

export type MatchRecord = Readonly<{
  readonly id: string;
  readonly user_id: string;
  readonly opponent: string;
  readonly home_score: number;
  readonly away_score: number;
  readonly outcome: MatchOutcome;
  readonly credits_earned: number;
  readonly xp_earned: number;
  readonly played_at: string;
}>;

export type MatchInsert = Omit<MatchRecord, 'id' | 'played_at'>;

// ─── PackOpeningRecord ────────────────────────────────────────────────────────

export type PackOpeningRecord = Readonly<{
  readonly id: string;
  readonly user_id: string;
  readonly pack_id: string; // "classic", "elite", "legend"
  readonly card_ids: readonly string[]; // TEXT[]
  readonly cost: number;
  readonly opened_at: string;
}>;

export type PackOpeningInsert = Omit<PackOpeningRecord, 'id' | 'opened_at'>;

// ─── Errors ───────────────────────────────────────────────────────────────────

export type RepoError =
  | Readonly<{ kind: 'NotFound'; entity: string; id: string }>
  | Readonly<{ kind: 'Conflict'; message: string }>
  | Readonly<{ kind: 'NetworkError'; message: string; cause?: unknown }>
  | Readonly<{ kind: 'NotConnected'; adapter: string; hint: string }>
  | Readonly<{ kind: 'Invalid'; field: string; message: string }>;

// ─── AchievementRecord — conquista reivindicada ───────────────────────────────

export type AchievementRecord = Readonly<{
  readonly id: string;
  readonly user_id: string;
  readonly achievement_id: string; // ex: 'wins50', 'level10'
  readonly stage: number; // estágio reivindicado (1-5)
  readonly claimed_at: string;
}>;

export type AchievementInsert = Omit<AchievementRecord, 'id' | 'claimed_at'>;
