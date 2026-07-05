'use client';

import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { MAX_BENCH } from '@/lib/squad-builder';
import type { DragSource } from '@/lib/squad-builder';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useCallback } from 'react';

type Props = {
  bench: (CollectionCard | null)[];
  dragOver: string | null;
  onRemove: (idx: number) => void;
};

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.4)',
  rare: 'rgba(147,51,234,0.6)',
  elite: 'rgba(59,130,246,0.7)',
  legendary: 'rgba(201,168,76,0.8)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

function BenchCard({
  card,
  idx,
  onRemove,
}: { card: CollectionCard; idx: number; onRemove: () => void }) {
  const visual = RARITY_VISUAL[card.rarityCode];
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `bench-card-${idx}`,
    data: { source: { kind: 'bench', benchIdx: idx, cardId: card.cardId } satisfies DragSource },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50, opacity: 0.3 }
    : {};

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`relative group shrink-0 rounded-lg border-2 w-14 h-[72px] flex flex-col overflow-hidden cursor-grab active:cursor-grabbing touch-none ${visual.bgClass} ${visual.borderClass}`}
      style={{ ...style, boxShadow: `0 0 12px ${RARITY_GLOW[card.rarityCode]}` }}
      animate={{ opacity: isDragging ? 0.3 : 1 }}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex-1 flex items-center justify-center">
        <p className={`font-display text-xl leading-none ${visual.textClass}`}>{card.overall}</p>
      </div>
      <div
        className="pb-1 px-0.5"
        style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.8),transparent)' }}
      >
        <p className="text-[6px] font-bold text-parchment text-center truncate">
          {card.displayName.split(' ').pop()}
        </p>
        <p className={`text-[5px] text-center ${visual.textClass}`}>{card.position}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-600 text-white text-[7px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </motion.div>
  );
}

function BenchSlot({ idx, dragOver }: { idx: number; dragOver: string | null }) {
  const id = `bench-${idx}`;
  const { setNodeRef, isOver } = useDroppable({ id });
  const active = isOver || dragOver === id;

  return (
    <motion.div
      ref={setNodeRef}
      className="shrink-0 rounded-lg border-2 border-dashed w-14 h-[72px] flex items-center justify-center"
      animate={{
        borderColor: active ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.1)',
        backgroundColor: active ? 'rgba(201,168,76,0.08)' : 'transparent',
        scale: active ? 1.05 : 1,
      }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-white/15 text-[8px]">R{idx + 1}</span>
    </motion.div>
  );
}

export function BenchStrip({ bench, dragOver, onRemove }: Props) {
  const slots = Array.from({ length: MAX_BENCH }, (_, i) => bench[i] ?? null);

  return (
    <div className="border-t border-white/5 bg-black/40 px-3 py-2">
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-[9px] text-white/30 uppercase tracking-widest">BANCO</span>
        <span className="text-[8px] text-white/20">
          ({bench.filter(Boolean).length}/{MAX_BENCH})
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {slots.map((card, idx) =>
          card ? (
            <BenchCard
              key={`bench-${idx}-${card.cardId}`}
              card={card}
              idx={idx}
              onRemove={() => onRemove(idx)}
            />
          ) : (
            <BenchSlot key={`bench-empty-${idx}`} idx={idx} dragOver={dragOver} />
          ),
        )}
      </div>
    </div>
  );
}
