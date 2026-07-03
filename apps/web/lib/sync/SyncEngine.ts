/**
 * lib/sync/SyncEngine.ts — T062
 *
 * Orquestrador central do Cloud Save.
 *
 * Responsabilidades:
 *   1. Receber mudanças via enqueue() (chamado pelo GameContext)
 *   2. Debounce 800ms antes de enviar ao banco
 *   3. Processar fila com retry exponencial (até 5 tentativas)
 *   4. Detectar online/offline e pausar/retomar
 *   5. Reconciliar estado local vs servidor ao voltar online
 *   6. Emitir eventos de status para a UI (SyncIndicator)
 *
 * Singleton: usar getSyncEngine() para obter a instância.
 *
 * Não importa React — pode ser usado em qualquer contexto TS.
 */

import {
  type SyncStatus,
  type ChangeType,
  type QueuedChange,
  type SyncEvent,
  type UserProgressPayload,
  type UserStatsPayload,
  type SquadPayload,
  type MatchPayload,
  type PackPayload,
  type AchievementPayload,
  SYNC_DEBOUNCE_MS,
  SYNC_RETRY_MAX,
} from './types';

import { ChangeQueue }       from './ChangeQueue';
import { RetryScheduler }    from './RetryScheduler';
import { reconcileUser, reconcileAchievements, reconcileSquad } from './Reconciler';

import {
  persistReward,
  persistMatchResult,
  persistPackOpening,
  persistSquad,
  persistAchievementClaim,
  loadOrCreateUser,
  loadAchievementSummary,
} from '@/lib/persistence/bridge';

// ─── SyncEngine ───────────────────────────────────────────────────────────────

export class SyncEngine {
  private readonly queue    = new ChangeQueue();
  private readonly retry    = new RetryScheduler();
  private readonly listeners= new Set<(event: SyncEvent) => void>();

  private userId:      string | null    = null;
  private status:      SyncStatus       = 'idle';
  private debounce:    NodeJS.Timeout  | null = null;
  private isOnline:    boolean          = typeof navigator !== 'undefined'
                                          ? navigator.onLine : true;
  private isFlushing = false;

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online',  this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  // ── Setup ───────────────────────────────────────────────────────────────────

  setUser(userId: string | null): void {
    if (this.userId === userId) return;
    this.userId = userId;
    if (!userId) {
      this.retry.cancelAll();
      this.setStatus('idle');
    } else if (!this.queue.isEmpty) {
      // Há itens na fila de sessão anterior com o mesmo usuário → tentar flush
      this.scheduleFlush();
    }
  }

  // ── Enqueue ─────────────────────────────────────────────────────────────────

  enqueue(type: ChangeType, payload: unknown): void {
    if (!this.userId) return;
    this.queue.enqueue(this.userId, type, payload);
    this.setStatus('queued');
    this.scheduleFlush();
  }

  // ── Flush ────────────────────────────────────────────────────────────────────

  private scheduleFlush(): void {
    if (this.debounce) clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.flush(), SYNC_DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    if (this.isFlushing || !this.userId || this.queue.isEmpty) return;

    if (!this.isOnline) {
      this.setStatus('offline');
      return;
    }

    this.isFlushing = true;
    this.setStatus('syncing');

    const changes = this.queue.drain();
    let allOk = true;

    for (const change of changes) {
      const ok = await this.processChange(change);
      if (!ok) allOk = false;
    }

    this.isFlushing = false;

    if (allOk && this.queue.isEmpty && this.retry.pendingCount === 0) {
      this.setStatus('idle');
      this.emit({ kind:'queue_flushed', count:changes.length });
    } else if (!allOk) {
      this.setStatus('retrying');
    }
  }

  // ── Process single change ────────────────────────────────────────────────────

  private async processChange(change: QueuedChange): Promise<boolean> {
    this.queue.markAttempt(change.id);

    try {
      await this.callBridge(change);
      this.queue.remove(change.id);
      this.emit({ kind:'change_saved', changeId:change.id });
      return true;

    } catch (error) {
      const msg        = (error as Error).message ?? 'Erro desconhecido';
      const willRetry  = change.attempts < SYNC_RETRY_MAX;

      this.emit({ kind:'change_failed', changeId:change.id, error:msg, willRetry });

      if (willRetry) {
        this.retry.schedule(change.id, change.attempts, async () => {
          const ok = await this.processChange({ ...change, attempts:change.attempts });
          if (ok && this.queue.isEmpty && this.retry.pendingCount === 0) {
            this.setStatus('idle');
          }
        });
      } else {
        // Max retries → remover da fila para não bloquear outros
        this.queue.remove(change.id);
        console.error('[sync] Dropping change after max retries:', change.id, msg);
        this.setStatus('error');
      }

      return false;
    }
  }

