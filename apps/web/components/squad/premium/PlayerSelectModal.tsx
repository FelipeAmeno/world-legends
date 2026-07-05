'use client';

import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import { getPositionCompat } from '@/lib/squad-builder';
import type { Position } from '@world-legends/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';

// ─── Position → sector mapping ────────────────────────────────────────────────

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
  all: 'border-white/20 text-white/50',
  GK: 'border-amber-500/40 text-amber-400/70',
  DEF: 'border-blue-500/40 text-blue-400/70',
  MID: 'border-emerald-500/40 text-emerald-400/70',
  ATT: 'border-red-500/40 text-red-400/70',
};

const GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.4)',
  rare: 'rgba(147,51,234,0.6)',
  elite: 'rgba(59,130,246,0.7)',
  legendary: 'rgba(201,168,76,0.8)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

function positionSector(pos: Position): Sector {
  if (pos === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'MID';
  return 'ATT';
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  slotPosition: Position | null;
  pool: CollectionCard[];
  onSelect: (cardId: string) => void;
  onClose: () => void;
};

// ─── Card cell ────────────────────────────────────────────────────────────────

function CardCell({
  card,
  compat,
  onSelect,
}: {
  card: CollectionCard;
  compat: 'natural' | 'ok' | 'awkward';
  onSelect: () => void;
}) {
  const visual = RARITY_VISUAL[card.rarityCode];
  const compatColor = compat === 'natural' ? '#22c55e' : compat === 'ok' ? '#eab308' : '#ef4444';

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.93 }}
      className={[
        'relative flex flex-col rounded-xl border-2 overflow-hidden shrink-0',
        'w-[72px] h-[92px]',
        visual.bgClass,
        visual.borderClass,
        compat === 'awkward' ? 'opacity-40' : '',
      ].join(' ')}
      style={{ boxShadow: `0 0 10px ${GLOW[card.rarityCode]}` }}
    >
      {/* Compat dot */}
      <div
        className="absolute top-1 right-1 w-2 h-2 rounded-full ring-1 ring-black/60 z-10"
        style={{ background: compatColor }}
      />

      <div className="flex-1 flex items-center justify-center">
        <p className={`font-display text-2xl leading-none ${visual.textClass}`}>{card.overall}</p>
      </div>
      <div
        className="pb-1.5 px-1"
        style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.9),transparent)' }}
      >
        <p className="text-parchment text-[7px] font-bold text-center truncate leading-tight">
          {card.displayName.split(' ').pop()}
        </p>
        <p className={`text-[6px] font-bold text-center ${visual.textClass}`}>
          {card.flagEmoji} {card.position}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function PlayerSelectModal({ open, slotPosition, pool, onSelect, onClose }: Props) {
  const defaultSector = slotPosition ? positionSector(slotPosition) : 'all';
  const [sector, setSector] = useState<Sector>(defaultSector);
  const [search, setSearch] = useState('');

  // Reset sector when slot position changes
  const activeSector = slotPosition ? sector : 'all';

  const filtered = useMemo(() => {
    let result = pool;
    if (activeSector !== 'all') {
      const positions = SECTOR_POSITIONS[activeSector];
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
    // Sort: natural fit first, then ok, then awkward — within each group sort by OVR desc
    if (slotPosition) {
      result = [...result].sort((a, b) => {
        const ca = getPositionCompat(a.position, slotPosition);
        const cb = getPositionCompat(b.position, slotPosition);
        const rank = { natural: 0, ok: 1, awkward: 2 };
        if (rank[ca] !== rank[cb]) return rank[ca] - rank[cb];
        return b.overall - a.overall;
      });
    } else {
      result = [...result].sort((a, b) => b.overall - a.overall);
    }
    return result;
  }, [pool, activeSector, search, slotPosition]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl overflow-hidden"
            style={{
              maxHeight: '78vh',
              background: '#0d0f18',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 shrink-0">
              <div>
                <p className="text-[9px] text-white/30 uppercase tracking-widest">
                  Escolher jogador
                </p>
                {slotPosition && <p className="text-parchment font-bold text-sm">{slotPosition}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-white/50 hover:bg-white/15 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Sector chips + search */}
            <div className="px-4 pb-3 flex items-center gap-2 flex-wrap shrink-0">
              <div className="flex gap-1.5 flex-wrap">
                {(Object.keys(SECTOR_POSITIONS) as Sector[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSector(s)}
                    className={[
                      'px-2.5 py-0.5 rounded-full border text-[9px] font-bold transition-all',
                      activeSector === s ? SECTOR_ACTIVE[s] : SECTOR_IDLE[s],
                    ].join(' ')}
                  >
                    {s === 'all' ? 'TODOS' : s}
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="nome, posição, país…"
                className="flex-1 min-w-[120px] bg-white/5 border border-white/10 rounded-lg px-3 py-1.5
                           text-parchment text-[10px] placeholder:text-white/20
                           focus:outline-none focus:border-gold-dim/50 transition-colors"
              />
            </div>

            {/* Cards grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filtered.length === 0 ? (
                <p className="text-white/20 text-xs py-8 text-center">Nenhum resultado</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {filtered.map((card) => (
                    <CardCell
                      key={card.cardId}
                      card={card}
                      compat={
                        slotPosition ? getPositionCompat(card.position, slotPosition) : 'natural'
                      }
                      onSelect={() => {
                        onSelect(card.cardId);
                        setSearch('');
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
