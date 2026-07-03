/**
 * Tipos centrais do domínio LiveOps (doc 10 §10/§23, doc 18 §2).
 *
 * NOTA DE NOMENCLATURA (doc 18 §2):
 * `packages/events` = LiveOps (calendário, missões, recompensas de evento).
 * Eventos de Domínio (`DomainEvent`, `EventPublisher`) = mecanismo de
 * pub/sub de `packages/shared`. São conceitos homônimos mas distintos.
 *
 * Os seis tipos de LiveOps da T022, mapeados ao doc 10 §23:
 *
 *   EventCard      — Carta sazonal (doc 10 §10/§23) com janela de tempo
 *                    estritamente limitada; disponível só em Pacotes de Evento.
 *   WeekendBoost   — Bônus de fim de semana (doc 10 §23: "fins de semana de
 *                    drop em dobro", sub-tipo de boost genérico).
 *   DoubleDrop     — "Fins de semana de drop em dobro" (doc 10 §23) — janelas
 *                    curtas com probabilidades elevadas, sempre anunciadas com
 *                    antecedência, nunca retroativas.
 *   CommunityGoal  — "Metas comunitárias" (doc 10 §23) — objetivo agregado
 *                    do servidor; todos os jogadores contribuem.
 *   LegendRescue   — "Resgate de Lenda" (doc 10 §23) — janela temporária de
 *                    Craft para cartas normalmente não-craftáveis (exceto GOAT).
 *   SeasonEvent    — "Calendário ao vivo" / evento temático sazonal (doc 10 §23).
 */
import type { RarityCode } from '@world-legends/types';

// ─── IDs nominais ─────────────────────────────────────────────────────────────
export type LiveOpsEventId = string & { readonly _brand: 'LiveOpsEventId' };
export function liveOpsEventId(v: string): LiveOpsEventId {
  if (!v.trim()) throw new Error('LiveOpsEventId vazio');
  return v as LiveOpsEventId;
}

// ─── EventWindow — janela de tempo de qualquer evento ────────────────────────
export type EventWindow = Readonly<{
  readonly startsAt: Date;
  readonly endsAt:   Date;
}>;

export function isWindowActive(window: EventWindow, now: Date): boolean {
  return now >= window.startsAt && now <= window.endsAt;
}

export function isWindowUpcoming(window: EventWindow, now: Date): boolean {
  return now < window.startsAt;
}

export function isWindowExpired(window: EventWindow, now: Date): boolean {
  return now > window.endsAt;
}

export function windowDurationMs(window: EventWindow): number {
  return window.endsAt.getTime() - window.startsAt.getTime();
}

// ─── EventStatus ──────────────────────────────────────────────────────────────
export type EventStatus = 'upcoming' | 'active' | 'ended' | 'cancelled';

export function resolveEventStatus(window: EventWindow, now: Date, cancelled = false): EventStatus {
  if (cancelled)               return 'cancelled';
  if (isWindowUpcoming(window, now)) return 'upcoming';
  if (isWindowActive(window, now))   return 'active';
  return 'ended';
}

// ─── Tipo discriminado de LiveOps event ───────────────────────────────────────
export type LiveOpsEventKind =
  | 'event_card'
  | 'weekend_boost'
  | 'double_drop'
  | 'community_goal'
  | 'legend_rescue'
  | 'season_event';

// ─── Campos comuns a todos os tipos ───────────────────────────────────────────
export type LiveOpsEventBase = Readonly<{
  readonly id: LiveOpsEventId;
  readonly kind: LiveOpsEventKind;
  readonly name: string;
  readonly description: string;
  readonly window: EventWindow;
  readonly status: EventStatus;
  readonly createdAt: Date;
}>;

// ─── Erros de domínio ─────────────────────────────────────────────────────────
export type LiveOpsError =
  | Readonly<{ kind: 'EventNotFound';      eventId: string }>
  | Readonly<{ kind: 'EventNotActive';     eventId: string; status: EventStatus }>
  | Readonly<{ kind: 'EventExpired';       eventId: string }>
  | Readonly<{ kind: 'InvalidWindow';      reason: string }>
  | Readonly<{ kind: 'GoalAlreadyReached'; eventId: string }>
  | Readonly<{ kind: 'InvalidDelta';       delta: number }>
  | Readonly<{ kind: 'GoatNotRescuable';   reason: string }>
  | Readonly<{ kind: 'EventCancelled';     eventId: string }>;
