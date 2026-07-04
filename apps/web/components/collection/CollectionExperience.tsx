'use client';

/**
 * CollectionExperience — T053
 *
 * Tela de coleção completa:
 *   - Busca instantânea com useDeferredValue (non-blocking)
 *   - Filtros: posição, raridade, era, país, favoritos
 *   - Ordenação bidirecional
 *   - Favoritos (localStorage)
 *   - Comparação entre 2–4 cartas
 *   - Modal de detalhes premium (Framer Motion)
 *   - Grid virtualizado (@tanstack/react-virtual)
 *   - Lazy loading individual de cartas
 */

import type { CollectionCard } from '@/lib/collection-data';
import {
  type CollectionFilters,
  DEFAULT_FILTERS,
  buildFacets,
  filterAndSort,
  loadFavorites,
  saveFavorites,
} from '@/lib/collection-filters';
import { SPRING } from '@/lib/motion-tokens';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useDeferredValue, useEffect, useMemo, useReducer, useState } from 'react';

import { CardDetailModal } from './CardDetailModal';
import { CompareModal } from './CompareModal';
import { FilterBar } from './FilterBar';
import { FilterPanel } from './FilterPanel';
import { VirtualCardGrid } from './VirtualCardGrid';

// ─── Reducer ─────────────────────────────────────────────────────────────────

type State = {
  filters: CollectionFilters;
  panelOpen: boolean;
  selectedCard: CollectionCard | null;
  comparing: CollectionCard[];
  compareOpen: boolean;
  viewMode: 'grid' | 'list';
  favorites: Set<string>;
};

type Action =
  | { type: 'SET_FILTER'; key: keyof CollectionFilters; value: any }
  | { type: 'TOGGLE_FILTER'; key: 'positions' | 'rarities' | 'eras' | 'countries'; value: string }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'SELECT_CARD'; card: CollectionCard | null }
  | { type: 'TOGGLE_COMPARE'; card: CollectionCard }
  | { type: 'OPEN_COMPARE' }
  | { type: 'CLOSE_COMPARE' }
  | { type: 'TOGGLE_FAV'; cardId: string }
  | { type: 'SET_VIEW'; mode: 'grid' | 'list' }
  | { type: 'RESET_FILTERS' }
  | { type: 'INIT_FAVORITES'; favs: Set<string> };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT_FAVORITES':
      return { ...state, favorites: action.favs };

    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, [action.key]: action.value } };

    case 'TOGGLE_FILTER': {
      const prev = state.filters[action.key] as string[];
      const next = prev.includes(action.value)
        ? prev.filter((v) => v !== action.value)
        : [...prev, action.value];
      return { ...state, filters: { ...state.filters, [action.key]: next } };
    }

    case 'TOGGLE_PANEL':
      return { ...state, panelOpen: !state.panelOpen };

    case 'SELECT_CARD':
      return { ...state, selectedCard: action.card };

    case 'TOGGLE_COMPARE': {
      const has = state.comparing.some((c) => c.cardId === action.card.cardId);
      const next = has
        ? state.comparing.filter((c) => c.cardId !== action.card.cardId)
        : state.comparing.length < 4
          ? [...state.comparing, action.card]
          : state.comparing;
      return { ...state, comparing: next };
    }

    case 'OPEN_COMPARE':
      return { ...state, compareOpen: true };

    case 'CLOSE_COMPARE':
      return { ...state, compareOpen: false, comparing: [] };

    case 'TOGGLE_FAV': {
      const favs = new Set(state.favorites);
      if (favs.has(action.cardId)) favs.delete(action.cardId);
      else favs.add(action.cardId);
      saveFavorites(favs);
      return { ...state, favorites: favs };
    }

    case 'SET_VIEW':
      return { ...state, viewMode: action.mode };

    case 'RESET_FILTERS':
      return { ...state, filters: DEFAULT_FILTERS };

    default:
      return state;
  }
}

const INITIAL: State = {
  filters: DEFAULT_FILTERS,
  panelOpen: false,
  selectedCard: null,
  comparing: [],
  compareOpen: false,
  viewMode: 'grid',
  favorites: new Set(),
};

// ─── Collection progress header ───────────────────────────────────────────────

const RARITY_META: Array<{ key: string; label: string; color: string }> = [
  { key: 'world_cup_hero', label: 'WCH',       color: '#e2e8f0' },
  { key: 'ultra',          label: 'Ultra',      color: '#ec4899' },
  { key: 'legendary',      label: 'Lendária',   color: '#c9a84c' },
  { key: 'elite',          label: 'Elite',      color: '#3b82f6' },
  { key: 'rare',           label: 'Rara',       color: '#a855f7' },
  { key: 'common',         label: 'Comum',      color: '#6b7280' },
];

