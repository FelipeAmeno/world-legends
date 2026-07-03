'use client';

import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import type { ChemLine, SBSnapshot, SlotDef, SquadSlots } from '@/lib/squad-builder';
import { getPositionCompat } from '@/lib/squad-builder';
import type { FormationKey } from '@/lib/squad-builder';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';
import type { DragSource } from '@/lib/squad-builder';

type Props = {
  formation: FormationKey;
  slots: readonly SlotDef[];
  occupied: SquadSlots;
  chemLines: ChemLine[];
  snapshot: SBSnapshot;
  dragOver: string | null;
  selectedSlotId: string | null;
  suggestions: CollectionCard[];
  onSlotClick: (slotId: string, occupied: boolean) => void;
  onSuggestion: (cardId: string) => void;
  onRemove: (slotId: string) => void;
};

// ─── Pitch SVG markings ───────────────────────────────────────────────────────

function PitchMarkings() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 130"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#081408" />
          <stop offset="50%" stopColor="#0c1e0c" />
          <stop offset="100%" stopColor="#081408" />
        </linearGradient>
        <pattern id="grassStripe" x="0" y="0" width="100" height="10" patternUnits="userSpaceOnUse">
          <rect width="100" height="5" fill="rgba(0,0,0,0.07)" />
          <rect y="5" width="100" height="5" fill="rgba(255,255,255,0.013)" />
        </pattern>
      </defs>
      <rect width="100" height="130" fill="url(#pitchGrad)" />
      <rect width="100" height="130" fill="url(#grassStripe)" />
      <rect x="3" y="3" width="94" height="124" rx="0.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
      <line x1="3" y1="65" x2="97" y2="65" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
      <circle cx="50" cy="65" r="9.5" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
      <circle cx="50" cy="65" r="0.7" fill="rgba(255,255,255,0.3)" />
      <rect x="19" y="3" width="62" height="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.45" />
      <rect x="31" y="3" width="38" height="8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <circle cx="50" cy="16" r="0.5" fill="rgba(255,255,255,0.25)" />
      <path d="M 38,21 A 9,9 0 0,0 62,21" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <rect x="19" y="109" width="62" height="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.45" />
      <rect x="31" y="119" width="38" height="8" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <circle cx="50" cy="115" r="0.5" fill="rgba(255,255,255,0.25)" />
      <path d="M 38,109 A 9,9 0 0,1 62,109" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.4" />
      <rect x="39" y="0.5" width="22" height="3.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      <rect x="39" y="126" width="22" height="3.5" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      {([
        [3, 3], [97, 3], [3, 127], [97, 127],
      ] as [number, number][]).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.2" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
      ))}
    </svg>
  );
}

// ─── Chemistry lines ─────────────────────────────────────────────────────────

