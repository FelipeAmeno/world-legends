/**
 * lib/marketplace/types.ts — T063
 *
 * Tipos completos do Marketplace do World Legends.
 *
 * Preparado para economia futura:
 *   - Venda direta (sell)
 *   - Leilão (auction)
 *   - Troca (trade)
 *   - Oferta (offer)
 *
 * Nenhum tipo requer mudança quando o backend for conectado.
 * A UI já renderiza preços, timers e status corretos.
 */

import type { RarityCode } from '@world-legends/types';

// ─── Listing ──────────────────────────────────────────────────────────────────

export type ListingType = 'sell' | 'auction' | 'trade';
export type ListingStatus = 'active' | 'sold' | 'expired' | 'cancelled';
export type PriceUnit = 'credits' | 'fragments' | 'pack';

export type PriceTag = {
  readonly amount: number;
  readonly unit: PriceUnit;
  readonly label: string; // "1.200c", "50 gemas", "1 Elite Pack"
};

export type AuctionDetails = {
  readonly currentBid: PriceTag;
  readonly minimumBid: PriceTag;
  readonly buyNow?: PriceTag;
  readonly bids: number; // total de lances
  readonly endsAt: string; // ISO date
  readonly timeLeft: string; // "2h 35m"
};

export type MarketListing = {
  readonly id: string;
  readonly type: ListingType;
  readonly status: ListingStatus;

  // Carta
  readonly cardId: string; // ex: 'uc-1'
  readonly ownedCardId: string; // id único da carta do vendedor
  readonly cardName: string;
  readonly cardOvr: number;
  readonly rarityCode: RarityCode;
  readonly rarityLabel: string;
  readonly position: string;
  readonly nationality: string;
  readonly flagEmoji: string;
  readonly era: string;
  readonly evolution: number;
  readonly contracts: number;

  // Seller
  readonly sellerId: string;
  readonly sellerName: string;
  readonly sellerLevel: number;

  // Preço
  readonly price: PriceTag;
  readonly originalPrice?: PriceTag; // para mostrar desconto

  // Leilão (só se type === 'auction')
  readonly auction?: AuctionDetails;

  // Meta
  readonly listedAt: string; // ISO date
  readonly expiresAt?: string;
  readonly views: number;
  readonly favorited: number; // quantos favoritaram

  // Flags para economia futura
  readonly isHighlighted: boolean; // pago para aparecer primeiro
  readonly isTrending: boolean;
  readonly isNew: boolean; // listado nas últimas 2h
};

// ─── Filtros ──────────────────────────────────────────────────────────────────

export type MarketSortField =
  | 'price_asc'
  | 'price_desc'
  | 'ovr_desc'
  | 'ovr_asc'
  | 'newest'
  | 'ending_soon' // leilões
  | 'most_viewed'
  | 'trending';

export type MarketFilters = {
  search: string;
  rarities: RarityCode[];
  positions: string[];
  countries: string[];
  eras: string[];
  types: ListingType[];
  priceMin: number | null;
  priceMax: number | null;
  priceUnit: PriceUnit;
  ovrMin: number | null;
  ovrMax: number | null;
  evolutionMin: number; // 0–5
  contractsMin: number; // mínimo de contratos
  sortBy: MarketSortField;
  onlyNew: boolean;
  onlyTrending: boolean;
};

export const DEFAULT_MARKET_FILTERS: MarketFilters = {
  search: '',
  rarities: [],
  positions: [],
  countries: [],
  eras: [],
  types: [],
  priceMin: null,
  priceMax: null,
  priceUnit: 'credits',
  ovrMin: null,
  ovrMax: null,
  evolutionMin: 0,
  contractsMin: 0,
  sortBy: 'newest',
  onlyNew: false,
  onlyTrending: false,
};

// ─── Economia (preparado para o futuro) ──────────────────────────────────────

/**
 * Estatísticas de mercado de uma carta.
 * Obtidas do histórico de vendas (futuro: via API).
 */
export type CardMarketStats = {
  readonly cardId: string;
  readonly avgPrice: number;
  readonly minPrice: number;
  readonly maxPrice: number;
  readonly salesLast7d: number;
  readonly priceChange: number; // % vs semana anterior
  readonly priceHistory: Array<{ date: string; price: number }>;
};

/**
 * Transação de compra (futuro: enviada ao backend)
 */
export type BuyTransaction = {
  listingId: string;
  buyerId: string;
  price: PriceTag;
  timestamp: string;
};

/**
 * Intent de listagem (futuro: enviado ao backend quando vender)
 */
export type CreateListingIntent = {
  ownedCardId: string;
  type: ListingType;
  price: PriceTag;
  auctionEnds?: string;
  buyNow?: PriceTag;
};

// ─── Estado do cliente ────────────────────────────────────────────────────────

export type MarketplaceState = {
  filters: MarketFilters;
  selectedListing: MarketListing | null;
  watchlist: Set<string>; // listingIds favoritados localmente
  recentlyViewed: string[]; // últimos 20 listingIds vistos
};
