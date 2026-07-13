'use client';

import { PlayerCard } from '@/components/cards/PlayerCard';
import { ResolvedWorldLegendsCard } from '@/components/cards/ResolvedWorldLegendsCard';
import { CompareModal } from '@/components/collection/CompareModal';
import { toggleFavoriteCardAction } from '@/lib/actions';
import type { CollectionCard } from '@/lib/collection-data';
import {
  type AlbumSlotData,
  type CountryGroup,
  RARITY_META,
  type RarityProgress,
  buildHallData,
} from '@/lib/hall-of-legends-data';
import type { RarityCode } from '@world-legends/types';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { CardSpotlightPresence } from './CardSpotlightModal';

// ─── Glow / bg por raridade ───────────────────────────────────────────────────

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

// ─── Country accent colours ───────────────────────────────────────────────────

const COUNTRY_ACCENT: Record<string, string> = {
  BR: '#009C3B',
  AR: '#74ACDF',
  DE: '#DD0000',
  FR: '#0055A4',
  IT: '#003399',
  ES: '#C60B1E',
  NL: '#FF6600',
  PT: '#006600',
  EN: '#CF111B',
  UY: '#5BBFDF',
  HR: '#FF0000',
};
const DEFAULT_COUNTRY_ACCENT = '#6b7280';

// ─── Tab type ─────────────────────────────────────────────────────────────────

type ActiveTab = 'museu' | 'album' | 'nacoes' | 'dream' | 'conquistas';

// ─── localStorage ─────────────────────────────────────────────────────────────

const FAV_KEY = 'wl:collection:favorites';
const DREAM_KEY = 'wl:dream-team';
const DREAM_MAX = 11;

// Sprint 23 — helpers puros (fora do componente, não contam pra complexidade dele)
function toggleIdInSet(set: Set<string>, id: string, max: number): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else if (next.size < max) next.add(id);
  return next;
}

function matchesCountryFilter(nationality: string, filter: string): boolean {
  return filter === 'all' || nationality === filter;
}

function loadSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key: string, s: Set<string>) {
  try {
    localStorage.setItem(key, JSON.stringify([...s]));
  } catch {
    /* noop */
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  catalogCards: CollectionCard[];
  ownedCardIds: ReadonlySet<string>;
  isAuthenticated: boolean;
  initialFavoriteIds?: readonly string[];
};

// ─── Component principal ──────────────────────────────────────────────────────

export function HallOfLegendsExperience({
  catalogCards,
  ownedCardIds,
  isAuthenticated,
  initialFavoriteIds = [],
}: Props) {
  const router = useRouter();

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('museu');
  const [showMissing, setShowMissing] = useState(false);
  const [search, setSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityCode | 'all'>('all');
  const [posFilter, setPosFilter] = useState<PosFilter>('all');
  const [openCountry, setOpenCountry] = useState<string | null>(null);
  // Sprint 23 — Museum Collection: filtro por país, modo comparar, spotlight
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [comparingIds, setComparingIds] = useState<Set<string>>(new Set());
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [spotlightCard, setSpotlightCard] = useState<CollectionCard | null>(null);

  // Favorites (initialised from server prop) + Dream Team (client-only)
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(initialFavoriteIds));
  const [dreamTeamIds, setDreamTeamIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDreamTeamIds(loadSet(DREAM_KEY));
  }, []);

  const toggleFavorite = useCallback((cardId: string) => {
    void toggleFavoriteCardAction(cardId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      saveSet(FAV_KEY, next);
      return next;
    });
  }, []);

  const toggleDreamTeam = useCallback((cardId: string) => {
    setDreamTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else if (next.size < DREAM_MAX) {
        next.add(cardId);
      }
      saveSet(DREAM_KEY, next);
      return next;
    });
  }, []);

  const handleSelectCard = useCallback(
    (card: CollectionCard) => router.push(`/collection/${card.cardId}`),
    [router],
  );

  // Sprint 23 — modo comparar (máx. 4 cartas, mesma convenção do comparador orfão em components/collection/)
  const toggleCompareMode = useCallback(() => {
    setCompareMode((prev) => !prev);
    setComparingIds(new Set());
  }, []);

  const toggleComparing = useCallback((cardId: string) => {
    setComparingIds((prev) => toggleIdInSet(prev, cardId, 4));
  }, []);

  const handleSpotlight = useCallback((card: CollectionCard) => setSpotlightCard(card), []);

  // Data
  const hallData = useMemo(
    () => buildHallData(catalogCards, ownedCardIds),
    [catalogCards, ownedCardIds],
  );

  // Category collections (Museu tab)
  const categoryData = useMemo(() => {
    const makeCategory = (
      id: string,
      name: string,
      subtitle: string,
      icon: string,
      color: string,
      filter: (c: CollectionCard) => boolean,
    ) => {
      const cards = catalogCards.filter(filter);
      const slots = cards.map((c) => ({ card: c, owned: ownedCardIds.has(c.cardId) }));
      const ownedCount = slots.filter((s) => s.owned).length;
      return {
        id,
        name,
        subtitle,
        icon,
        color,
        slots,
        ownedCount,
        completionPct: slots.length > 0 ? Math.round((ownedCount / slots.length) * 100) : 0,
      };
    };
    return [
      makeCategory(
        'copa',
        'Copa do Mundo',
        'Heróis que fizeram história',
        '🏆',
        '#c9a84c',
        (c) => c.rarityCode === 'world_cup_hero',
      ),
      makeCategory(
        '50s60s',
        'Anos 50-60',
        'Os pioneiros do futebol',
        '⏳',
        '#94a3b8',
        (c) => c.era === '1950s' || c.era === '1960s',
      ),
      makeCategory(
        '70s',
        'Anos 70',
        'A era dos campeões',
        '🌟',
        '#10b981',
        (c) => c.era === '1970s',
      ),
      makeCategory(
        '80s',
        'Anos 80',
        'A geração dourada',
        '⭐',
        '#f59e0b',
        (c) => c.era === '1980s',
      ),
      makeCategory(
        '90s',
        'Anos 90',
        'O futebol moderno nasce',
        '🔥',
        '#ef4444',
        (c) => c.era === '1990s',
      ),
      makeCategory(
        'gk',
        'Goleiros',
        'Os guardiões das traves',
        '🧤',
        '#6366f1',
        (c) => c.position === 'GK',
      ),
      makeCategory('def', 'Defensores', 'A muralha do futebol', '🛡️', '#3b82f6', (c) =>
        (POS_GROUPS.DEF ?? []).includes(c.position),
      ),
      makeCategory('mid', 'Meias', 'Os maestros do jogo', '🎵', '#10b981', (c) =>
        (POS_GROUPS.MID ?? []).includes(c.position),
      ),
      makeCategory('fwd', 'Atacantes', 'Os artilheiros eternos', '⚽', '#ef4444', (c) =>
        (POS_GROUPS.FWD ?? []).includes(c.position),
      ),
    ].filter((cat) => cat.slots.length > 0);
  }, [catalogCards, ownedCardIds]);

  // Conquistas/badges
  const conquistas = useMemo(() => {
    const own = hallData.ownedCards;
    const countryComplete = hallData.countryGroups.filter((g) => g.isComplete).length;
    const hasWCH = catalogCards.some(
      (c) => c.rarityCode === 'world_cup_hero' && ownedCardIds.has(c.cardId),
    );
    const hasLeg = catalogCards.some(
      (c) => c.rarityCode === 'legendary' && ownedCardIds.has(c.cardId),
    );
    const hasUltra = catalogCards.some(
      (c) => c.rarityCode === 'ultra' && ownedCardIds.has(c.cardId),
    );
    return [
      {
        id: 'first',
        name: 'Primeira Carta',
        desc: 'Obtenha sua primeira carta',
        icon: '🃏',
        color: '#94a3b8',
        unlocked: own >= 1,
      },
      {
        id: 'c10',
        name: 'Colecionador',
        desc: '10 cartas na coleção',
        icon: '📦',
        color: '#3b82f6',
        unlocked: own >= 10,
      },
      {
        id: 'c50',
        name: 'Veterano',
        desc: '50 cartas na coleção',
        icon: '🎖️',
        color: '#8b5cf6',
        unlocked: own >= 50,
      },
      {
        id: 'c100',
        name: 'Hall das Lendas',
        desc: '100 cartas na coleção',
        icon: '🏟️',
        color: '#c9a84c',
        unlocked: own >= 100,
      },
      {
        id: 'legendary',
        name: 'Lendário',
        desc: 'Obtenha uma carta Lendária',
        icon: '✨',
        color: '#c9a84c',
        unlocked: hasLeg,
      },
      {
        id: 'ultra',
        name: 'Ultra Raro',
        desc: 'Obtenha uma carta Ultra',
        icon: '💎',
        color: '#ec4899',
        unlocked: hasUltra,
      },
      {
        id: 'wch',
        name: 'Herói da Copa',
        desc: 'Obtenha um World Cup Hero',
        icon: '🏆',
        color: '#e2e8f0',
        unlocked: hasWCH,
      },
      {
        id: 'dream',
        name: 'Dream Team',
        desc: 'Complete o Dream Team com 11',
        icon: '⭐',
        color: '#f59e0b',
        unlocked: dreamTeamIds.size === 11,
      },
      {
        id: 'country1',
        name: 'Coleção Completa',
        desc: 'Complete a coleção de um país',
        icon: '🌍',
        color: '#10b981',
        unlocked: countryComplete >= 1,
      },
      {
        id: 'country3',
        name: 'Multi-Nacional',
        desc: 'Complete 3 coleções de países',
        icon: '🌐',
        color: '#c9a84c',
        unlocked: countryComplete >= 3,
      },
      {
        id: 'goat',
        name: 'Primeiro GOAT',
        desc: 'Obtenha uma carta Ultra ou World Cup Hero',
        icon: '🐐',
        color: '#ec4899',
        unlocked: hasUltra || hasWCH,
      },
      {
        id: 'hero',
        name: 'Primeiro Herói',
        desc: 'Obtenha uma carta Lendária',
        icon: '🦸',
        color: '#c9a84c',
        unlocked: hasLeg,
      },
      {
        id: 'c250',
        name: 'Enciclopédia',
        desc: '250 cartas na coleção',
        icon: '📚',
        color: '#8b5cf6',
        unlocked: own >= 250,
      },
      {
        id: 'c500',
        name: 'Lenda Viva',
        desc: '500 cartas na coleção',
        icon: '🌟',
        color: '#c9a84c',
        unlocked: own >= 500,
      },
      {
        id: 'brasil',
        name: 'Seleção Completa',
        desc: 'Complete toda a coleção do Brasil',
        icon: '🇧🇷',
        color: '#009C3B',
        unlocked: hallData.countryGroups.find((g) => g.nationality === 'BR')?.isComplete ?? false,
      },
      {
        id: 'argentina',
        name: 'La Albiceleste',
        desc: 'Complete toda a coleção da Argentina',
        icon: '🇦🇷',
        color: '#74ACDF',
        unlocked: hallData.countryGroups.find((g) => g.nationality === 'AR')?.isComplete ?? false,
      },
      {
        id: 'europa',
        name: 'O Continente',
        desc: 'Complete coleções de 5 países europeus',
        icon: '🇪🇺',
        color: '#003399',
        unlocked:
          (
            [
              'DE',
              'FR',
              'IT',
              'ES',
              'NL',
              'PT',
              'EN',
              'HR',
              'PL',
              'BE',
              'SE',
              'DK',
              'CH',
              'AT',
              'CZ',
              'SK',
              'HU',
              'RO',
              'BG',
              'GR',
              'TR',
              'UA',
              'IS',
              'RS',
              'SI',
            ] as string[]
          ).filter((c) => hallData.countryGroups.find((g) => g.nationality === c)?.isComplete)
            .length >= 5,
      },
      {
        id: 'gk',
        name: 'Guarda a Trave',
        desc: 'Possua todos os goleiros do catálogo',
        icon: '🧤',
        color: '#6366f1',
        unlocked: catalogCards
          .filter((c) => c.position === 'GK')
          .every((c) => ownedCardIds.has(c.cardId)),
      },
      {
        id: 'fwd',
        name: 'Artilheiro Total',
        desc: 'Possua todos os atacantes do catálogo',
        icon: '⚽',
        color: '#ef4444',
        unlocked: catalogCards
          .filter((c) => ['LW', 'RW', 'CF', 'ST', 'SS'].includes(c.position))
          .every((c) => ownedCardIds.has(c.cardId)),
      },
    ];
  }, [hallData, catalogCards, ownedCardIds, dreamTeamIds]);

  const deferredSearch = useDeferredValue(search);
  const isSearching = deferredSearch.trim().length > 0;
  const favCount = favorites.size;

  // Posição stats (owned only)
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

  // Grupos filtrados para o álbum
  const filteredGroups = useMemo(() => {
    return hallData.countryGroups
      .filter((group) => matchesCountryFilter(group.nationality, countryFilter))
      .map((group) => {
        let slots = group.slots;

        if (showMissing) slots = slots.filter((s) => !s.owned);
        if (rarityFilter !== 'all') slots = slots.filter((s) => s.card.rarityCode === rarityFilter);

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
  }, [hallData, showMissing, rarityFilter, posFilter, favorites, deferredSearch, countryFilter]);

  // Sprint 23 — cartas selecionadas pro comparador
  const comparingCards = useMemo(
    () => catalogCards.filter((c) => comparingIds.has(c.cardId)),
    [catalogCards, comparingIds],
  );

  const toggleCountry = useCallback(
    (nat: string) => setOpenCountry((prev) => (prev === nat ? null : nat)),
    [],
  );

  // Dream Team cards (preserving insertion order)
  const dreamTeamCards = useMemo(() => {
    const cardMap = new Map(catalogCards.map((c) => [c.cardId, c]));
    return [...dreamTeamIds].map((id) => cardMap.get(id)).filter((c): c is CollectionCard => !!c);
  }, [catalogCards, dreamTeamIds]);

  const missingCount = hallData.totalCards - hallData.ownedCards;

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: [
          'radial-gradient(ellipse 90% 45% at 50% 0%, rgba(37,99,235,0.14) 0%, transparent 55%)',
          'radial-gradient(ellipse 50% 30% at 100% 30%, rgba(99,102,241,0.08) 0%, transparent 50%)',
          '#050508',
        ].join(', '),
      }}
    >
      {/* ── Header premium ── */}
      <PremiumHeader
        totalCards={hallData.totalCards}
        ownedCards={hallData.ownedCards}
        completionPct={hallData.completionPct}
        missingCount={missingCount}
        favCount={favCount}
        dreamTeamCount={dreamTeamIds.size}
      />

      {/* ── Tab bar ── */}
      <TabBar activeTab={activeTab} onTab={setActiveTab} />

      {/* ── Tab: MUSEU ── */}
      {activeTab === 'museu' && (
        <MuseuTab
          categories={categoryData}
          favorites={favorites}
          dreamTeamIds={dreamTeamIds}
          onToggleFavorite={toggleFavorite}
          onToggleDreamTeam={toggleDreamTeam}
          onSelectCard={handleSelectCard}
        />
      )}

      {/* ── Tab: ÁLBUM ── */}
      {activeTab === 'album' && (
        <>
          {/* Progresso por raridade */}
          <div className="px-4 pt-3 shrink-0">
            <RarityProgressRow
              progress={hallData.rarityProgress}
              activeFilter={rarityFilter}
              onFilter={setRarityFilter}
            />
          </div>

          {/* Filtros de posição + faltando */}
          <div className="px-4 pt-2 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <PosFilterPill
                label="Todos"
                color="#6a7090"
                isActive={posFilter === 'all'}
                count={hallData.ownedCards}
                onPress={() => setPosFilter('all')}
              />
              {(['GK', 'DEF', 'MID', 'FWD'] as const).map((p) => (
                <PosFilterPill
                  key={p}
                  label={p}
                  color={POS_COLORS[p] ?? '#6a7090'}
                  isActive={posFilter === p}
                  count={posStats[p] ?? 0}
                  onPress={() => setPosFilter((prev) => (prev === p ? 'all' : p))}
                />
              ))}
              {favCount > 0 && (
                <PosFilterPill
                  label="❤️ Favoritos"
                  color={POS_COLORS.favorites!}
                  isActive={posFilter === 'favorites'}
                  count={favCount}
                  onPress={() =>
                    setPosFilter((prev) => (prev === 'favorites' ? 'all' : 'favorites'))
                  }
                />
              )}
              {/* Faltando toggle */}
              <PosFilterPill
                label="🔍 Faltando"
                color="#6366f1"
                isActive={showMissing}
                count={missingCount}
                onPress={() => setShowMissing((p) => !p)}
              />
              {/* Sprint 23 — Modo Comparar (nome diferente do botão da barra
                  flutuante de propósito — um entra no modo de seleção, o
                  outro abre a comparação de verdade; testado ao vivo e
                  confirmado que nomes iguais causavam ambiguidade real). */}
              <PosFilterPill
                label="⚖️ Selecionar"
                color="#f59e0b"
                isActive={compareMode}
                count={comparingIds.size}
                onPress={toggleCompareMode}
              />
            </div>
          </div>

          {/* Sprint 23 — Filtro por país */}
          <div className="px-4 pt-2 shrink-0">
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface/60 px-3 py-2 text-xs text-parchment outline-none focus:border-gold/40 transition-colors"
            >
              <option value="all">🌍 Todos os países</option>
              {hallData.countryGroups.map((g) => (
                <option key={g.nationality} value={g.nationality}>
                  {g.flag} {g.name} ({g.ownedCount}/{g.totalCount})
                </option>
              ))}
            </select>
          </div>

          {/* Busca */}
          <div className="px-4 pt-2.5 pb-2 shrink-0">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
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

          {/* Banner novo usuário */}
          {isAuthenticated && hallData.ownedCards === 0 && !showMissing && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-3 shrink-0"
            >
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(201,168,76,0.06)',
                  border: '1px solid rgba(201,168,76,0.18)',
                }}
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

          {/* Lista de países */}
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
                    {showMissing ? (
                      <>
                        <p className="text-4xl mb-3">✅</p>
                        <p className="text-parchment text-sm font-bold">Coleção completa!</p>
                        <p className="text-muted text-xs mt-1">
                          Você possui todas as cartas neste filtro.
                        </p>
                      </>
                    ) : posFilter === 'favorites' ? (
                      <>
                        <p className="text-4xl mb-3">❤️</p>
                        <p className="text-muted text-sm">Nenhum favorito ainda</p>
                        <p className="text-muted/50 text-xs mt-1">
                          Toque ❤️ em uma carta para favoritar
                        </p>
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
                      isOpen={
                        isSearching ||
                        posFilter !== 'all' ||
                        showMissing ||
                        openCountry === group.nationality
                      }
                      onToggle={() => toggleCountry(group.nationality)}
                      isSearching={isSearching || posFilter !== 'all' || showMissing}
                      favorites={favorites}
                      dreamTeamIds={dreamTeamIds}
                      onToggleFavorite={toggleFavorite}
                      onToggleDreamTeam={toggleDreamTeam}
                      onSelectCard={handleSelectCard}
                      compareMode={compareMode}
                      comparingIds={comparingIds}
                      onToggleCompare={toggleComparing}
                      onSpotlight={handleSpotlight}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: NAÇÕES ── */}
      {activeTab === 'nacoes' && (
        <NacoesTab
          hallData={hallData}
          favorites={favorites}
          dreamTeamIds={dreamTeamIds}
          onToggleFavorite={toggleFavorite}
          onToggleDreamTeam={toggleDreamTeam}
          onSelectCard={handleSelectCard}
        />
      )}

      {/* ── Tab: DREAM TEAM ── */}
      {activeTab === 'dream' && (
        <DreamTeamTab
          dreamTeamCards={dreamTeamCards}
          maxSlots={DREAM_MAX}
          onSelectCard={handleSelectCard}
          onRemove={toggleDreamTeam}
        />
      )}

      {/* ── Tab: CONQUISTAS ── */}
      {activeTab === 'conquistas' && (
        <ConquistasTab
          conquistas={conquistas}
          hallData={hallData}
          catalogCards={catalogCards}
          ownedCardIds={ownedCardIds}
          dreamTeamIds={dreamTeamIds}
        />
      )}

      {/* Sprint 23 — barra flutuante do Modo Comparar */}
      <CompareBar
        visible={compareMode && comparingIds.size > 0}
        count={comparingIds.size}
        onCompare={() => setCompareModalOpen(true)}
        onCancel={toggleCompareMode}
      />

      {/* Sprint 23 — modal de comparação (componente já existente, agora conectado à tela real) */}
      <CompareModalPresence
        open={compareModalOpen}
        cards={comparingCards}
        onClose={() => {
          setCompareModalOpen(false);
          setCompareMode(false);
          setComparingIds(new Set());
        }}
      />

      {/* Sprint 23 — Modo Spotlight (toque longo num card) */}
      <CardSpotlightPresence card={spotlightCard} onClose={() => setSpotlightCard(null)} />
    </div>
  );
}