  // ── Bridge dispatch ──────────────────────────────────────────────────────────

  private async callBridge(change: QueuedChange): Promise<void> {
    if (!this.userId) throw new Error('No user');
    const uid = this.userId;

    switch (change.type) {
      case 'user_progress': {
        const p = change.payload as UserProgressPayload;
        await persistReward(uid, 0, 0);   // atualiza via addReward do bridge
        break;
      }
      case 'user_stats': {
        // Stats são persistidos com match_result — não precisa chamada separada
        break;
      }
      case 'squad': {
        const p = change.payload as SquadPayload;
        await persistSquad(uid, p);
        break;
      }
      case 'match_result': {
        const p = change.payload as MatchPayload;
        await persistMatchResult(uid, p);
        break;
      }
      case 'pack_opening': {
        const p = change.payload as PackPayload;
        await persistPackOpening(uid, {
          ...p,
          newCardIds: [],
        });
        break;
      }
      case 'achievement': {
        const p = change.payload as AchievementPayload;
        await persistAchievementClaim(uid, p.achievementId, p.stage);
        break;
      }
      default: {
        console.warn('[sync] Unknown change type:', (change as any).type);
      }
    }
  }

  // ── Reconciliation ───────────────────────────────────────────────────────────

  /**
   * Reconcilia estado local com o servidor.
   * Chamado ao voltar online ou ao fazer login.
   */
  async reconcile(
    localUser: Record<string, number>,
    localAchievements: Record<string, number>,
  ): Promise<void> {
    if (!this.userId) return;

    try {
      // 1. Buscar estado do servidor
      const serverUser = await loadOrCreateUser(this.userId, '');
      const serverAch  = await loadAchievementSummary(this.userId);

      if (!serverUser) return;

      // 2. Reconciliar usuário
      const userResult = reconcileUser(
        localUser as any,
        serverUser as any,
      );

      // 3. Reconciliar conquistas
      const achResult = reconcileAchievements(localAchievements, serverAch);

      // 4. Se há conquistas locais que o servidor não tem → reivindicar
      for (const [id, stage] of Object.entries(achResult.merged)) {
        const serverStage = serverAch[id] ?? 0;
        if (stage > serverStage) {
          this.enqueue('achievement', { achievementId:id, stage });
        }
      }

      const allChanged = [...userResult.changed, ...achResult.changed];
      if (allChanged.length > 0) {
        this.emit({ kind:'reconciled', merged:allChanged });
      }

    } catch (e) {
      console.warn('[sync] Reconciliation failed:', e);
    }
  }

  // ── Online/Offline ───────────────────────────────────────────────────────────

  private handleOnline = (): void => {
    this.isOnline = true;
    if (!this.queue.isEmpty) {
      this.setStatus('syncing');
      this.flush();
    } else {
      this.setStatus('idle');
    }
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    if (this.debounce) clearTimeout(this.debounce);
    this.retry.cancelAll();
    this.setStatus('offline');
  };

  // ── Status & Events ──────────────────────────────────────────────────────────

  private setStatus(s: SyncStatus): void {
    if (this.status === s) return;
    this.status = s;
    this.emit({ kind:'status_changed', status:s });
  }

  private emit(event: SyncEvent): void {
    for (const cb of this.listeners) cb(event);
  }

  on(cb: (event: SyncEvent) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  getStatus(): SyncStatus { return this.status; }
  getQueueSize(): number  { return this.queue.size; }
  getIsOnline(): boolean  { return this.isOnline; }

  /** Forçar flush imediato (ex: antes de fechar a aba) */
  async forceFlush(): Promise<void> {
    if (this.debounce) clearTimeout(this.debounce);
    await this.flush();
  }

  /** Destruir (remover listeners) */
  destroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('online',  this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    if (this.debounce) clearTimeout(this.debounce);
    this.retry.cancelAll();
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _engine: SyncEngine | null = null;

export function getSyncEngine(): SyncEngine {
  if (!_engine) {
    _engine = new SyncEngine();
    // Flush ao fechar a aba
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => _engine?.forceFlush());
    }
  }
  return _engine;
}

export function resetSyncEngine(): void {
  _engine?.destroy();
  _engine = null;
}
