'use client';

import { OvrDisplay } from '@/components/ui/OvrDisplay';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import type { SlotDef, SquadSlots } from '@/lib/squad-data';
import { FORMATIONS, type FormationKey, getPositionCompat } from '@/lib/squad-data';
import type { DragSource } from './types';

type Props = {
  formation: FormationKey;
  slots: readonly SlotDef[];
  occupied: SquadSlots;
  dragOverSlot: string | null;
  draggingCardId: string | null;
  getCurrentDrag: () => DragSource | null;
  onDragStart: (slotId: string, cardId: string, e: React.DragEvent) => void;
  onDragOver: (slotId: string, e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (slotId: string, e: React.DragEvent) => void;
  onRemove: (slotId: string) => void;
};

export function PitchField({
  formation,
  slots,
  occupied,
  dragOverSlot,
  draggingCardId,
  getCurrentDrag,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
}: Props) {
  return (
    <div
      className="pitch-bg relative w-full rounded-2xl border border-[#1a4a1a] overflow-hidden select-none"
      style={{ paddingBottom: '140%' }}
    >
      {/* Marcações do campo */}
      <PitchMarkings />

      {/* Rótulo de formação */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
        <span className="text-[10px] font-bold text-white/30 tracking-widest">{formation}</span>
      </div>

      {/* Slots de jogadores */}
      {slots.map((slot) => {
        const card = occupied[slot.slotId] ?? null;
        const isDragOver = dragOverSlot === slot.slotId;
        const src = getCurrentDrag();
        const srcCard = src?.type !== 'pool' ? null : null; // A compatibilidade é visual apenas

        // Calcular compatibilidade se há drag em andamento
        let compat: 'natural' | 'ok' | 'awkward' | null = null;
        if (isDragOver && src) {
          // Precisamos da posição do card sendo arrastado
          // (guardada no draggingCardId + card map externo)
          // Para simplificar, mantemos feedback visual sem verificar posição aqui
          compat = null; // handled in slot
        }

        return (
          <PitchSlot
            key={slot.slotId}
            slot={slot}
            card={card}
            isDragOver={isDragOver}
            isDragging={card !== null && card.cardId === draggingCardId}
            onDragStart={(e) => card && onDragStart(slot.slotId, card.cardId, e)}
            onDragOver={(e) => onDragOver(slot.slotId, e)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(slot.slotId, e)}
            onRemove={() => onRemove(slot.slotId)}
          />
        );
      })}
    </div>
  );
}

// ─── PitchSlot ────────────────────────────────────────────────────────────────

type SlotProps = {
  slot: SlotDef;
  card: CollectionCard | null;
  isDragOver: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onRemove: () => void;
};

function PitchSlot({
  slot,
  card,
  isDragOver,
  isDragging,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
}: SlotProps) {
  const visual = card ? RARITY_VISUAL[card.rarityCode] : null;

  const dropHighlight = isDragOver ? 'ring-2 ring-gold/60 bg-gold/10' : '';

  const draggingOpacity = isDragging ? 'opacity-40' : 'opacity-100';

  return (
    <div
      className="player-node"
      style={{ top: `${slot.top}%`, left: `${slot.left}%` }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {card ? (
        // Slot ocupado — draggable
        <div
          draggable
          onDragStart={onDragStart}
          className={`relative group cursor-grab active:cursor-grabbing ${draggingOpacity} transition-opacity`}
        >
          {/* Círculo com OVR */}
          <div
            className={[
              'w-10 h-10 rounded-full border-2 flex items-center justify-center mx-auto',
              'bg-obsidian/95 backdrop-blur-sm transition-all',
              visual?.borderClass ?? 'border-gray-600',
              visual?.glowClass ?? '',
              dropHighlight,
            ].join(' ')}
          >
            <OvrDisplay value={card.overall} size="sm" />
          </div>

          {/* Botão remover (hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white
                       text-[8px] font-bold flex items-center justify-center
                       opacity-0 group-hover:opacity-100 transition-opacity z-30"
          >
            ✕
          </button>

          {/* Nome + posição */}
          <div className="mt-0.5 px-1.5 py-0.5 rounded bg-obsidian/85 backdrop-blur-sm max-w-[72px] mx-auto">
            <p className="text-parchment text-[8px] font-semibold leading-tight truncate whitespace-nowrap text-center">
              {card.displayName}
            </p>
            <p className={`text-[7px] text-center font-bold ${visual?.textClass ?? 'text-muted'}`}>
              {slot.position}
            </p>
          </div>
        </div>
      ) : (
        // Slot vazio — drop target
        <div
          className={[
            'w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center mx-auto',
            'transition-all duration-150',
            isDragOver
              ? 'border-gold bg-gold/15 scale-110'
              : 'border-white/20 bg-white/5 hover:border-white/40',
            dropHighlight,
          ].join(' ')}
        >
          <span className="text-white/30 text-xs">{slot.position}</span>
        </div>
      )}
    </div>
  );
}

// ─── Marcações do campo (SVG) ─────────────────────────────────────────────────

function PitchMarkings() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 100 140"
      preserveAspectRatio="xMidYMid meet"
    >
      <g stroke="rgba(255,255,255,0.10)" fill="none" strokeWidth="0.5">
        <rect x="4" y="4" width="92" height="132" rx="1" />
        <line x1="4" y1="70" x2="96" y2="70" />
        <circle cx="50" cy="70" r="10" />
        <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.15)" stroke="none" />
        <rect x="22" y="4" width="56" height="20" />
        <rect x="34" y="4" width="32" height="9" />
        <circle cx="50" cy="18" r="0.6" fill="rgba(255,255,255,0.2)" stroke="none" />
        <rect x="22" y="116" width="56" height="20" />
        <rect x="34" y="127" width="32" height="9" />
        <circle cx="50" cy="122" r="0.6" fill="rgba(255,255,255,0.2)" stroke="none" />
        <rect x="38" y="1.5" width="24" height="3" stroke="rgba(255,255,255,0.15)" />
        <rect x="38" y="135.5" width="24" height="3" stroke="rgba(255,255,255,0.15)" />
      </g>
    </svg>
  );
}