function ChemistryLinesLayer({ lines }: { lines: ChemLine[] }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 130"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {lines.map((l, i) => (
          <filter key={i} id={`glow-pp-${i}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.7" result="blur" />
            <feFlood floodColor={l.glow} floodOpacity="0.9" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="g" />
            <feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        ))}
      </defs>
      {lines.map((l, i) => {
        const x1 = l.slotA.left;
        const y1 = l.slotA.top * (130 / 100);
        const x2 = l.slotB.left;
        const y2 = l.slotB.top * (130 / 100);
        const hasBoth = l.cardA && l.cardB;
        const sw = l.total >= 4 ? 0.9 : l.total >= 3 ? 0.7 : 0.5;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={l.color} strokeWidth={sw * 2.5} strokeOpacity={0.12} strokeLinecap="round" />
            <motion.line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={l.color} strokeWidth={sw} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: hasBoth ? 1 : 0.18 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              filter={hasBoth && l.total > 0 ? `url(#glow-pp-${i})` : undefined}
            />
            {l.total >= 4 && hasBoth && (
              <motion.circle
                cx={(x1 + x2) / 2} cy={(y1 + y2) / 2} r="0.8"
                fill={l.color}
                animate={{ r: [0.4, 1.2, 0.4], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Per-player chemistry color (perPlayer is Record<string, number>, scale 0–10) ───

function chemColor(perPlayer: SBSnapshot['chemistry']['perPlayer'], cardId: string) {
  const t = perPlayer[cardId] ?? 0;
  if (t >= 7) return '#22c55e';
  if (t >= 5) return '#3b82f6';
  if (t >= 3) return '#eab308';
  return '#ef4444';
}

// ─── Rarity glows ────────────────────────────────────────────────────────────

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.5)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(59,130,246,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,0.9)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

const POS_COLOR: Record<string, string> = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#3b82f6', RB: '#3b82f6',
  LWB: '#3b82f6', RWB: '#3b82f6', CDM: '#10b981', CM: '#10b981',
  CAM: '#10b981', LM: '#10b981', RM: '#10b981',
  LW: '#ef4444', RW: '#ef4444', CF: '#ef4444', ST: '#ef4444',
};

// ─── PitchSlot ────────────────────────────────────────────────────────────────

type SlotProps = {
  slot: SlotDef;
  card: CollectionCard | null;
  chemPerPlayer: SBSnapshot['chemistry']['perPlayer'];
  isDragOver: boolean;
  isSelected: boolean;
  onSlotClick: () => void;
  onRemove: () => void;
};

function PitchSlot({ slot, card, chemPerPlayer, isDragOver, isSelected, onSlotClick, onRemove }: SlotProps) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slot.slotId });
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    transform,
    isDragging,
  } = useDraggable({
    id: `slot-${slot.slotId}`,
    disabled: !card,
    data: { source: { kind: 'slot', slotId: slot.slotId, cardId: card?.cardId ?? '' } satisfies DragSource },
  });

  const mergedRef = useCallback(
    (node: HTMLElement | null) => { setDropRef(node); setDragRef(node); },
    [setDropRef, setDragRef],
  );

  const transformStyle = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  const visual = card ? RARITY_VISUAL[card.rarityCode] : null;
  const posColor = POS_COLOR[slot.position] ?? '#6b7280';
  const isActualOver = isOver || isDragOver;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${slot.left}%`,
    top: `${slot.top}%`,
    transform: 'translate(-50%,-50%)',
  };

  if (card) {
    const compat = getPositionCompat(card.position, slot.position);
    const compatDot =
      compat === 'natural' ? '#22c55e' : compat === 'ok' ? '#eab308' : '#ef4444';
    const cardChem = chemColor(chemPerPlayer, card.cardId);

    return (
      <div data-squad-slot style={style}>
        <div
          ref={mergedRef}
          {...attributes}
          {...listeners}
          className="relative group cursor-grab active:cursor-grabbing touch-none"
          style={transformStyle}
          onClick={(e) => { e.stopPropagation(); onSlotClick(); }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={card.cardId + slot.slotId}
              initial={{ scale: 0.5, opacity: 0, y: 8 }}
              animate={{ scale: isDragging ? 0.85 : 1, opacity: isDragging ? 0.3 : 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              {...(!isDragging ? { whileHover: { scale: 1.1, y: -3 } } : {})}
            >
              <div
                className={`relative w-14 h-[72px] rounded-xl border-2 flex flex-col overflow-hidden shadow-lg ${visual?.bgClass ?? ''} ${visual?.borderClass ?? ''}`}
                style={{ boxShadow: `0 0 18px ${RARITY_GLOW[card.rarityCode]}, 0 4px 16px rgba(0,0,0,0.6)` }}
              >
                {/* OVR */}
                <div className="flex-1 flex items-center justify-center pt-1">
                  <p
                    className="font-display text-2xl leading-none"
                    style={{
                      background: `linear-gradient(180deg, #fff, ${RARITY_GLOW[card.rarityCode]})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {card.overall}
                  </p>
                </div>
                {/* Name + position */}
                <div className="pb-1 px-0.5" style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.85),transparent)' }}>
                  <p className="text-parchment text-[7px] font-bold text-center truncate leading-tight">
                    {card.displayName.split(' ').pop()}
                  </p>
                  <p className="text-white/40 text-[6px] text-center">{slot.position}</p>
                </div>

                {/* Position compat dot */}
                <div
                  className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full ring-1 ring-black/40"
                  style={{ background: compatDot }}
                  title={compat}
                />
                {/* Chemistry dot */}
                <div
                  className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full ring-1 ring-black/40"
                  style={{ background: cardChem }}
                  title="química"
                />
              </div>

              {/* Remove */}
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[7px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
              >
                ✕
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Empty slot
  return (
    <div data-squad-slot style={style} ref={setDropRef}>
      <motion.button
        className="w-12 h-12 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-0.5 focus:outline-none"
        animate={
          isSelected
            ? { scale: 1.25, borderColor: '#c9a84c', backgroundColor: 'rgba(201,168,76,0.15)' }
            : isActualOver
              ? { scale: 1.2, borderColor: posColor, backgroundColor: `${posColor}20` }
              : { scale: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.03)' }
        }
        transition={{ duration: 0.15 }}
        onClick={(e) => { e.stopPropagation(); onSlotClick(); }}
      >
        <span
          className="text-[9px] font-bold"
          style={{ color: isSelected ? '#c9a84c' : isActualOver ? posColor : 'rgba(255,255,255,0.3)' }}
        >
          {slot.position}
        </span>
        {isSelected && (
          <motion.span
            className="text-[7px] text-gold"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            ✦
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}

// ─── Suggestion pills near selected slot ─────────────────────────────────────

type SuggestionPanelProps = {
  slot: SlotDef;
  suggestions: CollectionCard[];
  onPick: (cardId: string) => void;
  onClose: () => void;
};

function SuggestionPanel({ slot, suggestions, onPick, onClose }: SuggestionPanelProps) {
  if (suggestions.length === 0) return null;

  // Position panel above or below the slot
  const above = slot.top > 50;
  return (
    <div
      data-squad-slot
      className="absolute z-40 flex flex-col gap-1"
      style={{
        left: `${slot.left}%`,
        top: above ? `${slot.top - 2}%` : `${slot.top + 2}%`,
        transform: above
          ? 'translate(-50%, calc(-100% - 16px))'
          : 'translate(-50%, 16px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-0.5">
        <span className="text-[8px] text-gold uppercase tracking-widest">Sugestões</span>
        <button onClick={onClose} className="text-[8px] text-white/30 hover:text-white/60">✕</button>
      </div>
      {/* Cards */}
      <div className="flex gap-1.5">
        {suggestions.map((card, i) => {
          const visual = RARITY_VISUAL[card.rarityCode];
          return (
            <motion.button
              key={card.cardId}
              data-squad-slot
              initial={{ opacity: 0, y: above ? 8 : -8, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 360, damping: 26 }}
              onClick={(e) => { e.stopPropagation(); onPick(card.cardId); }}
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.92 }}
              className={`relative w-12 h-[60px] rounded-lg border-2 flex flex-col overflow-hidden ${visual.bgClass} ${visual.borderClass}`}
              style={{ boxShadow: `0 0 12px ${RARITY_GLOW[card.rarityCode]}` }}
              title={`${card.displayName} · ${card.position} · ${card.overall}`}
            >
              <div className="flex-1 flex items-center justify-center">
                <p
                  className="font-display text-xl leading-none"
                  style={{
                    background: `linear-gradient(180deg, #fff, ${RARITY_GLOW[card.rarityCode]})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {card.overall}
                </p>
              </div>
              <div className="pb-0.5 px-0.5" style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.85),transparent)' }}>
                <p className="text-parchment text-[6px] font-bold text-center truncate">
                  {card.displayName.split(' ').pop()}
                </p>
              </div>
              {/* Compat dot */}
              {(() => {
                const compat = getPositionCompat(card.position, slot.position);
                const dot = compat === 'natural' ? '#22c55e' : compat === 'ok' ? '#eab308' : '#ef4444';
                return (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                );
              })()}
            </motion.button>
          );
        })}
      </div>
      {/* Arrow */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{ [above ? 'bottom' : 'top']: '-6px', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', [above ? 'borderTop' : 'borderBottom']: '6px solid rgba(201,168,76,0.4)' }}
      />
    </div>
  );
}

// ─── Main PremiumPitch ────────────────────────────────────────────────────────

export function PremiumPitch({
  slots,
  occupied,
  chemLines,
  snapshot,
  dragOver,
  selectedSlotId,
  suggestions,
  onSlotClick,
  onSuggestion,
  onRemove,
}: Props) {
  const selectedSlotDef = slots.find((s) => s.slotId === selectedSlotId) ?? null;

  return (
    <div className="relative flex-1 overflow-hidden" style={{ minHeight: 0 }}>
      <div className="absolute inset-0">
        <PitchMarkings />
        <ChemistryLinesLayer lines={chemLines} />

        {slots.map((slot) => {
          const card = occupied[slot.slotId] ?? null;
          return (
            <PitchSlot
              key={slot.slotId}
              slot={slot}
              card={card}
              chemPerPlayer={snapshot.chemistry.perPlayer}
              isDragOver={dragOver === slot.slotId}
              isSelected={selectedSlotId === slot.slotId}
              onSlotClick={() => onSlotClick(slot.slotId, card !== null)}
              onRemove={() => onRemove(slot.slotId)}
            />
          );
        })}

        {/* Suggestion panel */}
        <AnimatePresence>
          {selectedSlotDef && suggestions.length > 0 && (
            <motion.div
              key={selectedSlotId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            >
              <SuggestionPanel
                slot={selectedSlotDef}
                suggestions={suggestions}
                onPick={onSuggestion}
                onClose={() => onSlotClick(selectedSlotDef.slotId, false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
