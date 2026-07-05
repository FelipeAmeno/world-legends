/**
 * lib/sync/RetryScheduler.ts — T062
 *
 * Agendador de retentativas com backoff exponencial + jitter.
 *
 * Fórmula:
 *   delay = min(baseMs * 2^attempts + jitter, maxMs)
 *   jitter = random * 500ms (evita thundering herd)
 *
 * Ex: tentativa 0 → 1s, 1 → 2s, 2 → 4s, 3 → 8s, 4 → 16s (cap 30s)
 */

import { SYNC_RETRY_BASE_MS, SYNC_RETRY_MAX, SYNC_RETRY_MAX_MS } from './types';

type RetryCallback = () => Promise<void>;

type ScheduledRetry = {
  id: string;
  attempts: number;
  timer: NodeJS.Timeout;
  callback: RetryCallback;
};

export class RetryScheduler {
  private readonly pending = new Map<string, ScheduledRetry>();

  /** Calcular delay com jitter */
  static delay(attempts: number): number {
    const base = SYNC_RETRY_BASE_MS * 2 ** attempts;
    const jitter = Math.random() * 500;
    return Math.min(base + jitter, SYNC_RETRY_MAX_MS);
  }

  /** Agendar uma retentativa */
  schedule(id: string, attempts: number, callback: RetryCallback): void {
    // Cancelar retentativa anterior do mesmo item
    this.cancel(id);

    if (attempts >= SYNC_RETRY_MAX) return; // desistir

    const delay = RetryScheduler.delay(attempts);

    const timer = setTimeout(async () => {
      this.pending.delete(id);
      try {
        await callback();
      } catch {
        // callback deve chamar schedule() novamente se quiser
      }
    }, delay);

    this.pending.set(id, { id, attempts, timer, callback });
  }

  /** Cancelar retentativa de um item */
  cancel(id: string): void {
    const item = this.pending.get(id);
    if (item) {
      clearTimeout(item.timer);
      this.pending.delete(id);
    }
  }

  /** Cancelar todas as retentativas */
  cancelAll(): void {
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
    }
    this.pending.clear();
  }

  get pendingCount(): number {
    return this.pending.size;
  }

  /** Listar IDs com retentativa pendente */
  getPendingIds(): string[] {
    return [...this.pending.keys()];
  }
}
