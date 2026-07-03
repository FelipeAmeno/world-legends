'use client';

import { OvrDisplay } from '@/components/ui/OvrDisplay';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { MAX_BENCH } from '@/lib/squad-data';

type Props = {
  bench: (CollectionCard | null)[];
  dragOver: string | null;
  onDragStart: (idx: number, cardId: string, e: React.DragEvent) => void;
  onDragOver: (idx: number, e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (idx: number, e: React.DragEvent) => void;
  onRemove: (idx: number) => void;
  onDragEnd: () => void;
};

export function BenchRow({
  bench,
  dragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onDragEnd,
}: Props) {
  const slots = Array.from({ length: MAX_BENCH }, (_, i) => bench[i] ?? null);

  return (
    <section className="bg-surface border border-border rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-display text-base text-parchment tracking-wider">BANCO</span>
        <span className="text-muted text-[10px]">
          {bench.filter(Boolean).length}/{MAX_BENCH}
        </span>
      </div>

      <div className="flex gap-2 flex-wrap sm:flex-wrap scroll-x-hide pb-1">
        {slots.map((card, idx) => {
          const isDragOver = dragOver === `bench-${idx}`;
          return (
            <BenchSlot
              key={idx}
              idx={idx}
              card={card}
              isDragOver={isDragOver}
              onDragStart={(cardId, e) => onDragStart(idx, cardId, e)}
              onDragOver={(e) => onDragOver(idx, e)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(idx, e)}
              onRemove={() => onRemove(idx)}
              onDragEnd={onDragEnd}
            />
          );
        })}
      </div>
    </section>
  );
}

// ─── BenchSlot ────────────────────────────────────────────────────────────────

type SlotProps = {
  idx: number;
  card: CollectionCard | null;
  isDragOver: boolean;
  onDragStart: (cardId: string, e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onRemove: () => void;
  onDragEnd: () => void;
};

function BenchSlot({
  card,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
  onDragEnd,
}: SlotProps) {
  const visual = card ? RARITY_VISUAL[card.rarityCode] : null;

  if (card) {
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(card.cardId, e)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          'relative group flex flex-col items-center rounded-lg border p-1.5 cursor-grab active:cursor-grabbing',
          'transition-all w-[74px] min-h-[88px]',
          visual?.bgClass ?? '',
          visual?.borderClass ?? 'border-border',
          visual?.glowClass ?? '',
          isDragOver ? 'ring-2 ring-gold/50 scale-105' : 'hover:scale-105',
        ].join(' ')}
      >
        {/* OVR */}
        <div
          className={[
            'w-8 h-8 rounded-full border flex items-center justify-center',
            'bg-obsidian/80',
            visual?.borderClass ?? 'border-border',
          ].join(' ')}
        >
          <OvrDisplay value={card.overall} size="sm" />
        </div>

        {/* Nome */}
        <p className="text-parchment text-[8px] font-semibold text-center leading-tight truncate w-full mt-1">
          {card.displayName}
        </p>
        <p className={`text-[7px] font-bold ${visual?.textClass ?? 'text-muted'}`}>
          {card.position}
        </p>

        {/* Remover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white
                     text-[8px] font-bold flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={[
        'flex items-center justify-center rounded-lg border-2 border-dashed',
        'w-[74px] min-h-[88px] transition-all duration-150',
        isDragOver ? 'border-gold/60 bg-gold/8 scale-105' : 'border-border/60 hover:border-border',
      ].join(' ')}
    >
      <span className="text-muted text-[9px] text-center px-1">Reserva</span>
    </div>
  );
}
