'use client';

import type { SaveSquadInput } from '@/lib/actions';
import { saveSquad } from '@/lib/actions';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import {
  type DragSource,
  FORMATIONS,
  FORMATION_LABELS,
  type FormationKey,
  type SBState,
  buildChemLines,
  calcSnapshot,
  createSBState,
  getAutoSuggest,
  getPoolCards,
  getPositionCompat,
  sbReducer,
} from '@/lib/squad-builder';
import type { DropTarget } from '@/lib/squad-builder';
import {
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { BenchStrip } from './BenchStrip';
import { CardPoolSheet } from './CardPoolSheet';
import { FormationSelect } from './FormationSelect';
import { PremiumPitch } from './PremiumPitch';
import { SquadOvrPanel } from './SquadOvrPanel';

// ─── DnD id helpers ──────────────────────────────────────────────────────────

function parseDropTarget(id: string): DropTarget {
  if (id === 'pool') return { kind: 'pool' };
  if (id.startsWith('bench-')) {
    const idx = Number.parseInt(id.replace('bench-', ''), 10);
    return { kind: 'bench', benchIdx: idx };
  }
  return { kind: 'slot', slotId: id };
}

// ─── Component ───────────────────────────────────────────────────────────────

type Props = {
  allCards: CollectionCard[];
  initialState?: Partial<SBState>;
};

export function PitchBuilder({ allCards, initialState }: Props) {
  const [state, dispatch] = useReducer(sbReducer, initialState ?? null, (init) => {
    const base = createSBState('4-3-3');
    if (!init) return base;
    return {
      ...base,
      ...(init.formation !== undefined ? { formation: init.formation } : {}),
      ...(init.slots !== undefined ? { slots: init.slots } : {}),
      ...(init.bench !== undefined ? { bench: init.bench } : {}),
    };
  });

  // ── Computed ──────────────────────────────────────────────────────────────
  const snapshot = useMemo(() => calcSnapshot(state), [state]);
  const chemLines = useMemo(() => buildChemLines(state, snapshot), [state, snapshot]);
  const pool = useMemo(() => getPoolCards(allCards, state), [allCards, state]);

  // ── Save state ────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // Auto-save: debounce 1.5s whenever state changes and has at least 1 card
  useEffect(() => {
    const starterCount = Object.values(state.slots).filter(Boolean).length;
    if (starterCount === 0) return;

    const key = JSON.stringify({
      formation: state.formation,
      slots: Object.fromEntries(
        Object.entries(state.slots).map(([k, v]) => [k, v?.cardId ?? null]),
      ),
      bench: state.bench.map((c) => c?.cardId ?? null),
    });
    if (key === lastSavedRef.current) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');

    saveTimerRef.current = setTimeout(async () => {
      const slots: SaveSquadInput['slots'] = [];
      for (const [slotId, card] of Object.entries(state.slots)) {
        if (card?.userCardId) slots.push({ slotId, userCardId: card.userCardId, isStarter: true });
      }
      state.bench.forEach((card, idx) => {
        if (card?.userCardId)
          slots.push({ slotId: `bench-${idx}`, userCardId: card.userCardId, isStarter: false, benchOrder: idx });
      });

      const result = await saveSquad({ formation: state.formation, slots });
      if (result.ok) {
        lastSavedRef.current = key;
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 1500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state]);

  // ── @dnd-kit setup ────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const [activeDragCard, setActiveDragCard] = useState<CollectionCard | null>(null);

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      const src = active.data.current?.source as DragSource | undefined;
      if (src) {
        dispatch({ type: 'DRAG_START', source: src });
        const card = allCards.find((c) => c.cardId === src.cardId) ?? null;
        setActiveDragCard(card);
      }
    },
    [allCards],
  );

  const handleDragOver = useCallback(({ over }: DragOverEvent) => {
    if (over) dispatch({ type: 'DRAG_OVER', targetId: String(over.id) });
    else dispatch({ type: 'DRAG_LEAVE' });
  }, []);

  const handleDragEnd = useCallback(
    ({ over }: DragEndEvent) => {
      setActiveDragCard(null);
      if (over) {
        const target = parseDropTarget(String(over.id));
        dispatch({ type: 'DROP', target, allCards });
      } else {
        dispatch({ type: 'DRAG_END' });
      }
    },
    [allCards],
  );

  // ── Slot selection for suggestions ────────────────────────────────────────
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const selectedSlotDef = useMemo(
    () =>
      selectedSlotId
        ? FORMATIONS[state.formation].find((s) => s.slotId === selectedSlotId) ?? null
        : null,
    [selectedSlotId, state.formation],
  );

  const suggestions = useMemo(
    () => (selectedSlotDef ? getAutoSuggest(selectedSlotDef.position, pool, 5) : []),
    [selectedSlotDef, pool],
  );

  const handleSlotClick = useCallback(
    (slotId: string, occupied: boolean) => {
      if (occupied) {
        setSelectedSlotId(null);
        return;
      }
      setSelectedSlotId((prev) => (prev === slotId ? null : slotId));
    },
    [],
  );

  const handleSuggestion = useCallback(
    (cardId: string) => {
      if (!selectedSlotId) return;
      dispatch({ type: 'PLACE_IN_SLOT', cardId, slotId: selectedSlotId, allCards });
      setSelectedSlotId(null);
    },
    [selectedSlotId, allCards],
  );

  const handleTapCard = useCallback(
    (cardId: string) => {
      if (selectedSlotId) {
        dispatch({ type: 'PLACE_IN_SLOT', cardId, slotId: selectedSlotId, allCards });
        setSelectedSlotId(null);
      } else {
        dispatch({ type: 'TAP_ADD', cardId, allCards });
      }
    },
    [selectedSlotId, allCards],
  );

  const handleAutoFill = useCallback(() => {
    dispatch({ type: 'AUTO_FILL', allCards });
    setSelectedSlotId(null);
  }, [allCards]);

  const handleClear = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
    setSelectedSlotId(null);
  }, []);

  const handleFormation = useCallback((f: FormationKey) => {
    dispatch({ type: 'CHANGE_FORMATION', formation: f });
    setSelectedSlotId(null);
  }, []);

  const handleRemoveSlot = useCallback(
    (slotId: string) => dispatch({ type: 'REMOVE_SLOT', slotId }),
    [],
  );
  const handleRemoveBench = useCallback(
    (idx: number) => dispatch({ type: 'REMOVE_BENCH', idx }),
    [],
  );

  // ── Save indicator ────────────────────────────────────────────────────────
  const saveDot =
    saveStatus === 'saving'
      ? { color: 'bg-yellow-400', label: 'salvando' }
      : saveStatus === 'saved'
        ? { color: 'bg-emerald-400', label: 'salvo' }
        : saveStatus === 'error'
          ? { color: 'bg-red-400', label: 'erro' }
          : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: dismiss on outside click */}
      <div
        className="flex flex-col h-full bg-[#060810] overflow-hidden"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-squad-slot]') === null &&
              (e.target as HTMLElement).closest('[data-squad-pool]') === null) {
            setSelectedSlotId(null);
          }
        }}
      >
        {/* ── Top bar ─── */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 gap-2 flex-wrap">
          <FormationSelect
            current={state.formation}
            options={Object.keys(FORMATION_LABELS) as FormationKey[]}
            labels={FORMATION_LABELS}
            onChange={handleFormation}
          />

          {/* Quick stats */}
          <div className="flex items-center gap-3">
            <QuickStat label="OVR" value={snapshot.rating.overall || '—'} color="gold-text" />
            <QuickStat
              label="QUÍM"
              value={snapshot.chemistry.total || '—'}
              color="text-emerald-400"
            />
            <QuickStat
              label="TITULARES"
              value={`${snapshot.starterCount}/11`}
              color="text-muted"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            {saveDot && (
              <div className="flex items-center gap-1.5">
                <motion.span
                  className={`w-1.5 h-1.5 rounded-full ${saveDot.color}`}
                  animate={saveStatus === 'saving' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.8, repeat: saveStatus === 'saving' ? Number.POSITIVE_INFINITY : 0 }}
                />
                <span className="text-[9px] text-white/40">{saveDot.label}</span>
              </div>
            )}
            <button
              onClick={handleAutoFill}
              className="text-[10px] px-2 py-1 rounded-lg border border-gold-dim/40 text-gold hover:bg-gold/10 transition-colors"
            >
              auto-fill
            </button>
            <button
              onClick={handleClear}
              className="text-[10px] text-muted hover:text-red-400 transition-colors px-1"
            >
              limpar
            </button>
          </div>
        </div>

        {/* ── Main area ─── */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Campo + banco */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <PremiumPitch
              formation={state.formation}
              slots={FORMATIONS[state.formation]}
              occupied={state.slots}
              chemLines={chemLines}
              snapshot={snapshot}
              dragOver={state.dragOver}
              selectedSlotId={selectedSlotId}
              suggestions={suggestions}
              onSlotClick={handleSlotClick}
              onSuggestion={handleSuggestion}
              onRemove={handleRemoveSlot}
            />

            <BenchStrip
              bench={state.bench}
              dragOver={state.dragOver}
              onRemove={handleRemoveBench}
            />
          </div>

          {/* Painel lateral (desktop) */}
          <div className="hidden lg:flex w-64 border-l border-white/5 overflow-y-auto flex-col">
            <SquadOvrPanel snapshot={snapshot} state={state} />
          </div>
        </div>

        {/* Pool de cartas */}
        <CardPoolSheet
          cards={pool}
          selectedSlotPos={selectedSlotDef?.position ?? null}
          dragOver={state.dragOver === 'pool'}
          onTapCard={handleTapCard}
        />
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
        {activeDragCard && <DragPreviewCard card={activeDragCard} />}
      </DragOverlay>
    </DndContext>
  );
}

