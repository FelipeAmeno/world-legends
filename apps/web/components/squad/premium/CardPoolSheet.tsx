'use client';

import { PlayerCard } from '@/components/cards/PlayerCard';
import type { CollectionCard } from '@/lib/collection-data';
import { getPositionCompat } from '@/lib/squad-builder';
import type { DragSource } from '@/lib/squad-builder';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Position } from '@world-legends/types';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';

type Props = {
  cards: CollectionCard[];
  selectedSlotPos: Position | null;
  dragOver: boolean;
  onTapCard: (cardId: string) => void;
  onClose: () => void;
};

type Sector = 'all' | 'GK' | 'DEF' | 'MID' | 'ATT';
const SECTOR_POSITIONS: Record<Sector, string[]> = {
  all: [],
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
  ATT: ['LW', 'RW', 'CF', 'ST'],
};
const SECTOR_COLOR: Record<Sector, string> = {
  all: 'border-white/20 text-white/50',
  GK: 'border-amber-500/50 text-amber-400',
  DEF: 'border-blue-500/50 text-blue-400',
  MID: 'border-emerald-500/50 text-emerald-400',
  ATT: 'border-red-500/50 text-red-400',
};
const SECTOR_ACTIVE: Record<Sector, string> = {
  all: 'bg-white/10 border-white/40 text-white',
  GK: 'bg-amber-900/30 border-amber-500 text-amber-300',
  DEF: 'bg-blue-900/30 border-blue-500 text-blue-300',
  MID: 'bg-emerald-900/30 border-emerald-500 text-emerald-300',
  ATT: 'bg-red-900/30 border-red-500 text-red-300',
};

// ─── Draggable pool card ──────────────────────────────────────────────────────

function PoolCard({
  card,
  isBestFit,
  onTap,
}: {
  card: CollectionCard;
  isBestFit: boolean;
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `pool-${card.cardId}`,
    data: { source: { kind: 'pool', cardId: card.cardId } satisfies DragSource },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50, opacity: 0.25 }
    : {};

  return (
    <motion.div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-squad-pool
      className={[
        'relative shrink-0 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing touch-none',
        isBestFit ? 'ring-2 ring-gold ring-offset-1 ring-offset-black' : '',
      ].join(' ')}
      style={style}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.92 }}
      animate={{ opacity: isDragging ? 0.25 : 1 }}
      title={`${card.displayName} · ${card.position} · ${card.overall} OVR`}
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
    >
      <PlayerCard card={card} size="xs" glow />

      {/* Best-fit glow badge */}
      {isBestFit && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY }}
          style={{
            background:
              'radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.3), transparent 70%)',
          }}
        />
      )}
    </motion.div>
  );
}

// ─── Main CardPoolSheet ───────────────────────────────────────────────────────

export function CardPoolSheet({ cards, selectedSlotPos, dragOver, onTapCard, onClose }: Props) {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState<Sector>('all');

  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });
  const isDropActive = isOver || dragOver;

  // Position filter
  const filtered = useMemo(() => {
    let result = cards;
    if (sector !== 'all') {
      const positions = SECTOR_POSITIONS[sector];
      result = result.filter((c) => positions.includes(c.position));
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.position.toLowerCase().includes(q) ||
          c.nationality.toLowerCase().includes(q),
      );
    }
    return result;
  }, [cards, sector, search]);

  // Highlight best-fit cards for selected slot
  const bestFitIds = useMemo(() => {
    if (!selectedSlotPos) return new Set<string>();
    return new Set(
      filtered
        .filter((c) => getPositionCompat(c.position, selectedSlotPos) !== 'awkward')
        .map((c) => c.cardId),
    );
  }, [filtered, selectedSlotPos]);

  // Nunca renderiza a coleção inteira de uma vez — corta em lotes de 80 cartas
  const RENDER_CAP = 80;
  const visible = filtered.slice(0, RENDER_CAP);
  const hiddenCount = filtered.length - visible.length;

  return (
    <div
      ref={setNodeRef}
      data-squad-pool
      className="rounded-t-2xl border-t border-x border-white/10 shadow-2xl"
      style={{
        background: isDropActive ? 'rgba(201,168,76,0.1)' : 'rgba(8,10,16,0.98)',
        backdropFilter: 'blur(12px)',
        transition: 'background 0.2s',
      }}
    >
      {/* Drag handle */}
      <div className="flex justify-center pt-2 pb-1">
        <div className="w-9 h-1 rounded-full bg-white/15" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
            Coleção
          </span>
          <span className="text-[9px] text-white/25">{filtered.length} disponíveis</span>
          {isDropActive && <span className="text-gold text-[9px]">↓ solte aqui para devolver</span>}
          {selectedSlotPos && !isDropActive && (
            <span className="text-gold text-[9px]">toque numa carta para colocá-la</span>
          )}
        </div>
        <button
          type="button"
          data-squad-pool
          onClick={onClose}
          className="text-white/40 hover:text-white/70 text-sm px-2 -mr-1"
        >
          ✕
        </button>
      </div>

      {/* Sector filter + search */}
      <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
        <div className="flex gap-1">
          {(Object.keys(SECTOR_POSITIONS) as Sector[]).map((s) => (
            <button
              key={s}
              data-squad-pool
              onClick={(e) => {
                e.stopPropagation();
                setSector(s);
              }}
              className={[
                'px-2 py-0.5 rounded-full border text-[9px] font-bold transition-all',
                sector === s ? SECTOR_ACTIVE[s] : SECTOR_COLOR[s],
              ].join(' ')}
            >
              {s === 'all' ? 'TODOS' : s}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          data-squad-pool
          onChange={(e) => setSearch(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="nome, posição…"
          className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-lg px-2 py-1
                     text-parchment text-[10px] placeholder:text-white/20
                     focus:outline-none focus:border-gold-dim/50 transition-colors"
        />
      </div>

      {/* Cards scroll */}
      <div
        className="flex gap-2 overflow-x-auto px-3 pb-3 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch', maxHeight: '30vh' }}
      >
        {filtered.length === 0 ? (
          <p className="text-white/20 text-xs py-4 w-full text-center">
            {search || sector !== 'all' ? 'Nenhum resultado' : 'Todos os jogadores estão no campo!'}
          </p>
        ) : (
          visible.map((card) => (
            <PoolCard
              key={card.cardId}
              card={card}
              isBestFit={bestFitIds.has(card.cardId)}
              onTap={() => onTapCard(card.cardId)}
            />
          ))
        )}
      </div>
      {hiddenCount > 0 && (
        <p className="text-white/20 text-[9px] text-center pb-2">
          +{hiddenCount} cartas — refine a busca para ver mais
        </p>
      )}
    </div>
  );
}
