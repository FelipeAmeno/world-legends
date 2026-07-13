'use client';

import { ResolvedWorldLegendsCard } from '@/components/cards/ResolvedWorldLegendsCard';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import type { ChemLine, SBSnapshot, SlotDef, SquadSlots } from '@/lib/squad-builder';
import { getPositionCompat } from '@/lib/squad-builder';
import type { FormationKey } from '@/lib/squad-builder';
import type { DragSource } from '@/lib/squad-builder';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';

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

// ─── Rarity chrome (usado pelo SuggestionPanel) ───────────────────────────────

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(150,150,150,0.45)',
  rare: 'rgba(147,51,234,0.65)',
  elite: 'rgba(59,130,246,0.75)',
  legendary: 'rgba(201,168,76,0.85)',
  ultra: 'rgba(236,72,153,0.90)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

const POS_COLOR: Record<string, string> = {
  GK: '#f59e0b',
  CB: '#3b82f6',
  LB: '#3b82f6',
  RB: '#3b82f6',
  LWB: '#3b82f6',
  RWB: '#3b82f6',
  CDM: '#10b981',
  CM: '#10b981',
  CAM: '#10b981',
  LM: '#10b981',
  RM: '#10b981',
  LW: '#ef4444',
  RW: '#ef4444',
  CF: '#ef4444',
  ST: '#ef4444',
};

// ─── PitchCard — versão xs da carta premium compartilhada ────────────────────

function PitchCard({
  card,
  isDragging,
  chemScore,
  compat,
}: {
  card: CollectionCard;
  isDragging: boolean;
  chemScore: number;
  compat: 'natural' | 'ok' | 'awkward';
}) {
  const compatDot = compat === 'natural' ? '#22c55e' : compat === 'ok' ? '#eab308' : '#ef4444';
  const chemDot =
    chemScore >= 7
      ? '#22c55e'
      : chemScore >= 5
        ? '#60a5fa'
        : chemScore >= 3
          ? '#eab308'
          : '#ef4444';

  return (
    <div style={{ position: 'relative', opacity: isDragging ? 0.2 : 1, flexShrink: 0 }}>
      {/* Sprint 39 — density Compact explícita: slot do campo nunca pede
          Standard/Showcase. resolvePlayerCardRendererForDensity decide
          full-artwork vs. procedural, este componente não sabe qual
          jogador tem preset. */}
      <ResolvedWorldLegendsCard card={card} size="xs" density="compact" glow />

      {/* Status dots: compat + química — canto inferior direito, sobre a faixa do nome */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          right: 4,
          zIndex: 10,
          display: 'flex',
          gap: 3,
        }}
      >
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: compatDot,
            boxShadow: `0 0 4px ${compatDot}`,
          }}
        />
        <div
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: chemDot,
            boxShadow: `0 0 4px ${chemDot}`,
          }}
        />
      </div>
    </div>
  );
}

// ─── Pitch SVG markings ───────────────────────────────────────────────────────

