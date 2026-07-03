/**
 * CardGrid — grade responsiva de cartas.
 *
 * Componente puramente apresentacional: recebe dados e callbacks,
 * não conhece filtros, estado ou dados de domínio.
 */
import type { CollectionCard } from '@/lib/collection-data';
import { CollectionCardTile } from './CollectionCardTile';

type Props = {
  cards: CollectionCard[];
  selectedCardId: string | null;
  onSelect: (card: CollectionCard) => void;
  emptyMessage?: string;
};

export function CardGrid({ cards, selectedCardId, onSelect, emptyMessage }: Props) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted animate-[fadeIn_0.3s_ease-out]">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-sm font-medium">{emptyMessage ?? 'Nenhuma carta encontrada'}</p>
        <p className="text-xs mt-1 text-muted/60">Tente ajustar os filtros</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 animate-[fadeIn_0.3s_ease-out]">
      {cards.map((card) => (
        <CollectionCardTile
          key={card.cardId}
          card={card}
          mode="grid"
          isFav={false}
          isComparing={false}
          onSelect={onSelect}
          onFav={() => undefined}
          onCompare={() => undefined}
        />
      ))}
    </div>
  );
}
