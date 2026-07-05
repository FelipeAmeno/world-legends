/**
 * lib/marketplace/filters.ts — T063
 *
 * Lógica pura (sem side effects) de filtros e ordenação do marketplace.
 *
 * filterListings()   → filtra + ordena (useDeferredValue-safe)
 * buildMarketFacets()→ valores únicos para os pills de filtro
 */

import type { MarketFilters, MarketListing, MarketSortField } from './types';

// ─── Normalização ─────────────────────────────────────────────────────────────

function norm(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: standard NFD diacritic removal
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  );
}

// ─── Filtro principal ─────────────────────────────────────────────────────────

export function filterListings(
  listings: readonly MarketListing[],
  filters: MarketFilters,
): MarketListing[] {
  let result = [...listings];

  // Apenas active (não vendido/expirado)
  result = result.filter((l) => l.status === 'active');

  // Busca textual
  if (filters.search.trim()) {
    const q = norm(filters.search);
    result = result.filter(
      (l) =>
        norm(l.cardName).includes(q) ||
        norm(l.position).includes(q) ||
        norm(l.nationality).includes(q) ||
        norm(l.rarityLabel).includes(q) ||
        norm(l.sellerName).includes(q) ||
        String(l.cardOvr).includes(q) ||
        norm(l.era).includes(q),
    );
  }

  // Raridade
  if (filters.rarities.length > 0) {
    result = result.filter((l) => filters.rarities.includes(l.rarityCode));
  }

  // Posição
  if (filters.positions.length > 0) {
    result = result.filter((l) => filters.positions.includes(l.position));
  }

  // País
  if (filters.countries.length > 0) {
    result = result.filter((l) => filters.countries.includes(l.nationality));
  }

  // Era
  if (filters.eras.length > 0) {
    result = result.filter((l) => filters.eras.includes(l.era));
  }

  // Tipo de listing
  if (filters.types.length > 0) {
    result = result.filter((l) => filters.types.includes(l.type));
  }

  // Preço (mínimo / máximo)
  if (filters.priceMin !== null) {
    result = result.filter((l) => l.price.amount >= filters.priceMin!);
  }
  if (filters.priceMax !== null) {
    result = result.filter((l) => l.price.amount <= filters.priceMax!);
  }

  // OVR
  if (filters.ovrMin !== null) {
    result = result.filter((l) => l.cardOvr >= filters.ovrMin!);
  }
  if (filters.ovrMax !== null) {
    result = result.filter((l) => l.cardOvr <= filters.ovrMax!);
  }

  // Evolução mínima
  if (filters.evolutionMin > 0) {
    result = result.filter((l) => l.evolution >= filters.evolutionMin);
  }

  // Contratos mínimos
  if (filters.contractsMin > 0) {
    result = result.filter((l) => l.contracts >= filters.contractsMin);
  }

  // Flags
  if (filters.onlyNew) result = result.filter((l) => l.isNew);
  if (filters.onlyTrending) result = result.filter((l) => l.isTrending);

  // Ordenação
  result = sortListings(result, filters.sortBy);

  // Highlighted sempre primeiro
  result.sort((a, b) => (b.isHighlighted ? 1 : 0) - (a.isHighlighted ? 1 : 0));

  return result;
}

// ─── Ordenação ────────────────────────────────────────────────────────────────

export const SORT_LABELS: Record<MarketSortField, string> = {
  price_asc: 'Menor Preço',
  price_desc: 'Maior Preço',
  ovr_desc: 'Maior OVR',
  ovr_asc: 'Menor OVR',
  newest: 'Mais Recente',
  ending_soon: 'Termina Antes',
  most_viewed: 'Mais Visto',
  trending: 'Tendência',
};

function sortListings(listings: MarketListing[], sortBy: MarketSortField): MarketListing[] {
  return [...listings].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc':
        return a.price.amount - b.price.amount;
      case 'price_desc':
        return b.price.amount - a.price.amount;
      case 'ovr_desc':
        return b.cardOvr - a.cardOvr;
      case 'ovr_asc':
        return a.cardOvr - b.cardOvr;
      case 'newest':
        return new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime();
      case 'ending_soon':
        return (
          new Date(a.expiresAt ?? a.listedAt).getTime() -
          new Date(b.expiresAt ?? b.listedAt).getTime()
        );
      case 'most_viewed':
        return b.views - a.views;
      case 'trending':
        return (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0) || b.favorited - a.favorited;
      default:
        return 0;
    }
  });
}

// ─── Facets ───────────────────────────────────────────────────────────────────

export type MarketFacets = {
  rarities: Array<{ code: string; label: string; count: number }>;
  positions: Array<{ pos: string; count: number }>;
  countries: Array<{ code: string; flag: string; count: number }>;
  eras: string[];
  priceRange: { min: number; max: number };
  ovrRange: { min: number; max: number };
};

const RARITY_ORDER = ['world_cup_hero', 'ultra', 'legendary', 'elite', 'rare', 'common'] as const;

export function buildMarketFacets(listings: readonly MarketListing[]): MarketFacets {
  const active = listings.filter((l) => l.status === 'active');

  const rarMap = new Map<string, { label: string; count: number }>();
  const posMap = new Map<string, number>();
  const cntMap = new Map<string, { flag: string; count: number }>();
  const eraSet = new Set<string>();
  let pMin = Number.POSITIVE_INFINITY;
  let pMax = 0;
  let oMin = 99;
  let oMax = 0;

  for (const l of active) {
    const r = rarMap.get(l.rarityCode) ?? { label: l.rarityLabel, count: 0 };
    rarMap.set(l.rarityCode, { ...r, count: r.count + 1 });

    posMap.set(l.position, (posMap.get(l.position) ?? 0) + 1);

    const c = cntMap.get(l.nationality) ?? { flag: l.flagEmoji, count: 0 };
    cntMap.set(l.nationality, { ...c, count: c.count + 1 });

    eraSet.add(l.era);

    if (l.price.amount < pMin) pMin = l.price.amount;
    if (l.price.amount > pMax) pMax = l.price.amount;
    if (l.cardOvr < oMin) oMin = l.cardOvr;
    if (l.cardOvr > oMax) oMax = l.cardOvr;
  }

  return {
    rarities: RARITY_ORDER.filter((k) => rarMap.has(k)).map((k) => ({
      code: k,
      label: rarMap.get(k)!.label,
      count: rarMap.get(k)!.count,
    })),
    positions: [...posMap.entries()]
      .map(([pos, count]) => ({ pos, count }))
      .sort((a, b) => b.count - a.count),
    countries: [...cntMap.entries()]
      .map(([code, { flag, count }]) => ({ code, flag, count }))
      .sort((a, b) => b.count - a.count),
    eras: [...eraSet].sort(),
    priceRange: { min: pMin === Number.POSITIVE_INFINITY ? 0 : pMin, max: pMax },
    ovrRange: { min: oMin, max: oMax },
  };
}

// ─── Utilitários de preço ─────────────────────────────────────────────────────

export function formatPrice(amount: number, unit = 'credits'): string {
  if (unit === 'credits') {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M c`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(amount % 1000 === 0 ? 0 : 1)}K c`;
    return `${amount}c`;
  }
  if (unit === 'fragments') return `${amount} 💎`;
  return String(amount);
}

export function priceChangeLabel(pct: number): { label: string; color: string } {
  if (pct > 5) return { label: `+${pct.toFixed(1)}%`, color: 'text-emerald-400' };
  if (pct < -5) return { label: `${pct.toFixed(1)}%`, color: 'text-red-400' };
  return { label: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, color: 'text-white/40' };
}
