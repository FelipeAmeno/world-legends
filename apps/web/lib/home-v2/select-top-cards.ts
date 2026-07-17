/**
 * lib/home-v2/select-top-cards.ts — Sprint 43E (Home V2 Discovery and
 * Information Architecture)
 *
 * Seletor puro e determinístico das 3 cartas em destaque do usuário —
 * especificado em docs/design/09-home-v2-information-architecture.md
 * §4. Esta sprint é primariamente de especificação; esta função é a
 * ÚNICA peça de código real desta sprint, deliberadamente pequena e
 * pura (nenhuma chamada de rede/DB, nenhuma renderização, nenhuma rota
 * tocada) — nunca usada pela Home ao vivo ainda (Sprint 43F decide se
 * e como integrar).
 *
 * Nunca usa cartas mock — recebe sempre a coleção real (já resolvida
 * pelo caller via `getUserCollection`, igual o resto do app faz hoje).
 */

import type { EditionCode, RarityCode } from '@world-legends/types';
import type { CollectionCard } from '../collection-data';

const RARITY_RANK: Record<RarityCode, number> = {
  common: 0,
  rare: 1,
  elite: 2,
  legendary: 3,
  ultra: 4,
  world_cup_hero: 5,
};

/**
 * Prestígio de edição — mesma ordem documentada em
 * `packages/types/src/index.ts` (goat = "topo absoluto de prestígio",
 * prime = "auge verificável da carreira", event = sazonal, base =
 * versão padrão). Número menor = prioridade maior.
 */
const EDITION_PRIORITY: Record<EditionCode, number> = {
  goat: 0,
  prime: 1,
  event: 2,
  base: 3,
};

export type TopCardsSelectionInput = {
  collection: readonly CollectionCard[];
  /** `cardId`s favoritados pelo usuário — de `getFavoriteCardIds()` (server action real, `lib/actions/favorites.ts`). Nunca dados mock. */
  favoriteCardIds?: readonly string[];
  limit?: number;
};

/** Chave estável de desempate — `userCardId` (instância possuída) quando existe, senão `cardId` (definição de catálogo). Nunca nome de exibição (pode mudar/colidir). */
function stableTieBreakerKey(card: CollectionCard): string {
  return card.userCardId ?? card.cardId;
}

function isFavorite(card: CollectionCard, favoriteCardIds: ReadonlySet<string>): boolean {
  return favoriteCardIds.has(card.cardId);
}

/**
 * Ordena por: (1) favoritado antes de não-favoritado — grupo inteiro,
 * não um bônus de pontuação; (2) overall descendente; (3) raridade
 * descendente; (4) prioridade de edição (goat > prime > event > base);
 * (5) desempate estável por id. Nunca lança, nunca muta o array de
 * entrada.
 */
export function selectTopCards(input: TopCardsSelectionInput): CollectionCard[] {
  const { collection, favoriteCardIds = [], limit = 3 } = input;
  const favorites = new Set(favoriteCardIds);

  const sorted = [...collection].sort((a, b) => {
    const favoriteDelta = Number(isFavorite(b, favorites)) - Number(isFavorite(a, favorites));
    if (favoriteDelta !== 0) return favoriteDelta;

    if (a.overall !== b.overall) return b.overall - a.overall;

    const rarityDelta = (RARITY_RANK[b.rarityCode] ?? 0) - (RARITY_RANK[a.rarityCode] ?? 0);
    if (rarityDelta !== 0) return rarityDelta;

    const aEdition = (a.editionCode as EditionCode | undefined) ?? 'base';
    const bEdition = (b.editionCode as EditionCode | undefined) ?? 'base';
    const editionDelta = (EDITION_PRIORITY[aEdition] ?? 3) - (EDITION_PRIORITY[bEdition] ?? 3);
    if (editionDelta !== 0) return editionDelta;

    return stableTieBreakerKey(a).localeCompare(stableTieBreakerKey(b));
  });

  return sorted.slice(0, Math.max(0, limit));
}
