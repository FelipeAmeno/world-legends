/**
 * `SeasonEvent` — evento temático sazonal do calendário ao vivo (doc 10 §23).
 *
 * "Calendário ao vivo (live-ops): eventos temáticos recorrentes
 * (aniversários de campanhas históricas, eventos sazonais ligados ao
 * calendário real de competições), cada um com Pacotes de Evento e
 * cartas Event exclusivas daquela janela."
 *
 * `SeasonEvent` é o contêiner principal de um evento de temporada.
 * Pode conter múltiplos sub-eventos (EventCard, DoubleDrop, CommunityGoal,
 * LegendRescue) associados à mesma janela temática.
 *
 * Em produção, a camada de aplicação agrupa os sub-eventos num SeasonEvent.
 * Aqui, o SeasonEvent é um Aggregate Root que os referencia por ID.
 */
import { Err, Ok, type Result } from '@world-legends/shared';
import {
  liveOpsEventId, resolveEventStatus,
  type LiveOpsEventBase, type EventWindow, type LiveOpsError, type LiveOpsEventKind,
} from '../catalog/types';

// ─── Recompensas do Season Event ──────────────────────────────────────────────

export type SeasonEventReward = Readonly<{
  readonly kind: 'fragments' | 'credits' | 'event_pack' | 'event_card' | 'badge' | 'cosmetic';
  readonly amount?: number;
  readonly itemId?: string;
  /** Posição mínima no leaderboard do evento para receber esta recompensa. null = todos. */
  readonly minRank?: number;
}>;

// ─── SeasonEventMission ───────────────────────────────────────────────────────

/**
 * Missão individual dentro de um SeasonEvent.
 * Missões são opcionais — um evento pode só ter recompensas gerais.
 */
export type SeasonEventMission = Readonly<{
  readonly missionId: string;
  readonly name: string;
  readonly description: string;
  readonly targetCount: number;
  readonly currentCount: number;
  readonly rewards: readonly SeasonEventReward[];
  readonly completedAt: Date | null;
}>;

// ─── SeasonEvent ──────────────────────────────────────────────────────────────

export type SeasonEvent = LiveOpsEventBase & Readonly<{
  readonly kind: 'season_event';
  /** Tema do evento (ex: "Copa 82 — O Ouro de Espanha"). */
  readonly theme: string;
  readonly missions: readonly SeasonEventMission[];
  readonly generalRewards: readonly SeasonEventReward[];
  /** IDs dos sub-eventos (EventCard, DoubleDrop etc.) desta temporada. */
  readonly subEventIds: readonly string[];
  /** Se o evento é recorrente (aniversário etc.). */
  readonly isRecurring: boolean;
}>;

// ─── createSeasonEvent ────────────────────────────────────────────────────────

export function createSeasonEvent(input: {
  id: string;
  name: string;
  description: string;
  theme: string;
  window: EventWindow;
  missions?: readonly Omit<SeasonEventMission, 'currentCount' | 'completedAt'>[];
  generalRewards?: readonly SeasonEventReward[];
  subEventIds?: readonly string[];
  isRecurring?: boolean;
}, now = new Date()): Result<SeasonEvent, LiveOpsError> {
  if (input.window.endsAt <= input.window.startsAt) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'endsAt deve ser posterior a startsAt' }));
  }
  if (!input.theme.trim()) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'theme não pode ser vazio' }));
  }

  const missions: SeasonEventMission[] = (input.missions ?? []).map((m) =>
    Object.freeze({ ...m, currentCount: 0, completedAt: null }),
  );

  return Ok(Object.freeze({
    id: liveOpsEventId(input.id),
    kind: 'season_event' as const,
    name: input.name,
    description: input.description,
    window: Object.freeze(input.window),
    status: resolveEventStatus(input.window, now),
    createdAt: now,
    theme: input.theme,
    missions: Object.freeze(missions),
    generalRewards: Object.freeze(input.generalRewards ?? []),
    subEventIds: Object.freeze(input.subEventIds ?? []),
    isRecurring: input.isRecurring ?? false,
  }));
}

// ─── advanceMission ───────────────────────────────────────────────────────────

/**
 * Avança o progresso de uma missão específica de um SeasonEvent.
 * Puro: retorna novo SeasonEvent com a missão atualizada.
 */
export function advanceMission(
  event: SeasonEvent,
  missionId: string,
  delta: number,
  now = new Date(),
): Result<SeasonEvent, LiveOpsError> {
  if (delta <= 0) {
    return Err(Object.freeze({ kind: 'InvalidDelta' as const, delta }));
  }

  const mission = event.missions.find((m) => m.missionId === missionId);
  if (mission === undefined) {
    return Err(Object.freeze({ kind: 'EventNotFound' as const, eventId: missionId }));
  }
  if (mission.completedAt !== null) {
    // Missão já concluída → retorna sem alterar (idempotente)
    return Ok(event);
  }

  const newCount = Math.min(mission.currentCount + delta, mission.targetCount);
  const justCompleted = newCount >= mission.targetCount;

  const updatedMission: SeasonEventMission = Object.freeze({
    ...mission,
    currentCount: newCount,
    completedAt: justCompleted ? now : null,
  });

  const updatedMissions = event.missions.map((m) =>
    m.missionId === missionId ? updatedMission : m,
  );

  return Ok(Object.freeze({
    ...event,
    missions: Object.freeze(updatedMissions),
  }));
}

/** Retorna as missões completas de um SeasonEvent. */
export function completedMissions(event: SeasonEvent): readonly SeasonEventMission[] {
  return event.missions.filter((m) => m.completedAt !== null);
}