// ─── Compare Bar (Sprint 23) ────────────────────────────────────────────────────
// Extraída como componente próprio pra manter a complexidade do componente
// principal dentro do limite do lint (mesmo padrão de PackContactShadow, Sprint 22).

function CompareBar({
  visible,
  count,
  onCompare,
  onCancel,
}: {
  visible: boolean;
  count: number;
  onCompare: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <div className="flex items-center gap-3 bg-midnight border border-amber-500/40 rounded-full px-4 py-2 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
            <span className="text-white/70 text-xs">{count}/4 selecionadas</span>
            <button
              type="button"
              disabled={count < 2}
              onClick={onCompare}
              className="px-3 py-1.5 rounded-full text-obsidian text-xs font-bold disabled:opacity-40 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}
            >
              ⚖️ Comparar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-white/40 hover:text-white text-xs"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CompareModalPresence({
  open,
  cards,
  onClose,
}: {
  open: boolean;
  cards: CollectionCard[];
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && cards.length >= 2 && <CompareModal cards={cards} onClose={onClose} />}
    </AnimatePresence>
  );
}

// ─── Premium Header ───────────────────────────────────────────────────────────

function PremiumHeader({
  totalCards,
  ownedCards,
  completionPct,
  missingCount,
  favCount,
  dreamTeamCount,
}: {
  totalCards: number;
  ownedCards: number;
  completionPct: number;
  missingCount: number;
  favCount: number;
  dreamTeamCount: number;
}) {
  return (
    <motion.div
      className="px-4 pt-5 pb-4 shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {/* Eyebrow */}
      <p
        className="text-[9px] font-black uppercase tracking-[0.25em] mb-1.5"
        style={{ color: 'rgba(201,168,76,0.55)' }}
      >
        World Legends
      </p>

      {/* Title */}
      <h1
        className="font-display text-3xl leading-none tracking-widest mb-3"
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #c9a84c 55%, #8c6f27 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        COLEÇÃO
      </h1>

      {/* Main stats row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-end gap-1.5 mb-1">
            <span className="font-display text-2xl text-parchment leading-none">{ownedCards}</span>
            <span className="text-muted text-sm pb-0.5">/ {totalCards} cartas</span>
          </div>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-1.5">
          <StatPill icon="📊" value={`${completionPct}%`} color="#c9a84c" />
          <StatPill icon="🔍" value={missingCount.toString()} label="faltando" color="#6366f1" />
          <StatPill icon="❤️" value={favCount.toString()} label="favs" color="#ec4899" />
          {dreamTeamCount > 0 && (
            <StatPill icon="⭐" value={`${dreamTeamCount}/11`} label="dream" color="#f59e0b" />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #8c6f27, #c9a84c, #e6c85a)',
            boxShadow: '0 0 10px rgba(201,168,76,0.6)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${completionPct}%` }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </motion.div>
  );
}

function StatPill({
  icon,
  value,
  label,
  color,
}: { icon: string; value: string; label?: string; color: string }) {
  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded-full"
      style={{ background: `${color}12`, border: `1px solid ${color}28` }}
    >
      <span style={{ fontSize: 10 }}>{icon}</span>
      <span className="text-[9px] font-bold leading-none" style={{ color }}>
        {value}
        {label && <span className="opacity-60 ml-0.5">{label}</span>}
      </span>
    </div>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({ activeTab, onTab }: { activeTab: ActiveTab; onTab: (t: ActiveTab) => void }) {
  const tabs: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'museu', label: 'MUSEU', icon: '🏛️' },
    { key: 'album', label: 'ÁLBUM', icon: '📖' },
    { key: 'nacoes', label: 'NAÇÕES', icon: '🌍' },
    { key: 'dream', label: 'DREAM', icon: '⭐' },
    { key: 'conquistas', label: 'TROFÉUS', icon: '🏆' },
  ];

  return (
    <div
      className="flex px-4 shrink-0"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {tabs.map((t) => {
        const isActive = activeTab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onTab(t.key)}
            className="relative flex items-center gap-1.5 px-3 py-3 text-[10px] font-black uppercase tracking-wider transition-all"
            style={{ color: isActive ? '#c9a84c' : 'rgba(255,255,255,0.3)' }}
          >
            <span style={{ fontSize: 11 }}>{t.icon}</span>
            {t.label}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: '#c9a84c' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Filtro de posição pill ───────────────────────────────────────────────────

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
    <motion.button
      onClick={onPress}
      whileTap={{ scale: 0.93 }}
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
    </motion.button>
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
          <motion.button
            key={r.code}
            onClick={() => onFilter(isActive ? 'all' : r.code)}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 flex flex-col gap-1 min-w-[68px] rounded-xl border px-2.5 py-2 transition-all"
            style={{
              borderColor: isActive ? r.color : 'rgba(255,255,255,0.07)',
              background: isActive ? `${r.color}18` : 'rgba(255,255,255,0.02)',
              boxShadow: isActive ? `0 0 14px ${r.color}30` : 'none',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[8px] font-black uppercase tracking-wide"
                style={{ color: r.color }}
              >
                {r.label}
              </span>
              <span
                className="text-[8px]"
                style={{ color: isActive ? r.color : 'rgba(255,255,255,0.3)' }}
              >
                {r.pct}%
              </span>
            </div>
            <div className="h-1 bg-black/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: r.color }}
                initial={{ width: '0%' }}
                animate={{ width: `${r.pct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[8px] text-muted">
                {r.owned}
                <span className="opacity-50">/{r.total}</span>
              </p>
              <p
                className="text-[7px]"
                style={{ color: r.owned === r.total && r.total > 0 ? '#c9a84c' : 'transparent' }}
              >
                ✓
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Country section ──────────────────────────────────────────────────────────

function CountrySection({
  group,
  index,
  isOpen,
  onToggle,
  isSearching,
  favorites,
  dreamTeamIds,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelectCard,
  compareMode,
  comparingIds,
  onToggleCompare,
  onSpotlight,
}: {
  group: CountryGroup;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  isSearching: boolean;
  favorites: Set<string>;
  dreamTeamIds: Set<string>;
  onToggleFavorite: (cardId: string) => void;
  compareMode: boolean;
  comparingIds: Set<string>;
  onToggleCompare: (cardId: string) => void;
  onSpotlight: (card: CollectionCard) => void;
  onToggleDreamTeam: (cardId: string) => void;
  onSelectCard: (card: CollectionCard) => void;
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
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.025] active:bg-white/[0.04] transition-colors"
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
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden relative"
          >
            {showBurst && <CompletionBurst onDone={() => setShowBurst(false)} />}

            <div className="px-3 pb-4 pt-1">
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {group.slots.map((slot, i) => (
                  <AlbumSlot
                    key={slot.card.cardId}
                    slot={slot}
                    index={i}
                    isFavorite={favorites.has(slot.card.cardId)}
                    isDreamTeam={dreamTeamIds.has(slot.card.cardId)}
                    onToggleFavorite={() => onToggleFavorite(slot.card.cardId)}
                    onToggleDreamTeam={() => onToggleDreamTeam(slot.card.cardId)}
                    onSelect={() => onSelectCard(slot.card)}
                    compareMode={compareMode}
                    isComparing={comparingIds.has(slot.card.cardId)}
                    onToggleCompare={() => onToggleCompare(slot.card.cardId)}
                    onSpotlight={() => onSpotlight(slot.card)}
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

// ─── Album Slot ───────────────────────────────────────────────────────────────

function AlbumSlot({
  slot,
  index,
  isFavorite,
  isDreamTeam,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelect,
  compareMode = false,
  isComparing = false,
  onToggleCompare,
  onSpotlight,
}: {
  slot: AlbumSlotData;
  index: number;
  isFavorite: boolean;
  isDreamTeam: boolean;
  onToggleFavorite: () => void;
  onToggleDreamTeam: () => void;
  onSelect: () => void;
  compareMode?: boolean;
  isComparing?: boolean;
  onToggleCompare?: () => void;
  onSpotlight?: () => void;
}) {
  const { card, owned } = slot;
  const glow = RARITY_GLOW[card.rarityCode] ?? 'rgba(255,255,255,0.2)';
  const bg = RARITY_BG[card.rarityCode] ?? RARITY_BG.common!;
  const meta = RARITY_META[card.rarityCode];

  // Sprint 23 — toque longo abre o Spotlight; toque curto segue o comportamento
  // normal (seleciona pra comparar, se o modo estiver ativo, ou navega).
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const handlePointerDown = () => {
    if (!onSpotlight) return;
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onSpotlight();
    }, 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  const handleClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    if (compareMode && onToggleCompare) onToggleCompare();
    else onSelect();
  };

  if (owned) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: Math.min(index * 0.025, 0.5), duration: 0.2 }}
        whileTap={{ scale: 0.92 }}
        className="relative cursor-pointer rounded-[10px] overflow-hidden"
        style={{
          boxShadow: isComparing
            ? '0 0 0 2px #f59e0b, 0 0 14px rgba(245,158,11,0.6)'
            : `0 0 12px ${glow}45`,
        }}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={cancelLongPress}
        onPointerLeave={cancelLongPress}
      >
        {/* Sprint 36 — grid do Museu (Collection) sempre pede a densidade
            Compact do artwork exclusivo, mesmo exibindo em size="sm";
            resolvePlayerCardRenderer decide full-artwork vs. procedural,
            esta tela não sabe qual jogador tem preset. */}
        <ResolvedWorldLegendsCard card={card} size="sm" density="compact" glow />

        {/* Sprint 23 — marca de seleção do Modo Comparar */}
        {compareMode && (
          <div
            className="absolute left-1 top-1 w-4 h-4 rounded-full border flex items-center justify-center z-20 text-[8px]"
            style={{
              background: isComparing ? '#f59e0b' : 'rgba(0,0,0,0.55)',
              borderColor: isComparing ? '#f59e0b' : 'rgba(255,255,255,0.3)',
              color: isComparing ? '#1a1206' : 'transparent',
            }}
          >
            ✓
          </div>
        )}

        {/* Action buttons — meio da borda direita, longe do OVR e do nome (ambos maiores agora) */}
        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-20">
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDreamTeam();
            }}
            className="w-4 h-4 flex items-center justify-center rounded-full"
            style={{ background: isDreamTeam ? 'rgba(245,158,11,0.3)' : 'rgba(0,0,0,0.55)' }}
            whileTap={{ scale: 0.8 }}
            title={isDreamTeam ? 'Remover do Dream Team' : 'Adicionar ao Dream Team'}
          >
            <motion.span
              style={{ fontSize: 7, lineHeight: 1 }}
              animate={isDreamTeam ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {isDreamTeam ? '⭐' : '☆'}
            </motion.span>
          </motion.button>

          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="w-4 h-4 flex items-center justify-center rounded-full"
            style={{ background: isFavorite ? 'rgba(236,72,153,0.25)' : 'rgba(0,0,0,0.55)' }}
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
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.025, 0.5), duration: 0.2 }}
      whileTap={{ scale: 0.92 }}
      className="relative cursor-pointer rounded-xl overflow-hidden border border-white/5 bg-black/40"
      style={{ width: 88, height: 117 }}
      onClick={onSelect}
    >
      <div className="w-full h-full flex flex-col items-center justify-center p-1">
        <div className="flex-1 flex items-center justify-center opacity-10">
          <svg viewBox="0 0 40 60" fill="currentColor" className="w-7 h-10 text-white">
            <circle cx="20" cy="13" r="7" />
            <path d="M6 55 Q8 34 20 32 Q32 34 34 55 Z" />
          </svg>
        </div>
        <p className="text-[7px] text-white/15 font-bold">{String(index + 1).padStart(2, '0')}</p>
      </div>
    </motion.div>
  );
}