// ─── QuickStat ───────────────────────────────────────────────────────────────

function QuickStat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <motion.div key={String(value)} initial={{ scale: 1.15, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
      <p className={`font-display text-base leading-none ${color}`}>{value}</p>
      <p className="text-[8px] text-white/25 uppercase tracking-wider mt-0.5">{label}</p>
    </motion.div>
  );
}

// ─── DragPreviewCard ─────────────────────────────────────────────────────────

function DragPreviewCard({ card }: { card: CollectionCard }) {
  const visual = RARITY_VISUAL[card.rarityCode];
  const GLOW: Record<string, string> = {
    common: 'rgba(150,150,150,0.5)',
    rare: 'rgba(147,51,234,0.7)',
    elite: 'rgba(59,130,246,0.8)',
    legendary: 'rgba(201,168,76,0.9)',
    ultra: 'rgba(236,72,153,0.9)',
    world_cup_hero: 'rgba(240,244,255,1)',
  };
  return (
    <div
      className={`w-14 h-[72px] rounded-xl border-2 flex flex-col overflow-hidden shadow-2xl rotate-2 ${visual.bgClass} ${visual.borderClass}`}
      style={{ boxShadow: `0 0 24px ${GLOW[card.rarityCode]}` }}
    >
      <div className="flex-1 flex items-center justify-center">
        <p
          className="font-display text-2xl leading-none"
          style={{
            background: `linear-gradient(180deg, #fff, ${GLOW[card.rarityCode]})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {card.overall}
        </p>
      </div>
      <div className="pb-1 px-0.5" style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.85),transparent)' }}>
        <p className="text-parchment text-[7px] font-bold text-center truncate">{card.displayName.split(' ').pop()}</p>
        <p className="text-white/40 text-[6px] text-center">{card.position}</p>
      </div>
    </div>
  );
}
