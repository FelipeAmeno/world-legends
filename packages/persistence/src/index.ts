/**
 * @world-legends/persistence — T050
 *
 * Camada de persistência com Ports & Adapters.
 *
 * AGORA: adapters in-memory (funcional, sem banco)
 * FUTURO: adapters Supabase (stubs prontos, aguardando conexão)
 *
 * API pública:
 *   getRegistry()        → PersistenceRegistry singleton (auto-detecta adapter)
 *   initRegistry(...)    → inicializa/troca o adapter
 *   createRegistry(...)  → cria instância isolada (testes)
 *   resetRegistry()      → reseta singleton (testes)
 */

// ── Records (tipos de linha do banco) ─────────────────────────────────────────
export type {
  UserRecord,
  UserInsert,
  UserUpdate,
  OwnedCardRecord,
  OwnedCardInsert,
  SquadRecord,
  SquadUpsert,
  SquadSlotJson,
  MatchRecord,
  MatchInsert,
  MatchOutcome,
  PackOpeningRecord,
  PackOpeningInsert,
  RepoError,
} from './records/types';

// ── Ports (interfaces) ────────────────────────────────────────────────────────
export type {
  IUserRepository,
  ICollectionRepository,
  ISquadRepository,
  IMatchRepository,
  MatchStats,
  IPackRepository,
} from './ports/index';

// ── Adapters in-memory ────────────────────────────────────────────────────────
export {
  MemUserRepository,
  MemCollectionRepository,
  MemSquadRepository,
  MemMatchRepository,
  MemPackRepository,
} from './adapters/memory/MemoryAdapters';

// ── Adapters Supabase (stubs) ─────────────────────────────────────────────────
export {
  SupabaseUserRepository,
  SupabaseCollectionRepository,
  SupabaseSquadRepository,
  SupabaseMatchRepository,
  SupabasePackRepository,
} from './adapters/supabase/SupabaseAdapters';

// ── Registry / DI ─────────────────────────────────────────────────────────────
export {
  createRegistry,
  getRegistry,
  initRegistry,
  resetRegistry,
} from './registry/PersistenceRegistry';

export type {
  PersistenceAdapter,
  SupabaseConfig,
  PersistenceRegistry,
} from './registry/PersistenceRegistry';

// ── Records (T061 additions) ──────────────────────────────────────────────────
export type {
  AchievementRecord,
  AchievementInsert,
} from './records/types';

// ── Ports (T061 additions) ────────────────────────────────────────────────────
export type { IAchievementRepository } from './ports/index';

// ── Adapters memory (T061 additions) ─────────────────────────────────────────
export { MemAchievementRepository } from './adapters/memory/MemoryAdapters';

// ── Adapters Supabase (T061 — implementações reais) ───────────────────────────
export { SupabaseAchievementRepository } from './adapters/supabase/SupabaseAdapters';
