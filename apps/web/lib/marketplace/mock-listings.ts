/**
 * lib/marketplace/mock-listings.ts — T063
 *
 * Listings simulados para demonstrar a UI do marketplace.
 *
 * Quando o backend for conectado:
 *   1. Substituir getListings() por fetch('/api/market/listings')
 *   2. Os tipos já são compatíveis (MarketListing)
 *   3. A UI não precisa de mudança
 */

import type { MarketListing, PriceTag } from './types';
import { getCollection }                from '@/lib/collection-data';
import { RARITY_VISUAL }                from '@/lib/collection-data';

// ─── Helper: criar PriceTag ────────────────────────────────────────────────────

function credits(amount: number): PriceTag {
  return { amount, unit:'credits', label:`${amount.toLocaleString('pt-BR')}c` };
}
function fragments(amount: number): PriceTag {
  return { amount, unit:'fragments', label:`${amount} gemas` };
}

// ─── Nomes de vendedores mock ─────────────────────────────────────────────────

const SELLERS = [
  { id:'s1', name:'CarlosFC',      level:24 },
  { id:'s2', name:'PedroLendas',   level:18 },
  { id:'s3', name:'AnaBola2024',   level:31 },
  { id:'s4', name:'MarcusGOAT',    level:12 },
  { id:'s5', name:'LuizTrader',    level:45 },
  { id:'s6', name:'FelipeWL',      level:9  },
  { id:'s7', name:'JessicaColeta', level:27 },
  { id:'s8', name:'RodrigoUltra',  level:33 },
];

// ─── Gerar listings a partir das cartas da coleção ────────────────────────────

export function getListings(): MarketListing[] {
  const cards  = getCollection();
  const now    = new Date();
  const result: MarketListing[] = [];

  cards.forEach((card, idx) => {
    const seller     = SELLERS[idx % SELLERS.length]!;
    const listedAt   = new Date(now.getTime() - (idx * 3_600_000)).toISOString();
    const expiresAt  = new Date(now.getTime() + ((7 - idx % 7) * 86_400_000)).toISOString();

    // Preço base por raridade
    const BASE_PRICE: Record<string, number> = {
      common:        200,
      rare:          800,
      elite:        2000,
      legendary:    6000,
      ultra:       15000,
      world_cup_hero:35000,
    };
    const base = BASE_PRICE[card.rarityCode] ?? 500;
    // Ajustar pelo OVR
    const price = Math.round(base * (0.8 + (card.overall - 75) / 50));

    // Tipo de listing (varia por índice)
    const listingType = idx % 5 === 0 ? 'auction' as const : 'sell' as const;

    const isNew       = idx < 6;
    const isTrending  = idx % 4 === 0 && card.rarityCode !== 'common';
    const isHighlight = idx % 7 === 0;

    const listing: MarketListing = {
      id:           `listing-${idx + 1}`,
      type:         listingType,
      status:       'active',

      cardId:       card.cardId,
      ownedCardId:  `owned-${idx + 1}`,
      cardName:     card.displayName,
      cardOvr:      card.overall,
      rarityCode:   card.rarityCode,
      rarityLabel:  card.rarityLabel,
      position:     card.position,
      nationality:  card.nationality,
      flagEmoji:    card.flagEmoji,
      era:          card.era,
      evolution:    card.evolution,
      contracts:    card.contracts,

      sellerId:     seller.id,
      sellerName:   seller.name,
      sellerLevel:  seller.level,

      price:        credits(price),
      originalPrice: idx % 3 === 0 ? credits(Math.round(price * 1.15)) : undefined,

      ...(listingType === 'auction' ? {
        auction: {
          currentBid: credits(Math.round(price * 0.7)),
          minimumBid: credits(Math.round(price * 0.05)),
          buyNow:     credits(price),
          bids:       Math.floor(idx * 1.7) % 20 + 1,
          endsAt:     expiresAt,
          timeLeft:   `${(7 - idx % 7)}d ${(idx * 3) % 24}h`,
        },
      } : {}),

      listedAt,
      expiresAt,
      views:        Math.floor(idx * 7.3) % 250 + 10,
      favorited:    Math.floor(idx * 2.1) % 40,

      isHighlighted: isHighlight,
      isTrending:    isTrending,
      isNew,
    };

    result.push(listing);
  });

  return result;
}

// ─── Estatísticas de mercado por carta ────────────────────────────────────────

export function getCardMarketStats(cardId: string) {
  const BASE_PRICE: Record<string, number> = {
    common:200, rare:800, elite:2000, legendary:6000, ultra:15000, world_cup_hero:35000,
  };

  const card  = getCollection().find(c => c.cardId === cardId);
  if (!card) return null;

  const base  = BASE_PRICE[card.rarityCode] ?? 500;
  const price = Math.round(base * (0.8 + (card.overall - 75) / 50));

  // Histórico simulado (7 dias)
  const history = Array.from({ length:7 }, (_, i) => ({
    date:  new Date(Date.now() - (6 - i) * 86_400_000).toISOString().slice(0,10),
    price: Math.round(price * (0.9 + Math.sin(i * 0.8) * 0.12)),
  }));

  const prices     = history.map(h => h.price);
  const priceChange = ((prices[6]! - prices[0]!) / prices[0]!) * 100;

  return {
    cardId,
    avgPrice:    Math.round(prices.reduce((s,v)=>s+v,0) / prices.length),
    minPrice:    Math.min(...prices),
    maxPrice:    Math.max(...prices),
    salesLast7d: Math.floor(price / 300) + 2,
    priceChange: Math.round(priceChange * 10) / 10,
    priceHistory:history,
  };
}
