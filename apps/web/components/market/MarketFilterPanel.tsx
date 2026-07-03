import type { MarketFacets } from '@/lib/marketplace/filters';
import type { MarketFilters } from '@/lib/marketplace/types';

const RARITY_STYLE: Record<string, string> = {
  world_cup_hero: 'border-slate-300 text-slate-200 bg-slate-900/30',
  ultra: 'border-pink-500  text-pink-400  bg-pink-900/20',
  legendary: 'border-amber-500 text-amber-400 bg-amber-900/20',
  elite: 'border-blue-500  text-blue-400  bg-blue-900/20',
  rare: 'border-purple-500text-purple-400 bg-purple-900/20',
  common: 'border-gray-500  text-gray-400  bg-gray-900/20',
};

type Props = {
  filters: MarketFilters;
  facets: MarketFacets;
  onToggleRarity: (code: string) => void;
  onTogglePos: (pos: string) => void;
  onToggleCountry: (code: string) => void;
  onToggleEra: (era: string) => void;
  onToggleType: (t: string) => void;
  onToggleNew: () => void;
  onToggleTrending: () => void;
  onPriceMin: (v: number | null) => void;
  onPriceMax: (v: number | null) => void;
  onOvrMin: (v: number | null) => void;
  onOvrMax: (v: number | null) => void;
  onReset: () => void;
};

export function MarketFilterPanel({
  filters,
  facets,
  onToggleRarity,
  onTogglePos,
  onToggleCountry,
  onToggleEra,
  onToggleType,
  onToggleNew,
  onToggleTrending,
  onPriceMin,
  onPriceMax,
  onOvrMin,
  onOvrMax,
  onReset,
}: Props) {
  return (
    <div className="bg-midnight/60 border-b border-border px-4 py-3 space-y-4">
      {/* Raridade */}
      <Row label="Raridade">
        {facets.rarities.map((r) => (
          <Pill
            key={r.code}
            label={r.code === 'world_cup_hero' ? 'WCH' : r.label}
            count={r.count}
            active={filters.rarities.includes(r.code as any)}
            colorClass={RARITY_STYLE[r.code] ?? ''}
            onClick={() => onToggleRarity(r.code)}
          />
        ))}
      </Row>

      {/* Tipo */}
      <Row label="Tipo">
        {(
          [
            ['sell', 'Venda direta'],
            ['auction', 'Leilão'],
          ] as const
        ).map(([t, label]) => (
          <Pill
            key={t}
            label={label}
            active={filters.types.includes(t)}
            colorClass="border-border text-muted"
            onClick={() => onToggleType(t)}
          />
        ))}
        <TogglePill label="🆕 Novo" active={filters.onlyNew} onClick={onToggleNew} />
        <TogglePill label="🔥 Tendência" active={filters.onlyTrending} onClick={onToggleTrending} />
      </Row>

      {/* Posição */}
      <Row label="Posição">
        {facets.positions.slice(0, 12).map(({ pos, count }) => (
          <Pill
            key={pos}
            label={pos}
            count={count}
            active={filters.positions.includes(pos)}
            colorClass="border-border text-muted"
            onClick={() => onTogglePos(pos)}
          />
        ))}
      </Row>

      {/* Era */}
      <Row label="Era">
        {facets.eras.map((era) => (
          <Pill
            key={era}
            label={era}
            active={filters.eras.includes(era)}
            colorClass="border-purple-700/60 text-purple-300 bg-purple-900/15"
            onClick={() => onToggleEra(era)}
          />
        ))}
      </Row>

      {/* País */}
      <Row label="País">
        {facets.countries.slice(0, 10).map((c) => (
          <button
            key={c.code}
            onClick={() => onToggleCountry(c.code)}
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
      </Row>

      {/* Preço */}
      <Row label="Preço (créditos)">
        <RangeInput
          placeholder={`Mín (${facets.priceRange.min})`}
          value={filters.priceMin ?? ''}
          onChange={(v) => onPriceMin(v ? Number(v) : null)}
        />
        <span className="text-muted text-xs">→</span>
        <RangeInput
          placeholder={`Máx (${facets.priceRange.max})`}
          value={filters.priceMax ?? ''}
          onChange={(v) => onPriceMax(v ? Number(v) : null)}
        />
      </Row>

      {/* OVR */}
      <Row label="OVR">
        <RangeInput
          placeholder={`Mín (${facets.ovrRange.min})`}
          value={filters.ovrMin ?? ''}
          onChange={(v) => onOvrMin(v ? Number(v) : null)}
        />
        <span className="text-muted text-xs">→</span>
        <RangeInput
          placeholder={`Máx (${facets.ovrRange.max})`}
          value={filters.ovrMax ?? ''}
          onChange={(v) => onOvrMax(v ? Number(v) : null)}
        />
      </Row>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] text-muted uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({
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
        active ? colorClass : 'border-border/60 text-muted/70 hover:border-border',
        active ? 'opacity-100' : 'opacity-60',
      ].join(' ')}
    >
      {label}
      {count !== undefined && <span className="text-[8px] opacity-60">×{count}</span>}
    </button>
  );
}

function TogglePill({
  label,
  active,
  onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={[
        'px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all',
        active ? 'border-gold/60 text-gold bg-gold/10' : 'border-border/60 text-muted/70',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function RangeInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string | number;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="number"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-28 bg-surface border border-border rounded-lg px-2 py-1 text-xs text-parchment
                 placeholder:text-muted/40 focus:outline-none focus:border-gold-dim transition-colors"
    />
  );
}
