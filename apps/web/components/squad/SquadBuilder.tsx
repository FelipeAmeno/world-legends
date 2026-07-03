'use client';

import type { CollectionCard } from '@/lib/collection-data';
import {
  FORMATIONS,
  FORMATION_LABELS,
  type FormationKey,
  MAX_BENCH,
  type SquadState,
  calculateSnapshot,
  changeFormation,
  createEmptyState,
  getPositionCompat,
} from '@/lib/squad-data';
/**
 * SquadBuilder — orquestrador do montador de time.
 *
 * Gerencia todo o estado de drag-and-drop, substituições e cálculos.
 * HTML5 native DnD: zero dependências externas.
 *
 * Fluxo de drag:
 *   Pool  → Slot:  coloca no slot (remove do pool)
 *   Slot  → Slot:  troca os dois cards
 *   Slot  → Bench: move para banco (libera slot)
 *   Bench → Slot:  coloca no slot (libera banco)
 *   Bench → Pool:  devolve ao pool
 *   Pool  → Bench: coloca no banco
 *
 * Estado centralizado aqui; componentes filhos são puramente presentacionais.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { BenchRow } from './BenchRow';
import { CardPool } from './CardPool';
import { FormationPicker } from './FormationPicker';
import { PitchField } from './PitchField';
import { SquadStatsPanel } from './SquadStatsPanel';

// ─── Drag source type ─────────────────────────────────────────────────────────

type DragSource =
  | { type: 'pool'; cardId: string }
  | { type: 'slot'; cardId: string; slotId: string }
  | { type: 'bench'; cardId: string; benchIdx: number };

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  allCards: CollectionCard[];
};

export function SquadBuilder({ allCards }: Props) {
  const [squadState, setSquadState] = useState<SquadState>(() => createEmptyState('4-3-3'));
  const dragging = useRef<DragSource | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null); // slotId | 'bench-N' | 'pool'

  // Cards não no squad nem no banco
  const usedCardIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(squadState.slots).forEach((c) => c && ids.add(c.cardId));
    squadState.bench.forEach((c) => c && ids.add(c.cardId));
    return ids;
  }, [squadState]);

  const poolCards = useMemo(
    () => allCards.filter((c) => !usedCardIds.has(c.cardId)),
    [allCards, usedCardIds],
  );

  // Snapshot de química e OVR
  const snapshot = useMemo(() => calculateSnapshot(squadState), [squadState]);

  // ── Handlers de drag ────────────────────────────────────────────────────────

  const handleDragStart = useCallback((source: DragSource, e: React.DragEvent) => {
    dragging.current = source;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', source.cardId);
  }, []);

  const handleDragOver = useCallback((targetId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(targetId);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(null), []);

  const handleDrop = useCallback(
    (target: DropTarget, _e: React.DragEvent) => {
      setDragOver(null);
      const src = dragging.current;
      dragging.current = null;
      if (!src) return;

      setSquadState((prev) => applyDrop(prev, src, target, allCards));
    },
    [allCards],
  );

  const handleDragEnd = useCallback(() => {
    dragging.current = null;
    setDragOver(null);
  }, []);

  // ── Trocar formação ──────────────────────────────────────────────────────────

  const handleFormationChange = useCallback((f: FormationKey) => {
    setSquadState((prev) => changeFormation(prev, f));
  }, []);

  // ── Remover jogador (click no slot ocupado) ──────────────────────────────────

  const handleRemoveFromSlot = useCallback((slotId: string) => {
    setSquadState((prev) => {
      const card = prev.slots[slotId];
      if (!card) return prev;
      return { ...prev, slots: { ...prev.slots, [slotId]: null } };
    });
  }, []);

  const handleRemoveFromBench = useCallback((idx: number) => {
    setSquadState((prev) => {
      const bench = [...prev.bench];
      bench[idx] = null;
      return { ...prev, bench };
    });
  }, []);

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Top bar: formação + OVR geral */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <FormationPicker
          current={squadState.formation}
          options={Object.keys(FORMATION_LABELS) as FormationKey[]}
          labels={FORMATION_LABELS}
          onChange={handleFormationChange}
        />
        <div className="flex items-center gap-4 shrink-0">
          <SnapshotBadge label="OVR" value={snapshot.rating.overall || '—'} color="gold-text" />
          <SnapshotBadge
            label="Química"
            value={snapshot.chemistry.total ? `${snapshot.chemistry.total}/100` : '—'}
            color="text-emerald-400"
          />
          <SnapshotBadge
            label="Titulares"
            value={`${snapshot.starterCount}/11`}
            color="text-muted"
          />
        </div>
      </div>

      {/* Main: campo + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* Campo */}
        <div className="lg:col-span-3">
          <PitchField
            formation={squadState.formation}
            slots={FORMATIONS[squadState.formation]}
            occupied={squadState.slots}
            dragOverSlot={dragOver}
            onDragStart={(slotId, cardId, e) =>
              handleDragStart({ type: 'slot', cardId, slotId }, e)
            }
            onDragOver={(slotId, e) => handleDragOver(slotId, e)}
            onDragLeave={handleDragLeave}
            onDrop={(slotId, e) => handleDrop({ type: 'slot', slotId }, e)}
            onRemove={handleRemoveFromSlot}
            draggingCardId={dragging.current?.cardId ?? null}
            getCurrentDrag={() => dragging.current}
          />
        </div>

        {/* Painel de stats */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto">
          <SquadStatsPanel snapshot={snapshot} />
        </div>
      </div>

      {/* Banco */}
      <BenchRow
        bench={squadState.bench}
        dragOver={dragOver}
        onDragStart={(idx, cardId, e) =>
          handleDragStart({ type: 'bench', cardId, benchIdx: idx }, e)
        }
        onDragOver={(idx, e) => handleDragOver(`bench-${idx}`, e)}
        onDragLeave={handleDragLeave}
        onDrop={(idx, e) => handleDrop({ type: 'bench', benchIdx: idx }, e)}
        onRemove={handleRemoveFromBench}
        onDragEnd={handleDragEnd}
      />

      {/* Pool de cartas */}
      <CardPool
        cards={poolCards}
        dragOver={dragOver === 'pool'}
        onDragStart={(cardId, e) => handleDragStart({ type: 'pool', cardId }, e)}
        onDragOver={(e) => handleDragOver('pool', e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop({ type: 'pool' }, e)}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}

// ─── Drop target type ─────────────────────────────────────────────────────────

type DropTarget =
  | { type: 'slot'; slotId: string }
  | { type: 'bench'; benchIdx: number }
  | { type: 'pool' };

// ─── applyDrop — lógica pura de substituição ─────────────────────────────────

function applyDrop(
  state: SquadState,
  src: DragSource,
  target: DropTarget,
  allCards: CollectionCard[],
): SquadState {
  const cardMap = new Map(allCards.map((c) => [c.cardId, c]));
  const getCard = (id: string) => cardMap.get(id) ?? null;

  const slots = { ...state.slots };
  const bench = [...state.bench];

  // Helper: remover card de sua origem
  function clearSource() {
    if (src.type === 'slot') {
      slots[src.slotId] = null;
    } else if (src.type === 'bench') {
      bench[src.benchIdx] = null;
    }
    // pool: nada a limpar (card estava disponível)
  }

  const srcCard = getCard(src.cardId);
  if (!srcCard) return state;

  // Target: slot do campo
  if (target.type === 'slot') {
    const existingCard = slots[target.slotId] ?? null;
    clearSource();

    if (existingCard && existingCard.cardId !== srcCard.cardId) {
      // Trocar: devolver carta existente à origem
      if (src.type === 'slot') slots[src.slotId] = existingCard;
      else if (src.type === 'bench') bench[src.benchIdx] = existingCard;
      // pool: carta existente fica disponível (vai pro pool implicitamente)
    }
    slots[target.slotId] = srcCard;
  }

  // Target: banco
  else if (target.type === 'bench') {
    const existingCard = bench[target.benchIdx] ?? null;
    clearSource();

    if (existingCard && existingCard.cardId !== srcCard.cardId) {
      // Trocar com slot/bench de origem
      if (src.type === 'slot') slots[src.slotId] = existingCard;
      else if (src.type === 'bench') bench[src.benchIdx] = existingCard;
    }

    // Verificar limite do banco (7)
    const filledCount = bench.filter((c) => c !== null).length;
    if (existingCard !== null || filledCount < MAX_BENCH) {
      bench[target.benchIdx] = srcCard;
    }
  }

  // Target: pool (devolver ao pool = apenas remover da origem)
  else if (target.type === 'pool') {
    clearSource();
  }

  return { ...state, slots, bench };
}

// ─── SnapshotBadge ────────────────────────────────────────────────────────────

function SnapshotBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-1.5 text-center min-w-[64px]">
      <p className={`font-display text-xl leading-none ${color}`}>{value}</p>
      <p className="text-muted text-[9px] uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
