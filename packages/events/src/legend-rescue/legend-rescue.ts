/**
 * `LegendRescue` — "Resgate de Lenda" (doc 10 §23).
 *
 * "Evento raro que abre uma janela temporária de Craft para uma carta
 * normalmente não-craftável (exceto GOAT, que segue sempre exclusivo
 * de conquista)."
 *
 * INVARIANTE GOAT (doc 10 §23, TC-HOF-03):
 * GOAT nunca pode ser alvo de um LegendRescue — é estruturalmente
 * impossível. Qualquer tentativa de criar um LegendRescue com
 * targetEditionCode='goat' ou targetCardId referenciando um GOAT
 * é rejeitada com `GoatNotRescuable`.
 *
 * CUSTO DE CRAFT TEMPORÁRIO:
 * O LegendRescue define um `craftCostFragments` específico para o evento
 * — geralmente MAIOR que o custo padrão de uma Legendary (1500) para
 * refletir o caráter especial da carta. Decisão de balanceamento própria,
 * coerente com o doc 10 §17 ("preserva prestígio").
 *
 * Funções puras — sem efeito colateral.
 */
import { Err, Ok, type Result } from '@world-legends/shared';
import {
  liveOpsEventId, resolveEventStatus, isWindowActive,
  type LiveOpsEventBase, type EventWindow, type LiveOpsError,
} from '../catalog/types';
import type { RarityCode, EditionCode } from '@world-legends/types';

// ─── LegendRescue ─────────────────────────────────────────────────────────────

export type LegendRescue = LiveOpsEventBase & Readonly<{
  readonly kind: 'legend_rescue';
  /** CardId da carta sendo resgatada (normalmente não-craftável). */
  readonly targetCardId: string;
  /** Raridade da carta (nunca GOAT edition). */
  readonly targetRarity: RarityCode;
  /** Edição da carta. 'goat' é PROIBIDO (TC-HOF-03). */
  readonly targetEdition: Exclude<EditionCode, 'goat'>;
  /**
   * Custo em fragmentos para o Craft temporário.
   * Deve ser ≥ ao custo padrão de Legendary (1500, doc 10 §17).
   */
  readonly craftCostFragments: number;
  /** Quantas cartas podem ser craftadas por conta durante o evento. */
  readonly perAccountLimit: number;
}>;

/** Custo mínimo de um LegendRescue — maior que Legendary padrão (doc 10 §17). */
export const LEGEND_RESCUE_MIN_COST = 2_000;
export const LEGEND_RESCUE_MAX_COST = 10_000;

// ─── createLegendRescue ───────────────────────────────────────────────────────

export function createLegendRescue(input: {
  id: string;
  name: string;
  description: string;
  window: EventWindow;
  targetCardId: string;
  targetRarity: RarityCode;
  targetEdition: EditionCode;
  craftCostFragments: number;
  perAccountLimit?: number;
}, now = new Date()): Result<LegendRescue, LiveOpsError> {
  // TC-HOF-03: GOAT nunca é resgatável
  if ((input.targetEdition as string) === 'goat') {
    return Err(Object.freeze({
      kind: 'GoatNotRescuable' as const,
      reason: 'Cartas GOAT são exclusivas de conquista (TC-HOF-03) e nunca podem ser resgatadas via LegendRescue.',
    }));
  }
  if (input.window.endsAt <= input.window.startsAt) {
    return Err(Object.freeze({ kind: 'InvalidWindow' as const, reason: 'endsAt deve ser posterior a startsAt' }));
  }
  if (input.craftCostFragments < LEGEND_RESCUE_MIN_COST) {
    return Err(Object.freeze({
      kind: 'InvalidWindow' as const,
      reason: `craftCostFragments deve ser ≥ ${LEGEND_RESCUE_MIN_COST} (maior que Legendary padrão)`,
    }));
  }
  if (input.craftCostFragments > LEGEND_RESCUE_MAX_COST) {
    return Err(Object.freeze({
      kind: 'InvalidWindow' as const,
      reason: `craftCostFragments deve ser ≤ ${LEGEND_RESCUE_MAX_COST}`,
    }));
  }

  return Ok(Object.freeze({
    id: liveOpsEventId(input.id),
    kind: 'legend_rescue' as const,
    name: input.name,
    description: input.description,
    window: Object.freeze(input.window),
    status: resolveEventStatus(input.window, now),
    createdAt: now,
    targetCardId: input.targetCardId,
    targetRarity: input.targetRarity,
    targetEdition: input.targetEdition as Exclude<EditionCode, 'goat'>,
    craftCostFragments: input.craftCostFragments,
    perAccountLimit: input.perAccountLimit ?? 1,
  }));
}

// ─── canCraftDuringRescue ─────────────────────────────────────────────────────

/**
 * Verifica se um craft é permitido durante um LegendRescue.
 * Retorna false se: evento não está ativo, targetCardId não confere, ou
 * o jogador atingiu o limite por conta.
 */
export function canCraftDuringRescue(
  rescue: LegendRescue,
  cardId: string,
  accountCraftsThisEvent: number,
  now: Date,
): { allowed: boolean; reason?: string } {
  if (!isWindowActive(rescue.window, now)) {
    return { allowed: false, reason: `Evento ${rescue.id} não está ativo.` };
  }
  if (rescue.targetCardId !== cardId) {
    return { allowed: false, reason: `Este LegendRescue só permite craftar ${rescue.targetCardId}.` };
  }
  if (accountCraftsThisEvent >= rescue.perAccountLimit) {
    return { allowed: false, reason: `Limite por conta atingido (${rescue.perAccountLimit}).` };
  }
  return { allowed: true };
}
