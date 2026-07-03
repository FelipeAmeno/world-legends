'use client';

import type { CollectionCard, FilterState } from '@/lib/collection-data';
import { applyFilters } from '@/lib/collection-data';
import type { Rarity } from '@world-legends/cards';
import type { Position } from '@world-legends/types';
/**
 * CollectionClient — orquestrador client-side da coleção.
 *
 * Gerencia estado (filtro, seleção) e compõe os componentes reutilizáveis.
 * Recebe todos os dados como props (vindos do Server Component pai).
 * Zero dados hardcoded aqui.
 */
import { useState } from 'react';
import { CardDetailPanel } from './CardDetailPanel';
import { CardGrid } from './CardGrid';
import { CollectionFilters } from './CollectionFilters';

type Props = {
  allCards: CollectionCard[];
  rarities: readonly Rarity[];
  positions: readonly Position[];
};

const DEFAULT_FILTER: FilterState = {
  search: '',
  rarity: 'all',
  position: 'all',
  sortKey: 'overall',
};

export function CollectionClient({ allCards, rarities, positions }: Props) {
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);

  const filteredCards = applyFilters(allCards, filter);

  function handleSelect(card: CollectionCard) {
    setSelectedCard((prev) => (prev?.cardId === card.cardId ? null : card));
  }

  function handleCloseDetail() {
    setSelectedCard(null);
  }

  return (
    <div className="relative">
      {/* Filtros */}
      <CollectionFilters
        filter={filter}
        onChange={setFilter}
        rarities={rarities}
        positions={positions}
        totalCount={allCards.length}
        filteredCount={filteredCards.length}
      />

      {/* Grade de cartas */}
      <div className="mt-4">
        <CardGrid
          cards={filteredCards}
          selectedCardId={selectedCard?.cardId ?? null}
          onSelect={handleSelect}
          emptyMessage="Nenhuma carta encontrada para estes filtros"
        />
      </div>

      {/* Painel de detalhes */}
      <CardDetailPanel card={selectedCard} onClose={handleCloseDetail} />
    </div>
  );
}
