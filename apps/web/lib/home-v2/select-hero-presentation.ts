/**
 * lib/home-v2/select-hero-presentation.ts — Sprint 43F.1 (Home V2 Visual
 * Hierarchy and Game Identity)
 *
 * REGRA DE APRESENTAÇÃO DO HERO — deliberadamente separada do ranking de
 * domínio (`select-top-cards.ts`, Sprint 43E). `selectTopCards()`
 * continua sendo a ÚNICA fonte de verdade de QUAIS 3 cartas aparecem —
 * este arquivo nunca reordena isso, nunca adiciona/remove uma carta do
 * top-3, nunca é chamado em vez de `selectTopCards()`. Ele só decide
 * qual das 3 cartas JÁ selecionadas ocupa a posição CENTRAL (a de maior
 * destaque visual) — uma escolha puramente de apresentação.
 *
 * Regra escolhida (documentada em docs/design/10-home-v2-prototype.md
 * §5, "trade-off" explícito pedido pelo brief): entre as 3 cartas do
 * ranking de domínio, a primeira (na MESMA ordem de domínio) que for
 * elegível pra full-artwork vira o centro. Nenhuma carta nova entra,
 * nenhuma sai — só a POSIÇÃO central muda. Se nenhuma das 3 for
 * full-artwork, o centro cai no rank[0] normal (comportamento idêntico
 * ao Sprint 43F, nunca menos determinístico).
 *
 * A elegibilidade full-artwork é decidida SEMPRE por
 * `resolvePlayerCardRendererForDensity` (nunca reimplementada aqui) —
 * injetada como função pra manter este arquivo puro/testável sem
 * depender do manifesto real gerado.
 */

import { CARD_STATIC_MANIFEST } from '../card-static/manifest.generated';
import { resolvePlayerCardRendererForDensity } from '../card-static/resolve-player-card-renderer';
import type { CollectionCard } from '../collection-data';

export type HeroPresentation = {
  center: CollectionCard;
  flankLeft: CollectionCard | null;
  flankRight: CollectionCard | null;
};

export type SelectHeroPresentationOptions = {
  /** Injetável nos testes — em produção, sempre `defaultIsFullArtworkEligible` (real, via `resolvePlayerCardRendererForDensity`). */
  isFullArtworkEligible?: (card: CollectionCard) => boolean;
};

export function defaultIsFullArtworkEligible(card: CollectionCard): boolean {
  const result = resolvePlayerCardRendererForDensity(
    {
      artworkPresetId: card.artworkPresetId,
      cardId: card.cardId,
      playerId: card.playerId,
      rarity: card.rarityCode,
    },
    CARD_STATIC_MANIFEST,
    'standard',
  );
  return result.renderer === 'full-artwork';
}

/**
 * `rankedTopThree` já vem ordenado pelo domínio (`selectTopCards()`) —
 * nunca reordenado aqui além da escolha de QUEM fica no centro.
 * `flankLeft`/`flankRight` preservam a ordem relativa de domínio das
 * duas cartas restantes (a que era "melhor" das duas restantes sempre
 * flanqueia à esquerda).
 */
export function selectHeroPresentation(
  rankedTopThree: readonly CollectionCard[],
  options: SelectHeroPresentationOptions = {},
): HeroPresentation | null {
  if (rankedTopThree.length === 0) return null;

  const isEligible = options.isFullArtworkEligible ?? defaultIsFullArtworkEligible;
  const eligibleIndex = rankedTopThree.findIndex((card) => isEligible(card));
  const centerIndex = eligibleIndex === -1 ? 0 : eligibleIndex;

  const center = rankedTopThree[centerIndex] as CollectionCard;
  const remaining = rankedTopThree.filter((_, index) => index !== centerIndex);

  return {
    center,
    flankLeft: remaining[0] ?? null,
    flankRight: remaining[1] ?? null,
  };
}
