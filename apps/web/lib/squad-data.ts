/**
 * lib/squad-data.ts
 *
 * Lógica de domínio para o Squad Builder:
 *   - Definições de formação (slots + coordenadas no campo)
 *   - Compatibilidade entre posição do jogador e slot
 *   - Mapeamento CollectionCard → inputs de chemistry e squad-rating
 *   - Cálculo de SquadSnapshot (OVR + química em tempo real)
 */
import { calculateChemistry }    from '@world-legends/chemistry';
import { calculateSquadRating }  from '@world-legends/squad-rating';
import { sectorOf }              from '@world-legends/squad-rating';
import type { SquadChemistry }   from '@world-legends/chemistry';
import type { SquadRating }      from '@world-legends/squad-rating';
import type { Position }         from '@world-legends/types';
import type { CollectionCard }   from './collection-data';

// ─── FormationKey ─────────────────────────────────────────────────────────────

export type FormationKey = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '5-3-2';

export const FORMATION_LABELS: Record<FormationKey, string> = {
  '4-3-3':   '4-3-3',
  '4-4-2':   '4-4-2',
  '4-2-3-1': '4-2-3-1',
  '3-5-2':   '3-5-2',
  '5-3-2':   '5-3-2',
};

// ─── SlotDef — slot do campo ──────────────────────────────────────────────────

export type SlotDef = Readonly<{
  slotId:    string;
  position:  Position;
  top:       number;    // % de cima
  left:      number;    // % da esquerda
}>;

// ─── Formações ────────────────────────────────────────────────────────────────

export const FORMATIONS: Record<FormationKey, readonly SlotDef[]> = {
  '4-3-3': [
    { slotId:'GK',  position:'GK',  top:85, left:50 },
    { slotId:'RB',  position:'RB',  top:67, left:82 },
    { slotId:'CB1', position:'CB',  top:67, left:62 },
    { slotId:'CB2', position:'CB',  top:67, left:38 },
    { slotId:'LB',  position:'LB',  top:67, left:18 },
    { slotId:'CM1', position:'CM',  top:47, left:72 },
    { slotId:'CM2', position:'CM',  top:45, left:50 },
    { slotId:'CM3', position:'CM',  top:47, left:28 },
    { slotId:'RW',  position:'RW',  top:23, left:80 },
    { slotId:'ST',  position:'ST',  top:17, left:50 },
    { slotId:'LW',  position:'LW',  top:23, left:20 },
  ],
  '4-4-2': [
    { slotId:'GK',  position:'GK',  top:85, left:50 },
    { slotId:'RB',  position:'RB',  top:67, left:82 },
    { slotId:'CB1', position:'CB',  top:67, left:62 },
    { slotId:'CB2', position:'CB',  top:67, left:38 },
    { slotId:'LB',  position:'LB',  top:67, left:18 },
    { slotId:'RM',  position:'RM',  top:46, left:78 },
    { slotId:'CM1', position:'CM',  top:46, left:58 },
    { slotId:'CM2', position:'CM',  top:46, left:42 },
    { slotId:'LM',  position:'LM',  top:46, left:22 },
    { slotId:'ST1', position:'ST',  top:20, left:62 },
    { slotId:'ST2', position:'ST',  top:20, left:38 },
  ],
  '4-2-3-1': [
    { slotId:'GK',   position:'GK',  top:85, left:50 },
    { slotId:'RB',   position:'RB',  top:67, left:82 },
    { slotId:'CB1',  position:'CB',  top:67, left:62 },
    { slotId:'CB2',  position:'CB',  top:67, left:38 },
    { slotId:'LB',   position:'LB',  top:67, left:18 },
    { slotId:'CDM1', position:'CDM', top:53, left:60 },
    { slotId:'CDM2', position:'CDM', top:53, left:40 },
    { slotId:'RW',   position:'RW',  top:35, left:80 },
    { slotId:'CAM',  position:'CAM', top:33, left:50 },
    { slotId:'LW',   position:'LW',  top:35, left:20 },
    { slotId:'ST',   position:'ST',  top:17, left:50 },
  ],
  '3-5-2': [
    { slotId:'GK',  position:'GK',  top:85, left:50 },
    { slotId:'CB1', position:'CB',  top:67, left:70 },
    { slotId:'CB2', position:'CB',  top:67, left:50 },
    { slotId:'CB3', position:'CB',  top:67, left:30 },
    { slotId:'RM',  position:'RM',  top:46, left:86 },
    { slotId:'CM1', position:'CM',  top:46, left:65 },
    { slotId:'CDM', position:'CDM', top:48, left:50 },
    { slotId:'CM2', position:'CM',  top:46, left:35 },
    { slotId:'LM',  position:'LM',  top:46, left:14 },
    { slotId:'ST1', position:'ST',  top:20, left:62 },
    { slotId:'ST2', position:'ST',  top:20, left:38 },
  ],
  '5-3-2': [
    { slotId:'GK',   position:'GK',  top:85, left:50 },
    { slotId:'RWB',  position:'RWB', top:65, left:88 },
    { slotId:'CB1',  position:'CB',  top:68, left:70 },
    { slotId:'CB2',  position:'CB',  top:68, left:50 },
    { slotId:'CB3',  position:'CB',  top:68, left:30 },
    { slotId:'LWB',  position:'LWB', top:65, left:12 },
    { slotId:'CM1',  position:'CM',  top:47, left:68 },
    { slotId:'CM2',  position:'CM',  top:45, left:50 },
    { slotId:'CM3',  position:'CM',  top:47, left:32 },
    { slotId:'ST1',  position:'ST',  top:20, left:62 },
    { slotId:'ST2',  position:'ST',  top:20, left:38 },
  ],
};

