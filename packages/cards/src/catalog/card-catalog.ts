/**
 * `CardCatalog` — registro em memória de todas as cartas do catálogo.
 *
 * Responsabilidades:
 * 1. Garantir unicidade de (playerId, rarityCode, editionCode) — doc 17 §5
 *    e doc 02 DDL (unique player_id, rarity_id, edition_code). Prime e Event
 *    sobre a mesma raridade são permitidos pois têm editionCode diferente.
 * 2. Garantir o limite de 6 cartas-base permanentes por jogador (doc 10 §3).
 *    Cartas 'prime'/'event' não contam — são variações sobre as 6 bases.
 * 3. Busca por playerId, rarityCode, editionCode.
 *
 * Sem banco — estado em memória. Persistência: camada futura.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';
import type { EditionCode, RarityCode } from '@world-legends/types';
import type { Card, CardId } from '../card/types';
import type { PlayerId } from '../player/types';

const MAX_BASE_CARDS_PER_PLAYER = 6;
const BASE_EDITION_CODES = new Set<EditionCode>(['base', 'goat']);

export type CardCatalogError =
  | ValidationError
  | Readonly<{
      kind: 'DuplicateCardError';
      playerId: PlayerId;
      rarityCode: RarityCode;
      editionCode: EditionCode;
    }>
  | Readonly<{ kind: 'MaxCardsPerPlayerError'; playerId: PlayerId; current: number }>
  | Readonly<{ kind: 'CardNotFoundError'; cardId: CardId }>;

export type CardCatalog = {
  register(card: Card): Result<Card, CardCatalogError>;
  findById(id: CardId): Card | null;
  findByPlayer(playerId: PlayerId): readonly Card[];
  findByPlayerAndRarity(playerId: PlayerId, rarityCode: RarityCode): Card | null;
  findByPlayerRarityEdition(
    playerId: PlayerId,
    rarityCode: RarityCode,
    editionCode: EditionCode,
  ): Card | null;
  listActive(): readonly Card[];
  size(): number;
};

export function createCardCatalog(): CardCatalog {
  const byId = new Map<CardId, Card>();
  // índice: `${playerId}:${rarityCode}:${editionCode}` → CardId
  const byPlayerRarityEdition = new Map<string, CardId>();
  const baseCountByPlayer = new Map<PlayerId, number>();

  function preKey(pid: PlayerId, r: RarityCode, e: EditionCode): string {
    return `${pid}:${r}:${e}`;
  }

  return {
    register(card: Card): Result<Card, CardCatalogError> {
      const preK = preKey(card.playerId, card.rarityCode, card.editionCode);
      if (byPlayerRarityEdition.has(preK)) {
        return Err(
          Object.freeze({
            kind: 'DuplicateCardError' as const,
            playerId: card.playerId,
            rarityCode: card.rarityCode,
            editionCode: card.editionCode,
          }),
        );
      }
      if (BASE_EDITION_CODES.has(card.editionCode)) {
        const current = baseCountByPlayer.get(card.playerId) ?? 0;
        if (current >= MAX_BASE_CARDS_PER_PLAYER) {
          return Err(
            Object.freeze({
              kind: 'MaxCardsPerPlayerError' as const,
              playerId: card.playerId,
              current,
            }),
          );
        }
        baseCountByPlayer.set(card.playerId, current + 1);
      }
      byId.set(card.id, card);
      byPlayerRarityEdition.set(preK, card.id);
      return Ok(card);
    },

    findById(id: CardId): Card | null {
      return byId.get(id) ?? null;
    },

    findByPlayer(pid: PlayerId): readonly Card[] {
      return [...byId.values()].filter((c) => c.playerId === pid);
    },

    findByPlayerAndRarity(pid: PlayerId, r: RarityCode): Card | null {
      // Retorna a carta 'base' de uma raridade (a mais comum das edições)
      const baseKey = preKey(pid, r, 'base');
      const id = byPlayerRarityEdition.get(baseKey);
      if (id !== undefined) return byId.get(id) ?? null;
      // Fallback: qualquer edição dessa raridade
      const any = [...byId.values()].find((c) => c.playerId === pid && c.rarityCode === r);
      return any ?? null;
    },

    findByPlayerRarityEdition(pid: PlayerId, r: RarityCode, e: EditionCode): Card | null {
      const key = preKey(pid, r, e);
      const id = byPlayerRarityEdition.get(key);
      if (id === undefined) return null;
      return byId.get(id) ?? null;
    },

    listActive(): readonly Card[] {
      return [...byId.values()].filter((c) => c.isActive);
    },

    size(): number {
      return byId.size;
    },
  };
}
