import type { CardId } from '@world-legends/cards';
/**
 * `UserCollection` — todas as UserCards de um usuário.
 *
 * Invariante central (doc 17 §6): unicidade de (profileId, cardId).
 * Uma segunda ocorrência da mesma carta → converte em fragmentos,
 * nunca cria um segundo UserCard.
 *
 * Fragmentos gerados são calculados pelo valor de raridade (doc 10 §16):
 * Common=10, Rare=25, Elite=60, Legendary=150, Ultra=400, WCH=1000.
 * (Valores meus — doc 10 §16 define a mecânica mas não os números exatos.)
 */
import { Err, Ok, type Result } from '@world-legends/shared';
import type { ValidationError } from '@world-legends/shared';
import type { RarityCode } from '@world-legends/types';
import type { AcquisitionSource, ProfileId, UserCard, UserCardId } from './user-card';
import { createUserCard } from './user-card';

export type CollectionError =
  | ValidationError
  | Readonly<{ kind: 'DuplicateConvertedToFragments'; cardId: CardId; fragmentsAwarded: number }>
  | Readonly<{ kind: 'CardNotFound'; userCardId: UserCardId }>;

/** Fragmentos concedidos por raridade em caso de duplicata (doc 10 §16). */
const FRAGMENT_VALUE_BY_RARITY: Readonly<Record<RarityCode, number>> = {
  common: 10,
  rare: 25,
  elite: 60,
  legendary: 150,
  ultra: 400,
  world_cup_hero: 1000,
};

export type AddCardResult =
  | Readonly<{ outcome: 'added'; userCard: UserCard }>
  | Readonly<{ outcome: 'duplicate_converted'; fragmentsAwarded: number }>;

export type UserCollection = {
  /** Adiciona uma carta. Duplicata → fragmentos; nunca cria 2ª instância. */
  addCard(input: {
    id: string;
    cardId: CardId;
    rarityCode: RarityCode;
    editionCode: import('@world-legends/types').EditionCode;
    source: AcquisitionSource;
  }): Result<AddCardResult, ValidationError>;

  removeCard(userCardId: UserCardId): Result<UserCard, CollectionError>;
  findByCardId(cardId: CardId): UserCard | null;
  findById(id: UserCardId): UserCard | null;
  updateCard(userCard: UserCard): Result<UserCard, CollectionError>;
  listAll(): readonly UserCard[];
  listEligibleStarters(): readonly UserCard[];
  size(): number;
  fragmentBalance(): number;
};

export function createUserCollection(pid: ProfileId): UserCollection {
  const byId = new Map<UserCardId, UserCard>();
  const byCardId = new Map<CardId, UserCardId>();
  let fragments = 0;

  return {
    addCard(input) {
      // Duplicata → fragmentos
      if (byCardId.has(input.cardId)) {
        const award = FRAGMENT_VALUE_BY_RARITY[input.rarityCode];
        fragments += award;
        return Ok({ outcome: 'duplicate_converted' as const, fragmentsAwarded: award });
      }

      const result = createUserCard({
        id: input.id,
        profileId: pid,
        cardId: input.cardId,
        source: input.source,
        rarityCode: input.rarityCode,
        editionCode: input.editionCode,
      });
      if (!result.ok) return result;

      const uc = result.value;
      byId.set(uc.id, uc);
      byCardId.set(uc.cardId, uc.id);
      return Ok({ outcome: 'added' as const, userCard: uc });
    },

    removeCard(id) {
      const uc = byId.get(id);
      if (!uc) return Err(Object.freeze({ kind: 'CardNotFound' as const, userCardId: id }));
      byId.delete(id);
      byCardId.delete(uc.cardId);
      return Ok(uc);
    },

    findByCardId(cardId) {
      const id = byCardId.get(cardId);
      if (!id) return null;
      return byId.get(id) ?? null;
    },

    findById(id) {
      return byId.get(id) ?? null;
    },

    updateCard(uc) {
      if (!byId.has(uc.id))
        return Err(Object.freeze({ kind: 'CardNotFound' as const, userCardId: uc.id }));
      byId.set(uc.id, uc);
      return Ok(uc);
    },

    listAll() {
      return [...byId.values()];
    },

    listEligibleStarters() {
      return [...byId.values()].filter(
        (uc) => !uc.injury.isInjured && uc.suspension.suspendedMatches === 0,
      );
    },

    size() {
      return byId.size;
    },

    fragmentBalance() {
      return fragments;
    },
  };
}
