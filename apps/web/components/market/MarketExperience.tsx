'use client';

/**
 * MarketExperience — T063
 *
 * Marketplace do World Legends (estrutura — sem compra ainda).
 *
 * Funcional:
 *   ✅ Listar cartas à venda
 *   ✅ Busca instantânea (useDeferredValue)
 *   ✅ Filtros: raridade, posição, país, era, tipo, preço, OVR
 *   ✅ Ordenação bidirecional (8 modos)
 *   ✅ Modal de detalhes com histórico de preços
 *   ✅ Watchlist local (favoritos de listings)
 *   ✅ Seção de trending
 *
 * Preparado para:
 *   🔒 Compra/venda (botões "Em breve")
 *   🔒 Leilão (UI pronta, timer ativo, sem bid)
 *   🔒 Oferta (estrutura no tipo CreateListingIntent)
 *   🔒 Histórico de transações
 *   🔒 Leaderboard de traders
 */

import { getCollectionMap } from '@/lib/collection-data';
import { SORT_LABELS, buildMarketFacets, filterListings } from '@/lib/marketplace/filters';
import {
  DEFAULT_MARKET_FILTERS,
  type MarketFilters,
  type MarketListing,
  type MarketSortField,
} from '@/lib/marketplace/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useDeferredValue, useEffect, useMemo, useReducer, useState } from 'react';
import { ListingDetailModal } from './ListingDetailModal';
import { ListingGrid } from './ListingGrid';
import { MarketFilterBar } from './MarketFilterBar';
import { MarketFilterPanel } from './MarketFilterPanel';

// ─── Reducer ──────────────────────────────────────────────────────────────────

type State = {
  filters: MarketFilters;
  panelOpen: boolean;
  selected: MarketListing | null;
  watchlist: Set<string>;
};

type Action =
  | { type: 'SET_SEARCH'; value: string }
  | { type: 'TOGGLE_RARITY'; code: string }
  | { type: 'TOGGLE_POS'; pos: string }
  | { type: 'TOGGLE_COUNTRY'; code: string }
  | { type: 'TOGGLE_ERA'; era: string }
  | { type: 'TOGGLE_TYPE'; t: string }
  | { type: 'SET_SORT'; by: MarketSortField }
  | { type: 'SET_PRICE_MIN'; v: number | null }
  | { type: 'SET_PRICE_MAX'; v: number | null }
  | { type: 'SET_OVR_MIN'; v: number | null }
  | { type: 'SET_OVR_MAX'; v: number | null }
  | { type: 'TOGGLE_NEW' }
  | { type: 'TOGGLE_TRENDING' }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'SELECT'; listing: MarketListing | null }
  | { type: 'TOGGLE_WATCH'; id: string }
  | { type: 'RESET' };

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, filters: { ...state.filters, search: action.value } };
    case 'TOGGLE_RARITY':
      return {
        ...state,
        filters: { ...state.filters, rarities: toggle(state.filters.rarities, action.code as any) },
      };
    case 'TOGGLE_POS':
      return {
        ...state,
        filters: { ...state.filters, positions: toggle(state.filters.positions, action.pos) },
      };
    case 'TOGGLE_COUNTRY':
      return {
        ...state,
        filters: { ...state.filters, countries: toggle(state.filters.countries, action.code) },
      };
    case 'TOGGLE_ERA':
      return {
        ...state,
        filters: { ...state.filters, eras: toggle(state.filters.eras, action.era) },
      };
    case 'TOGGLE_TYPE':
      return {
        ...state,
        filters: { ...state.filters, types: toggle(state.filters.types, action.t as any) },
      };
    case 'SET_SORT':
      return { ...state, filters: { ...state.filters, sortBy: action.by } };
    case 'SET_PRICE_MIN':
      return { ...state, filters: { ...state.filters, priceMin: action.v } };
    case 'SET_PRICE_MAX':
      return { ...state, filters: { ...state.filters, priceMax: action.v } };
    case 'SET_OVR_MIN':
      return { ...state, filters: { ...state.filters, ovrMin: action.v } };
    case 'SET_OVR_MAX':
      return { ...state, filters: { ...state.filters, ovrMax: action.v } };
    case 'TOGGLE_NEW':
      return { ...state, filters: { ...state.filters, onlyNew: !state.filters.onlyNew } };
    case 'TOGGLE_TRENDING':
      return { ...state, filters: { ...state.filters, onlyTrending: !state.filters.onlyTrending } };
    case 'TOGGLE_PANEL':
      return { ...state, panelOpen: !state.panelOpen };
    case 'SELECT':
      return { ...state, selected: action.listing };
    case 'TOGGLE_WATCH': {
      const w = new Set(state.watchlist);
      w.has(action.id) ? w.delete(action.id) : w.add(action.id);
      return { ...state, watchlist: w };
    }
    case 'RESET':
      return { ...state, filters: DEFAULT_MARKET_FILTERS, panelOpen: false };
    default:
      return state;
  }
}

const INITIAL: State = {
  filters: DEFAULT_MARKET_FILTERS,
  panelOpen: false,
  selected: null,
  watchlist: new Set(),
};

// ─── Component ────────────────────────────────────────────────────────────────

type Props = { listings: MarketListing[] };

