'use client';

import { PlayerCard } from '@/components/cards/PlayerCard';
import type { CollectionCard } from '@/lib/collection-data';
import { getPositionCompat } from '@/lib/squad-builder';
import type { SBSnapshot } from '@/lib/squad-builder';
import type { Position } from '@world-legends/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

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
  currentCard: CollectionCard | null;
  pool: CollectionCard[];
  getPreview: (cardId: string) => { before: SBSnapshot; after: SBSnapshot } | null;
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
  const compatColor = compat === 'natural' ? '#22c55e' : compat === 'ok' ? '#eab308' : '#ef4444';

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.93 }}
      className={['relative shrink-0', compat === 'awkward' ? 'opacity-40' : ''].join(' ')}
    >
      <PlayerCard card={card} size="xs" glow />
      {/* Compat dot */}
      <div
        className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full ring-1 ring-black/60 z-10"
        style={{ background: compatColor }}
      />
    </motion.button>
  );
}

// ─── Comparação antes/depois ("nunca trocar no escuro") ───────────────────────

function DeltaRow({
  label,
  before,
  after,
  color,
}: {
  label: string;
  before: number;
  after: number;
  color: string;
}) {
  const delta = after - before;
  const deltaColor = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : 'rgba(255,255,255,0.35)';
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-[9px] uppercase tracking-wide font-bold" style={{ color }}>
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-white/35 tabular-nums">{before || '—'}</span>
        <span className="text-white/15 text-[10px]">→</span>
        <span className="text-[14px] font-black text-white tabular-nums">{after || '—'}</span>
        <span
          className="text-[9px] font-bold tabular-nums w-8 text-right"
          style={{ color: deltaColor }}
        >
          {delta > 0 ? `+${delta}` : delta < 0 ? delta : '±0'}
        </span>
      </div>
    </div>
  );
}

function MiniCard({ card, label }: { card: CollectionCard | null; label: string }) {
  if (!card) {
    return (
      <div className="w-[62px] h-[84px] rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center shrink-0">
        <span className="text-white/20 text-[8px]">vazio</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <PlayerCard card={card} size="xs" glow />
      <span className="text-[8px] text-white/30 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function ComparePanel({
  currentCard,
  pendingCard,
  preview,
  onConfirm,
  onCancel,
}: {
  currentCard: CollectionCard | null;
  pendingCard: CollectionCard;
  preview: { before: SBSnapshot; after: SBSnapshot } | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="px-4 pb-4"
    >
      <p className="text-[9px] text-white/30 uppercase tracking-widest mb-2.5 text-center">
        {currentCard ? 'Confirmar substituição' : 'Confirmar entrada'}
      </p>

      <div className="flex items-center justify-center gap-4 mb-4">
        <MiniCard card={currentCard} label="Atual" />
        <span className="text-gold text-lg">→</span>
        <MiniCard card={pendingCard} label="Novo" />
      </div>

      {preview && (
        <div className="rounded-xl bg-white/[0.03] border border-white/8 px-3 py-1.5 mb-4">
          <DeltaRow
            label="OVR"
            before={preview.before.rating.overall}
            after={preview.after.rating.overall}
            color="#c9a84c"
          />
          <DeltaRow
            label="Química"
            before={preview.before.chemistry.total}
            after={preview.after.chemistry.total}
            color="#60a5fa"
          />
          <DeltaRow
            label="Ataque"
            before={preview.before.rating.attack}
            after={preview.after.rating.attack}
            color="#ef4444"
          />
          <DeltaRow
            label="Meio"
            before={preview.before.rating.midfield}
            after={preview.after.rating.midfield}
            color="#10b981"
          />
          <DeltaRow
            label="Defesa"
            before={preview.before.rating.defense}
            after={preview.after.rating.defense}
            color="#3b82f6"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wide bg-white/6 border border-white/10 text-white/50"
        >
          Cancelar
        </button>
        <motion.button
          type="button"
          onClick={onConfirm}
          whileTap={{ scale: 0.96 }}
          className="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
            color: '#050508',
            boxShadow: '0 4px 16px rgba(201,168,76,0.35)',
          }}
        >
          Confirmar
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export function PlayerSelectModal({
  open,
  slotPosition,
  currentCard,
  pool,
  getPreview,
  onSelect,
  onClose,
}: Props) {
  const defaultSector = slotPosition ? positionSector(slotPosition) : 'all';
  const [sector, setSector] = useState<Sector>(defaultSector);
  const [search, setSearch] = useState('');
  const [pendingCard, setPendingCard] = useState<CollectionCard | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset trigger, body doesn't need to read these
  useEffect(() => {
    setPendingCard(null);
  }, [open, slotPosition]);

  const preview = useMemo(
    () => (pendingCard ? getPreview(pendingCard.cardId) : null),
    [pendingCard, getPreview],
  );

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

  // Nunca renderiza a coleção inteira de uma vez — corta em lotes de 60 cartas
  const RENDER_CAP = 60;
  const visibleCards = filtered.slice(0, RENDER_CAP);
  const hiddenCount = filtered.length - visibleCards.length;

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
                  {pendingCard ? 'Antes de trocar' : 'Escolher jogador'}
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

            <AnimatePresence mode="wait">
              {pendingCard ? (
                <ComparePanel
                  key="compare"
                  currentCard={currentCard}
                  pendingCard={pendingCard}
                  preview={preview}
                  onConfirm={() => {
                    onSelect(pendingCard.cardId);
                    setSearch('');
                    setPendingCard(null);
                  }}
                  onCancel={() => setPendingCard(null)}
                />
              ) : (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col min-h-0 flex-1"
                >
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
                      <>
                        <div className="flex flex-wrap gap-2.5">
                          {visibleCards.map((card) => (
                            <CardCell
                              key={card.cardId}
                              card={card}
                              compat={
                                slotPosition
                                  ? getPositionCompat(card.position, slotPosition)
                                  : 'natural'
                              }
                              onSelect={() => setPendingCard(card)}
                            />
                          ))}
                        </div>
                        {hiddenCount > 0 && (
                          <p className="text-white/20 text-[9px] text-center pt-3">
                            +{hiddenCount} cartas — refine a busca para ver mais
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
