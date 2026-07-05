'use client';

import Link from 'next/link';
import type { CollectionCard } from '@/lib/collection-data';
import {
  buildHallData,
  type CountryGroup,
  type AlbumSlotData,
  type RarityProgress,
  RARITY_META,
} from '@/lib/hall-of-legends-data';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { RarityCode } from '@world-legends/types';

// ─── Glow/BG por raridade ─────────────────────────────────────────────────────

const RARITY_GLOW: Record<string, string> = {
  common: 'rgba(107,114,128,0.4)',
  rare: 'rgba(168,85,247,0.55)',
  elite: 'rgba(59,130,246,0.6)',
  legendary: '#c9a84c',
  ultra: '#ec4899',
  world_cup_hero: '#e2e8f0',
};

const RARITY_BG: Record<string, string> = {
  common: 'from-[#0f1017] to-[#1a1b24]',
  rare: 'from-[#0d0021] to-[#1a0038]',
  elite: 'from-[#000d1a] to-[#001a2e]',
  legendary: 'from-[#1a1000] to-[#2a1c00]',
  ultra: 'from-[#1a0020] to-[#001a30]',
  world_cup_hero: 'from-[#1a1820] to-[#0d0b12]',
};

// ─── Filtro de posição ────────────────────────────────────────────────────────

const POS_GROUPS: Record<string, string[]> = {
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW'],
  MID: ['CDM', 'CM', 'CAM', 'LM', 'RM', 'DM', 'AM'],
  FWD: ['LW', 'RW', 'CF', 'ST', 'SS'],
};

type PosFilter = 'all' | 'GK' | 'DEF' | 'MID' | 'FWD' | 'favorites';

const POS_COLORS: Record<string, string> = {
  GK: '#f59e0b',
  DEF: '#3b82f6',
  MID: '#10b981',
  FWD: '#ef4444',
  favorites: '#ec4899',
};

// ─── Favorites localStorage ───────────────────────────────────────────────────

const FAV_KEY = 'wl:collection:favorites';

function loadFavorites(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveFavorites(favs: Set<string>) {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favs]));
  } catch {
    // ignore
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  catalogCards: CollectionCard[];
  ownedCardIds: ReadonlySet<string>;
  isAuthenticated: boolean;
};

// ─── Componente principal ─────────────────────────────────────────────────────