export function MarketExperience({ listings }: Props) {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const deferredSearch = useDeferredValue(state.filters.search);

  // Sprint 40 — lookup indexado O(1) por cardId, construído uma vez.
  // MarketListing é um DTO achatado (T063) sem artworkPresetId/nickname/
  // stats — em vez de duplicar esses dados no tipo, resolvemos a
  // CollectionCard completa (mesma fonte de Collection/Squad) por cardId.
  const cardsById = useMemo(() => getCollectionMap(), []);

  const facets = useMemo(() => buildMarketFacets(listings), [listings]);

  const filtered = useMemo(() => {
    const filters = { ...state.filters, search: deferredSearch };
    return filterListings(listings, filters);
  }, [listings, state.filters, deferredSearch]);

  const trending = useMemo(
    () => listings.filter((l) => l.isTrending && l.status === 'active').slice(0, 6),
    [listings],
  );

  const hasFilters =
    state.filters.search !== '' ||
    state.filters.rarities.length > 0 ||
    state.filters.positions.length > 0 ||
    state.filters.countries.length > 0 ||
    state.filters.onlyNew ||
    state.filters.onlyTrending ||
    state.filters.priceMin !== null ||
    state.filters.priceMax !== null;

  return (
    <div className="flex flex-col h-full">
      {/* Coming soon banner */}
      <div className="glass border-b border-amber-800/30 bg-amber-900/10 px-4 py-2 text-center shrink-0">
        <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">
          🔒 Marketplace em desenvolvimento · Compra/venda disponível em breve
        </p>
      </div>

      {/* Filter bar */}
      <MarketFilterBar
        filters={state.filters}
        totalListings={listings.length}
        filteredCount={filtered.length}
        hasFilters={hasFilters}
        panelOpen={state.panelOpen}
        onSearch={(v) => dispatch({ type: 'SET_SEARCH', value: v })}
        onSort={(by) => dispatch({ type: 'SET_SORT', by })}
        onTogglePanel={() => dispatch({ type: 'TOGGLE_PANEL' })}
        onReset={() => dispatch({ type: 'RESET' })}
      />

      {/* Filter panel */}
      <AnimatePresence>
        {state.panelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden shrink-0"
          >
            <MarketFilterPanel
              filters={state.filters}
              facets={facets}
              onToggleRarity={(code) => dispatch({ type: 'TOGGLE_RARITY', code })}
              onTogglePos={(pos) => dispatch({ type: 'TOGGLE_POS', pos })}
              onToggleCountry={(code) => dispatch({ type: 'TOGGLE_COUNTRY', code })}
              onToggleEra={(era) => dispatch({ type: 'TOGGLE_ERA', era })}
              onToggleType={(t) => dispatch({ type: 'TOGGLE_TYPE', t })}
              onToggleNew={() => dispatch({ type: 'TOGGLE_NEW' })}
              onToggleTrending={() => dispatch({ type: 'TOGGLE_TRENDING' })}
              onPriceMin={(v) => dispatch({ type: 'SET_PRICE_MIN', v })}
              onPriceMax={(v) => dispatch({ type: 'SET_PRICE_MAX', v })}
              onOvrMin={(v) => dispatch({ type: 'SET_OVR_MIN', v })}
              onOvrMax={(v) => dispatch({ type: 'SET_OVR_MAX', v })}
              onReset={() => dispatch({ type: 'RESET' })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trending (quando sem filtros ativos) */}
      {!hasFilters && trending.length > 0 && (
        <div className="shrink-0 px-4 pt-3 pb-2">
          <p className="text-[9px] text-muted uppercase tracking-widest mb-2">🔥 Tendência</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-x-hide">
            {trending.map((l) => (
              <TrendingChip
                key={l.id}
                listing={l}
                onClick={() => dispatch({ type: 'SELECT', listing: l })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Listing grid */}
      <div className="flex-1 min-h-0">
        <ListingGrid
          listings={filtered}
          cardsById={cardsById}
          watchlist={state.watchlist}
          onSelect={(l) => dispatch({ type: 'SELECT', listing: l })}
          onWatch={(id) => dispatch({ type: 'TOGGLE_WATCH', id })}
        />
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {state.selected && (
          <ListingDetailModal
            listing={state.selected}
            card={cardsById.get(state.selected.cardId)}
            inWatchlist={state.watchlist.has(state.selected.id)}
            onClose={() => dispatch({ type: 'SELECT', listing: null })}
            onWatch={() => dispatch({ type: 'TOGGLE_WATCH', id: state.selected!.id })}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TrendingChip ─────────────────────────────────────────────────────────────

function TrendingChip({ listing, onClick }: { listing: MarketListing; onClick: () => void }) {
  const RARITY_COLOR: Record<string, string> = {
    common: '#6b7280',
    rare: '#a855f7',
    elite: '#3b82f6',
    legendary: '#c9a84c',
    ultra: '#ec4899',
    world_cup_hero: '#e2e8f0',
  };
  const color = RARITY_COLOR[listing.rarityCode] ?? '#c9a84c';

  return (
    <button
      onClick={onClick}
      className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border hover:border-white/20 transition-all"
      style={{ borderColor: `${color}40`, background: `${color}10` }}
    >
      <span className="font-display text-base leading-none" style={{ color }}>
        {listing.cardOvr}
      </span>
      <div className="text-left">
        <p className="text-parchment text-[9px] font-bold">{listing.cardName.split(' ').pop()}</p>
        <p className="text-[8px]" style={{ color: `${color}cc` }}>
          {listing.price.label}
        </p>
      </div>
    </button>
  );
}
