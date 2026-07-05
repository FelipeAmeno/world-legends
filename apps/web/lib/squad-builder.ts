/**
 * lib/squad-builder.ts — T054
 *
 * Estado e lógica do Squad Builder Premium.
 * Contém toda a lógica pura (sem React):
 *   - SquadBuilderState + reducer
 *   - Snapshot real-time (OVR + química) com @world-legends/chemistry
 *   - Adjacência entre slots para linhas de química
 *   - Compatibilidade de posição por slot
 */

import { calculateChemistry } from '@world-legends/chemistry';
import type { SquadChemistry } from '@world-legends/chemistry';
import { calculateSquadRating } from '@world-legends/squad-rating';
import type { SquadRating } from '@world-legends/squad-rating';
import type { CollectionCard } from './collection-data';
import {
  FORMATIONS,
  FORMATION_LABELS,
  type FormationKey,
  MAX_BENCH,
  type SlotDef,
  type SquadSlots,
  changeFormation,
  createEmptyState,
  getPositionCompat,
} from './squad-data';

export type { FormationKey, SlotDef, SquadSlots };
export { FORMATIONS, FORMATION_LABELS, MAX_BENCH, getPositionCompat };

// ─── Drag source / target ─────────────────────────────────────────────────────

export type DragSource =
  | { kind: 'slot'; slotId: string; cardId: string }
  | { kind: 'bench'; benchIdx: number; cardId: string }
  | { kind: 'pool'; cardId: string };

export type DropTarget =
  | { kind: 'slot'; slotId: string }
  | { kind: 'bench'; benchIdx: number }
  | { kind: 'pool' };

// ─── State ────────────────────────────────────────────────────────────────────

export type SBState = {
  formation: FormationKey;
  slots: SquadSlots; // slotId → card | null
  bench: (CollectionCard | null)[]; // 7 posições
  dragging: DragSource | null;
  dragOver: string | null; // slotId | 'bench-N' | 'pool'
};

