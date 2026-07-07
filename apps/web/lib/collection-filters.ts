/**
 * lib/collection-filters.ts
 *
 * Lógica pura (sem side effects) de filtragem e ordenação da coleção.
 * Usada pelo CollectionExperience client component.
 *
 * Todas as funções são estáveis — não dependem de estado externo.
 * Podem ser usadas em Web Workers no futuro para coleções grandes.
 */

import type { CollectionCard } from './collection-data';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SortField = 'overall' | 'name' | 'rarity' | 'era' | 'position' | 'recente';
export type SortDir = 'asc' | 'desc';

export type CollectionFilters = {
  search: string; // nome (debounced)
  positions: string[]; // multi
  rarities: string[]; // multi
  eras: string[]; // multi
  countries: string[]; // multi (nationality code)
  favorites: boolean; // só favoritas
  overallMin: number; // overall mínimo (0–99)
  overallMax: number; // overall máximo (0–99)
  sortField: SortField;
  sortDir: SortDir;
};

export const DEFAULT_FILTERS: CollectionFilters = {
  search: '',
  positions: [],
  rarities: [],
  eras: [],
  countries: [],
  favorites: false,
  overallMin: 0,
  overallMax: 99,
  sortField: 'overall',
  sortDir: 'desc',
};

// ─── Rarity order ─────────────────────────────────────────────────────────────

export const RARITY_ORDER: Record<string, number> = {
  world_cup_hero: 6,
  ultra: 5,
  legendary: 4,
  elite: 3,
  rare: 2,
  common: 1,
};

export const ERA_ORDER: Record<string, number> = {
  '1950s': 1,
  '1960s': 2,
  '1970s': 3,
  '1980s': 4,
  '1990s': 5,
  '2000s': 6,
  '2010s': 7,
  '2020s': 8,
};

// ─── Filter functions ─────────────────────────────────────────────────────────

/** Normaliza string para busca (ignora acentos, case, espaços extras) */
function normalize(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: standard NFD diacritic removal
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  );
}

function matchesSearch(card: CollectionCard, query: string): boolean {
  if (!query.trim()) return true;
  const q = normalize(query);
  const name = normalize(card.displayName);
  const nat = normalize(card.nationality);
  const pos = normalize(card.position);
  const rarity = normalize(card.rarityLabel);
  const ovr = String(card.overall);
  return (
    name.includes(q) ||
    nat.includes(q) ||
    pos.includes(q) ||
    rarity.includes(q) ||
    ovr.includes(q) ||
    card.era.includes(q)
  );
}

// ─── Main filter function ─────────────────────────────────────────────────────

export function filterAndSort(
  cards: readonly CollectionCard[],
  filters: CollectionFilters,
  favorites: ReadonlySet<string>,
): CollectionCard[] {
  let result = [...cards];

  // Search
  if (filters.search.trim()) {
    result = result.filter((c) => matchesSearch(c, filters.search));
  }

  // Position
  if (filters.positions.length > 0) {
    result = result.filter((c) => filters.positions.includes(c.position));
  }

  // Rarity
  if (filters.rarities.length > 0) {
    result = result.filter((c) => filters.rarities.includes(c.rarityCode));
  }

  // Era
  if (filters.eras.length > 0) {
    result = result.filter((c) => filters.eras.includes(c.era));
  }

  // Country
  if (filters.countries.length > 0) {
    result = result.filter((c) => filters.countries.includes(c.nationality));
  }

  // Favorites only
  if (filters.favorites) {
    result = result.filter((c) => favorites.has(c.cardId));
  }

  // Overall range
  if (filters.overallMin > 0) {
    result = result.filter((c) => c.overall >= filters.overallMin);
  }
  if (filters.overallMax < 99) {
    result = result.filter((c) => c.overall <= filters.overallMax);
  }

  // Sort
  result.sort((a, b) => {
    let cmp = 0;
    switch (filters.sortField) {
      case 'overall':
        cmp = a.overall - b.overall;
        break;
      case 'recente':
        cmp = 0;
        break;
      case 'name':
        cmp = a.displayName.localeCompare(b.displayName);
        break;
      case 'rarity':
        cmp = (RARITY_ORDER[a.rarityCode] ?? 0) - (RARITY_ORDER[b.rarityCode] ?? 0);
        break;
      case 'era':
        cmp = (ERA_ORDER[a.era] ?? 0) - (ERA_ORDER[b.era] ?? 0);
        break;
      case 'position':
        cmp = a.position.localeCompare(b.position);
        break;
    }
    return filters.sortDir === 'desc' ? -cmp : cmp;
  });

  return result;
}

