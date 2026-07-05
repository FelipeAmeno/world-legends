import type { CollectionFacets, CollectionFilters } from '@/lib/collection-filters';
import { useId } from 'react';

const RARITY_COLORS: Record<string, string> = {
  world_cup_hero: 'border-slate-300  text-slate-200  bg-slate-900/30',
  ultra: 'border-pink-500   text-pink-400   bg-pink-900/20',
  legendary: 'border-amber-500  text-amber-400  bg-amber-900/20',
  elite: 'border-blue-500   text-blue-400   bg-blue-900/20',
  rare: 'border-purple-500 text-purple-400 bg-purple-900/20',
  common: 'border-gray-500   text-gray-400   bg-gray-900/20',
};

type Props = {
  filters: CollectionFilters;
  facets: CollectionFacets;
  favorites: ReadonlySet<string>;
  onToggle: (key: 'positions' | 'rarities' | 'eras' | 'countries', value: string) => void;
  onToggleFav: () => void;
  onSetOverall: (min: number, max: number) => void;
  onReset: () => void;
};

export function FilterPanel({
  filters,
  facets,
  favorites,
  onToggle,
  onToggleFav,
  onSetOverall,
  onReset,
}: Props) {
  const minId = useId();
  const maxId = useId();
  return (
    <div className="bg-midnight/60 border-b border-border px-4 py-3 space-y-4">
      {/* Raridade */}
      <FilterGroup label="Raridade">
        {facets.rarities.map((r) => {
          const isActive = filters.rarities.includes(r.code);
          return (
            <FilterPill
              key={r.code}
              label={r.code === 'world_cup_hero' ? 'WCH' : r.label}
              count={r.count}
              active={isActive}
              colorClass={RARITY_COLORS[r.code] ?? ''}
              onClick={() => onToggle('rarities', r.code)}
            />
          );
        })}
      </FilterGroup>

      {/* Posição */}
      <FilterGroup label="Posição">
        {facets.positions.map((pos) => {
          const isActive = filters.positions.includes(pos);
          const POS_BG: Record<string, string> = {
            GK: 'border-amber-700 text-amber-400 bg-amber-900/20',
            CB: 'border-blue-700 text-blue-400 bg-blue-900/20',
            LB: 'border-blue-700 text-blue-400 bg-blue-900/20',
            RB: 'border-blue-700 text-blue-400 bg-blue-900/20',
            CDM: 'border-green-700 text-green-400 bg-green-900/20',
            CM: 'border-green-700 text-green-400 bg-green-900/20',
            CAM: 'border-green-700 text-green-400 bg-green-900/20',
            LW: 'border-red-700 text-red-400 bg-red-900/20',
            RW: 'border-red-700 text-red-400 bg-red-900/20',
            ST: 'border-red-700 text-red-400 bg-red-900/20',
            CF: 'border-red-700 text-red-400 bg-red-900/20',
          };
          return (
            <FilterPill
              key={pos}
              label={pos}
              active={isActive}
              colorClass={POS_BG[pos] ?? 'border-border text-muted'}
              onClick={() => onToggle('positions', pos)}
            />
          );
        })}
      </FilterGroup>

      {/* Era */}
      <FilterGroup label="Era">
        {facets.eras.map((era) => (
          <FilterPill
            key={era}
            label={era}
            active={filters.eras.includes(era)}
            colorClass="border-purple-700/60 text-purple-300 bg-purple-900/15"
            onClick={() => onToggle('eras', era)}
          />
        ))}
      </FilterGroup>

      {/* País */}
      <FilterGroup label="País">
        <div className="flex flex-wrap gap-1.5">
          {facets.countries.map((c) => (
            <button
              key={c.code}
              onClick={() => onToggle('countries', c.code)}
              className={[
                'flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] transition-all',
                filters.countries.includes(c.code)
                  ? 'border-gold/60 text-gold bg-gold/10'
                  : 'border-border text-muted hover:border-border/80',
              ].join(' ')}
            >
              <span>{c.flag}</span>
              <span>{c.code}</span>
              <span className="text-[8px] opacity-60">×{c.count}</span>
            </button>
          ))}
        </div>
      </FilterGroup>

      {/* Overall */}
      <FilterGroup
        label={`Overall — ${filters.overallMin === 0 ? '0' : filters.overallMin}–${filters.overallMax}`}
      >
        <div className="w-full space-y-2">
          <div className="flex items-center gap-3">
            <label htmlFor={minId} className="text-[9px] text-muted uppercase w-6 shrink-0">
              Min
            </label>
            <input
              id={minId}
              type="range"
              min={0}
              max={99}
              step={1}
              value={filters.overallMin}
              onChange={(e) => onSetOverall(Number(e.target.value), filters.overallMax)}
              className="flex-1 accent-gold h-1 cursor-pointer"
            />
            <span className="text-[10px] text-parchment font-bold w-6 text-right shrink-0">
              {filters.overallMin}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor={maxId} className="text-[9px] text-muted uppercase w-6 shrink-0">
              Max
            </label>
            <input
              id={maxId}
              type="range"
              min={0}
              max={99}
              step={1}
              value={filters.overallMax}
              onChange={(e) => onSetOverall(filters.overallMin, Number(e.target.value))}
              className="flex-1 accent-gold h-1 cursor-pointer"
            />
            <span className="text-[10px] text-parchment font-bold w-6 text-right shrink-0">
              {filters.overallMax}
            </span>
          </div>
        </div>
      </FilterGroup>

      {/* Favoritos */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={onToggleFav}
          className={[
            'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all',
            filters.favorites
              ? 'border-rose-500/60 text-rose-400 bg-rose-900/20'
              : 'border-border text-muted hover:text-parchment',
          ].join(' ')}
        >
          <span>{filters.favorites ? '❤️' : '🤍'}</span>
          <span>Só favoritas ({favorites.size})</span>
        </button>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-muted uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  colorClass,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  colorClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all',
        active ? colorClass : 'border-border/60 text-muted/70 hover:border-border hover:text-muted',
        active ? 'opacity-100' : 'opacity-60',
      ].join(' ')}
    >
      {label}
      {count !== undefined && <span className="text-[8px] opacity-60">×{count}</span>}
    </button>
  );
}
