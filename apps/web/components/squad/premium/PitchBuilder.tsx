'use client';

import { saveSquad } from '@/lib/actions/squad';
import type { SaveSquadInput } from '@/lib/actions/squad.types';
import type { CollectionCard } from '@/lib/collection-data';
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
  getSwapSuggestions,
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

import { ResolvedWorldLegendsCard } from '@/components/cards/ResolvedWorldLegendsCard';
import { CardDetailModal } from '@/components/collection/CardDetailModal';
import { Particles, useBurst } from '@/components/fx/Particles';
import { toast } from '@/lib/wl-toast';
import Link from 'next/link';
import { AutoBuildSheet } from './AutoBuildSheet';
import { BenchStrip } from './BenchStrip';
import { CardPoolSheet } from './CardPoolSheet';
import { FormationSelect } from './FormationSelect';
import { PlayerSelectModal } from './PlayerSelectModal';
import { PremiumPitch } from './PremiumPitch';
import { SwapSuggestionsSheet } from './SwapSuggestionsSheet';
import { TeamAnalysisSheet } from './TeamAnalysisSheet';

// ─── DnD helpers ─────────────────────────────────────────────────────────────

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

  // ── Auto-fill on mount: show cards immediately if no saved squad ──────────
  const hasAutoFilled = useRef(false);
  useEffect(() => {
    if (!hasAutoFilled.current && snapshot.starterCount === 0 && allCards.length > 0) {
      hasAutoFilled.current = true;
      dispatch({
        type: 'AUTO_BUILD',
        mode: 'best',
        allCards,
        ...(favoriteIds !== undefined ? { favoriteIds } : {}),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save state ────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');
  const { trigger: saveBurst, fire: fireSaveBurst } = useBurst();

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
        setTimeout(() => setSaveStatus('idle'), 2500);
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

  // ── dnd-kit setup ─────────────────────────────────────────────────────────
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

  // ── Slot selection & modals ───────────────────────────────────────────────
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [playerModalSlotId, setPlayerModalSlotId] = useState<string | null>(null);
  const [autoBuildOpen, setAutoBuildOpen] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const [previewCard, setPreviewCard] = useState<CollectionCard | null>(null);
  const [previewSlotId, setPreviewSlotId] = useState<string | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(false);

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

  const pitchSuggestions = useMemo(
    () => (selectedSlotDef ? getAutoSuggest(selectedSlotDef.position, pool, 5) : []),
    [selectedSlotDef, pool],
  );

  // Preview de "antes/depois" para a troca — nunca aplica no escuro (Sprint 17).
  const getSlotPreview = useCallback(
    (cardId: string) => {
      if (!playerModalSlotId) return null;
      const card = allCards.find((c) => c.cardId === cardId);
      if (!card) return null;
      const nextState: SBState = {
        ...state,
        slots: { ...state.slots, [playerModalSlotId]: card },
      };
      return { before: snapshot, after: calcSnapshot(nextState) };
    },
    [playerModalSlotId, allCards, state, snapshot],
  );

  const swapSuggestions = useMemo(
    () => (suggestionsOpen ? getSwapSuggestions(state, pool) : []),
    [suggestionsOpen, state, pool],
  );

  const handleSlotClick = useCallback(
    (slotId: string, occupied: boolean) => {
      if (occupied) {
        setSelectedSlotId(null);
        setPreviewCard(state.slots[slotId] ?? null);
        setPreviewSlotId(slotId);
        return;
      }
      setPlayerModalSlotId(slotId);
      setSelectedSlotId(slotId);
    },
    [state.slots],
  );

  const handleTrocarFromPreview = useCallback(() => {
    if (!previewSlotId) return;
    setPreviewCard(null);
    setPlayerModalSlotId(previewSlotId);
    setSelectedSlotId(previewSlotId);
  }, [previewSlotId]);

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

  const handleSwapApply = useCallback(
    (slotId: string, cardId: string) => {
      dispatch({ type: 'PLACE_IN_SLOT', cardId, slotId, allCards });
      setSuggestionsOpen(false);
      toast.success('Troca aplicada!', '🔄');
    },
    [allCards],
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
    dispatch({
      type: 'AUTO_BUILD',
      mode: 'best',
      allCards,
      ...(favoriteIds !== undefined ? { favoriteIds } : {}),
    });
    setSelectedSlotId(null);
    toast.success('Melhor time montado!', '⚡');
  }, [allCards, favoriteIds]);

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

  // ── Chemistry score color ─────────────────────────────────────────────────
  const chemTotal = snapshot.chemistry.total;
  const chemColor =
    chemTotal >= 80
      ? '#22c55e'
      : chemTotal >= 60
        ? '#60a5fa'
        : chemTotal >= 40
          ? '#fbbf24'
          : 'rgba(255,255,255,0.25)';

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: dismiss selection on outside click */}
      <div
        className="flex flex-col h-full overflow-hidden relative select-none"
        style={{ background: '#060810' }}
        onClick={(e) => {
          if (
            (e.target as HTMLElement).closest('[data-squad-slot]') === null &&
            (e.target as HTMLElement).closest('[data-squad-pool]') === null
          ) {
            setSelectedSlotId(null);
          }
        }}
      >
        <Particles preset="confetti" count={28} origin={{ x: 50, y: 8 }} trigger={saveBurst} />

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 px-3 pt-2 pb-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Link
            href="/"
            className="flex items-center gap-1 text-muted hover:text-white/70 transition-colors shrink-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>

          <span
            className="font-display text-lg tracking-widest shrink-0"
            style={{
              background: 'linear-gradient(180deg, #fff 0%, #c9a84c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MEU SQUAD
          </span>

          <div className="flex-1" />

          <FormationSelect
            current={state.formation}
            options={Object.keys(FORMATION_LABELS) as FormationKey[]}
            labels={FORMATION_LABELS}
            onChange={handleFormation}
          />

          {/* Save indicator */}
          {saveStatus !== 'idle' && (
            <div className="flex items-center gap-1.5">
              <motion.span
                className={`w-1.5 h-1.5 rounded-full ${
                  saveStatus === 'saving'
                    ? 'bg-yellow-400'
                    : saveStatus === 'saved'
                      ? 'bg-emerald-400'
                      : 'bg-red-400'
                }`}
                animate={saveStatus === 'saving' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                transition={{
                  duration: 0.8,
                  repeat: saveStatus === 'saving' ? Number.POSITIVE_INFINITY : 0,
                }}
              />
              <span className="text-[9px] text-white/35">
                {saveStatus === 'saving' ? 'salvando' : saveStatus === 'saved' ? 'salvo' : 'erro'}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleClear}
            className="text-[9px] text-muted hover:text-red-400 transition-colors px-1"
          >
            limpar
          </button>
        </div>

        {/* ── STATS BAR ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* OVR — toque para abrir a Análise do Time */}
          <button
            type="button"
            onClick={() => setAnalysisOpen(true)}
            className="flex items-baseline gap-1.5 shrink-0"
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={snapshot.rating.overall}
                className="font-display leading-none"
                style={{
                  fontSize: 52,
                  lineHeight: 1,
                  background: snapshot.rating.overall
                    ? 'linear-gradient(180deg, #fff 0%, #c9a84c 100%)'
                    : 'rgba(255,255,255,0.12)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: snapshot.rating.overall ? '0 0 24px rgba(201,168,76,0.55)' : 'none',
                }}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 20 }}
              >
                {snapshot.rating.overall || '—'}
              </motion.span>
            </AnimatePresence>
            <div className="flex flex-col pb-1">
              <span className="text-[8px] text-gold/55 uppercase tracking-widest font-bold">
                OVR
              </span>
              <span className="text-[8px] text-muted">{snapshot.starterCount}/11</span>
            </div>
          </button>

          <div className="w-px h-10 bg-white/8 shrink-0" />

          {/* Sector mini bars */}
          {snapshot.rating.overall > 0 && (
            <div className="flex gap-2.5 flex-1 min-w-0">
              <SectorMini label="ATK" value={snapshot.rating.attack} color="#ef4444" />
              <SectorMini label="MID" value={snapshot.rating.midfield} color="#10b981" />
              <SectorMini label="DEF" value={snapshot.rating.defense} color="#3b82f6" />
            </div>
          )}

          {snapshot.rating.overall === 0 && (
            <div className="flex-1 min-w-0">
              <p className="text-muted text-[10px]">
                {allCards.length === 0
                  ? 'Abra um pack para conseguir jogadores'
                  : 'Montando seu time…'}
              </p>
            </div>
          )}

          <div className="w-px h-10 bg-white/8 shrink-0" />

          {/* Chemistry */}
          <div className="flex flex-col items-center shrink-0 w-14">
            <AnimatePresence mode="wait">
              <motion.span
                key={chemTotal}
                className="font-display leading-none"
                style={{ fontSize: 28, color: chemColor }}
                initial={{ scale: 1.25, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                {chemTotal || '—'}
              </motion.span>
            </AnimatePresence>
            <span className="text-[8px] text-muted uppercase tracking-wider mt-0.5">QUÍM</span>
            {/* Chemistry bar */}
            {chemTotal > 0 && (
              <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden mt-1">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: chemColor }}
                  animate={{ width: `${chemTotal}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── PITCH — espaço dominante garantido, nunca espremido ─────────── */}
        <div className="flex-1 min-h-[380px] relative">
          <PremiumPitch
            formation={state.formation}
            slots={FORMATIONS[state.formation]}
            occupied={state.slots}
            chemLines={chemLines}
            snapshot={snapshot}
            dragOver={state.dragOver}
            selectedSlotId={selectedSlotId}
            suggestions={pitchSuggestions}
            onSlotClick={handleSlotClick}
            onSuggestion={handleSuggestion}
            onRemove={handleRemoveSlot}
          />
        </div>

        {/* ── BENCH ──────────────────────────────────────────────────────── */}
        <BenchStrip bench={state.bench} dragOver={state.dragOver} onRemove={handleRemoveBench} />

        {/* ── ACTION BAR ─────────────────────────────────────────────────── */}
        <div
          className="grid grid-cols-2 gap-2 px-3 py-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Auto Fill */}
          <motion.button
            type="button"
            onClick={handleAutoFill}
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
            style={{
              background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
              color: '#050508',
              boxShadow: '0 4px 16px rgba(201,168,76,0.35)',
            }}
          >
            ⚡ Melhor Time
          </motion.button>

          {/* Coleção (abre a lista completa como bottom sheet sob demanda) */}
          <motion.button
            type="button"
            onClick={() => setPoolOpen(true)}
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.75)',
            }}
          >
            📚 Coleção
          </motion.button>

          {/* Sugestões */}
          <motion.button
            type="button"
            onClick={() => setSuggestionsOpen(true)}
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
            style={{
              background: 'rgba(147,51,234,0.14)',
              border: '1px solid rgba(147,51,234,0.32)',
              color: '#c084fc',
            }}
          >
            💡 Sugestões
          </motion.button>

          {/* Advanced build or Play */}
          <AnimatePresence mode="wait">
            {snapshot.starterCount >= 11 ? (
              <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link
                  href="/match"
                  className="flex items-center justify-center gap-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #064e3b, #065f46)',
                    border: '1px solid rgba(16,185,129,0.4)',
                    color: '#34d399',
                    boxShadow: '0 0 12px rgba(16,185,129,0.3)',
                  }}
                >
                  ⚽ Jogar
                </Link>
              </motion.div>
            ) : (
              <motion.button
                key="build"
                type="button"
                onClick={() => setAutoBuildOpen(true)}
                whileTap={{ scale: 0.96 }}
                className="py-2.5 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                ⚙ Opções
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── CARD POOL — bottom sheet sob demanda, nunca ocupa espaço fixo ── */}
        <AnimatePresence>
          {poolOpen && (
            <>
              <motion.div
                className="absolute inset-0 z-30 bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setPoolOpen(false)}
              />
              <motion.div
                className="absolute inset-x-0 bottom-0 z-40"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              >
                <CardPoolSheet
                  cards={pool}
                  selectedSlotPos={selectedSlotDef?.position ?? null}
                  dragOver={state.dragOver === 'pool'}
                  onTapCard={(cardId) => {
                    handleTapCard(cardId);
                    setPoolOpen(false);
                  }}
                  onClose={() => setPoolOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── PLAYER SELECT MODAL ─────────────────────────────────────────── */}
        <PlayerSelectModal
          open={playerModalSlotId !== null}
          slotPosition={playerModalSlotDef?.position ?? null}
          currentCard={playerModalSlotId ? (state.slots[playerModalSlotId] ?? null) : null}
          pool={pool}
          getPreview={getSlotPreview}
          onSelect={handlePlayerModalSelect}
          onClose={() => {
            setPlayerModalSlotId(null);
            setSelectedSlotId(null);
          }}
        />

        {/* ── AUTO BUILD SHEET ────────────────────────────────────────────── */}
        <AutoBuildSheet
          open={autoBuildOpen}
          hasFavorites={hasFavorites}
          hasBrazilians={hasBrazilians}
          hasGoats={hasGoats}
          onBuild={handleAutoBuild}
          onClose={() => setAutoBuildOpen(false)}
        />

        {/* ── SWAP SUGGESTIONS SHEET ──────────────────────────────────────── */}
        <SwapSuggestionsSheet
          open={suggestionsOpen}
          suggestions={swapSuggestions}
          onApply={handleSwapApply}
          onClose={() => setSuggestionsOpen(false)}
        />

        {/* ── ANÁLISE DO TIME (toque no OVR) ──────────────────────────────── */}
        <TeamAnalysisSheet
          open={analysisOpen}
          snapshot={snapshot}
          slots={state.slots}
          starterCount={snapshot.starterCount}
          onClose={() => setAnalysisOpen(false)}
        />

        {/* ── CARD PREVIEW (tap num jogador já no campo) ──────────────────── */}
        <AnimatePresence>
          {previewCard && (
            <>
              <CardDetailModal
                card={previewCard}
                isFav={favoriteIds?.has(previewCard.cardId) ?? false}
                isComparing={false}
                onClose={() => setPreviewCard(null)}
                onFav={() => {}}
                onCompare={() => {}}
              />
              <motion.button
                type="button"
                onClick={handleTrocarFromPreview}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                whileTap={{ scale: 0.96 }}
                className="fixed left-1/2 -translate-x-1/2 bottom-[calc(env(safe-area-inset-bottom)+16px)] z-[62] px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, #c9a84c, #e6c85a)',
                  color: '#050508',
                  boxShadow: '0 4px 20px rgba(201,168,76,0.5)',
                }}
              >
                🔄 Trocar jogador
              </motion.button>
            </>
          )}
        </AnimatePresence>
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
    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
      <div className="flex items-baseline justify-between gap-1">
        <span className="text-[8px] font-bold uppercase tracking-wide" style={{ color }}>
          {label}
        </span>
        <motion.span
          key={value}
          className="font-display text-[13px] leading-none text-white/75"
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
  // Sprint 39 — o overlay de arraste (dnd-kit `DragOverlay`) monta uma
  // SEGUNDA instância do mesmo card enquanto o original (em PremiumPitch/
  // BenchStrip/CardPoolSheet) fica com opacity reduzida, não desmontado.
  // Ambas pedem a MESMA densidade Compact do MESMO jogador — o navegador
  // deduplica pela URL (mesmo webp), nunca dois downloads distintos.
  return (
    <div className="rotate-2 shadow-2xl">
      <ResolvedWorldLegendsCard card={card} size="xs" density="compact" glow />
    </div>
  );
}
