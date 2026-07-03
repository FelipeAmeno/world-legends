'use client';

import { SORT_LABELS } from '@/lib/marketplace/filters';
import type { MarketFilters, MarketSortField } from '@/lib/marketplace/types';
import { useRef } from 'react';

// ─── MarketFilterBar ──────────────────────────────────────────────────────────

type BarProps = {
  filters: MarketFilters;
  totalListings: number;
  filteredCount: number;
  hasFilters: boolean;
  panelOpen: boolean;
  onSearch: (v: string) => void;
  onSort: (by: MarketSortField) => void;
  onTogglePanel: () => void;
  onReset: () => void;
};

export function MarketFilterBar({
  filters,
  totalListings,
  filteredCount,
  hasFilters,
  panelOpen,
  onSearch,
  onSort,
  onTogglePanel,
  onReset,
}: BarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-midnight/80 backdrop-blur-sm border-b border-border px-4 py-3 space-y-2 shrink-0 sticky top-0 z-20">
      {/* Linha 1: busca + filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
          <input
            ref={inputRef}
            type="search"
            value={filters.search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Nome, país, posição, OVR…"
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm
                       text-parchment placeholder:text-muted/40
                       focus:outline-none focus:border-gold-dim transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => {
                onSearch('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={onTogglePanel}
          className={[
            'flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
            panelOpen || hasFilters
              ? 'bg-gold/10 border-gold-dim text-gold'
              : 'bg-surface border-border text-muted hover:text-parchment',
          ].join(' ')}
        >
          <span>⚙</span>
          {hasFilters && (
            <span className="w-4 h-4 rounded-full bg-gold text-obsidian text-[8px] font-black flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      {/* Linha 2: sort + contador */}
      <div className="flex items-center gap-2">
        <select
          value={filters.sortBy}
          onChange={(e) => onSort(e.target.value as MarketSortField)}
          className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-parchment focus:outline-none cursor-pointer"
        >
          {(Object.keys(SORT_LABELS) as MarketSortField[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </select>
        <p className="text-muted text-[10px]">
          {filteredCount === totalListings ? (
            <>
              <span className="text-parchment font-bold">{totalListings}</span> listagens
            </>
          ) : (
            <>
              <span className="text-gold font-bold">{filteredCount}</span>
              <span className="text-muted">/{totalListings}</span>
            </>
          )}
        </p>
        {hasFilters && (
          <button
            onClick={onReset}
            className="ml-auto text-[10px] text-muted hover:text-red-400 transition-colors"
          >
            Limpar ×
          </button>
        )}
      </div>
    </div>
  );
}