export const MAX_BENCH = 7;

// ─── Compatibilidade de posição ───────────────────────────────────────────────

export type PositionCompat = 'natural' | 'ok' | 'awkward';

// Posições naturais e compatíveis por posição de jogador
const COMPAT_MAP: Record<Position, { natural: Position[]; ok: Position[] }> = {
  GK:  { natural:['GK'],       ok:[] },
  CB:  { natural:['CB'],       ok:['CDM','LB','RB'] },
  LB:  { natural:['LB'],       ok:['LWB','LM','CB'] },
  RB:  { natural:['RB'],       ok:['RWB','RM','CB'] },
  LWB: { natural:['LWB'],      ok:['LB','LM'] },
  RWB: { natural:['RWB'],      ok:['RB','RM'] },
  CDM: { natural:['CDM'],      ok:['CM','CB'] },
  CM:  { natural:['CM'],       ok:['CDM','CAM','LM','RM'] },
  CAM: { natural:['CAM'],      ok:['CM','CF','LW','RW'] },
  LM:  { natural:['LM'],       ok:['LW','CM','LB'] },
  RM:  { natural:['RM'],       ok:['RW','CM','RB'] },
  LW:  { natural:['LW','LM'],  ok:['CAM','ST','CF'] },
  RW:  { natural:['RW','RM'],  ok:['CAM','ST','CF'] },
  CF:  { natural:['CF','ST'],  ok:['CAM','LW','RW'] },
  ST:  { natural:['ST','CF'],  ok:['LW','RW','CAM'] },
};

export function getPositionCompat(cardPos: Position, slotPos: Position): PositionCompat {
  const compat = COMPAT_MAP[cardPos];
  if (!compat) return 'awkward';
  if (compat.natural.includes(slotPos)) return 'natural';
  if (compat.ok.includes(slotPos)) return 'ok';
  return 'awkward';
}

// ─── SquadState ───────────────────────────────────────────────────────────────

export type SquadSlots = Record<string, CollectionCard | null>;

export type SquadState = {
  formation: FormationKey;
  slots:     SquadSlots;               // slotId → card
  bench:     (CollectionCard | null)[]; // 7 posições
};

export function createEmptyState(formation: FormationKey = '4-3-3'): SquadState {
  const slots: SquadSlots = {};
  for (const slot of FORMATIONS[formation]) {
    slots[slot.slotId] = null;
  }
  return {
    formation,
    slots,
    bench: Array.from({ length: MAX_BENCH }, () => null),
  };
}

