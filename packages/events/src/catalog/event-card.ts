/**
 * `EventCard` — carta sazonal disponível somente durante uma janela de evento
 * (doc 10 §10/§23).
 *
 * REGRAS DOCUMENTADAS (doc 10 §10):
 * - Disponibilidade estritamente limitada no tempo.
 * - Obtida apenas via Pacotes de Evento ou objetivos específicos do evento;
 *   NUNCA via craft direto enquanto o evento está ativo (doc 10 §10).
 * - Não-tradeable durante a janela ativa; torna-se tradeable após o evento
 *   encerrar, se a carta permanecer disponível (doc 10 §10, §21).
 * - Política de transparência: retornos futuros anunciados com antecedência.
 *
 * `EventCard` aqui é a DEFINIÇÃO DO EVENTO que libera aquela carta —
 * não a carta em si (que vive em `packages/cards`).
 */
import { Err, Ok, type Result } from '@world-legends/shared';
import {
  liveOpsEventId, resolveEventStatus, isWindowActive,
  type LiveOpsEventBase, type EventWindow, type LiveOpsError,
} from './types';
import type { RarityCode } from '@world-legends/types';

// ─── EventCard ────────────────────────────────────────────────────────────────

export type EventCard = LiveOpsEventBase & Readonly<{
  readonly kind: 'event_card';
  readonly featuredCardId: string;
  readonly featuredRarity: RarityCode;
  /** Pack(s) que podem conter esta carta Event durante a janela. */
  readonly eventPackIds: readonly string[];
  /**
   * Bônus de atributo de ocasião (doc 10 §10: "pequeno bônus válido
   * apenas durante a janela em modos casuais").
   * null = sem bônus (só a carta normal).
   */
  readonly occasionalBonus: number | null;
  /** Tradeable APÓS o evento encerrar (doc 10 §10/§21). */
  readonly tradeableAfterEvent: boolean;
}>;

// ─── createEventCard ──────────────────────────────────────────────────────────

export type CreateEventCardInput = Readonly<{
  id: string;
  name: string;
  description: string;
  window: EventWindow;
  featuredCardId: string;
  featuredRarity: RarityCode;
  eventPackIds?: readonly string[];
  occasionalBonus?: number;
  tradeableAfterEvent?: boolean;
}>;

export function createEventCard(
  input: CreateEventCardInput,
  now = new Date(),
): Result<EventCard, LiveOpsError> {
  if (input.window.endsAt <= input.window.startsAt) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'endsAt deve ser posterior a startsAt' }));
  }
  if (!input.featuredCardId.trim()) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'featuredCardId vazio' }));
  }
  if (input.occasionalBonus !== undefined && (input.occasionalBonus < 0 || input.occasionalBonus > 10)) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'occasionalBonus deve ser entre 0 e 10' }));
  }

  return Ok(Object.freeze({
    id: liveOpsEventId(input.id),
    kind: 'event_card' as const,
    name: input.name,
    description: input.description,
    window: Object.freeze(input.window),
    status: resolveEventStatus(input.window, now),
    createdAt: now,
    featuredCardId: input.featuredCardId,
    featuredRarity: input.featuredRarity,
    eventPackIds: Object.freeze(input.eventPackIds ?? []),
    occasionalBonus: input.occasionalBonus ?? null,
    tradeableAfterEvent: input.tradeableAfterEvent ?? true,
  }));
}

/** Verifica se uma EventCard está tradeable no momento dado. */
export function isEventCardTradeable(card: EventCard, now: Date): boolean {
  if (!card.tradeableAfterEvent) return false;
  return !isWindowActive(card.window, now); // tradeable APÓS o evento
}