function CollectionProgressHeader({ allCards, filteredCount }: { allCards: CollectionCard[]; filteredCount: number }) {
  const total = allCards.length;
  const byRarity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of allCards) map[c.rarityCode] = (map[c.rarityCode] ?? 0) + 1;
    return map;
  }, [allCards]);

  return (
    <motion.div
      className="px-4 pt-4 pb-3 border-b shrink-0"
      style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
    >
      {/* Page title + count */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1" style={{ color: '#6a7090' }}>
            World Legends
          </p>
          <h1 className="font-display text-4xl gold-text tracking-wider leading-none">COLEÇÃO</h1>
        </div>
        <div className="text-right">
          <motion.p
            className="font-display text-3xl gold-text leading-none"
            key={total}
            initial={{ scale: 1.15, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING.snappy}
          >
            {filteredCount < total ? filteredCount : total}
          </motion.p>
          <p className="text-muted text-[9px]">{filteredCount < total ? `de ${total} cartas` : 'cartas'}</p>
        </div>
      </div>

      {/* Rarity breakdown pills */}
      <div className="flex flex-wrap gap-1.5">
        {RARITY_META.map(({ key, label, color }) => {
          const count = byRarity[key] ?? 0;
          if (count === 0) return null;
          return (
            <motion.div
              key={key}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                background: `${color}12`,
                border: `1px solid ${color}30`,
              }}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRING.snappy}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[9px] font-bold" style={{ color }}>
                {count}
              </span>
              <span className="text-[8px]" style={{ color: `${color}80` }}>
                {label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  allCards: CollectionCard[];
};

export function CollectionExperience({ allCards }: Props) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const deferredSearch = useDeferredValue(state.filters.search);

  // Carregar favoritos do localStorage
  useEffect(() => {
    dispatch({ type: 'INIT_FAVORITES', favs: loadFavorites() });
  }, []);

  // Facets (valores únicos para os filtros)
  const facets = useMemo(() => buildFacets(allCards), [allCards]);

  // Filtros aplicados — usa search deferido para não bloquear UI
  const filteredCards = useMemo(() => {
    const filters = { ...state.filters, search: deferredSearch };
    return filterAndSort(allCards, filters, state.favorites);
  }, [allCards, state.filters, deferredSearch, state.favorites]);

  const hasActiveFilters =
    state.filters.search.trim() !== '' ||
    state.filters.positions.length > 0 ||
    state.filters.rarities.length > 0 ||
    state.filters.eras.length > 0 ||
    state.filters.countries.length > 0 ||
    state.filters.favorites ||
    state.filters.overallMin > 0 ||
    state.filters.overallMax < 99;

  // Ações callbacks
  const handleSearch = useCallback(
    (v: string) => dispatch({ type: 'SET_FILTER', key: 'search', value: v }),
    [],
  );

  const handleSort = useCallback(
    (field: any, dir: any) => dispatch({ type: 'SET_FILTER', key: 'sortField', value: field }),
    [],
  );

  const handleToggle = useCallback(
    (key: any, val: string) => dispatch({ type: 'TOGGLE_FILTER', key, value: val }),
    [],
  );

  const handleFav = useCallback((cardId: string) => dispatch({ type: 'TOGGLE_FAV', cardId }), []);

  const handleCompare = useCallback(
    (card: CollectionCard) => dispatch({ type: 'TOGGLE_COMPARE', card }),
    [],
  );

  const handleSelect = useCallback(
    (card: CollectionCard | null) => dispatch({ type: 'SELECT_CARD', card }),
    [],
  );

  const handleReset = useCallback(() => dispatch({ type: 'RESET_FILTERS' }), []);

  const handleSetOverall = useCallback(
    (min: number, max: number) => {
      dispatch({ type: 'SET_FILTER', key: 'overallMin', value: min });
      dispatch({ type: 'SET_FILTER', key: 'overallMax', value: max });
    },
    [],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Progress header */}
      <CollectionProgressHeader allCards={allCards} filteredCount={filteredCards.length} />

      {/* Barra de filtros superior (sempre visível) */}
      <FilterBar
        search={state.filters.search}
        onSearch={handleSearch}
        sortField={state.filters.sortField}
        sortDir={state.filters.sortDir}
        onSortField={(f) => dispatch({ type: 'SET_FILTER', key: 'sortField', value: f })}
        onSortDir={(d) => dispatch({ type: 'SET_FILTER', key: 'sortDir', value: d })}
        viewMode={state.viewMode}
        onViewMode={(m) => dispatch({ type: 'SET_VIEW', mode: m })}
        panelOpen={state.panelOpen}
        onTogglePanel={() => dispatch({ type: 'TOGGLE_PANEL' })}
        hasFilters={hasActiveFilters}
        totalCards={allCards.length}
        filteredCount={filteredCards.length}
        comparingCount={state.comparing.length}
        onOpenCompare={() => dispatch({ type: 'OPEN_COMPARE' })}
        onReset={handleReset}
      />

      {/* Painel de filtros avançados (colapsável) */}
      <AnimatePresence>
        {state.panelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <FilterPanel
              filters={state.filters}
              facets={facets}
              favorites={state.favorites}
              onToggle={handleToggle}
              onToggleFav={() =>
                dispatch({ type: 'SET_FILTER', key: 'favorites', value: !state.filters.favorites })
              }
              onSetOverall={handleSetOverall}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid virtualizado */}
      <div className="flex-1 min-h-0">
        <VirtualCardGrid
          cards={filteredCards}
          viewMode={state.viewMode}
          favorites={state.favorites}
          comparing={state.comparing}
          onSelect={handleSelect}
          onFav={handleFav}
          onCompare={handleCompare}
        />
      </div>

      {/* Modal de detalhes */}
      <AnimatePresence>
        {state.selectedCard && (
          <CardDetailModal
            card={state.selectedCard}
            isFav={state.favorites.has(state.selectedCard.cardId)}
            isComparing={state.comparing.some((c) => c.cardId === state.selectedCard?.cardId)}
            onClose={() => handleSelect(null)}
            onFav={handleFav}
            onCompare={handleCompare}
          />
        )}
      </AnimatePresence>

      {/* Modal de comparação */}
      <AnimatePresence>
        {state.compareOpen && state.comparing.length >= 2 && (
          <CompareModal
            cards={state.comparing}
            onClose={() => dispatch({ type: 'CLOSE_COMPARE' })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
