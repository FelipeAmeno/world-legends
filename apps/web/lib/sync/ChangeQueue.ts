/**
 * lib/sync/ChangeQueue.ts — T062
 *
 * Fila de mudanças persistida em localStorage.
 *
 * Garantias:
 *   - Sobrevive a refresh/crash do browser
 *   - Deduplicação por (userId + type): mudanças do mesmo tipo
 *     sobrescrevem a anterior (ex: vários saves de squad → 1 item na fila)
 *   - Merge de payloads quando possível (user_progress)
 *   - Thread-safe dentro do mesmo tab (operações síncronas sobre array)
 */

import {
  type QueuedChange,
  type ChangeType,
  SYNC_QUEUE_LS_KEY,
} from './types';

// Tipos de mudança que sofrem merge (última versão prevalece)
const DEDUPE_BY_TYPE = new Set<ChangeType>([
  'user_progress',
  'squad',
]);

// Tipos que se acumulam (não deduplica)
const APPEND_TYPES = new Set<ChangeType>([
  'match_result',
  'pack_opening',
  'achievement',
  'user_stats',
]);

// ─── ID gerador ───────────────────────────────────────────────────────────────

let _counter = 0;
function genId(): string {
  return `${Date.now()}-${++_counter}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── ChangeQueue ──────────────────────────────────────────────────────────────

export class ChangeQueue {
  private items: QueuedChange[] = [];

  constructor() {
    this.load();
  }

  // ── Persistência ────────────────────────────────────────────────────────────

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_LS_KEY);
      this.items = raw ? (JSON.parse(raw) as QueuedChange[]) : [];
    } catch {
      this.items = [];
    }
  }

  save(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SYNC_QUEUE_LS_KEY, JSON.stringify(this.items));
    } catch {
      // localStorage cheio → remover itens antigos
      if (this.items.length > 10) {
        this.items = this.items.slice(-10);
        localStorage.setItem(SYNC_QUEUE_LS_KEY, JSON.stringify(this.items));
      }
    }
  }

  clear(): void {
    this.items = [];
    try { localStorage.removeItem(SYNC_QUEUE_LS_KEY); } catch {}
  }

  // ── Operações ───────────────────────────────────────────────────────────────

  enqueue(userId: string, type: ChangeType, payload: unknown): QueuedChange {
    const change: QueuedChange = {
      id:          genId(),
      type,
      payload,
      userId,
      timestamp:   Date.now(),
      attempts:    0,
      lastAttempt: 0,
    };

    if (DEDUPE_BY_TYPE.has(type)) {
      // Substituir item existente do mesmo tipo/userId
      const idx = this.items.findIndex(i => i.type === type && i.userId === userId);
      if (idx >= 0) {
        this.items[idx] = { ...change, id: this.items[idx]!.id };
      } else {
        this.items.push(change);
      }
    } else {
      // Append (match, pack, achievement, stats)
      this.items.push(change);
    }

    this.save();
    return change;
  }

  /** Remove um item por ID (após salvar com sucesso) */
  remove(id: string): void {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
  }

  /** Atualiza tentativas de um item */
  markAttempt(id: string): void {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.attempts++;
      item.lastAttempt = Date.now();
      this.save();
    }
  }

  /** Pegar todos os itens pendentes (cópia) */
  drain(): QueuedChange[] {
    return [...this.items];
  }

  get size(): number { return this.items.length; }

  get isEmpty(): boolean { return this.items.length === 0; }
}
