'use client';

import type { CollectionCard } from '@/lib/collection-data';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';
import { CollectionCardTile } from './CollectionCardTile';

// ─── Constantes de layout ─────────────────────────────────────────────────────

const GRID_COLS = 3; // colunas mobile
const GRID_COLS_SM = 4; // ≥ 480px
const GRID_COLS_MD = 5; // ≥ 768px
const CARD_H_GRID = 176; // altura estimada do card em grid
const CARD_H_LIST = 72; // altura estimada do card em lista
const GAP = 8;

// ─── Hook: colunas responsivas ────────────────────────────────────────────────

function useColumns(viewMode: 'grid' | 'list'): number {
  if (viewMode === 'list') return 1;
  // Simplesmente 3 colunas no mobile, recalcula no próximo render
  // Para real responsividade usaríamos ResizeObserver
  return GRID_COLS;
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  cards: CollectionCard[];
  viewMode: 'grid' | 'list';
  favorites: ReadonlySet<string>;
  comparing: CollectionCard[];
  onSelect: (card: CollectionCard) => void;
  onFav: (cardId: string) => void;
  onCompare: (card: CollectionCard) => void;
};

export function VirtualCardGrid({
  cards,
  viewMode,
  favorites,
  comparing,
  onSelect,
  onFav,
  onCompare,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const cols = useColumns(viewMode);
  const cardH = viewMode === 'list' ? CARD_H_LIST : CARD_H_GRID;

  // Agrupar cards em linhas
  const rows = useMemo(() => {
    const result: CollectionCard[][] = [];
    for (let i = 0; i < cards.length; i += cols) {
      result.push(cards.slice(i, i + cols));
    }
    return result;
  }, [cards, cols]);

  // Virtual row list
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cardH + GAP,
    overscan: 4, // renderizar 4 linhas a mais acima/abaixo
  });

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <span className="text-5xl">🔍</span>
        <p className="text-muted text-sm">Nenhuma carta encontrada</p>
        <p className="text-muted/50 text-xs">Tente ajustar os filtros</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="overflow-y-auto h-full"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Container total com altura virtual */}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((vRow) => {
          const row = rows[vRow.index];
          if (!row) return null;

          return (
            <div
              key={vRow.key}
              data-index={vRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vRow.start}px)`,
              }}
            >
              {viewMode === 'grid' ? (
                <div
                  className="grid px-4 pb-2"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gap: GAP,
                  }}
                >
                  {row.map((card) => (
                    <CollectionCardTile
                      key={card.cardId}
                      card={card}
                      mode="grid"
                      isFav={favorites.has(card.cardId)}
                      isComparing={comparing.some((c) => c.cardId === card.cardId)}
                      onSelect={onSelect}
                      onFav={onFav}
                      onCompare={onCompare}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1 px-4 pb-1">
                  {row.map((card) => (
                    <CollectionCardTile
                      key={card.cardId}
                      card={card}
                      mode="list"
                      isFav={favorites.has(card.cardId)}
                      isComparing={comparing.some((c) => c.cardId === card.cardId)}
                      onSelect={onSelect}
                      onFav={onFav}
                      onCompare={onCompare}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