function PitchMarkings() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 130"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="pitchGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#071507" />
          <stop offset="40%" stopColor="#0b200b" />
          <stop offset="100%" stopColor="#071507" />
        </linearGradient>
        <pattern
          id="grassStripe2"
          x="0"
          y="0"
          width="100"
          height="12"
          patternUnits="userSpaceOnUse"
        >
          <rect width="100" height="6" fill="rgba(0,0,0,0.09)" />
          <rect y="6" width="100" height="6" fill="rgba(255,255,255,0.017)" />
        </pattern>
      </defs>
      <rect width="100" height="130" fill="url(#pitchGrad2)" />
      <rect width="100" height="130" fill="url(#grassStripe2)" />

      {/* Outer border */}
      <rect
        x="2.5"
        y="2.5"
        width="95"
        height="125"
        rx="0.5"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.65"
      />

      {/* Center line */}
      <line x1="2.5" y1="65" x2="97.5" y2="65" stroke="rgba(255,255,255,0.22)" strokeWidth="0.55" />

      {/* Center circle */}
      <circle
        cx="50"
        cy="65"
        r="10"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.55"
      />
      <circle cx="50" cy="65" r="0.8" fill="rgba(255,255,255,0.35)" />

      {/* Top penalty area (large) */}
      <rect
        x="18"
        y="2.5"
        width="64"
        height="20"
        fill="none"
        stroke="rgba(255,255,255,0.17)"
        strokeWidth="0.5"
      />
      {/* Top goal area (small) */}
      <rect
        x="32"
        y="2.5"
        width="36"
        height="9"
        fill="none"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="0.45"
      />
      {/* Top penalty spot */}
      <circle cx="50" cy="15" r="0.6" fill="rgba(255,255,255,0.28)" />
      {/* Top penalty arc */}
      <path
        d="M 37,22.5 A 9.5,9.5 0 0,0 63,22.5"
        fill="none"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="0.45"
      />

      {/* Bottom penalty area (large) */}
      <rect
        x="18"
        y="107.5"
        width="64"
        height="20"
        fill="none"
        stroke="rgba(255,255,255,0.17)"
        strokeWidth="0.5"
      />
      {/* Bottom goal area (small) */}
      <rect
        x="32"
        y="118.5"
        width="36"
        height="9"
        fill="none"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="0.45"
      />
      {/* Bottom penalty spot */}
      <circle cx="50" cy="115" r="0.6" fill="rgba(255,255,255,0.28)" />
      {/* Bottom penalty arc */}
      <path
        d="M 37,107.5 A 9.5,9.5 0 0,1 63,107.5"
        fill="none"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="0.45"
      />

      {/* Goals */}
      <rect
        x="38"
        y="0"
        width="24"
        height="2.5"
        fill="none"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="0.55"
      />
      <rect
        x="38"
        y="127.5"
        width="24"
        height="2.5"
        fill="none"
        stroke="rgba(255,255,255,0.30)"
        strokeWidth="0.55"
      />

      {/* Corner arcs */}
      {(
        [
          [2.5, 2.5, 0, 90],
          [97.5, 2.5, 90, 180],
          [2.5, 127.5, 270, 360],
          [97.5, 127.5, 180, 270],
        ] as [number, number, number, number][]
      ).map(([cx, cy, startA, endA], i) => {
        const r = 2.5;
        const toRad = (a: number) => (a * Math.PI) / 180;
        const x1 = cx + r * Math.cos(toRad(startA));
        const y1 = cy + r * Math.sin(toRad(startA));
        const x2 = cx + r * Math.cos(toRad(endA));
        const y2 = cy + r * Math.sin(toRad(endA));
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
            fill="none"
            stroke="rgba(255,255,255,0.17)"
            strokeWidth="0.45"
          />
        );
      })}
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
          <filter key={i} id={`glow-pp2-${i}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
            <feFlood floodColor={l.glow} floodOpacity="0.9" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        ))}
      </defs>
      {lines.map((l, i) => {
        const x1 = l.slotA.left;
        const y1 = l.slotA.top * (130 / 100);
        const x2 = l.slotB.left;
        const y2 = l.slotB.top * (130 / 100);
        const hasBoth = l.cardA && l.cardB;
        const sw = l.total >= 4 ? 1.0 : l.total >= 3 ? 0.8 : 0.55;
        return (
          <g key={i}>
            {/* Thick soft glow behind */}
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={l.color}
              strokeWidth={sw * 3}
              strokeOpacity={hasBoth ? 0.14 : 0.04}
              strokeLinecap="round"
            />
            {/* Main line */}
            <motion.line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={l.color}
              strokeWidth={sw}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: hasBoth ? 1 : 0.15 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              filter={hasBoth && l.total > 0 ? `url(#glow-pp2-${i})` : undefined}
            />
            {/* Perfect link pulse */}
            {l.total >= 4 && hasBoth && (
              <motion.circle
                cx={(x1 + x2) / 2}
                cy={(y1 + y2) / 2}
                r="1.0"
                fill={l.color}
                animate={{ r: [0.5, 1.5, 0.5], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

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

function PitchSlot({
  slot,
  card,
  chemPerPlayer,
  isDragOver,
  isSelected,
  onSlotClick,
  onRemove,
}: SlotProps) {
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
    data: {
      source: {
        kind: 'slot',
        slotId: slot.slotId,
        cardId: card?.cardId ?? '',
      } satisfies DragSource,
    },
  });

  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      setDropRef(node);
      setDragRef(node);
    },
    [setDropRef, setDragRef],
  );

  const transformStyle = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  const posColor = POS_COLOR[slot.position] ?? '#6b7280';
  const isActualOver = isOver || isDragOver;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${slot.left}%`,
    top: `${slot.top}%`,
    transform: 'translate(-50%,-50%)',
    zIndex: card ? 10 : 5,
  };

  if (card) {
    const compat = getPositionCompat(card.position, slot.position);
    const chemScore = chemPerPlayer[card.cardId] ?? 0;

    return (
      <div data-squad-slot style={style}>
        <div
          ref={mergedRef}
          {...attributes}
          {...listeners}
          className="relative group cursor-grab active:cursor-grabbing touch-none"
          style={transformStyle}
          onClick={(e) => {
            e.stopPropagation();
            onSlotClick();
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={card.cardId + slot.slotId}
              initial={{ scale: 0.55, opacity: 0, y: 10 }}
              animate={{ scale: isDragging ? 0.82 : 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.55, opacity: 0, y: -10 }}
              transition={{ type: 'spring', stiffness: 340, damping: 24 }}
              {...(!isDragging ? { whileHover: { scale: 1.12, y: -4 } } : {})}
            >
              <PitchCard
                card={card}
                isDragging={isDragging}
                chemScore={chemScore}
                compat={compat}
              />

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-[8px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-lg"
              >
                ✕
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // ── Empty slot ──
  return (
    <div data-squad-slot style={style} ref={setDropRef}>
      <motion.button
        type="button"
        className="w-14 h-14 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 focus:outline-none"
        animate={
          isSelected
            ? {
                scale: 1.2,
                borderColor: '#c9a84c',
                backgroundColor: 'rgba(201,168,76,0.18)',
                boxShadow: '0 0 16px rgba(201,168,76,0.45)',
              }
            : isActualOver
              ? {
                  scale: 1.18,
                  borderColor: posColor,
                  backgroundColor: `${posColor}25`,
                  boxShadow: `0 0 14px ${posColor}50`,
                }
              : {
                  scale: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  boxShadow: 'none',
                }
        }
        transition={{ duration: 0.18 }}
        onClick={(e) => {
          e.stopPropagation();
          onSlotClick();
        }}
      >
        <span
          className="text-[10px] font-black uppercase tracking-wide"
          style={{
            color: isSelected ? '#c9a84c' : isActualOver ? posColor : 'rgba(255,255,255,0.28)',
          }}
        >
          {slot.position}
        </span>
        {isSelected && (
          <motion.span
            className="text-[8px] text-gold"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY }}
          >
            ✦
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}

// ─── Suggestion pills ─────────────────────────────────────────────────────────

function SuggestionPanel({
  slot,
  suggestions,
  onPick,
  onClose,
}: {
  slot: SlotDef;
  suggestions: CollectionCard[];
  onPick: (cardId: string) => void;
  onClose: () => void;
}) {
  if (suggestions.length === 0) return null;

  const above = slot.top > 50;
  return (
    <div
      data-squad-slot
      className="absolute z-40 flex flex-col gap-1"
      style={{
        left: `${slot.left}%`,
        top: above ? `${slot.top - 2}%` : `${slot.top + 2}%`,
        transform: above ? 'translate(-50%, calc(-100% - 18px))' : 'translate(-50%, 20px)',
      }}
    >
      <div className="flex items-center justify-between px-2 mb-0.5">
        <span className="text-[8px] text-gold uppercase tracking-widest font-bold">Sugestões</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[8px] text-white/30 hover:text-white/60 ml-3"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-1.5">
        {suggestions.map((card, i) => {
          const visual = RARITY_VISUAL[card.rarityCode];
          const compat = getPositionCompat(card.position, slot.position);
          const dot = compat === 'natural' ? '#22c55e' : compat === 'ok' ? '#eab308' : '#ef4444';
          const glow = RARITY_GLOW[card.rarityCode];
          return (
            <motion.button
              key={card.cardId}
              type="button"
              data-squad-slot
              initial={{ opacity: 0, y: above ? 8 : -8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 360, damping: 26 }}
              onClick={(e) => {
                e.stopPropagation();
                onPick(card.cardId);
              }}
              whileHover={{ scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.92 }}
              className={`relative w-12 h-[60px] rounded-lg border-2 flex flex-col overflow-hidden ${visual.bgClass} ${visual.borderClass}`}
              style={{ boxShadow: `0 0 12px ${glow}` }}
              title={`${card.displayName} · ${card.position} · ${card.overall}`}
            >
              <div className="flex-1 flex items-center justify-center">
                <p
                  className="font-display text-xl leading-none"
                  style={{
                    background: `linear-gradient(180deg, #fff, ${glow})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {card.overall}
                </p>
              </div>
              <div
                className="pb-0.5 px-0.5"
                style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.85),transparent)' }}
              >
                <p className="text-parchment text-[6px] font-bold text-center truncate">
                  {card.displayName.split(' ').slice(-1)[0]}
                </p>
              </div>
              <div
                className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-black/40"
                style={{ background: dot }}
              />
            </motion.button>
          );
        })}
      </div>
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          [above ? 'bottom' : 'top']: '-6px',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          [above ? 'borderTop' : 'borderBottom']: '6px solid rgba(201,168,76,0.4)',
        }}
      />
    </div>
  );
}

// ─── PremiumPitch ─────────────────────────────────────────────────────────────

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
    <div className="absolute inset-0 overflow-hidden">
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

        <AnimatePresence>
          {selectedSlotDef && suggestions.length > 0 && (
            <motion.div
              key={selectedSlotId}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
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