export function createSBState(formation: FormationKey = '4-3-3'): SBState {
  const base = createEmptyState(formation);
  return { ...base, dragging: null, dragOver: null };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export type AutoBuildMode = 'best' | 'chemistry' | 'brazilians' | 'goat' | 'dream';

export type SBAction =
  | { type: 'DRAG_START'; source: DragSource }
  | { type: 'DRAG_OVER'; targetId: string }
  | { type: 'DRAG_LEAVE' }
  | { type: 'DROP'; target: DropTarget; allCards: CollectionCard[] }
  | { type: 'DRAG_END' }
  | { type: 'REMOVE_SLOT'; slotId: string }
  | { type: 'REMOVE_BENCH'; idx: number }
  | { type: 'CHANGE_FORMATION'; formation: FormationKey }
  | { type: 'CLEAR_ALL' }
  | { type: 'PLACE_IN_SLOT'; cardId: string; slotId: string; allCards: CollectionCard[] }
  | { type: 'TAP_ADD'; cardId: string; allCards: CollectionCard[] }
  | { type: 'AUTO_FILL'; allCards: CollectionCard[] }
  | {
      type: 'AUTO_BUILD';
      mode: AutoBuildMode;
      allCards: CollectionCard[];
      favoriteIds?: ReadonlySet<string>;
    };

export function sbReducer(state: SBState, action: SBAction): SBState {
  switch (action.type) {
    case 'DRAG_START':
      return { ...state, dragging: action.source };

    case 'DRAG_OVER':
      return { ...state, dragOver: action.targetId };

    case 'DRAG_LEAVE':
      return { ...state, dragOver: null };

    case 'DRAG_END':
      return { ...state, dragging: null, dragOver: null };

    case 'DROP': {
      const { target, allCards } = action;
      const src = state.dragging;
      if (!src) return { ...state, dragging: null, dragOver: null };

      const slots = { ...state.slots };
      const bench = [...state.bench];
      const cardMap = new Map(allCards.map((c) => [c.cardId, c]));
      const srcCard = cardMap.get(src.cardId) ?? null;
      if (!srcCard) return { ...state, dragging: null, dragOver: null };

      // Clear source
      if (src.kind === 'slot') slots[src.slotId] = null;
      if (src.kind === 'bench') bench[src.benchIdx] = null;

      if (target.kind === 'slot') {
        const displaced = slots[target.slotId] ?? null;
        slots[target.slotId] = srcCard;
        if (displaced && displaced.cardId !== srcCard.cardId) {
          if (src.kind === 'slot') slots[src.slotId] = displaced;
          else if (src.kind === 'bench') bench[src.benchIdx] = displaced;
        }
      } else if (target.kind === 'bench') {
        const displaced = bench[target.benchIdx] ?? null;
        bench[target.benchIdx] = srcCard;
        if (displaced && displaced.cardId !== srcCard.cardId) {
          if (src.kind === 'slot') slots[src.slotId] = displaced;
          else if (src.kind === 'bench') bench[src.benchIdx] = displaced;
        }
      }
      // pool: apenas liberou a origem

      return { ...state, slots, bench, dragging: null, dragOver: null };
    }

    case 'REMOVE_SLOT': {
      const slots = { ...state.slots, [action.slotId]: null };
      return { ...state, slots };
    }

    case 'REMOVE_BENCH': {
      const bench = [...state.bench];
      bench[action.idx] = null;
      return { ...state, bench };
    }

    case 'CHANGE_FORMATION': {
      const base = changeFormation(
        { formation: state.formation, slots: state.slots, bench: state.bench },
        action.formation,
      );
      return { ...state, ...base, dragging: null, dragOver: null };
    }

    case 'CLEAR_ALL': {
      return createSBState(state.formation);
    }

    case 'PLACE_IN_SLOT': {
      const card = action.allCards.find((c) => c.cardId === action.cardId);
      if (!card) return state;
      const slots = { ...state.slots, [action.slotId]: card };
      return { ...state, slots };
    }

    case 'TAP_ADD': {
      const card = action.allCards.find((c) => c.cardId === action.cardId);
      if (!card) return state;
      const slots = { ...state.slots };
      const emptySlotId = Object.keys(slots).find((id) => !slots[id]);
      if (emptySlotId) {
        slots[emptySlotId] = card;
        return { ...state, slots };
      }
      const bench = [...state.bench];
      const emptyBench = bench.findIndex((b) => !b);
      if (emptyBench >= 0) {
        bench[emptyBench] = card;
        return { ...state, bench };
      }
      return state;
    }

    case 'AUTO_FILL': {
      const pool = getPoolCards(action.allCards, state);
      const slots = { ...state.slots };
      for (const slotId of Object.keys(slots)) {
        if (!slots[slotId] && pool.length > 0) {
          slots[slotId] = pool.shift()!;
        }
      }
      return { ...state, slots };
    }

    case 'AUTO_BUILD': {
      const newSlots = autoBuildSlots(
        action.mode,
        action.allCards,
        state.formation,
        action.favoriteIds,
      );
      return { ...state, slots: newSlots };
    }

    default:
      return state;
  }
}

// ─── Snapshot real-time ───────────────────────────────────────────────────────

export type SBSnapshot = {
  starterCount: number;
  rating: SquadRating;
  chemistry: SquadChemistry;
  chemLinkMap: Map<string, number>; // "cardA-cardB" → link.total
};

const EMPTY_SNAPSHOT: SBSnapshot = {
  starterCount: 0,
  rating: {
    overall: 0,
    attack: 0,
    midfield: 0,
    defense: 0,
    breakdown: {
      chemistryMultiplier: 1,
      totalTraitBonus: 0,
      traitBonus: { attack: 0, midfield: 0, defense: 0 },
      sectorCounts: { attack: 0, midfield: 0, defense: 0 },
      baseAverage: { attack: 0, midfield: 0, defense: 0 },
    },
  },
  chemistry: {
    total: 0,
    links: [],
    perPlayer: {},
    breakdown: {
      nationalityLinks: 0,
      competitionLinks: 0,
      eraLinks: 0,
      perfectLinks: 0,
      totalLinkBonus: 0,
      totalLinks: 0,
    },
  },
  chemLinkMap: new Map(),
};

function xpEraMap(era: string): string {
  const map: Record<string, string> = {
    '1950s': '1950s',
    '1960s': '1960s',
    '1970s': '1970s',
    '1980s': '1980s',
    '1990s': '1990s',
    '2000s': '2000s',
    '2010s': '2010s',
    '2020s': '2020s',
  };
  return map[era] ?? '1990s';
}

export function calcSnapshot(state: SBState): SBSnapshot {
  const starters = Object.values(state.slots).filter((c): c is CollectionCard => c !== null);
  if (starters.length === 0) return EMPTY_SNAPSHOT;

  const rated = starters.map((c) => ({
    userCardId: c.cardId,
    position: c.position as any,
    overall: c.overall,
    traits: [],
  }));

  const chemInput = starters.map((c) => ({
    userCardId: c.cardId,
    nationality: c.nationality,
    competition: 'brasileirao' as any,
    era: xpEraMap(c.era) as any,
  }));

  const rating = calculateSquadRating({ starters: rated, chemistry: 75 });
  const chemistry = calculateChemistry({ players: chemInput });

  // Construir mapa de links: "aId-bId" → total (bidirecional)
  const chemLinkMap = new Map<string, number>();
  for (const link of chemistry.links) {
    const kAB = `${link.playerAId}-${link.playerBId}`;
    const kBA = `${link.playerBId}-${link.playerAId}`;
    chemLinkMap.set(kAB, link.total);
    chemLinkMap.set(kBA, link.total);
  }

  return { starterCount: starters.length, rating, chemistry, chemLinkMap };
}

// ─── Adjacência de slots (para linhas de química) ─────────────────────────────

const DIST_THRESHOLD = 32; // % de distância máxima para conectar

function slotDist(a: SlotDef, b: SlotDef): number {
  const dx = a.left - b.left;
  const dy = a.top - b.top;
  return Math.sqrt(dx * dx + dy * dy);
}

export type ChemLine = {
  slotA: SlotDef;
  slotB: SlotDef;
  cardA: CollectionCard | null;
  cardB: CollectionCard | null;
  total: number; // 0–4 (chemistry link total)
  color: string;
  glow: string;
};

export function buildChemLines(state: SBState, snapshot: SBSnapshot): ChemLine[] {
  const slots = FORMATIONS[state.formation];
  const lines: ChemLine[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i]!;
      const b = slots[j]!;

      if (slotDist(a, b) > DIST_THRESHOLD) continue;

      const key = `${a.slotId}|${b.slotId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const cardA = state.slots[a.slotId] ?? null;
      const cardB = state.slots[b.slotId] ?? null;

      let total = 0;
      if (cardA && cardB) {
        total = snapshot.chemLinkMap.get(`${cardA.cardId}-${cardB.cardId}`) ?? 0;
      }

      const { color, glow } = chemLineStyle(total, cardA !== null && cardB !== null);

      lines.push({ slotA: a, slotB: b, cardA, cardB, total, color, glow });
    }
  }

  return lines;
}

function chemLineStyle(total: number, hasBothCards: boolean): { color: string; glow: string } {
  if (!hasBothCards) return { color: 'rgba(255,255,255,0.04)', glow: 'transparent' };
  if (total >= 4) return { color: 'rgba(201,168,76,0.9)', glow: 'rgba(201,168,76,0.6)' };
  if (total >= 3) return { color: 'rgba(34,197,94,0.85)', glow: 'rgba(34,197,94,0.5)' };
  if (total >= 1) return { color: 'rgba(234,179,8,0.80)', glow: 'rgba(234,179,8,0.45)' };
  return { color: 'rgba(239,68,68,0.70)', glow: 'rgba(239,68,68,0.4)' };
}

// ─── Pool cards (não no squad/banco) ─────────────────────────────────────────

export function getPoolCards(allCards: CollectionCard[], state: SBState): CollectionCard[] {
  const usedIds = new Set<string>();
  Object.values(state.slots).forEach((c) => c && usedIds.add(c.cardId));
  state.bench.forEach((c) => c && usedIds.add(c.cardId));
  return allCards.filter((c) => !usedIds.has(c.cardId));
}

export function getAutoSuggest(
  position: string,
  pool: CollectionCard[],
  max = 5,
): CollectionCard[] {
  return pool
    .filter(
      (c) =>
        getPositionCompat(c.position, position as Parameters<typeof getPositionCompat>[1]) !==
        'awkward',
    )
    .sort((a, b) => b.overall - a.overall)
    .slice(0, max);
}

// ─── Auto Build ───────────────────────────────────────────────────────────────

function greedyFill(formation: FormationKey, ranked: CollectionCard[]): SquadSlots {
  const slots: SquadSlots = {};
  for (const sd of FORMATIONS[formation]) slots[sd.slotId] = null;
  const used = new Set<string>();
  for (const sd of FORMATIONS[formation]) {
    const best = ranked.find(
      (c) => !used.has(c.cardId) && getPositionCompat(c.position, sd.position) !== 'awkward',
    );
    if (best) {
      slots[sd.slotId] = best;
      used.add(best.cardId);
    }
  }
  return slots;
}

export function autoBuildSlots(
  mode: AutoBuildMode,
  allCards: CollectionCard[],
  formation: FormationKey,
  favoriteIds?: ReadonlySet<string>,
): SquadSlots {
  let ranked: CollectionCard[];

  switch (mode) {
    case 'brazilians': {
      const br = allCards
        .filter((c) => c.nationality === 'BR')
        .sort((a, b) => b.overall - a.overall);
      const others = allCards
        .filter((c) => c.nationality !== 'BR')
        .sort((a, b) => b.overall - a.overall);
      ranked = [...br, ...others];
      break;
    }
    case 'goat': {
      const goats = allCards
        .filter((c) => c.rarityCode === 'ultra' || c.rarityCode === 'world_cup_hero')
        .sort((a, b) => b.overall - a.overall);
      const rest = allCards
        .filter((c) => c.rarityCode !== 'ultra' && c.rarityCode !== 'world_cup_hero')
        .sort((a, b) => b.overall - a.overall);
      ranked = [...goats, ...rest];
      break;
    }
    case 'dream': {
      const fav = allCards
        .filter((c) => favoriteIds?.has(c.cardId))
        .sort((a, b) => b.overall - a.overall);
      const notFav = allCards
        .filter((c) => !favoriteIds?.has(c.cardId))
        .sort((a, b) => b.overall - a.overall);
      ranked = [...fav, ...notFav];
      break;
    }
    case 'chemistry': {
      const top = [...allCards].sort((a, b) => b.overall - a.overall).slice(0, 40);
      const natCount = new Map<string, number>();
      for (const c of top) natCount.set(c.nationality, (natCount.get(c.nationality) ?? 0) + 1);
      const dominant = [...natCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
      ranked = [...allCards].sort((a, b) => {
        const aNat = a.nationality === dominant ? 1 : 0;
        const bNat = b.nationality === dominant ? 1 : 0;
        return bNat !== aNat ? bNat - aNat : b.overall - a.overall;
      });
      break;
    }
    default: {
      ranked = [...allCards].sort((a, b) => b.overall - a.overall);
    }
  }

  return greedyFill(formation, ranked);
}
