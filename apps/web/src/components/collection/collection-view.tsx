'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { CardTile } from '../cards/card-tile';
import { cn } from '../../lib/utils';
import type { RarityCode } from '@world-legends/types';

const RARITY_FILTERS: { code: RarityCode | 'all'; label: string }[] = [
  { code: 'all',           label: 'Todas'  },
  { code: 'legendary',     label: 'Lenda'  },
  { code: 'ultra',         label: 'Ultra'  },
  { code: 'elite',         label: 'Elite'  },
  { code: 'rare',          label: 'Rara'   },
  { code: 'common',        label: 'Comum'  },
];

export function CollectionView() {
  const [search,      setSearch]  = useState('');
  const [rarityFilter, setRarity] = useState<RarityCode | 'all'>('all');
  const [selected,    setSelected] = useState<string | null>(null);

  const { data: cards, isLoading } = trpc.collection.myCards.useQuery({ search });

  const filtered = (cards ?? []).filter((c) =>
    rarityFilter === 'all' ? true : (c as any).rarityCode === rarityFilter
  );

  return (
    <div className="space-y-3 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Minha Coleção</h2>
        <span className="text-xs text-muted-foreground">{filtered.length} cartas</span>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Filtros de raridade */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {RARITY_FILTERS.map(({ code, label }) => (
          <button
            key={code}
            onClick={() => setRarity(code)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              rarityFilter === code
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-muted-foreground hover:border-primary/40',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid de cartas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Nenhuma carta encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 pb-4">
          {filtered.map((card) => (
            <CardTile
              key={card.id}
              cardId={card.cardId}
              knownAs={(card as any).knownAs ?? card.cardId.slice(0, 8)}
              position={(card as any).position ?? 'CM'}
              overall={(card as any).overall ?? 80}
              rarityCode={((card as any).rarityCode ?? 'common') as RarityCode}
              artworkUrl={(card as any).artworkUrl}
              form={card.form}
              isInjured={card.isInjured}
              isSuspended={card.suspendedMatches > 0}
              onClick={() => setSelected(card.id === selected ? null : card.id)}
              selected={card.id === selected}
            />
          ))}
        </div>
      )}
    </div>
  );
}
