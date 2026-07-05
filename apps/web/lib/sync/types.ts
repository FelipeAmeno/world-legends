/**
 * lib/sync/types.ts — T062
 *
 * Tipos centrais do sistema de Cloud Save:
 *   SyncStatus   → estado atual do engine
 *   ChangeType   → categorias de mudança (user, squad, match...)
 *   QueuedChange → mudança pendente de persistência
 *   SyncEvent    → evento emitido pelo engine para a UI
 */

// ─── Status de sincronização ──────────────────────────────────────────────────

export type SyncStatus =
  | 'idle' // sem pendências
  | 'syncing' // enviando ao banco agora
  | 'queued' // mudanças enfileiradas, aguardando debounce
  | 'retrying' // tentando novamente após erro
  | 'offline' // sem conexão, fila salva localmente
  | 'error'; // falha permanente (max retries atingido)

// ─── Tipos de mudança ─────────────────────────────────────────────────────────

export type ChangeType =
  | 'user_progress' // XP, level, créditos, fragmentos
  | 'user_stats' // wins, draws, losses
  | 'squad' // formação + slots + banco
  | 'match_result' // resultado de partida
  | 'pack_opening' // pack aberto + cartas
  | 'achievement'; // conquista reivindicada

// ─── Mudança na fila ──────────────────────────────────────────────────────────

export type QueuedChange = {
  readonly id: string; // UUID para deduplicação
  readonly type: ChangeType;
  readonly payload: unknown; // dados a persistir
  readonly userId: string;
  readonly timestamp: number; // Date.now() de quando foi enfileirado
  attempts: number; // tentativas realizadas
  lastAttempt: number; // timestamp da última tentativa
};

// ─── Constantes ───────────────────────────────────────────────────────────────

export const SYNC_DEBOUNCE_MS = 800; // aguardar antes de enviar
export const SYNC_RETRY_MAX = 5; // tentativas máximas
export const SYNC_RETRY_BASE_MS = 1_000; // base do backoff exponencial
export const SYNC_RETRY_MAX_MS = 30_000; // cap do backoff
export const SYNC_QUEUE_LS_KEY = 'wl-sync-queue-v1';
export const SYNC_STATUS_LS_KEY = 'wl-sync-meta-v1';

// ─── Eventos do engine ────────────────────────────────────────────────────────

export type SyncEvent =
  | { kind: 'status_changed'; status: SyncStatus }
  | { kind: 'change_queued'; change: QueuedChange }
  | { kind: 'change_saved'; changeId: string }
  | { kind: 'change_failed'; changeId: string; error: string; willRetry: boolean }
  | { kind: 'queue_flushed'; count: number }
  | { kind: 'reconciled'; merged: string[] };

// ─── Payload por tipo ─────────────────────────────────────────────────────────

export type UserProgressPayload = {
  level: number;
  current_xp: number;
  xp_for_next: number;
  credits: number;
  fragments: number;
};

export type UserStatsPayload = {
  outcome: 'win' | 'draw' | 'loss';
};

export type SquadPayload = {
  formation: string;
  slots: Array<{ slotId: string; ownedCardId: string }>;
  benchIds: string[];
};

export type MatchPayload = {
  opponent: string;
  opponentOvr: number;
  homeScore: number;
  awayScore: number;
  outcome: 'win' | 'draw' | 'loss';
  creditsEarned: number;
  xpEarned: number;
};

export type PackPayload = {
  packId: string;
  packName: string;
  cost: number;
  cardsJson: Array<{ cardId: string; rarityCode: string }>;
};

export type AchievementPayload = {
  achievementId: string;
  stage: number;
};