// ─── Hall of Fame Tab ─────────────────────────────────────────────────────────

function HallOfFameTab({
  goat,
  ultra,
  legendary,
  favorites,
  dreamTeamIds,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelectCard,
}: {
  goat: AlbumSlotData[];
  ultra: AlbumSlotData[];
  legendary: AlbumSlotData[];
  favorites: Set<string>;
  dreamTeamIds: Set<string>;
  onToggleFavorite: (cardId: string) => void;
  onToggleDreamTeam: (cardId: string) => void;
  onSelectCard: (card: CollectionCard) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto pb-28">
      <div className="px-4 pt-4 space-y-8">
        {/* GOAT Section */}
        {goat.length > 0 && (
          <HallSection
            title="WORLD CUP HEROES"
            subtitle="Os mais raros do mundo"
            color="#e2e8f0"
            glow="rgba(226,232,240,0.4)"
            slots={goat}
            size="xl"
            favorites={favorites}
            dreamTeamIds={dreamTeamIds}
            onToggleFavorite={onToggleFavorite}
            onToggleDreamTeam={onToggleDreamTeam}
            onSelectCard={onSelectCard}
          />
        )}

        {/* Ultra Section */}
        {ultra.length > 0 && (
          <HallSection
            title="ULTRA RARE"
            subtitle="Raridade extrema"
            color="#ec4899"
            glow="rgba(236,72,153,0.3)"
            slots={ultra}
            size="lg"
            favorites={favorites}
            dreamTeamIds={dreamTeamIds}
            onToggleFavorite={onToggleFavorite}
            onToggleDreamTeam={onToggleDreamTeam}
            onSelectCard={onSelectCard}
          />
        )}

        {/* Legendary Section */}
        {legendary.length > 0 && (
          <HallSection
            title="LEGENDARY"
            subtitle="Lendas atemporais"
            color="#c9a84c"
            glow="rgba(201,168,76,0.25)"
            slots={legendary}
            size="md"
            favorites={favorites}
            dreamTeamIds={dreamTeamIds}
            onToggleFavorite={onToggleFavorite}
            onToggleDreamTeam={onToggleDreamTeam}
            onSelectCard={onSelectCard}
          />
        )}
      </div>
    </div>
  );
}

