'use client';

import type { SaveSquadInput } from '@/lib/actions';
import { saveSquad } from '@/lib/actions';
import type { CollectionCard } from '@/lib/collection-data';
import { RARITY_VISUAL } from '@/lib/collection-data';
import {
  type AutoBuildMode,
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
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { Particles, useBurst } from '@/components/fx/Particles';
import { toast } from '@/lib/wl-toast';
import Link from 'next/link';
import { AutoBuildSheet } from './AutoBuildSheet';
import { BenchStrip } from './BenchStrip';
import { CardPoolSheet } from './CardPoolSheet';
import { FormationSelect } from './FormationSelect';
import { PlayerSelectModal } from './PlayerSelectModal';
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
  favoriteIds?: ReadonlySet<string>;
};

export function PitchBuilder({ allCards, initialState, favoriteIds }: Props) {
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
          slots.push({
            slotId: `bench-${idx}`,
            userCardId: card.userCardId,
            isStarter: false,
            benchOrder: idx,
          });
      });

      const result = await saveSquad({ formation: state.formation, slots });
      if (result.ok) {
        lastSavedRef.current = key;
        setSaveStatus('saved');
        fireSaveBurst();
        toast.success('Squad salvo!', '⚽');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        toast.error('Erro ao salvar squad');
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
  const { trigger: saveBurst, fire: fireSaveBurst } = useBurst();

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

  // ── Slot selection & modals ───────────────────────────────────────────────
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [playerModalSlotId, setPlayerModalSlotId] = useState<string | null>(null);
  const [autoBuildOpen, setAutoBuildOpen] = useState(false);

  const selectedSlotDef = useMemo(
    () =>
      selectedSlotId
        ? (FORMATIONS[state.formation].find((s) => s.slotId === selectedSlotId) ?? null)
        : null,
    [selectedSlotId, state.formation],
  );

  const playerModalSlotDef = useMemo(
    () =>
      playerModalSlotId
        ? (FORMATIONS[state.formation].find((s) => s.slotId === playerModalSlotId) ?? null)
        : null,
    [playerModalSlotId, state.formation],
  );

  const suggestions = useMemo(
    () => (selectedSlotDef ? getAutoSuggest(selectedSlotDef.position, pool, 5) : []),
    [selectedSlotDef, pool],
  );

  const handleSlotClick = useCallback((slotId: string, occupied: boolean) => {
    if (occupied) {
      setSelectedSlotId(null);
      return;
    }
    setPlayerModalSlotId(slotId);
    setSelectedSlotId(slotId);
  }, []);

  const handlePlayerModalSelect = useCallback(
    (cardId: string) => {
      if (!playerModalSlotId) return;
      dispatch({ type: 'PLACE_IN_SLOT', cardId, slotId: playerModalSlotId, allCards });
      setPlayerModalSlotId(null);
      setSelectedSlotId(null);
    },
    [playerModalSlotId, allCards],
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

  const handleAutoBuild = useCallback(
    (mode: AutoBuildMode) => {
      dispatch({
        type: 'AUTO_BUILD',
        mode,
        allCards,
        ...(favoriteIds !== undefined ? { favoriteIds } : {}),
      });
      setSelectedSlotId(null);
    },
    [allCards, favoriteIds],
  );

  const handleAutoFill = useCallback(() => {
    dispatch({ type: 'AUTO_FILL', allCards });
    setSelectedSlotId(null);
  }, [allCards]);

  // Derived flags for AutoBuildSheet
  const hasBrazilians = useMemo(() => allCards.some((c) => c.nationality === 'BR'), [allCards]);
  const hasGoats = useMemo(
    () => allCards.some((c) => c.rarityCode === 'ultra' || c.rarityCode === 'world_cup_hero'),
    [allCards],
  );
  const hasFavorites = useMemo(
    () => favoriteIds != null && allCards.some((c) => favoriteIds.has(c.cardId)),
    [allCards, favoriteIds],
  );

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
        className="flex flex-col h-full bg-[#060810] overflow-hidden relative"
        onClick={(e) => {
          if (
            (e.target as HTMLElement).closest('[data-squad-slot]') === null &&
            (e.target as HTMLElement).closest('[data-squad-pool]') === null
          ) {
            setSelectedSlotId(null);
          }
        }}
      >
        {/* Save celebration particles */}
        <Particles preset="confetti" count={28} origin={{ x: 50, y: 8 }} trigger={saveBurst} />

        {/* ── Top bar ─── */}
        <div className="border-b border-white/5">
          {/* Row 1: formation + actions */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1.5 gap-2">
            <FormationSelect
              current={state.formation}
              options={Object.keys(FORMATION_LABELS) as FormationKey[]}
              labels={FORMATION_LABELS}
              onChange={handleFormation}
            />

            <div className="flex items-center gap-1.5 ml-auto">
              {saveDot && (
                <div className="flex items-center gap-1.5">
                  <motion.span
                    className={`w-1.5 h-1.5 rounded-full ${saveDot.color}`}
                    animate={saveStatus === 'saving' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                    transition={{
                      duration: 0.8,
                      repeat: saveStatus === 'saving' ? Number.POSITIVE_INFINITY : 0,
                    }}
                  />
                  <span className="text-[9px] text-white/40">{saveDot.label}</span>
                </div>
              )}
              <AnimatePresence>
                {saveStatus === 'saved' && snapshot.starterCount >= 11 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                  >
                    <Link
                      href="/match"
                      className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #064e3b, #065f46)',
                        border: '1px solid rgba(16,185,129,0.4)',
                        color: '#34d399',
                        boxShadow: '0 0 10px rgba(16,185,129,0.25)',
                      }}
                    >
                      ⚽ Jogar
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={() => setAutoBuildOpen(true)}
                className="text-[10px] px-2 py-1 rounded-lg border border-gold-dim/40 text-gold hover:bg-gold/10 transition-colors"
              >
                auto build
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] text-muted hover:text-red-400 transition-colors px-1"
              >
                limpar
              </button>
            </div>
          </div>

          {/* Row 2: OVR gigante + setores + química */}
          <div className="flex items-center gap-3 px-3 pb-2">
            {/* OVR principal */}
            <div className="flex items-baseline gap-1.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={snapshot.rating.overall}
                  className="font-display leading-none"
                  style={{
                    fontSize: 48,
                    background: snapshot.rating.overall
                      ? 'linear-gradient(180deg, #fff 0%, #c9a84c 100%)'
                      : 'rgba(255,255,255,0.15)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: snapshot.rating.overall ? '0 0 20px rgba(201,168,76,0.5)' : 'none',
                  }}
                  initial={{ scale: 1.25, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                >
                  {snapshot.rating.overall || '—'}
                </motion.span>
              </AnimatePresence>
              <div className="flex flex-col gap-0.5 pb-1">
                <span className="text-[8px] text-gold/60 uppercase tracking-widest font-bold">
                  OVR
                </span>
                <span className="text-[8px] text-muted">{snapshot.starterCount}/11</span>
              </div>
            </div>

            {/* Divisor */}
            <div className="w-px h-10 bg-white/8 shrink-0" />

            {/* Setores */}
            {snapshot.rating.overall > 0 && (
              <div className="flex gap-3 flex-1">
                <SectorMini label="ATK" value={snapshot.rating.attack} color="#ef4444" />
                <SectorMini label="MID" value={snapshot.rating.midfield} color="#10b981" />
                <SectorMini label="DEF" value={snapshot.rating.defense} color="#3b82f6" />
              </div>
            )}

            {/* Divisor */}
            {snapshot.rating.overall > 0 && <div className="w-px h-10 bg-white/8 shrink-0" />}

            {/* Química */}
            <div className="flex flex-col items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={snapshot.chemistry.total}
                  className="font-display text-2xl leading-none"
                  style={{
                    color:
                      snapshot.chemistry.total >= 80
                        ? '#34d399'
                        : snapshot.chemistry.total >= 60
                          ? '#60a5fa'
                          : snapshot.chemistry.total >= 40
                            ? '#fbbf24'
                            : 'rgba(255,255,255,0.3)',
                  }}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  {snapshot.chemistry.total || '—'}
                </motion.span>
              </AnimatePresence>
              <span className="text-[8px] text-muted uppercase tracking-wider">QUÍM</span>
            </div>
          </div>
        </div>

        {/* ── Empty squad guidance ─── */}
        <AnimatePresence>
          {snapshot.starterCount === 0 && allCards.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className="mx-3 my-1.5 px-4 py-2.5 rounded-xl flex items-center justify-between gap-3"
                style={{
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.2)',
                }}
              >
                <p className="text-[11px] text-gold/80">
                  Toque em um slot · arraste cartas · ou use <strong>auto build</strong>
                </p>
                <button
                  type="button"
                  onClick={() => setAutoBuildOpen(true)}
                  className="shrink-0 text-[10px] px-3 py-1 rounded-lg font-bold text-obsidian transition-all"
                  style={{ background: 'linear-gradient(135deg, #c9a84c, #e6c85a)' }}
                >
                  auto build
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* Player select modal (slot tap) */}
        <PlayerSelectModal
          open={playerModalSlotId !== null}
          slotPosition={playerModalSlotDef?.position ?? null}
          pool={pool}
          onSelect={handlePlayerModalSelect}
          onClose={() => {
            setPlayerModalSlotId(null);
            setSelectedSlotId(null);
          }}
        />

        {/* Auto Build sheet */}
        <AutoBuildSheet
          open={autoBuildOpen}
          hasFavorites={hasFavorites}
          hasBrazilians={hasBrazilians}
          hasGoats={hasGoats}
          onBuild={handleAutoBuild}
          onClose={() => setAutoBuildOpen(false)}
        />
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
        {activeDragCard && <DragPreviewCard card={activeDragCard} />}
      </DragOverlay>
    </DndContext>
  );
}

// ─── SectorMini ─────────────────────────────────────────────────────────────

function SectorMini({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round((value / 99) * 100);
  return (
    <div className="flex flex-col gap-0.5 min-w-[32px]">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[8px] font-bold" style={{ color }}>
          {label}
        </span>
        <motion.span
          key={value}
          className="font-display text-xs leading-none text-white/70"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 1 }}
        >
          {value || '—'}
        </motion.span>
      </div>
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
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
      <div
        className="pb-1 px-0.5"
        style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.85),transparent)' }}
      >
        <p className="text-parchment text-[7px] font-bold text-center truncate">
          {card.displayName.split(' ').pop()}
        </p>
        <p className="text-white/40 text-[6px] text-center">{card.position}</p>
      </div>
    </div>
  );
}
