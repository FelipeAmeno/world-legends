import type { CardId } from '@world-legends/cards';
/**
 * `Showcase` — vitrine pública de cartas escolhidas pelo usuário.
 *
 * Doc 17 §4: parte do contexto de Coleção. Permite que o usuário exiba
 * até 5 cartas escolhidas manualmente no perfil público.
 *
 * Invariantes:
 * - Máximo de MAX_SHOWCASE_SLOTS cartas simultâneas.
 * - Só cartas que o usuário possui (UserCard válido na coleção).
 * - Sem duplicatas de CardId no showcase.
 * - Ordem importa (posição de exibição 0..4).
 *
 * Doc não especifica MAX_SHOWCASE_SLOTS explicitamente — uso 5, valor
 * razoável para uma "vitrine". Documentado como decisão própria.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { ProfileId, UserCardId } from '../user-card/user-card';

export const MAX_SHOWCASE_SLOTS = 5;

export type ShowcaseSlot = Readonly<{
  readonly position: number; // 0-based, ordem de exibição
  readonly userCardId: UserCardId;
  readonly cardId: CardId;
}>;

export type Showcase = Readonly<{
  readonly profileId: ProfileId;
  readonly slots: readonly ShowcaseSlot[];
}>;

export type ShowcaseError =
  | ValidationError
  | Readonly<{ kind: 'SlotLimitExceeded'; max: number }>
  | Readonly<{ kind: 'DuplicateCard'; cardId: CardId }>
  | Readonly<{ kind: 'CardNotOwned'; cardId: CardId }>;

export function createShowcase(profileId: ProfileId): Showcase {
  return Object.freeze({ profileId, slots: [] });
}

/**
 * Adiciona uma carta ao showcase. Retorna um novo Showcase imutável.
 * `ownedCardIds` é o conjunto de CardIds que o usuário possui — validação
 * de posse sem criar dependência direta no `UserCollection`.
 */
export function addToShowcase(
  showcase: Showcase,
  input: { userCardId: UserCardId; cardId: CardId },
  ownedCardIds: ReadonlySet<CardId>,
): Result<Showcase, ShowcaseError> {
  if (showcase.slots.length >= MAX_SHOWCASE_SLOTS) {
    return Err(Object.freeze({ kind: 'SlotLimitExceeded' as const, max: MAX_SHOWCASE_SLOTS }));
  }
  if (!ownedCardIds.has(input.cardId)) {
    return Err(Object.freeze({ kind: 'CardNotOwned' as const, cardId: input.cardId }));
  }
  if (showcase.slots.some((s) => s.cardId === input.cardId)) {
    return Err(Object.freeze({ kind: 'DuplicateCard' as const, cardId: input.cardId }));
  }

  const newSlot: ShowcaseSlot = Object.freeze({
    position: showcase.slots.length,
    userCardId: input.userCardId,
    cardId: input.cardId,
  });

  return Ok(
    Object.freeze({
      ...showcase,
      slots: Object.freeze([...showcase.slots, newSlot]),
    }),
  );
}

/** Remove uma carta do showcase por cardId. Reordena as posições. */
export function removeFromShowcase(showcase: Showcase, cardId: CardId): Showcase {
  const remaining = showcase.slots
    .filter((s) => s.cardId !== cardId)
    .map((s, i) => Object.freeze({ ...s, position: i }));

  return Object.freeze({ ...showcase, slots: Object.freeze(remaining) });
}

/** Reordena o showcase dado um array de CardIds na nova ordem desejada. */
export function reorderShowcase(
  showcase: Showcase,
  orderedCardIds: readonly CardId[],
): Result<Showcase, ShowcaseError> {
  const currentCardIds = new Set(showcase.slots.map((s) => s.cardId));
  for (const id of orderedCardIds) {
    if (!currentCardIds.has(id)) {
      return Err(
        validationError(
          `CardId "${id}" não está no showcase atual — não pode reordenar.`,
          'orderedCardIds',
        ),
      );
    }
  }
  if (orderedCardIds.length !== showcase.slots.length) {
    return Err(
      validationError(
        `Array de reordenação tem ${orderedCardIds.length} itens mas o showcase tem ${showcase.slots.length}.`,
        'orderedCardIds',
      ),
    );
  }

  const slotByCardId = new Map(showcase.slots.map((s) => [s.cardId, s]));
  const reordered = orderedCardIds.map((cid, i) => {
    // biome-ignore lint/style/noNonNullAssertion: orderedCardIds is pre-validated against showcase.slots
    const slot = slotByCardId.get(cid)!;
    return Object.freeze({ ...slot, position: i });
  });

  return Ok(Object.freeze({ ...showcase, slots: Object.freeze(reordered) }));
}
