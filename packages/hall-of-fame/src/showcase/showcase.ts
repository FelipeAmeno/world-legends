/**
 * Vitrine pessoal (Showcase) — doc 10 §21, TC-HOF-06.
 *
 * "Vitrine pessoal: o usuário fixa até 5 cartas no topo do próprio
 * perfil, vistas por amigos e na liga." (doc 10 §21)
 *
 * TC-HOF-06: "Limite de 5 cartas fixadas é respeitado; tentativa de
 * fixar uma 6ª é rejeitada."
 *
 * `hall-of-fame` cuida da lógica de exibição do showcase. A ownership
 * (se a carta pertence ao usuário) é validada pela camada de aplicação
 * antes de chamar as funções deste módulo.
 *
 * Funções puras — sem efeito colateral.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export const HOF_SHOWCASE_MAX_SLOTS = 5; // TC-HOF-06

export type HofShowcaseSlot = Readonly<{
  readonly position:  number;  // 0-based
  readonly cardId:    string;
  readonly userCardId: string;
}>;

export type HofShowcase = Readonly<{
  readonly profileId:  string;
  readonly slots:      readonly HofShowcaseSlot[];
}>;

export type ShowcaseError =
  | Readonly<{ kind: 'SlotLimitExceeded'; max: number }>
  | Readonly<{ kind: 'DuplicateCard'; cardId: string }>
  | ReturnType<typeof validationError>;

// ─── Funções puras ────────────────────────────────────────────────────────────

export function createShowcase(profileId: string): HofShowcase {
  return Object.freeze({ profileId, slots: Object.freeze([]) });
}

/** Adiciona uma carta à vitrine. Rejeita se já tem 5 ou se a carta já está. */
export function addToShowcase(
  showcase: HofShowcase,
  input: { cardId: string; userCardId: string },
): Result<HofShowcase, ShowcaseError> {
  if (showcase.slots.length >= HOF_SHOWCASE_MAX_SLOTS) {
    return Err(Object.freeze({ kind: 'SlotLimitExceeded' as const, max: HOF_SHOWCASE_MAX_SLOTS }));
  }
  if (showcase.slots.some((s) => s.cardId === input.cardId)) {
    return Err(Object.freeze({ kind: 'DuplicateCard' as const, cardId: input.cardId }));
  }

  const newSlot: HofShowcaseSlot = Object.freeze({
    position: showcase.slots.length,
    cardId: input.cardId,
    userCardId: input.userCardId,
  });

  return Ok(Object.freeze({
    ...showcase,
    slots: Object.freeze([...showcase.slots, newSlot]),
  }));
}

/** Remove uma carta da vitrine por cardId. Reordena as posições. */
export function removeFromShowcase(showcase: HofShowcase, cardId: string): HofShowcase {
  const remaining = showcase.slots
    .filter((s) => s.cardId !== cardId)
    .map((s, i) => Object.freeze({ ...s, position: i }));

  return Object.freeze({ ...showcase, slots: Object.freeze(remaining) });
}

/** Troca duas posições na vitrine. */
export function reorderShowcase(
  showcase: HofShowcase,
  orderedCardIds: readonly string[],
): Result<HofShowcase, ShowcaseError> {
  if (orderedCardIds.length !== showcase.slots.length) {
    return Err(validationError(
      `Reordenação requer ${showcase.slots.length} IDs, recebido ${orderedCardIds.length}`,
      'orderedCardIds',
    ));
  }

  const slotByCardId = new Map(showcase.slots.map((s) => [s.cardId, s]));
  for (const id of orderedCardIds) {
    if (!slotByCardId.has(id)) {
      return Err(validationError(`CardId "${id}" não está na vitrine`, 'orderedCardIds'));
    }
  }

  const reordered = orderedCardIds.map((cid, i) =>
    Object.freeze({ ...slotByCardId.get(cid)!, position: i }),
  );

  return Ok(Object.freeze({ ...showcase, slots: Object.freeze(reordered) }));
}