// ─── Facets (valores únicos para os filtros) ──────────────────────────────────

export type CollectionFacets = {
  positions: string[];
  rarities: Array<{ code: string; label: string; count: number }>;
  eras: string[];
  countries: Array<{ code: string; flag: string; count: number }>;
};

export function buildFacets(cards: readonly CollectionCard[]): CollectionFacets {
  const posSet = new Set<string>();
  const eraSet = new Set<string>();
  const rarityMap = new Map<string, { label: string; count: number }>();
  const countryMap = new Map<string, { flag: string; count: number }>();

  for (const card of cards) {
    posSet.add(card.position);
    eraSet.add(card.era);

    const rar = rarityMap.get(card.rarityCode) ?? { label: card.rarityLabel, count: 0 };
    rarityMap.set(card.rarityCode, { ...rar, count: rar.count + 1 });

    const cnt = countryMap.get(card.nationality) ?? { flag: card.flagEmoji, count: 0 };
    countryMap.set(card.nationality, { ...cnt, count: cnt.count + 1 });
  }

  const POS_ORDER = [
    'GK',
    'RWB',
    'RB',
    'CB',
    'LB',
    'LWB',
    'CDM',
    'CM',
    'CAM',
    'RM',
    'LM',
    'RW',
    'LW',
    'CF',
    'ST',
  ];

  return {
    positions: [...posSet].sort((a, b) => POS_ORDER.indexOf(a) - POS_ORDER.indexOf(b)),
    rarities: Object.keys(RARITY_ORDER)
      .reverse()
      .filter((k) => rarityMap.has(k))
      .map((k) => ({ code: k, label: rarityMap.get(k)!.label, count: rarityMap.get(k)!.count })),
    eras: [...eraSet].sort((a, b) => (ERA_ORDER[a] ?? 0) - (ERA_ORDER[b] ?? 0)),
    countries: [...countryMap.entries()]
      .map(([code, { flag, count }]) => ({ code, flag, count }))
      .sort((a, b) => b.count - a.count),
  };
}

// ─── Comparação de cartas (differentials) ────────────────────────────────────

export type CardDiff = {
  field: string;
  values: Array<{ cardId: string; value: number | string; best: boolean }>;
};

export function compareCards(cards: CollectionCard[]): CardDiff[] {
  if (cards.length < 2) return [];

  const numField = (label: string, getter: (c: CollectionCard) => number | undefined): CardDiff => {
    const vals = cards.map((c) => getter(c) ?? 0);
    const maxVal = Math.max(...vals);
    return {
      field: label,
      values: cards.map((c) => ({
        cardId: c.cardId,
        value: getter(c) ?? 0,
        best: (getter(c) ?? 0) === maxVal,
      })),
    };
  };

  return [
    numField('OVR Geral', (c) => c.overall),
    numField('Ritmo', (c) => c.attributes.pace),
    numField('Finalização', (c) => c.attributes.finishing),
    numField('Passe', (c) => c.attributes.passing),
    numField('Drible', (c) => c.attributes.dribbling),
    numField('Defesa', (c) => c.attributes.defending),
    numField('Físico', (c) => c.attributes.physical),
    numField('Contratos', (c) => c.contracts ?? 10),
    numField('Evolução', (c) => c.evolution ?? 0),
  ];
}

// ─── Favorites hook helper ────────────────────────────────────────────────────

const FAV_KEY = 'wl-favorites-v1';

export function loadFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveFavorites(favs: ReadonlySet<string>): void {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
  } catch {}
}