export function changeFormation(state: SquadState, formation: FormationKey): SquadState {
  // Pegar cards que estavam nos slots da formação anterior
  const cards = Object.values(state.slots).filter((c): c is CollectionCard => c !== null);
  // Criar novos slots vazios para a nova formação
  const slots: SquadSlots = {};
  for (const slot of FORMATIONS[formation]) {
    slots[slot.slotId] = null;
  }
  // Tentar reposicionar cards por compatibilidade de posição
  const unplaced: CollectionCard[] = [];
  for (const card of cards) {
    const compatSlot = Object.entries(slots).find(([slotId, occupant]) => {
      if (occupant !== null) return false;
      const slotDef = FORMATIONS[formation].find(s => s.slotId === slotId);
      if (!slotDef) return false;
      return getPositionCompat(card.position, slotDef.position) !== 'awkward';
    });
    if (compatSlot) {
      slots[compatSlot[0]] = card;
    } else {
      unplaced.push(card);
    }
  }
  // Devolver não posicionados ao banco
  const bench = [...state.bench];
  for (const card of unplaced) {
    const emptyIdx = bench.findIndex(b => b === null);
    if (emptyIdx !== -1) bench[emptyIdx] = card;
  }
  return { formation, slots, bench };
}

export function getStarterCards(state: SquadState): CollectionCard[] {
  return Object.values(state.slots).filter((c): c is CollectionCard => c !== null);
}

export function getBenchCards(state: SquadState): CollectionCard[] {
  return state.bench.filter((c): c is CollectionCard => c !== null);
}

// ─── Cálculo em tempo real ────────────────────────────────────────────────────

export type SquadSnapshot = {
  rating:    SquadRating;
  chemistry: SquadChemistry;
  starterCount: number;
};

const EMPTY_SNAPSHOT: SquadSnapshot = {
  rating: {
    overall: 0, attack: 0, midfield: 0, defense: 0,
    breakdown: {
      chemistryMultiplier: 1, totalTraitBonus: 0,
      traitBonus: { attack: 0, midfield: 0, defense: 0 },
      sectorCounts: { attack: 0, midfield: 0, defense: 0 },
      baseAverage:  { attack: 0, midfield: 0, defense: 0 },
    },
  },
  chemistry: {
    total: 0, links: [], perPlayer: {},
    breakdown: {
      nationalityLinks: 0, competitionLinks: 0, eraLinks: 0,
      perfectLinks: 0, totalLinkBonus: 0, totalLinks: 0,
    },
  },
  starterCount: 0,
};

// Mapeamento de era textual → EraCode (chemistry)
const ERA_MAP: Record<string, string> = {
  '1950s':'1950s','1960s':'1960s','1970s':'1970s','1980s':'1980s',
  '1990s':'1990s','2000s':'2000s','2010s':'2010s','2020s':'2020s',
};

export function calculateSnapshot(state: SquadState): SquadSnapshot {
  const starters = getStarterCards(state);
  if (starters.length === 0) return EMPTY_SNAPSHOT;

  const formation = FORMATIONS[state.formation];

  // RatedPlayers para squad-rating
  const ratedPlayers = starters.map(card => ({
    userCardId: card.cardId,
    position:   card.position as any,
    overall:    card.overall,
    traits:     [],  // traits vindos do domínio não mapeiam para TRAIT_BONUS_TABLE aqui
  }));

  // Chemistry inputs
  const chemPlayers = starters.map(card => ({
    userCardId:  card.cardId,
    nationality: card.nationality,
    competition: 'brasileirao',  // default (todos BR)
    era:         (ERA_MAP[card.era] ?? '1990s') as any,
  }));

  const rating    = calculateSquadRating({ starters: ratedPlayers, chemistry: 75 });
  const chemistry = calculateChemistry({ players: chemPlayers });

  return { rating, chemistry, starterCount: starters.length };
}

// ─── Cor de setor para barras ─────────────────────────────────────────────────

export const SECTOR_COLORS = {
  attack:  'from-red-500 to-red-700',
  midfield:'from-emerald-500 to-emerald-700',
  defense: 'from-blue-500 to-blue-700',
} as const;
