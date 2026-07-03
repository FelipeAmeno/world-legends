'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Filter, SortAsc } from 'lucide-react';
import { useCards } from '@/hooks/use-query';
import { Input, Badge, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState } from '@/components/ui';
import { cn } from '@/lib/utils';

const RARITIES = [
  { code: 'all',           label: 'Todas'  },
  { code: 'ultra',         label: 'Ultra'  },
  { code: 'world_cup_hero',label: 'WCH'   },
  { code: 'legendary',     label: 'Lenda'  },
  { code: 'elite',         label: 'Elite'  },
  { code: 'rare',          label: 'Rara'   },
  { code: 'common',        label: 'Comum'  },
];

const POSITIONS = ['Todos', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];

const GLOW: Record<string, string> = {
  common:       '',
  rare:         'hover:shadow-[0_0_12px_rgba(66,165,245,0.4)]',
  elite:        'hover:shadow-[0_0_12px_rgba(171,71,188,0.4)]',
  legendary:    'hover:shadow-[0_0_16px_rgba(255,202,40,0.4)]',
  ultra:        'hover:shadow-[0_0_20px_rgba(239,83,80,0.5)]',
  world_cup_hero:'hover:shadow-[0_0_20px_rgba(38,198,218,0.5)]',
  goat:         'hover:shadow-[0_0_24px_rgba(255,215,0,0.6)]',
};

export function CollectionPage() {
  const [search,   setSearch]   = useState('');
  const [rarity,   setRarity]   = useState('all');
  const [position, setPosition] = useState('Todos');
  const [selected, setSelected] = useState<string | null>(null);

  const { data: cards, isLoading } = useCards();

  const filtered = (cards ?? []).filter((c) => {
    if (rarity !== 'all' && c.rarityCode !== rarity) return false;
    if (position !== 'Todos' && c.position !== position) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.knownAs.toLowerCase().includes(q) && !c.nationality.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">Minha Coleção</h1>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
          {filtered.length} cartas
        </span>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Buscar jogador, nação…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Filtros de raridade */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {RARITIES.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setRarity(code)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors border',
              rarity === code
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filtros de posição */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-1">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosition(pos)}
            className={cn(
              'shrink-0 rounded px-2 py-1 text-[10px] font-mono font-bold transition-colors',
              position === pos
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🃏" title="Nenhuma carta" description="Tente ajustar os filtros ou abra mais packs." />
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {filtered.map((card) => (
            <Link
              key={card.id}
              href={`/collection/${card.id}`}
              onClick={() => setSelected(card.id)}
              className={cn(
                'group relative flex flex-col overflow-hidden rounded-lg border-2 transition-all duration-200 hover:scale-105',
                `card-rarity-${card.rarityCode.replace(/_/g, '-').replace('world-cup-hero', 'wch')}`,
                GLOW[card.rarityCode],
                selected === card.id && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                (card.isInjured || card.suspendedMatches > 0) && 'opacity-60',
              )}
            >
              {/* Arte placeholder */}
              <div className="flex flex-1 items-center justify-center bg-black/20 py-3 text-3xl">⚽</div>

              {/* Info */}
              <div className="bg-black/70 px-1.5 pb-1.5 pt-1">
                <p className="truncate text-[9px] font-bold text-white">{card.knownAs}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">{card.position}</span>
                  <span className="text-sm font-black text-white">{card.overall}</span>
                </div>
              </div>

              {/* Form */}
              {card.form !== 0 && (
                <div className={cn(
                  'absolute right-1 top-1 rounded px-0.5 text-[8px] font-bold',
                  card.form > 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
                )}>
                  {card.form > 0 ? `+${card.form}` : card.form}
                </div>
              )}

              {/* Status icons */}
              <div className="absolute left-1 top-1 flex flex-col gap-0.5">
                {card.isInjured       && <span className="text-[10px]">🩹</span>}
                {card.suspendedMatches > 0 && <span className="text-[10px]">🟨</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
