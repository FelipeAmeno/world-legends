'use client';

import type { SortDir, SortField } from '@/lib/collection-filters';
import { useRef } from 'react';

type Props = {
  search: string;
  onSearch: (v: string) => void;
  sortField: SortField;
  sortDir: SortDir;
  onSortField: (f: SortField) => void;
  onSortDir: (d: SortDir) => void;
  viewMode: 'grid' | 'list';
  onViewMode: (m: 'grid' | 'list') => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  hasFilters: boolean;
  totalCards: number;
  filteredCount: number;
  comparingCount: number;
  onOpenCompare: () => void;
  onReset: () => void;
};

const SORT_OPTIONS: Array<{ value: SortField; label: string }> = [
  { value: 'overall', label: 'OVR' },
  { value: 'rarity', label: 'Raridade' },
  { value: 'name', label: 'Nome' },
  { value: 'recente', label: 'Recente' },
  { value: 'era', label: 'Era' },
  { value: 'position', label: 'Posição' },
];

export function FilterBar({
  search,
  onSearch,
  sortField,
  sortDir,
  onSortField,
  onSortDir,
  viewMode,
  onViewMode,
  panelOpen,
  onTogglePanel,
  hasFilters,
  totalCards,
  filteredCount,
  comparingCount,
  onOpenCompare,
  onReset,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-midnight/80 backdrop-blur-sm border-b border-border px-4 py-3 space-y-2.5 sticky top-0 z-20">
      {/* Linha 1: busca + ações */}
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
          <input
            ref={inputRef}
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Nome, país, posição, era…"
            autoComplete="off"
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2 text-sm
                       text-parchment placeholder:text-muted/50
                       focus:outline-none focus:border-gold-dim transition-colors"
          />
          {search && (
            <button
              onClick={() => {
                onSearch('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-parchment text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filtros avançados */}
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
          <span className="hidden sm:inline">Filtros</span>
          {hasFilters && (
            <span className="w-4 h-4 rounded-full bg-gold text-obsidian text-[8px] font-black flex items-center justify-center">
              !
            </span>
          )}
        </button>

        {/* View toggle */}
        <div className="flex gap-0.5 bg-surface border border-border rounded-xl p-0.5">
          {(['grid', 'list'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onViewMode(m)}
              className={[
                'px-2 py-1.5 rounded-lg text-sm transition-all',
                viewMode === m ? 'bg-border text-parchment' : 'text-muted hover:text-parchment',
              ].join(' ')}
            >
              {m === 'grid' ? '⊞' : '≡'}
            </button>
          ))}
        </div>
      </div>

      {/* Linha 2: sort + contador + compare */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Ordenar */}
        <div className="flex items-center gap-1">
          <select
            value={sortField}
            onChange={(e) => onSortField(e.target.value as SortField)}
            className="bg-surface border border-border rounded-lg px-2 py-1 text-xs text-parchment
                       focus:outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => onSortDir(sortDir === 'desc' ? 'asc' : 'desc')}
            className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center
                       text-muted hover:text-parchment transition-colors text-xs"
          >
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        {/* Contador */}
        <p className="text-muted text-[10px]">
          {filteredCount === totalCards ? (
            <>
              <span className="text-parchment font-bold">{totalCards}</span> cartas
            </>
          ) : (
            <>
              <span className="text-gold font-bold">{filteredCount}</span>
              <span className="text-muted">/{totalCards}</span>
            </>
          )}
        </p>

        {/* Comparar */}
        {comparingCount > 0 && (
          <button
            onClick={onOpenCompare}
            disabled={comparingCount < 2}
            className={[
              'ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all',
              comparingCount >= 2
                ? 'bg-steel/20 border border-steel/40 text-blue-300 hover:bg-steel/30'
                : 'text-muted opacity-60 cursor-not-allowed',
            ].join(' ')}
          >
            <span>⚖</span>
            <span>Comparar ({comparingCount})</span>
          </button>
        )}

        {/* Reset filtros */}
        {hasFilters && (
          <button
            onClick={onReset}
            className="ml-auto text-muted text-[10px] hover:text-red-400 transition-colors"
          >
            Limpar filtros ×
          </button>
        )}
      </div>
    </div>
  );
}