function HallSection({
  title,
  subtitle,
  color,
  glow,
  slots,
  size,
  favorites,
  dreamTeamIds,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelectCard,
}: {
  title: string;
  subtitle: string;
  color: string;
  glow: string;
  slots: AlbumSlotData[];
  size: 'xl' | 'lg' | 'md';
  favorites: Set<string>;
  dreamTeamIds: Set<string>;
  onToggleFavorite: (cardId: string) => void;
  onToggleDreamTeam: (cardId: string) => void;
  onSelectCard: (card: CollectionCard) => void;
}) {
  const cols = size === 'xl' ? 'grid-cols-2' : size === 'lg' ? 'grid-cols-3' : 'grid-cols-4';
  const ownedCount = slots.filter((s) => s.owned).length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Section header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <p
            className="font-display text-xl tracking-widest leading-none mb-0.5"
            style={{
              background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.6))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 12px ${color})`,
            }}
          >
            {title}
          </p>
          <p className="text-muted text-[10px]">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-base leading-none" style={{ color }}>
            {ownedCount}
            <span className="text-muted text-xs">/{slots.length}</span>
          </p>
          <p className="text-[9px] text-muted">
            {slots.length > 0 ? Math.round((ownedCount / slots.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Decorative glow line */}
      <div
        className="h-px mb-4 rounded-full"
        style={{ background: `linear-gradient(90deg, ${color}60, transparent)` }}
      />

      {/* Grid */}
      <div className={`grid ${cols} gap-3`}>
        {slots.map((slot, i) => (
          <MuseumCard
            key={slot.card.cardId}
            slot={slot}
            index={i}
            accentColor={color}
            accentGlow={glow}
            size={size}
            isFavorite={favorites.has(slot.card.cardId)}
            isDreamTeam={dreamTeamIds.has(slot.card.cardId)}
            onToggleFavorite={() => onToggleFavorite(slot.card.cardId)}
            onToggleDreamTeam={() => onToggleDreamTeam(slot.card.cardId)}
            onSelect={() => onSelectCard(slot.card)}
          />
        ))}
      </div>
    </motion.section>
  );
}

function MuseumCard({
  slot,
  index,
  accentColor,
  accentGlow,
  size,
  isFavorite,
  isDreamTeam,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelect,
}: {
  slot: AlbumSlotData;
  index: number;
  accentColor: string;
  accentGlow: string;
  size: 'xl' | 'lg' | 'md';
  isFavorite: boolean;
  isDreamTeam: boolean;
  onToggleFavorite: () => void;
  onToggleDreamTeam: () => void;
  onSelect: () => void;
}) {
  const { card, owned } = slot;
  const aspect = size === 'xl' ? 'aspect-[3/4]' : 'aspect-[2/3]';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.8), duration: 0.35, ease: 'easeOut' }}
      whileTap={{ scale: 0.96 }}
      className={`relative ${aspect} rounded-2xl overflow-hidden cursor-pointer`}
      style={{
        border: `1px solid ${owned ? `${accentColor}40` : 'rgba(255,255,255,0.06)'}`,
        boxShadow: owned
          ? `0 0 24px ${accentGlow}, 0 4px 16px rgba(0,0,0,0.6)`
          : '0 4px 16px rgba(0,0,0,0.5)',
        background: owned
          ? `linear-gradient(145deg, ${accentColor}08 0%, rgba(0,0,0,0.9) 100%)`
          : 'rgba(0,0,0,0.5)',
      }}
      onClick={onSelect}
    >
      {owned ? (
        <>
          {/* Glow orb */}
          <div
            className="absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl pointer-events-none"
            style={{ background: `${accentColor}30` }}
          />

          {/* OVR */}
          <div className="absolute top-2 left-2">
            <p
              className="font-display leading-none"
              style={{
                fontSize: size === 'xl' ? 42 : size === 'lg' ? 34 : 28,
                background: `linear-gradient(180deg, #fff, ${accentColor})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: `drop-shadow(0 0 8px ${accentColor}80)`,
              }}
            >
              {card.overall}
            </p>
          </div>

          {/* Flag — center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              style={{
                fontSize: size === 'xl' ? 52 : size === 'lg' ? 40 : 32,
                filter: `drop-shadow(0 0 12px ${accentColor}60)`,
              }}
            >
              {card.flagEmoji}
            </span>
          </div>

          {/* Name + position */}
          <div
            className="absolute bottom-0 left-0 right-0 p-2"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}
          >
            <p
              className="font-display text-white leading-tight tracking-wide truncate"
              style={{ fontSize: size === 'xl' ? 14 : size === 'lg' ? 11 : 9 }}
            >
              {card.displayName.toUpperCase()}
            </p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[8px]" style={{ color: `${accentColor}90` }}>
                {card.position}
              </span>
              <span className="text-[8px] text-muted">{card.era}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDreamTeam();
              }}
              whileTap={{ scale: 0.8 }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: isDreamTeam ? 'rgba(245,158,11,0.35)' : 'rgba(0,0,0,0.5)',
                border: isDreamTeam
                  ? '1px solid rgba(245,158,11,0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ fontSize: 11 }}>{isDreamTeam ? '⭐' : '☆'}</span>
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              whileTap={{ scale: 0.8 }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: isFavorite ? 'rgba(236,72,153,0.3)' : 'rgba(0,0,0,0.5)',
                border: isFavorite
                  ? '1px solid rgba(236,72,153,0.5)'
                  : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ fontSize: 11 }}>{isFavorite ? '❤️' : '🤍'}</span>
            </motion.button>
          </div>
        </>
      ) : (
        /* ─ Mystery / não possui ─ */
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
          {/* Pulse ring */}
          <motion.div
            className="w-12 h-12 rounded-full border flex items-center justify-center"
            style={{ borderColor: `${accentColor}20` }}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
          >
            <span className="text-xl" style={{ filter: 'grayscale(1)', opacity: 0.2 }}>
              ?
            </span>
          </motion.div>
          <div className="text-center">
            <p className="text-[8px] font-bold" style={{ color: `${accentColor}40` }}>
              NÃO POSSUI
            </p>
            <p className="text-[7px] text-muted/40 mt-0.5 truncate max-w-full px-1">
              {card.displayName}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Dream Team Tab ───────────────────────────────────────────────────────────

function DreamTeamTab({
  dreamTeamCards,
  maxSlots,
  onSelectCard,
  onRemove,
}: {
  dreamTeamCards: CollectionCard[];
  maxSlots: number;
  onSelectCard: (card: CollectionCard) => void;
  onRemove: (cardId: string) => void;
}) {
  const filled = dreamTeamCards.length;
  const empty = maxSlots - filled;
  const avgOvr =
    filled > 0 ? Math.round(dreamTeamCards.reduce((s, c) => s + c.overall, 0) / filled) : 0;

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      <div className="px-4 pt-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <p
            className="text-[9px] font-black uppercase tracking-[0.22em] mb-1"
            style={{ color: 'rgba(245,158,11,0.6)' }}
          >
            Meu
          </p>
          <div className="flex items-end justify-between">
            <h2
              className="font-display text-2xl tracking-widest"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24, #fde68a)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              DREAM TEAM
            </h2>
            {filled > 0 && (
              <div className="text-right">
                <p className="font-display text-xl" style={{ color: '#f59e0b' }}>
                  {avgOvr}
                </p>
                <p className="text-muted text-[9px]">OVR médio</p>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)' }}
                initial={{ width: '0%' }}
                animate={{ width: `${(filled / maxSlots) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] font-bold shrink-0" style={{ color: '#f59e0b' }}>
              {filled}/{maxSlots}
            </span>
          </div>
        </motion.div>

        {filled === 0 ? (
          /* ─ Empty state ─ */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              className="text-6xl mb-4"
            >
              ⭐
            </motion.div>
            <p className="text-parchment font-bold text-sm mb-2">Seu Dream Team está vazio</p>
            <p className="text-muted text-xs leading-relaxed max-w-xs mx-auto">
              Toque <span style={{ color: '#f59e0b' }}>⭐</span> em qualquer carta que você possui
              para montar seu time dos sonhos com até 11 lendas.
            </p>
          </motion.div>
        ) : (
          /* ─ Dream Team grid ─ */
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {dreamTeamCards.map((card, i) => (
              <motion.div
                key={card.cardId}
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: -8 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className="relative aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  background: `linear-gradient(145deg, ${RARITY_GLOW[card.rarityCode] ?? 'rgba(255,255,255,0.1)'}15, #070709)`,
                  border: `1px solid ${RARITY_GLOW[card.rarityCode] ?? 'rgba(255,255,255,0.12)'}50`,
                  boxShadow: `0 0 20px ${RARITY_GLOW[card.rarityCode] ?? 'rgba(255,255,255,0.1)'}40`,
                }}
                onClick={() => onSelectCard(card)}
              >
                {/* Glow orb */}
                <div
                  className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl pointer-events-none"
                  style={{ background: `${RARITY_GLOW[card.rarityCode]}25` }}
                />

                {/* OVR */}
                <div className="absolute top-2 left-2">
                  <span
                    className="font-display text-2xl leading-none"
                    style={{
                      background: `linear-gradient(180deg, #fff, ${RARITY_GLOW[card.rarityCode] ?? '#fff'})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {card.overall}
                  </span>
                </div>

                {/* Position badge */}
                <div className="absolute top-2 right-2">
                  <span
                    className="text-[7px] font-black px-1 py-0.5 rounded"
                    style={{
                      background: `${RARITY_GLOW[card.rarityCode] ?? '#fff'}25`,
                      color: RARITY_GLOW[card.rarityCode] ?? '#fff',
                    }}
                  >
                    {card.position}
                  </span>
                </div>

                {/* Flag center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    style={{
                      fontSize: 36,
                      filter: `drop-shadow(0 0 14px ${RARITY_GLOW[card.rarityCode]}70)`,
                    }}
                  >
                    {card.flagEmoji}
                  </span>
                </div>

                {/* Name + remove */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-2"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' }}
                >
                  <p className="text-white text-[9px] font-bold leading-tight truncate">
                    {card.displayName.toUpperCase()}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span
                      className="text-[7px]"
                      style={{ color: RARITY_META[card.rarityCode]?.color }}
                    >
                      {RARITY_META[card.rarityCode]?.label}
                    </span>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(card.cardId);
                      }}
                      whileTap={{ scale: 0.8 }}
                      className="text-[8px] text-muted/60 hover:text-red-400 transition-colors"
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: empty }).map((_, i) => (
              <motion.div
                key={`empty-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: (filled + i) * 0.04 }}
                className="aspect-[2/3] rounded-2xl flex flex-col items-center justify-center gap-1"
                style={{
                  border: '1px dashed rgba(245,158,11,0.15)',
                  background: 'rgba(245,158,11,0.02)',
                }}
              >
                <span className="text-xl" style={{ color: 'rgba(245,158,11,0.15)' }}>
                  ⭐
                </span>
                <p className="text-[7px] font-bold" style={{ color: 'rgba(245,158,11,0.2)' }}>
                  {String(filled + i + 1).padStart(2, '0')}
                </p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Instrução */}
        {filled > 0 && filled < maxSlots && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-muted text-[10px] mt-6"
          >
            Toque <span style={{ color: '#f59e0b' }}>⭐</span> em qualquer carta no Álbum para
            completar seu Dream Team
          </motion.p>
        )}

        {filled === maxSlots && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center px-4 py-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04))',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <p className="text-lg mb-1">⭐</p>
            <p className="font-display text-sm tracking-wider" style={{ color: '#f59e0b' }}>
              DREAM TEAM COMPLETO
            </p>
            <p className="text-muted text-xs mt-1">
              OVR médio: <span style={{ color: '#fbbf24' }}>{avgOvr}</span>
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Completion burst ─────────────────────────────────────────────────────────

function playCompletionChime() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      osc.start(t);
      osc.stop(t + 0.28);
    });
  } catch {
    /* noop */
  }
}

