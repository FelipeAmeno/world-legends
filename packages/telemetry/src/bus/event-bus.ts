/**
 * `TelemetryBus` — pub/sub em memória para eventos de telemetria.
 *
 * DISTINÇÃO (doc 18 §2, doc 12 §1):
 * Este é o barramento de OBSERVABILIDADE — coleta eventos para dashboards,
 * alertas e Regression Guards. É diferente do `EventPublisher` de `shared`,
 * que é o mecanismo de comunicação interna entre packages de domínio.
 *
 * Em produção, o `TelemetryBus` seria um adaptador para um sistema de
 * streaming (ex: Kafka, Supabase Realtime) ou um sink de analytics
 * (ex: BigQuery). Em domínio puro (T023), é um bus em memória com
 * subscribers registráveis — suficiente para testes e Regression Guards.
 *
 * INVARIANTE (doc 12 §3): eventos são append-only e imutáveis.
 * `publish()` nunca modifica um evento existente — só adiciona ao log.
 */
import type { TelemetryEnvelope, TelemetryEventType } from '../events/envelope';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TelemetrySubscriber = (event: TelemetryEnvelope) => void;

export type TelemetryFilter = Readonly<{
  /** Se definido, só entrega eventos deste tipo. */
  readonly eventType?: TelemetryEventType;
  /** Se definido, só entrega eventos deste userId. */
  readonly userId?: string;
  /** Se definido, só entrega eventos desta season. */
  readonly seasonId?: string;
}>;

type Subscription = Readonly<{
  readonly id: number;
  readonly filter: TelemetryFilter;
  readonly handler: TelemetrySubscriber;
}>;

// ─── TelemetryBus ─────────────────────────────────────────────────────────────

export type TelemetryBus = {
  /**
   * Publica um evento de telemetria.
   * Append-only: o evento é imutável após publicado (doc 12 §3).
   * Entrega o evento a todos os subscribers com filter correspondente.
   */
  publish(event: TelemetryEnvelope): void;

  /**
   * Registra um subscriber para eventos de telemetria.
   * Retorna o ID da subscrição (usado para cancelar).
   */
  subscribe(handler: TelemetrySubscriber, filter?: TelemetryFilter): number;

  /** Cancela a subscrição pelo ID retornado por `subscribe`. */
  unsubscribe(subscriptionId: number): void;

  /** Retorna todos os eventos publicados (append-only log). */
  getLog(): readonly TelemetryEnvelope[];

  /** Retorna eventos filtrados por tipo. */
  getByType(eventType: TelemetryEventType): readonly TelemetryEnvelope[];

  /** Retorna eventos de um usuário específico. */
  getByUser(userId: string): readonly TelemetryEnvelope[];

  /** Conta eventos por tipo (útil para assertions em Regression Guards). */
  countByType(eventType: TelemetryEventType): number;

  /** Limpa o log em memória. Não afeta eventos já enviados (em produção). */
  clearLog(): void;
};

// ─── createTelemetryBus ───────────────────────────────────────────────────────

export function createTelemetryBus(): TelemetryBus {
  const log: TelemetryEnvelope[] = [];
  const subscriptions: Subscription[] = [];
  let nextId = 1;

  function matchesFilter(event: TelemetryEnvelope, filter: TelemetryFilter): boolean {
    if (filter.eventType !== undefined && event.eventType !== filter.eventType) return false;
    if (filter.userId !== undefined && event.userId !== filter.userId) return false;
    if (filter.seasonId !== undefined && event.seasonId !== filter.seasonId) return false;
    return true;
  }

  return {
    publish(event) {
      // Append-only: evento imutável adicionado ao log (doc 12 §3)
      log.push(Object.freeze(event));
      // Entregar a todos os subscribers que correspondem ao filtro
      for (const sub of subscriptions) {
        if (matchesFilter(event, sub.filter)) {
          sub.handler(event);
        }
      }
    },

    subscribe(handler, filter = {}) {
      const id = nextId++;
      subscriptions.push(Object.freeze({ id, filter, handler }));
      return id;
    },

    unsubscribe(subscriptionId) {
      const idx = subscriptions.findIndex((s) => s.id === subscriptionId);
      if (idx !== -1) subscriptions.splice(idx, 1);
    },

    getLog() {
      return Object.freeze([...log]);
    },

    getByType(eventType) {
      return Object.freeze(log.filter((e) => e.eventType === eventType));
    },

    getByUser(userId) {
      return Object.freeze(log.filter((e) => e.userId === userId));
    },

    countByType(eventType) {
      return log.filter((e) => e.eventType === eventType).length;
    },

    clearLog() {
      log.length = 0;
    },
  };
}
