/**
 * `WeekendBoost` e `DoubleDrop` — tipos de boost de live-ops (doc 10 §23).
 *
 * REGRAS DOCUMENTADAS (doc 10 §23):
 * - "Fins de semana de drop em dobro: janelas curtas com probabilidades
 *   elevadas em pacotes específicos, sempre anunciadas com antecedência
 *   e nunca retroativas."
 *
 * `WeekendBoost` é um multiplicador geral (ex: +50% fragmentos no fim de semana).
 * `DoubleDrop` é o caso específico de probabilidade dobrada de carta rara.
 * Ambos são modelados como Live-Ops events com janela explícita.
 *
 * INVARIANTE: janela máxima de 72h para boosts (3 dias — "fins de semana"
 * + alguma folga). Não documentada com número exato; decisão própria.
 */
import { Err, Ok, type Result } from '@world-legends/shared';
import {
  liveOpsEventId, resolveEventStatus,
  type LiveOpsEventBase, type EventWindow, type LiveOpsError,
} from '../catalog/types';
import type { RarityCode } from '@world-legends/types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type BoostTarget =
  | 'fragments'   // +X% de fragmentos ao abrir packs
  | 'credits'     // +X% de créditos em recompensas de partida
  | 'drop_rate'   // Drop rate dobrado para raridade específica
  | 'xp';         // +X% de XP (progressão de álbum)

export type WeekendBoost = LiveOpsEventBase & Readonly<{
  readonly kind: 'weekend_boost';
  /** Multiplicador (ex: 1.5 = +50%, 2.0 = dobrado). */
  readonly multiplier: number;
  readonly target: BoostTarget;
  /** Packs afetados pelo boost. Vazio = todos os packs. */
  readonly affectedPackIds: readonly string[];
}>;

export type DoubleDrop = LiveOpsEventBase & Readonly<{
  readonly kind: 'double_drop';
  /** Raridade com drop rate dobrado. */
  readonly doubledRarity: RarityCode;
  /** Packs afetados. Vazio = todos. */
  readonly affectedPackIds: readonly string[];
  /** Multiplicador de drop rate (padrão: 2.0 = "em dobro"). */
  readonly dropMultiplier: number;
}>;

// ─── Constante de janela máxima ───────────────────────────────────────────────
export const MAX_BOOST_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 horas

// ─── createWeekendBoost ───────────────────────────────────────────────────────

export function createWeekendBoost(input: {
  id: string;
  name: string;
  description: string;
  window: EventWindow;
  multiplier: number;
  target: BoostTarget;
  affectedPackIds?: readonly string[];
}, now = new Date()): Result<WeekendBoost, LiveOpsError> {
  if (input.window.endsAt <= input.window.startsAt) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'endsAt deve ser posterior a startsAt' }));
  }
  const durationMs = input.window.endsAt.getTime() - input.window.startsAt.getTime();
  if (durationMs > MAX_BOOST_WINDOW_MS) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: `WeekendBoost não pode durar mais que 72h` }));
  }
  if (input.multiplier < 1.0 || input.multiplier > 5.0) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'multiplier deve ser entre 1.0 e 5.0' }));
  }

  return Ok(Object.freeze({
    id: liveOpsEventId(input.id),
    kind: 'weekend_boost' as const,
    name: input.name,
    description: input.description,
    window: Object.freeze(input.window),
    status: resolveEventStatus(input.window, now),
    createdAt: now,
    multiplier: input.multiplier,
    target: input.target,
    affectedPackIds: Object.freeze(input.affectedPackIds ?? []),
  }));
}

// ─── createDoubleDrop ─────────────────────────────────────────────────────────

export function createDoubleDrop(input: {
  id: string;
  name: string;
  description: string;
  window: EventWindow;
  doubledRarity: RarityCode;
  affectedPackIds?: readonly string[];
  dropMultiplier?: number;
}, now = new Date()): Result<DoubleDrop, LiveOpsError> {
  if (input.window.endsAt <= input.window.startsAt) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'endsAt deve ser posterior a startsAt' }));
  }
  const durationMs = input.window.endsAt.getTime() - input.window.startsAt.getTime();
  if (durationMs > MAX_BOOST_WINDOW_MS) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'DoubleDrop não pode durar mais que 72h' }));
  }

  const multiplier = input.dropMultiplier ?? 2.0;
  if (multiplier < 1.0 || multiplier > 10.0) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'dropMultiplier deve ser entre 1.0 e 10.0' }));
  }

  return Ok(Object.freeze({
    id: liveOpsEventId(input.id),
    kind: 'double_drop' as const,
    name: input.name,
    description: input.description,
    window: Object.freeze(input.window),
    status: resolveEventStatus(input.window, now),
    createdAt: now,
    doubledRarity: input.doubledRarity,
    affectedPackIds: Object.freeze(input.affectedPackIds ?? []),
    dropMultiplier: multiplier,
  }));
}

// ─── applyBoostMultiplier ─────────────────────────────────────────────────────

/**
 * Aplica o multiplicador de boost a um valor base.
 * Retorna o valor original se o boost não estiver ativo.
 */
export function applyBoostMultiplier(
  baseValue: number,
  boost: WeekendBoost | DoubleDrop,
  now: Date,
): number {
  const multiplier = boost.kind === 'weekend_boost' ? boost.multiplier : boost.dropMultiplier;
  if (boost.status !== 'active') return baseValue;
  const isActive = now >= boost.window.startsAt && now <= boost.window.endsAt;
  if (!isActive) return baseValue;
  return Math.round(baseValue * multiplier);
}