export function HallOfLegendsExperience({ catalogCards, ownedCardIds, isAuthenticated }: Props) {
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityCode | 'all'>('all');
  const [posFilter, setPosFilter] = useState<PosFilter>('all');
  const [openCountry, setOpenCountry] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Load favorites on mount (client-only)
  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const deferredSearch = useDeferredValue(search);

  const hallData = useMemo(
    () => buildHallData(catalogCards, ownedCardIds),
    [catalogCards, ownedCardIds],
  );

  const toggleFavorite = useCallback((cardId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      saveFavorites(next);
      return next;
    });
  }, []);

  const isSearching = deferredSearch.trim().length > 0;
  const favCount = favorites.size;

  // Filtrar grupos de países por search + rarity + position
  const filteredGroups = useMemo(() => {
    return hallData.countryGroups
      .map((group) => {
        let slots = group.slots;

        if (rarityFilter !== 'all') {
          slots = slots.filter((s) => s.card.rarityCode === rarityFilter);
        }

        if (posFilter === 'favorites') {
          slots = slots.filter((s) => s.owned && favorites.has(s.card.cardId));
        } else if (posFilter !== 'all') {
          const positions = POS_GROUPS[posFilter] ?? [];
          slots = slots.filter((s) => positions.includes(s.card.position));
        }

        if (deferredSearch.trim()) {
          const q = deferredSearch.toLowerCase();
          slots = slots.filter(
            (s) =>
              s.card.displayName.toLowerCase().includes(q) ||
              s.card.fullName.toLowerCase().includes(q) ||
              s.card.position.toLowerCase().includes(q),
          );
        }

        return { ...group, slots };
      })
      .filter((g) => g.slots.length > 0);
  }, [hallData.countryGroups, rarityFilter, posFilter, favorites, deferredSearch]);

  const toggleCountry = useCallback(
    (nat: string) => setOpenCountry((prev) => (prev === nat ? null : nat)),
    [],
  );

  // Estatísticas por posição (das cartas que o usuário possui)
  const posStats = useMemo(() => {
    const owned = hallData.countryGroups.flatMap((g) => g.slots.filter((s) => s.owned));
    const counts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    for (const slot of owned) {
      const pos = slot.card.position;
      if (POS_GROUPS.GK?.includes(pos)) counts.GK = (counts.GK ?? 0) + 1;
      else if (POS_GROUPS.DEF?.includes(pos)) counts.DEF = (counts.DEF ?? 0) + 1;
      else if (POS_GROUPS.MID?.includes(pos)) counts.MID = (counts.MID ?? 0) + 1;
      else if (POS_GROUPS.FWD?.includes(pos)) counts.FWD = (counts.FWD ?? 0) + 1;
    }
    return counts;
  }, [hallData]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="page-header shrink-0">
        <p
          className="text-[9px] font-bold uppercase tracking-[0.22em] mb-1.5"
          style={{ color: '#6a7090' }}
        >
          World Legends
        </p>
        <div className="flex items-end justify-between">
          <h1 className="font-display text-4xl gold-text tracking-wider leading-none">
            HALL OF LEGENDS
          </h1>
          <div className="text-right mb-0.5">
            <p className="text-parchment font-display text-xl leading-none">
              {hallData.ownedCards}
              <span className="text-muted text-sm">/{hallData.totalCards}</span>
            </p>
            <p className="text-muted text-[9px]">{hallData.completionPct}% completo</p>
          </div>
        </div>

        {/* Barra de progresso global */}
        <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #8c6f27, #c9a84c, #e6c85a)',
              boxShadow: '0 0 8px rgba(201,168,76,0.5)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${hallData.completionPct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      {/* ── Progresso por raridade ── */}
      <div className="px-4 shrink-0">
        <RarityProgressRow
          progress={hallData.rarityProgress}
          activeFilter={rarityFilter}
          onFilter={setRarityFilter}
        />
      </div>

      {/* ── Filtro de posição ── */}
      <div className="px-4 pt-2 shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {/* Todos */}
          <PosFilterPill
            label="Todos"
            color="#6a7090"
            isActive={posFilter === 'all'}
            onPress={() => setPosFilter('all')}
            count={hallData.ownedCards}
          />
          {/* GK / DEF / MID / FWD */}
          {(['GK', 'DEF', 'MID', 'FWD'] as const).map((p) => (
            <PosFilterPill
              key={p}
              label={p}
              color={POS_COLORS[p] ?? '#6a7090'}
              isActive={posFilter === p}
              onPress={() => setPosFilter((prev) => (prev === p ? 'all' : p))}
              count={posStats[p] ?? 0}
            />
          ))}
          {/* Favoritos */}
          {favCount > 0 && (
            <PosFilterPill
              label="❤️ Favoritos"
              color={POS_COLORS.favorites ?? '#ec4899'}
              isActive={posFilter === 'favorites'}
              onPress={() => setPosFilter((prev) => (prev === 'favorites' ? 'all' : 'favorites'))}
              count={favCount}
            />
          )}
        </div>
      </div>

      {/* ── Busca ── */}
      <div className="px-4 pt-2.5 pb-2 shrink-0">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jogador…"
            className="w-full rounded-xl border border-border bg-surface/60 pl-9 pr-9 py-2.5 text-sm text-parchment placeholder:text-muted outline-none focus:border-gold/40 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-parchment text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Banner para novos usuários sem cartas ── */}
      {isAuthenticated && hallData.ownedCards === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 shrink-0"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)' }}
          >
            <span className="text-2xl shrink-0">📦</span>
            <div className="flex-1 min-w-0">
              <p className="text-gold text-xs font-bold leading-tight">Nenhuma carta ainda</p>
              <p className="text-muted text-[10px] mt-0.5 leading-tight">
                Abra packs para descobrir lendas e preencher o álbum.
              </p>
            </div>
            <Link
              href="/packs"
              className="shrink-0 px-3 py-1.5 rounded-lg text-obsidian text-[10px] font-bold transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #8c6f27, #c9a84c)' }}
            >
              Abrir Pack
            </Link>
          </div>
        </motion.div>
      )}

      {/* ── Lista de países ── */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="px-4 space-y-2">
          <AnimatePresence initial={false}>
            {filteredGroups.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-16 text-center"
              >
                {posFilter === 'favorites' ? (
                  <>
                    <p className="text-4xl mb-3">❤️</p>
                    <p className="text-muted text-sm">Nenhum favorito ainda</p>
                    <p className="text-muted/50 text-xs mt-1">Toque o ❤️ em uma carta para favoritar</p>
                  </>
                ) : (
                  <>
                    <p className="text-muted text-sm">Nenhum jogador encontrado</p>
                    <p className="text-muted/50 text-xs mt-1">Tente ajustar os filtros</p>
                  </>
                )}
              </motion.div>
            ) : (
              filteredGroups.map((group, i) => (
                <CountrySection
                  key={group.nationality}
                  group={group}
                  index={i}
                  isOpen={isSearching || posFilter !== 'all' || openCountry === group.nationality}
                  onToggle={() => toggleCountry(group.nationality)}
                  isSearching={isSearching || posFilter !== 'all'}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Pill de filtro de posição ────────────────────────────────────────────────

function PosFilterPill({
  label,
  color,
  isActive,
  onPress,
  count,
}: {
  label: string;
  color: string;
  isActive: boolean;
  onPress: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onPress}
      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-all"
      style={{
        borderColor: isActive ? color : 'rgba(255,255,255,0.08)',
        background: isActive ? `${color}18` : 'rgba(255,255,255,0.025)',
        color: isActive ? color : 'rgba(255,255,255,0.35)',
        boxShadow: isActive ? `0 0 12px ${color}30` : 'none',
      }}
    >
      {label}
      {count > 0 && (
        <span
          className="text-[8px] font-black px-1 py-0.5 rounded-full leading-none"
          style={{
            background: isActive ? `${color}30` : 'rgba(255,255,255,0.06)',
            color: isActive ? color : 'rgba(255,255,255,0.3)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Progresso por raridade ───────────────────────────────────────────────────

function RarityProgressRow({
  progress,
  activeFilter,
  onFilter,
}: {
  progress: RarityProgress[];
  activeFilter: RarityCode | 'all';
  onFilter: (r: RarityCode | 'all') => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {progress.map((r) => {
        const isActive = activeFilter === r.code;
        return (
          <button
            key={r.code}
            onClick={() => onFilter(isActive ? 'all' : r.code)}
            className="shrink-0 flex flex-col gap-1 min-w-[64px] rounded-xl border px-2.5 py-2 transition-all"
            style={{
              borderColor: isActive ? r.color : 'rgba(255,255,255,0.07)',
              background: isActive ? `${r.color}18` : 'rgba(255,255,255,0.02)',
              boxShadow: isActive ? `0 0 12px ${r.color}30` : 'none',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[8px] font-black uppercase tracking-wide"
                style={{ color: r.color }}
              >
                {r.label}
              </span>
              <span className="text-[8px] text-muted">{r.pct}%</span>
            </div>
            <div className="h-1 bg-black/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: r.color }}
                initial={{ width: '0%' }}
                animate={{ width: `${r.pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
              />
            </div>
            <p className="text-[8px] text-muted text-left">
              {r.owned}/{r.total}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ─── Seção de país ────────────────────────────────────────────────────────────

function CountrySection({
  group,
  index,
  isOpen,
  onToggle,
  isSearching,
  favorites,
  onToggleFavorite,
}: {
  group: CountryGroup;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  isSearching: boolean;
  favorites: Set<string>;
  onToggleFavorite: (cardId: string) => void;
}) {
  const wasPreviouslyComplete = useRef(false);
  const [showBurst, setShowBurst] = useState(false);

  if (group.isComplete && !wasPreviouslyComplete.current) {
    wasPreviouslyComplete.current = true;
    if (isOpen) setShowBurst(true);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.4) }}
      className={[
        'rounded-2xl border overflow-hidden transition-all duration-200',
        group.isComplete
          ? 'border-amber-500/40 shadow-[0_0_20px_rgba(201,168,76,0.2)]'
          : group.ownedCount > 0
            ? 'border-white/10 bg-surface'
            : 'border-white/5 bg-surface/50',
      ].join(' ')}
    >
      {/* Header do país */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.025] transition-colors"
      >
        <span className="text-2xl shrink-0 leading-none">{group.flag}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-parchment text-sm font-bold leading-tight truncate">{group.name}</p>
            {group.isComplete && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(201,168,76,0.2)',
                  color: '#c9a84c',
                  border: '1px solid rgba(201,168,76,0.4)',
                }}
              >
                ✓ COMPLETO
              </motion.span>
            )}
          </div>

          <div className="h-1 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: group.isComplete
                  ? 'linear-gradient(90deg, #8c6f27, #c9a84c)'
                  : 'linear-gradient(90deg, #334155, #475569)',
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${group.completionPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-parchment text-xs font-bold font-display">
            {group.ownedCount}
            <span className="text-muted text-[10px]">/{group.totalCount}</span>
          </p>
          <p className="text-muted text-[9px]">{group.completionPct}%</p>
        </div>

        {!isSearching && (
          <motion.span
            className="text-muted text-xs shrink-0 ml-1"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.span>
        )}
      </button>

      {/* Grid de cartas */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden relative"
          >
            {showBurst && (
              <CompletionBurst onDone={() => setShowBurst(false)} />
            )}

            <div className="px-3 pb-4 pt-1">
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {group.slots.map((slot, i) => (
                  <AlbumSlot
                    key={slot.card.cardId}
                    slot={slot}
                    index={i}
                    isFavorite={favorites.has(slot.card.cardId)}
                    onToggleFavorite={() => onToggleFavorite(slot.card.cardId)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Slot do álbum ─────────────────────────────────────────────────────────────

function AlbumSlot({
  slot,
  index,
  isFavorite,
  onToggleFavorite,
}: {
  slot: AlbumSlotData;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  const { card, owned } = slot;
  const glow = RARITY_GLOW[card.rarityCode] ?? 'rgba(255,255,255,0.2)';
  const bg = RARITY_BG[card.rarityCode] ?? RARITY_BG.common;
  const meta = RARITY_META[card.rarityCode];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.025, 0.5), duration: 0.2 }}
      className={[
        'relative aspect-[2/3] rounded-xl overflow-hidden border transition-all duration-200',
        owned ? 'border-white/20' : 'border-white/5 bg-black/40',
      ].join(' ')}
      style={
        owned
          ? { boxShadow: `0 0 12px ${glow}45` }
          : {}
      }
    >
      {owned ? (
        /* ─ Carta revelada ─ */
        <div className={`w-full h-full flex flex-col bg-gradient-to-br ${bg} p-1 relative`}>
          {/* Rarity label */}
          <div className="absolute top-0.5 right-0.5">
            <span
              className="text-[6px] font-black px-0.5 rounded"
              style={{
                background: `${meta?.color ?? '#fff'}25`,
                color: meta?.color ?? '#fff',
                border: `1px solid ${meta?.color ?? '#fff'}50`,
              }}
            >
              {card.rarityCode === 'world_cup_hero'
                ? 'WCH'
                : (meta?.label ?? '').slice(0, 3).toUpperCase()}
            </span>
          </div>

          {/* OVR */}
          <div className="absolute top-0.5 left-0.5">
            <span
              className="text-[8px] font-black"
              style={{
                background: `linear-gradient(180deg, #fff 0%, ${glow} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {card.overall}
            </span>
          </div>

          {/* Flag */}
          <div className="flex-1 flex items-center justify-center mt-2">
            <span style={{ fontSize: 22 }}>{card.flagEmoji}</span>
          </div>

          {/* Name */}
          <p className="text-white text-[7px] font-bold text-center leading-tight truncate mt-0.5">
            {card.displayName.split(' ')[0]}
          </p>
          <p className="text-white/50 text-[6px] text-center">{card.position}</p>

          {/* Favorite heart button */}
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute bottom-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-full"
            style={{
              background: isFavorite ? 'rgba(236,72,153,0.25)' : 'rgba(0,0,0,0.4)',
            }}
            whileTap={{ scale: 0.85 }}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <motion.span
              style={{ fontSize: 8, lineHeight: 1 }}
              animate={isFavorite ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isFavorite ? '❤️' : '🤍'}
            </motion.span>
          </motion.button>
        </div>
      ) : (
        /* ─ Slot vazio / silhueta ─ */
        <div className="w-full h-full flex flex-col items-center justify-center p-1">
          <div className="flex-1 flex items-center justify-center opacity-10">
            <svg viewBox="0 0 40 60" fill="currentColor" className="w-7 h-10 text-white">
              <circle cx="20" cy="13" r="7" />
              <path d="M6 55 Q8 34 20 32 Q32 34 34 55 Z" />
            </svg>
          </div>
          <p className="text-[7px] text-white/15 font-bold">
            {String(index + 1).padStart(2, '0')}
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Animação de conclusão ─────────────────────────────────────────────────────

const BURST_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  angle: (i / 20) * 360,
  distance: 40 + (i % 4) * 18,
  size: 3 + (i % 3) * 2,
  color: ['#c9a84c', '#fbbf24', '#e6c85a', '#fff', '#f0c040'][i % 5]!,
  delay: i * 0.025,
}));

function CompletionBurst({ onDone }: { onDone: () => void }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.35), transparent 70%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8 }}
        onAnimationComplete={onDone}
      />

      {BURST_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, background: p.color, top: '50%', left: '50%' }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 0.9, delay: p.delay, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.2, times: [0, 0.3, 0.5, 1] }}
        className="font-display text-base tracking-widest"
        style={{ color: '#c9a84c', textShadow: '0 0 20px rgba(201,168,76,0.8)' }}
      >
        ✓ COMPLETO!
      </motion.div>
    </div>
  );
}
