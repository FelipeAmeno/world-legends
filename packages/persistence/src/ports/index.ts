/**
 * packages/persistence/src/ports/index.ts
 *
 * Portas (interfaces) do sistema de persistência — Ports & Adapters.
 *
 * Regras:
 *   - Nenhuma referência a Supabase, PostgreSQL ou qualquer driver
 *   - Nenhuma importação de packages de domínio
 *   - Retornam Result<T, RepoError> — nunca lançam exceções
 *   - Operações são assíncronas (Promise) — permite adapters síncronos e async
 *
 * Como usar:
 *   1. Importar a interface → tipagem do código consumidor
 *   2. Injetar o adapter concreto (memory | supabase) via PersistenceRegistry
 */

import type { Result } from '@world-legends/shared';
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
  SquadUpsert,
  UserInsert,
  UserRecord,
  UserUpdate,
} from '../records/types';

// ─── IUserRepository ────────────────────────────────────────────────────────

/**
 * Gerencia perfil, progresso e recursos do jogador.
 */
export interface IUserRepository {
  /** Busca por ID (UUID). Retorna null se não existir. */
  findById(id: string): Promise<Result<UserRecord | null, RepoError>>;

  /** Cria ou atualiza o usuário (upsert). */
  upsert(data: UserInsert): Promise<Result<UserRecord, RepoError>>;

  /**
   * Atualiza campos de progresso.
   * Campos omitidos permanecem inalterados.
   */
  updateProgress(id: string, update: UserUpdate): Promise<Result<UserRecord, RepoError>>;

  /**
   * Incrementa atômica e seguramente wins/draws/losses.
   * Previne race conditions em multiplas sessões.
   */
  incrementStats(id: string, outcome: MatchOutcome): Promise<Result<UserRecord, RepoError>>;

  /**
   * Deduz créditos de forma atômica.
   * Retorna Conflict se saldo insuficiente.
   */
  deductCredits(id: string, amount: number): Promise<Result<UserRecord, RepoError>>;

  /**
   * Adiciona créditos e XP após recompensa.
   * Calcula e aplica level-up automaticamente.
   */
  addReward(id: string, credits: number, xp: number): Promise<Result<UserRecord, RepoError>>;
}

// ─── ICollectionRepository ──────────────────────────────────────────────────

/**
 * Gerencia as cartas possuídas pelo jogador.
 */
export interface ICollectionRepository {
  /** Todas as cartas do usuário. */
  findByUserId(userId: string): Promise<Result<OwnedCardRecord[], RepoError>>;

  /** Carta específica por ID de owned_card. */
  findById(id: string): Promise<Result<OwnedCardRecord | null, RepoError>>;

  /** Adiciona uma carta à coleção. */
  addCard(data: OwnedCardInsert): Promise<Result<OwnedCardRecord, RepoError>>;

  /** Adiciona múltiplas cartas de uma vez (pack opening). */
  addCards(
    userId: string,
    cardIds: readonly string[],
  ): Promise<Result<OwnedCardRecord[], RepoError>>;

  /** Atualiza evolução ou contratos de uma carta. */
  updateCard(
    id: string,
    update: { evolution?: number; contracts?: number },
  ): Promise<Result<OwnedCardRecord, RepoError>>;

  /** Remove uma carta (burn/trade). */
  removeCard(id: string): Promise<Result<void, RepoError>>;

  /** Quantidade de cartas do usuário. */
  countByUserId(userId: string): Promise<Result<number, RepoError>>;
}

// ─── ISquadRepository ───────────────────────────────────────────────────────

/**
 * Persiste a formação e titulares do time do jogador.
 * Um usuário tem exatamente um squad (upsert por user_id).
 */
export interface ISquadRepository {
  /** Retorna null se o usuário ainda não montou um squad. */
  findByUserId(userId: string): Promise<Result<SquadRecord | null, RepoError>>;

  /** Cria ou substitui o squad do usuário. */
  upsert(data: SquadUpsert): Promise<Result<SquadRecord, RepoError>>;

  /** Atualiza apenas os slots (mantém formação). */
  updateSlots(
    userId: string,
    slots: SquadRecord['slots'],
    bench: SquadRecord['bench_ids'],
  ): Promise<Result<SquadRecord, RepoError>>;

  /** Altera a formação e reposiciona cartas compatíveis. */
  changeFormation(userId: string, formation: string): Promise<Result<SquadRecord, RepoError>>;
}

// ─── IMatchRepository ───────────────────────────────────────────────────────

/**
 * Histórico de partidas do jogador.
 */
export interface IMatchRepository {
  /** Busca histórico paginado (mais recente primeiro). */
  findByUserId(
    userId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<Result<MatchRecord[], RepoError>>;

  /** Registra o resultado de uma partida. */
  create(data: MatchInsert): Promise<Result<MatchRecord, RepoError>>;

  /** Agregados para o perfil: wins, losses, goals etc. */
  getStats(userId: string): Promise<Result<MatchStats, RepoError>>;
}

export type MatchStats = Readonly<{
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  winRate: number; // 0–100
}>;

// ─── IPackRepository ────────────────────────────────────────────────────────

/**
 * Histórico de aberturas de pack.
 */
export interface IPackRepository {
  /** Histórico de aberturas paginado. */
  findByUserId(
    userId: string,
    opts?: { limit?: number },
  ): Promise<Result<PackOpeningRecord[], RepoError>>;

  /** Registra uma abertura de pack (após debitado o custo). */
  create(data: PackOpeningInsert): Promise<Result<PackOpeningRecord, RepoError>>;

  /** Total de packs abertos por tipo. */
  countByPack(userId: string): Promise<Result<Record<string, number>, RepoError>>;
}

// ─── IAchievementRepository ──────────────────────────────────────────────────

import type { AchievementInsert, AchievementRecord } from '../records/types';

/**
 * Rastreia conquistas e missões reivindicadas pelo jogador.
 */
export interface IAchievementRepository {
  /** Todas as conquistas do usuário (achievement_id → stages claimed) */
  findByUserId(userId: string): Promise<Result<AchievementRecord[], RepoError>>;

  /** Verificar se uma conquista/estágio específico foi reivindicado */
  isClaimedAt(
    userId: string,
    achievementId: string,
    stage: number,
  ): Promise<Result<boolean, RepoError>>;

  /** Registrar reivindicação de estágio */
  claim(data: AchievementInsert): Promise<Result<AchievementRecord, RepoError>>;

  /** Todos os achievement_ids com os estágios máximos reivindicados */
  getSummary(userId: string): Promise<Result<Record<string, number>, RepoError>>;
}
