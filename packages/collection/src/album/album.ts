import type { CardId } from '@world-legends/cards';
/**
 * Álbum de coleção (doc 17 §7).
 *
 * Dois agregados separados:
 *
 * `CollectionSetDefinition` (catálogo) — define quais cartas compõem um
 * álbum e a recompensa por completar. Imutável após publicação.
 *
 * `AlbumProgress` (coleção do usuário) — rastreia quais cartas do álbum
 * o usuário já possui. Calcula percentual de completude e detecta conclusão.
 *
 * Invariante central (doc 17 §7): a recompensa é entregue exatamente uma
 * vez — `completedAt` é o guard de idempotência.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { ProfileId } from '../user-card/user-card';

// ─── SetId ───────────────────────────────────────────────────────────────────
export type SetId = string & { readonly _brand: 'SetId' };
export function setId(v: string): SetId {
  if (!v.trim()) throw new Error('SetId vazio');
  return v as SetId;
}

// ─── RewardSpec ───────────────────────────────────────────────────────────────
export type RewardSpec = Readonly<{
  /** Fragmentos concedidos ao completar. */
  readonly fragments: number;
  /** Créditos (moeda in-game) concedidos ao completar. */
  readonly credits: number;
  /** ID de pack especial concedido, se houver. */
  readonly packId?: string;
}>;

// ─── CollectionSetDefinition ──────────────────────────────────────────────────
/**
 * Definição imutável de um álbum. (doc 17 §7)
 * `requiredCards` nunca muda após publicação — alteração cria novo set.
 */
export type CollectionSetDefinition = Readonly<{
  readonly id: SetId;
  readonly name: string;
  readonly description: string;
  readonly requiredCards: readonly CardId[];
  readonly reward: RewardSpec;
}>;

export function createCollectionSetDefinition(input: {
  id: string;
  name: string;
  description: string;
  requiredCards: readonly CardId[];
  reward: RewardSpec;
}): Result<CollectionSetDefinition, ValidationError> {
  if (!input.name.trim()) {
    return Err(validationError('name não pode ser vazio', 'name'));
  }
  if (input.requiredCards.length === 0) {
    return Err(validationError('requiredCards não pode ser vazio', 'requiredCards'));
  }
  const unique = new Set(input.requiredCards);
  if (unique.size !== input.requiredCards.length) {
    return Err(validationError('requiredCards contém CardIds duplicados', 'requiredCards'));
  }
  if (input.reward.fragments < 0 || input.reward.credits < 0) {
    return Err(validationError('Recompensas não podem ser negativas', 'reward'));
  }

  return Ok(
    Object.freeze({
      id: setId(input.id),
      name: input.name.trim(),
      description: input.description.trim(),
      requiredCards: Object.freeze([...input.requiredCards]),
      reward: Object.freeze(input.reward),
    }),
  );
}

// ─── AlbumProgress ────────────────────────────────────────────────────────────
export type AlbumProgress = Readonly<{
  readonly profileId: ProfileId;
  readonly setId: SetId;
  /** CardIds do set que o usuário já possui. Subconjunto de CollectionSetDefinition.requiredCards. */
  readonly ownedCards: ReadonlySet<CardId>;
  /** Definido quando o usuário completou 100% do álbum. Guard de idempotência. */
  readonly completedAt: Date | null;
}>;

export function createAlbumProgress(
  profileId: ProfileId,
  set: CollectionSetDefinition,
): AlbumProgress {
  return Object.freeze({
    profileId,
    setId: set.id,
    ownedCards: new Set<CardId>(),
    completedAt: null,
  });
}

/** Percentual de completude: 0.0 → 1.0. */
export function completionPercent(progress: AlbumProgress, set: CollectionSetDefinition): number {
  if (set.requiredCards.length === 0) return 1;
  const owned = set.requiredCards.filter((id) => progress.ownedCards.has(id)).length;
  return owned / set.requiredCards.length;
}

/**
 * Atualiza o progresso quando o usuário adquire uma carta.
 * Retorna o novo AlbumProgress (imutável) e se a conclusão acabou de ser
 * alcançada neste momento (para trigger de entrega de recompensa).
 */
export function recordCardAcquired(
  progress: AlbumProgress,
  set: CollectionSetDefinition,
  cardId: CardId,
): { progress: AlbumProgress; justCompleted: boolean } {
  // Carta não pertence a este álbum — sem efeito
  if (!set.requiredCards.includes(cardId)) {
    return { progress, justCompleted: false };
  }
  // Já possuída — sem efeito
  if (progress.ownedCards.has(cardId)) {
    return { progress, justCompleted: false };
  }

  const newOwned = new Set(progress.ownedCards);
  newOwned.add(cardId);

  const nowComplete = newOwned.size === set.requiredCards.length;
  const wasAlreadyComplete = progress.completedAt !== null;

  const newProgress: AlbumProgress = Object.freeze({
    ...progress,
    ownedCards: newOwned,
    completedAt: nowComplete && !wasAlreadyComplete ? new Date() : progress.completedAt,
  });

  return { progress: newProgress, justCompleted: nowComplete && !wasAlreadyComplete };
}

export function isAlbumComplete(progress: AlbumProgress): boolean {
  return progress.completedAt !== null;
}
