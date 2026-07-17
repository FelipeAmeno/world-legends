/**
 * lib/home-v2/view-model.ts — Sprint 43F (Home V2 Prototype Behind an
 * Internal Route)
 *
 * `HomeV2ViewModel` — o contrato de dados especificado em
 * docs/design/09-home-v2-information-architecture.md §8, agora
 * implementado. `buildHomeV2ViewModel` é uma função PURA (sem I/O,
 * nenhuma chamada de rede/DB) — recebe os dados já buscados pela rota
 * (mesmo padrão que `apps/web/app/page.tsx` já usa pra Home real: busca
 * em paralelo na rota, computa/deriva em funções puras) e nunca duplica
 * uma fonte de verdade. Nenhum campo aqui é inventado — cada um mapeia
 * pra uma query/action real já existente (documentado por campo no
 * arquivo de doc).
 *
 * Marketplace: nunca inclui listagens mock (`lib/marketplace/mock-listings.ts`)
 * — `marketplaceSummary` é sempre `{ readOnly: true }`, sem preço/atividade
 * nenhuma, porque a única fonte de listagem hoje é inteiramente fake
 * (vendedores/preços fabricados). Mostrar isso "rotulado como read-only"
 * ainda seria mostrar atividade falsa — a regra desta sprint é nunca
 * mostrar isso pra usuário autenticado, ponto.
 */

import type { CollectionCard } from '../collection-data';
import { selectTopCards } from './select-top-cards';

export type HomeV2SquadSummary = {
  formation: string;
  overall: number;
  chemistry: number;
};

export type HomeV2RecentResult = {
  outcome: 'win' | 'draw' | 'loss';
  opponent: string;
  homeScore: number;
  awayScore: number;
  date: string;
};

export type HomeV2FeatureAvailability = {
  marketplaceTransactions: boolean;
  packInventory: boolean;
  leagueMode: boolean;
  worldCupMode: boolean;
};

export type HomeV2ViewModel = {
  userSummary: { username: string; avatarUrl: string | null };
  currencies: { softCurrency: number; fragmentBalance: number };
  progression: { level: number; xp: number; xpForNext: number };
  highlightedCards: CollectionCard[];
  squadSummary: HomeV2SquadSummary | null;
  playSummary: {
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    recentResult: HomeV2RecentResult | null;
  };
  collectionSummary: { ownedCount: number; catalogCount: number; completionPercent: number };
  /** Sempre read-only nesta sprint — nunca listagens mock, ver comentário do arquivo. */
  marketplaceSummary: { readOnly: true };
  packSummary: {
    canPurchase: boolean;
    /** `null` = conceito não existe no domínio hoje (nenhum inventário de pack não-aberto é rastreado) — nunca inventado como 0. */
    ownedUnopenedCount: null;
    availablePackNames: string[];
  };
  featureAvailability: HomeV2FeatureAvailability;
};

export type BuildHomeV2ViewModelInput = {
  profile: {
    username: string;
    displayName: string | null;
    softCurrency: number;
    fragmentBalance: number;
  } | null;
  collection: readonly CollectionCard[];
  favoriteCardIds: readonly string[];
  squadSummary: HomeV2SquadSummary | null;
  matchStats: {
    wins: number;
    draws: number;
    losses: number;
    recentMatches: readonly HomeV2RecentResult[];
  };
  progression: { level: number; xp: number; xpForNext: number };
  /** `getCollection().length` — tamanho real do catálogo, nunca um número fabricado. */
  catalogCount: number;
  /** Nomes reais de `@world-legends/packs` (ex.: `CLASSIC_PACK.name`) — nunca inventados. */
  availablePackNames: readonly string[];
};

export function buildHomeV2ViewModel(input: BuildHomeV2ViewModelInput): HomeV2ViewModel {
  const highlightedCards = selectTopCards({
    collection: input.collection,
    favoriteCardIds: input.favoriteCardIds,
    limit: 3,
  });

  const totalMatches = input.matchStats.wins + input.matchStats.draws + input.matchStats.losses;
  const winRate = totalMatches > 0 ? input.matchStats.wins / totalMatches : 0;

  const ownedCount = input.collection.length;
  const completionPercent =
    input.catalogCount > 0 ? Math.round((ownedCount / input.catalogCount) * 100) : 0;

  return {
    userSummary: {
      username: input.profile?.displayName?.trim() || input.profile?.username || 'Treinador',
      avatarUrl: null,
    },
    currencies: {
      softCurrency: input.profile?.softCurrency ?? 0,
      fragmentBalance: input.profile?.fragmentBalance ?? 0,
    },
    progression: input.progression,
    highlightedCards,
    squadSummary: input.squadSummary,
    playSummary: {
      wins: input.matchStats.wins,
      draws: input.matchStats.draws,
      losses: input.matchStats.losses,
      winRate,
      recentResult: input.matchStats.recentMatches[0] ?? null,
    },
    collectionSummary: { ownedCount, catalogCount: input.catalogCount, completionPercent },
    marketplaceSummary: { readOnly: true },
    packSummary: {
      canPurchase: input.availablePackNames.length > 0,
      ownedUnopenedCount: null,
      availablePackNames: [...input.availablePackNames],
    },
    featureAvailability: {
      marketplaceTransactions: false,
      packInventory: false,
      leagueMode: false,
      worldCupMode: false,
    },
  };
}
