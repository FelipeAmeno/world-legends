import type { FilterState, SortKey } from '@/lib/collection-data';
import { POSITION_LABELS, RARITY_VISUAL, SORT_OPTIONS } from '@/lib/collection-data';
import type { Rarity } from '@world-legends/cards';
/**
 * CollectionFilters — barra de filtros reutilizável.
 *
 * Recebe options do domínio (via lib/collection-data) e callbacks.
 * Zero hardcoded: labels de raridade, posições e sort vêm como props.
 */
import type { Position, RarityCode } from '@world-legends/types';

type Props = {
  filter: FilterState;
  onChange: (next: FilterState) => void;
  rarities: readonly Rarity[];
  positions: readonly Position[];
  totalCount: number;
  filteredCount: number;
};

export function CollectionFilters({
  filter,
  onChange,
  rarities,
  positions,
  totalCount,
  filteredCount,
}: Props) {
  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filter, [key]: value });
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-4">
      {/* Linha 1: busca + sort + contagem */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={filter.search}
          onChange={(v) => set('search', v)}
          placeholder="Buscar jogador…"
        />
        <SortSelect
          value={filter.sortKey}
          options={SORT_OPTIONS}
          onChange={(v) => set('sortKey', v)}
        />
        <span className="text-muted text-xs ml-auto shrink-0">
          {filteredCount === totalCount
            ? `${totalCount} cartas`
            : `${filteredCount} de ${totalCount}`}
        </span>
      </div>

      {/* Linha 2: filtro por raridade */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-muted text-[10px] uppercase tracking-wider w-14 shrink-0">
          Raridade
        </span>
        <RarityTab
          active={filter.rarity === 'all'}
          label="Todas"
          textClass="text-parchment"
          borderClass="border-parchment/30"
          onClick={() => set('rarity', 'all')}
        />
        {rarities.map((r) => {
          const visual = RARITY_VISUAL[r.code];
          return (
            <RarityTab
              key={r.code}
              active={filter.rarity === r.code}
              label={r.code === 'world_cup_hero' ? 'WCH' : r.label}
              textClass={visual.textClass}
              borderClass={visual.borderClass}
              onClick={() => set('rarity', r.code)}
            />
          );
        })}
      </div>

      {/* Linha 3: filtro por posição */}
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-muted text-[10px] uppercase tracking-wider w-14 shrink-0">
          Posição
        </span>
        <PosTab
          active={filter.position === 'all'}
          label="Todas"
          onClick={() => set('position', 'all')}
        />
        {positions.map((pos) => {
          const posLabel = POSITION_LABELS[pos];
          return (
            <PosTab
              key={pos}
              active={filter.position === pos}
              label={pos}
              {...(posLabel !== undefined ? { title: posLabel } : {})}
              onClick={() => set('position', pos)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Sub-componentes internos ─────────────────────────────────────────────────

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[180px]">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-1.5 bg-obsidian border border-border rounded-lg
                   text-parchment text-sm placeholder:text-muted/60
                   focus:outline-none focus:border-gold-dim transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-parchment text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function SortSelect({
  value,
  options,
  onChange,
}: {
  value: SortKey;
  options: readonly { key: SortKey; label: string }[];
  onChange: (v: SortKey) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as SortKey)}
      className="bg-obsidian border border-border rounded-lg px-3 py-1.5
                 text-parchment text-sm focus:outline-none focus:border-gold-dim
                 transition-colors cursor-pointer shrink-0"
    >
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          Ordenar: {o.label}
        </option>
      ))}
    </select>
  );
}

function RarityTab({
  active,
  label,
  textClass,
  borderClass,
  onClick,
}: {
  active: boolean;
  label: string;
  textClass: string;
  borderClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider',
        'transition-all duration-150',
        textClass,
        borderClass,
        active ? 'opacity-100 bg-white/6' : 'opacity-40 hover:opacity-70',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function PosTab({
  active,
  label,
  title,
  onClick,
}: {
  active: boolean;
  label: string;
  title?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        'px-2 py-0.5 rounded text-[10px] font-medium transition-all',
        active ? 'bg-steel text-white' : 'text-muted hover:text-parchment hover:bg-white/5',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
