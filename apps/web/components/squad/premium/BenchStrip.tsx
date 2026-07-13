'use client';

import { ResolvedWorldLegendsCard } from '@/components/cards/ResolvedWorldLegendsCard';
import type { CollectionCard } from '@/lib/collection-data';
import { MAX_BENCH } from '@/lib/squad-builder';
import type { DragSource } from '@/lib/squad-builder';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';

type Props = {
  bench: (CollectionCard | null)[];
  dragOver: string | null;
  onRemove: (idx: number) => void;
};

type Sector = 'all' | 'GK' | 'DEF' | 'MID' | 'ATT';
const SECTOR_POSITIONS: Record<Sector, string[]> = {
  all: [],
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  ATT: ['LW', 'RW', 'CF', 'ST'],
};
const SECTOR_ACTIVE: Record<Sector, string> = {
  all: 'bg-white/10 border-white/40 text-white',
  GK: 'bg-amber-900/30 border-amber-500 text-amber-300',
  DEF: 'bg-blue-900/30 border-blue-500 text-blue-300',
  MID: 'bg-emerald-900/30 border-emerald-500 text-emerald-300',
  ATT: 'bg-red-900/30 border-red-500 text-red-300',
};
const SECTOR_IDLE: Record<Sector, string> = {
  all: 'border-white/15 text-white/35',
  GK: 'border-amber-500/30 text-amber-400/60',
  DEF: 'border-blue-500/30 text-blue-400/60',
  MID: 'border-emerald-500/30 text-emerald-400/60',
  ATT: 'border-red-500/30 text-red-400/60',
};

function BenchCard({
  card,
  idx,
  dimmed,
  onRemove,
}: { card: CollectionCard; idx: number; dimmed: boolean; onRemove: () => void }) {
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
      className="relative group shrink-0 cursor-grab active:cursor-grabbing touch-none"
      style={style}
      animate={{ opacity: isDragging ? 0.3 : dimmed ? 0.25 : 1 }}
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.95 }}
    >
      <ResolvedWorldLegendsCard card={card} size="xs" density="compact" glow />
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
      className="shrink-0 rounded-lg border-2 border-dashed w-[62px] h-[84px] flex items-center justify-center"
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
  const [sector, setSector] = useState<Sector>('all');

  const filledCount = useMemo(() => bench.filter(Boolean).length, [bench]);
  const matches = useCallback(
    (card: CollectionCard) => sector === 'all' || SECTOR_POSITIONS[sector].includes(card.position),
    [sector],
  );

  return (
    <div className="border-t border-white/5 bg-black/40 px-3 py-2">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[9px] text-white/30 uppercase tracking-widest">BANCO</span>
        <span className="text-[8px] text-white/20">
          ({filledCount}/{MAX_BENCH})
        </span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {(Object.keys(SECTOR_POSITIONS) as Sector[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSector(s)}
              className={[
                'px-1.5 py-0.5 rounded-full border text-[8px] font-bold transition-all',
                sector === s ? SECTOR_ACTIVE[s] : SECTOR_IDLE[s],
              ].join(' ')}
            >
              {s === 'all' ? 'TODOS' : s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {slots.map((card, idx) =>
          card ? (
            <BenchCard
              key={`bench-${idx}-${card.cardId}`}
              card={card}
              idx={idx}
              dimmed={!matches(card)}
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
