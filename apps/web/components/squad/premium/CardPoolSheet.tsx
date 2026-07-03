'use client';

import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { getPositionCompat } from '@/lib/squad-builder';
import type { DragSource } from '@/lib/squad-builder';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Position } from '@world-legends/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

type Props = {
  cards: CollectionCard[];
  selectedSlotPos: Position | null;
  dragOver: boolean;
  onTapCard: (cardId: string) => void;
};

const GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.4)',
  rare: 'rgba(147,51,234,0.6)',
  elite: 'rgba(59,130,246,0.7)',
  legendary: 'rgba(201,168,76,0.8)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
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
  const visual = RARITY_VISUAL[card.rarityCode];
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
        'relative shrink-0 rounded-xl border-2 overflow-hidden cursor-grab active:cursor-grabbing touch-none',
        'w-14 h-[76px] flex flex-col',
        visual.bgClass,
        visual.borderClass,
        isBestFit ? 'ring-2 ring-gold ring-offset-1 ring-offset-black' : '',
      ].join(' ')}
      style={{ ...style, boxShadow: `0 0 ${isBestFit ? 16 : 8}px ${GLOW[card.rarityCode]}` }}
      whileHover={{ scale: 1.1, y: -4 }}
      whileTap={{ scale: 0.92 }}
      animate={{ opacity: isDragging ? 0.25 : 1 }}
      title={`${card.displayName} · ${card.position} · ${card.overall} OVR`}
      onClick={(e) => {
        e.stopPropagation();
        onTap();
      }}
    >
      {/* Best-fit glow badge */}
      {isBestFit && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.3), transparent 70%)' }}
        />
      )}

      <div className="flex-1 flex items-center justify-center">
        <p
          className={`font-display text-2xl leading-none ${visual.textClass}`}
          style={{ filter: `drop-shadow(0 0 6px ${GLOW[card.rarityCode]})` }}
        >
          {card.overall}
        </p>
      </div>
      <div className="pb-1 px-0.5" style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.85),transparent)' }}>
        <p className="text-parchment text-[6px] font-bold text-center truncate leading-tight">
          {card.displayName.split(' ').pop()}
        </p>
        <p className={`text-[5px] font-bold text-center ${visual.textClass}`}>{card.position}</p>
      </div>
    </motion.div>
  );
}

// ─── Main CardPoolSheet ───────────────────────────────────────────────────────

export function CardPoolSheet({ cards, selectedSlotPos, dragOver, onTapCard }: Props) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(true);
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

  return (
    <div
      ref={setNodeRef}
      data-squad-pool
      className="border-t border-white/5"
      style={{
        background: isDropActive
          ? 'rgba(201,168,76,0.06)'
          : 'rgba(0,0,0,0.5)',
        transition: 'background 0.2s',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-white/30 uppercase tracking-widest">DISPONÍVEIS</span>
          <span className="text-[8px] text-white/20">{filtered.length}</span>
          {isDropActive && <span className="text-gold text-[9px]">↓ solte aqui para devolver</span>}
          {selectedSlotPos && !isDropActive && (
            <span className="text-gold text-[9px]">toque numa carta para colocá-la</span>
          )}
        </div>
        <motion.span className="text-white/30 text-xs" animate={{ rotate: open ? 180 : 0 }}>
          ▲
        </motion.span>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Sector filter + search */}
            <div className="px-3 pb-1.5 flex items-center gap-2 flex-wrap">
              {/* Sector chips */}
              <div className="flex gap-1">
                {(Object.keys(SECTOR_POSITIONS) as Sector[]).map((s) => (
                  <button
                    key={s}
                    data-squad-pool
                    onClick={(e) => { e.stopPropagation(); setSector(s); }}
                    className={[
                      'px-2 py-0.5 rounded-full border text-[9px] font-bold transition-all',
                      sector === s ? SECTOR_ACTIVE[s] : SECTOR_COLOR[s],
                    ].join(' ')}
                  >
                    {s === 'all' ? 'TODOS' : s}
                  </button>
                ))}
              </div>
              {/* Search */}
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
            <div className="flex gap-2 overflow-x-auto px-3 pb-3 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filtered.length === 0 ? (
                <p className="text-white/20 text-xs py-4 w-full text-center">
                  {search || sector !== 'all' ? 'Nenhum resultado' : 'Todos os jogadores estão no campo!'}
                </p>
              ) : (
                filtered.map((card) => (
                  <PoolCard
                    key={card.cardId}
                    card={card}
                    isBestFit={bestFitIds.has(card.cardId)}
                    onTap={() => onTapCard(card.cardId)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