const BURST_PARTICLES = Array.from({ length: 36 }, (_, i) => ({
  angle: (i / 36) * 360,
  distance: 45 + (i % 5) * 20,
  size: 3 + (i % 4) * 2,
  color: ['#c9a84c', '#fbbf24', '#e6c85a', '#fff', '#f0c040', '#ec4899', '#60a5fa'][i % 7]!,
  delay: i * 0.018,
  shape: i % 4 === 0 ? '20%' : '50%',
}));

const CONFETTI_STRIPS = Array.from({ length: 14 }, (_, i) => ({
  x: -10 + (i / 13) * 120,
  delay: i * 0.07,
  color: ['#c9a84c', '#fbbf24', '#ec4899', '#60a5fa', '#34d399'][i % 5]!,
  rotate: -30 + (i % 3) * 30,
}));

function CompletionBurst({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    playCompletionChime();
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center overflow-hidden">
      {/* Radial flash */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.40), transparent 65%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1.0 }}
        onAnimationComplete={onDone}
      />

      {/* Falling confetti strips */}
      {CONFETTI_STRIPS.map((s, i) => (
        <motion.div
          key={`strip-${i}`}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${s.x}%`,
            width: 6,
            height: 14,
            background: s.color,
            rotate: s.rotate,
          }}
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: 260, opacity: [1, 1, 0], rotate: s.rotate + 180 }}
          transition={{ duration: 1.4, delay: s.delay, ease: 'easeIn' }}
        />
      ))}

      {/* Burst particles */}
      {BURST_PARTICLES.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            top: '50%',
            left: '50%',
            borderRadius: p.shape,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0,
          }}
          transition={{ duration: 1.0, delay: p.delay, ease: 'easeOut' }}
        />
      ))}

      {/* COMPLETO text */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.4, times: [0, 0.25, 0.55, 1] }}
        className="font-display text-xl tracking-widest"
        style={{ color: '#c9a84c', textShadow: '0 0 24px rgba(201,168,76,0.9)', zIndex: 30 }}
      >
        ✓ COMPLETO!
      </motion.div>
    </div>
  );
}

// ─── Museu Tab ────────────────────────────────────────────────────────────────

type CategoryItem = {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  color: string;
  slots: AlbumSlotData[];
  ownedCount: number;
  completionPct: number;
};

type ConquistaItem = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  unlocked: boolean;
};

function MuseuTab({
  categories,
  favorites,
  dreamTeamIds,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelectCard,
}: {
  categories: CategoryItem[];
  favorites: Set<string>;
  dreamTeamIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onToggleDreamTeam: (id: string) => void;
  onSelectCard: (card: CollectionCard) => void;
}) {
  const [openSection, setOpenSection] = useState<string | null>('copa');

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      {/* Header */}
      <motion.div
        className="px-4 pt-4 pb-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p
          className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5"
          style={{ color: 'rgba(201,168,76,0.55)' }}
        >
          World Legends
        </p>
        <h2
          className="font-display text-2xl tracking-widest leading-none"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #c9a84c 55%, #8c6f27 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          MUSEU
        </h2>
      </motion.div>

      {/* Collections */}
      <div className="px-4 space-y-2 pb-6">
        <p
          className="text-[8px] font-black uppercase tracking-[0.25em] mb-2"
          style={{ color: 'rgba(255,255,255,0.2)' }}
        >
          Coleções Temáticas
        </p>
        {categories.map((cat, i) => (
          <CategorySection
            key={cat.id}
            cat={cat}
            index={i}
            isOpen={openSection === cat.id}
            onToggle={() => setOpenSection((prev) => (prev === cat.id ? null : cat.id))}
            favorites={favorites}
            dreamTeamIds={dreamTeamIds}
            onToggleFavorite={onToggleFavorite}
            onToggleDreamTeam={onToggleDreamTeam}
            onSelectCard={onSelectCard}
          />
        ))}
      </div>
    </div>
  );
}

function CategorySection({
  cat,
  index,
  isOpen,
  onToggle,
  favorites,
  dreamTeamIds,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelectCard,
}: {
  cat: CategoryItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  favorites: Set<string>;
  dreamTeamIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onToggleDreamTeam: (id: string) => void;
  onSelectCard: (card: CollectionCard) => void;
}) {
  const isComplete = cat.completionPct === 100 && cat.slots.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.3) }}
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: isComplete
          ? 'rgba(201,168,76,0.4)'
          : cat.ownedCount > 0
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(255,255,255,0.05)',
        boxShadow: isComplete ? '0 0 18px rgba(201,168,76,0.18)' : 'none',
      }}
    >
      <motion.button
        onClick={onToggle}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.025] transition-colors"
      >
        <span className="text-xl shrink-0 leading-none">{cat.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-parchment text-sm font-bold leading-tight truncate">{cat.name}</p>
            {isComplete && (
              <span
                className="shrink-0 text-[8px] font-black px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'rgba(201,168,76,0.2)',
                  color: '#c9a84c',
                  border: '1px solid rgba(201,168,76,0.4)',
                }}
              >
                ✓ COMPLETO
              </span>
            )}
          </div>
          <div className="h-1 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isComplete
                  ? 'linear-gradient(90deg,#8c6f27,#c9a84c)'
                  : `linear-gradient(90deg,${cat.color}60,${cat.color})`,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${cat.completionPct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
          <p className="text-[8px] text-muted mt-0.5">{cat.subtitle}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-parchment text-xs font-bold font-display">
            {cat.ownedCount}
            <span className="text-muted text-[10px]">/{cat.slots.length}</span>
          </p>
          <p className="text-[8px]" style={{ color: cat.color }}>
            {cat.completionPct}%
          </p>
        </div>
        <motion.span
          className="text-muted text-xs shrink-0 ml-1"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 pt-1">
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
                {cat.slots.map((slot, i) => (
                  <AlbumSlot
                    key={slot.card.cardId}
                    slot={slot}
                    index={i}
                    isFavorite={favorites.has(slot.card.cardId)}
                    isDreamTeam={dreamTeamIds.has(slot.card.cardId)}
                    onToggleFavorite={() => onToggleFavorite(slot.card.cardId)}
                    onToggleDreamTeam={() => onToggleDreamTeam(slot.card.cardId)}
                    onSelect={() => onSelectCard(slot.card)}
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

function BadgeCard({ badge, index }: { badge: ConquistaItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="rounded-xl p-3 relative overflow-hidden"
      style={{
        background: badge.unlocked ? `${badge.color}12` : 'rgba(0,0,0,0.25)',
        border: `1px solid ${badge.unlocked ? `${badge.color}35` : 'rgba(255,255,255,0.05)'}`,
        opacity: badge.unlocked ? 1 : 0.5,
      }}
    >
      {badge.unlocked && (
        <div
          className="absolute -top-3 -right-3 w-12 h-12 rounded-full blur-xl"
          style={{ background: `${badge.color}25` }}
        />
      )}
      <div className="flex items-start gap-2">
        <span
          style={{ fontSize: 22, lineHeight: 1, filter: badge.unlocked ? 'none' : 'grayscale(1)' }}
        >
          {badge.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p
            className="text-[10px] font-bold leading-tight truncate"
            style={{ color: badge.unlocked ? badge.color : 'rgba(255,255,255,0.3)' }}
          >
            {badge.name}
          </p>
          <p className="text-[8px] text-muted/60 leading-tight mt-0.5 line-clamp-2">{badge.desc}</p>
          {badge.unlocked && (
            <p className="text-[7px] font-black mt-1" style={{ color: badge.color, opacity: 0.7 }}>
              ✓ DESBLOQUEADO
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Nações Tab ───────────────────────────────────────────────────────────────

type HallDataShape = ReturnType<typeof buildHallData>;

function NacoesTab({
  hallData,
  favorites,
  dreamTeamIds,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelectCard,
}: {
  hallData: HallDataShape;
  favorites: Set<string>;
  dreamTeamIds: Set<string>;
  onToggleFavorite: (cardId: string) => void;
  onToggleDreamTeam: (cardId: string) => void;
  onSelectCard: (card: CollectionCard) => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const inProgress = hallData.countryGroups.filter((g) => g.ownedCount > 0 && !g.isComplete);
    const empty = hallData.countryGroups.filter((g) => g.ownedCount === 0 && !g.isComplete);
    const complete = hallData.countryGroups.filter((g) => g.isComplete);
    inProgress.sort((a, b) => b.ownedCount - a.ownedCount);
    return [...inProgress, ...empty, ...complete];
  }, [hallData.countryGroups]);

  const selectedGroup = selectedCountry
    ? (hallData.countryGroups.find((g) => g.nationality === selectedCountry) ?? null)
    : null;

  if (selectedGroup) {
    return (
      <CountryDetailView
        group={selectedGroup}
        favorites={favorites}
        dreamTeamIds={dreamTeamIds}
        onBack={() => setSelectedCountry(null)}
        onToggleFavorite={onToggleFavorite}
        onToggleDreamTeam={onToggleDreamTeam}
        onSelectCard={onSelectCard}
      />
    );
  }

  const totalCountries = hallData.countryGroups.length;
  const overallPct = hallData.completionPct;

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <p
          className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5"
          style={{ color: 'rgba(201,168,76,0.55)' }}
        >
          World Legends
        </p>
        <div className="flex items-end justify-between">
          <h2
            className="font-display text-2xl tracking-widest leading-none"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #c9a84c 55%, #8c6f27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🌍 NAÇÕES
          </h2>
          <div className="text-right">
            <p className="font-display text-lg leading-none" style={{ color: '#c9a84c' }}>
              {overallPct}%
            </p>
            <p className="text-muted text-[9px]">{totalCountries} países</p>
          </div>
        </div>
      </div>

      {/* Country grid */}
      <div className="px-4 grid grid-cols-2 gap-2.5">
        {sorted.map((group, i) => {
          const accent = COUNTRY_ACCENT[group.nationality] ?? DEFAULT_COUNTRY_ACCENT;
          return (
            <motion.button
              key={group.nationality}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.4) }}
              onClick={() => setSelectedCountry(group.nationality)}
              className="relative rounded-2xl border p-3 text-left flex flex-col gap-2 transition-all"
              style={{
                borderColor: group.isComplete
                  ? 'rgba(201,168,76,0.4)'
                  : group.ownedCount > 0
                    ? `${accent}40`
                    : 'rgba(255,255,255,0.06)',
                background: group.isComplete
                  ? 'rgba(201,168,76,0.06)'
                  : group.ownedCount > 0
                    ? `${accent}08`
                    : 'rgba(255,255,255,0.02)',
                boxShadow: group.isComplete ? '0 0 16px rgba(201,168,76,0.15)' : 'none',
              }}
            >
              {/* Flag */}
              <span style={{ fontSize: 32, lineHeight: 1 }}>{group.flag}</span>

              {/* Country name */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-parchment text-xs font-bold leading-tight">{group.name}</p>
                {group.isComplete && (
                  <span
                    className="text-[7px] font-black px-1 rounded-full"
                    style={{
                      background: 'rgba(201,168,76,0.2)',
                      color: '#c9a84c',
                      border: '1px solid rgba(201,168,76,0.4)',
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>

              {/* Count */}
              <p className="text-muted text-[9px]">
                {group.ownedCount}/{group.totalCount} cartas
              </p>

              {/* Progress bar */}
              <div className="h-1 bg-black/40 rounded-full overflow-hidden w-full">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${group.completionPct}%`,
                    background: group.isComplete
                      ? 'linear-gradient(90deg,#8c6f27,#c9a84c)'
                      : `${accent}`,
                  }}
                />
              </div>

              {/* Percentage */}
              <p
                className="text-[9px] font-bold self-end"
                style={{ color: group.isComplete ? '#c9a84c' : accent }}
              >
                {group.completionPct}%
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function CountryDetailView({
  group,
  favorites,
  dreamTeamIds,
  onBack,
  onToggleFavorite,
  onToggleDreamTeam,
  onSelectCard,
}: {
  group: CountryGroup;
  favorites: Set<string>;
  dreamTeamIds: Set<string>;
  onBack: () => void;
  onToggleFavorite: (cardId: string) => void;
  onToggleDreamTeam: (cardId: string) => void;
  onSelectCard: (card: CollectionCard) => void;
}) {
  const accent = COUNTRY_ACCENT[group.nationality] ?? DEFAULT_COUNTRY_ACCENT;

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      {/* Back button + header */}
      <div className="px-4 pt-4 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-muted text-xs mb-4 hover:text-parchment transition-colors"
        >
          <span>←</span>
          <span>Nações</span>
        </button>

        <div className="flex items-center gap-4">
          <span style={{ fontSize: 48, lineHeight: 1 }}>{group.flag}</span>
          <div>
            <h2
              className="font-display text-2xl tracking-widest leading-none"
              style={{ color: accent }}
            >
              {group.name.toUpperCase()}
            </h2>
            <p className="text-muted text-xs mt-1">
              {group.ownedCount} de {group.totalCount} cartas ({group.completionPct}%)
            </p>
          </div>
        </div>

        {/* Completion bar */}
        <div className="mt-3 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${group.completionPct}%`,
              background: group.isComplete ? 'linear-gradient(90deg,#8c6f27,#c9a84c)' : accent,
            }}
          />
        </div>

        {/* Completion box */}
        {group.isComplete && (
          <div
            className="mt-4 px-4 py-3 rounded-xl"
            style={{
              background: 'rgba(201,168,76,0.08)',
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            <p className="text-[11px] font-bold" style={{ color: '#c9a84c' }}>
              🏆 Coleção Completa! +500c +100 frags (Em breve)
            </p>
          </div>
        )}
      </div>

      {/* Card grid */}
      <div className="px-4">
        <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
          {group.slots.map((slot, i) => (
            <AlbumSlot
              key={slot.card.cardId}
              slot={slot}
              index={i}
              isFavorite={favorites.has(slot.card.cardId)}
              isDreamTeam={dreamTeamIds.has(slot.card.cardId)}
              onToggleFavorite={() => onToggleFavorite(slot.card.cardId)}
              onToggleDreamTeam={() => onToggleDreamTeam(slot.card.cardId)}
              onSelect={() => onSelectCard(slot.card)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Conquistas Tab ───────────────────────────────────────────────────────────

function ConquistasTab({
  conquistas,
}: {
  conquistas: ConquistaItem[];
  hallData: HallDataShape;
  catalogCards: CollectionCard[];
  ownedCardIds: ReadonlySet<string>;
  dreamTeamIds: Set<string>;
}) {
  const unlockedCount = conquistas.filter((c) => c.unlocked).length;

  return (
    <div className="flex-1 overflow-y-auto pb-28">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <p
          className="text-[9px] font-black uppercase tracking-[0.25em] mb-0.5"
          style={{ color: 'rgba(201,168,76,0.55)' }}
        >
          World Legends
        </p>
        <div className="flex items-end justify-between">
          <h2
            className="font-display text-2xl tracking-widest leading-none"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #c9a84c 55%, #8c6f27 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🏆 TROFÉUS
          </h2>
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.25)',
            }}
          >
            <span style={{ fontSize: 10 }}>🏅</span>
            <span className="text-[9px] font-bold" style={{ color: '#c9a84c' }}>
              {unlockedCount}/{conquistas.length} desbloqueados
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-2.5">
          {conquistas.map((badge, i) => (
            <BadgeCard key={badge.id} badge={badge} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
