/**
 * lib/pack-logic.ts
 *
 * Bridge entre @world-legends/packs e a UI.
 * Usa openPack() real com CardResolver que mapeia raridade → CollectionCard.
 *
 * Fluxo:
 *   1. Selecionar pack (CLASSIC / ELITE / LEGEND)
 *   2. openPack() sorteia (rarityCode, editionCode) por slot via RNG determinístico
 *   3. CardResolver escolhe uma CollectionCard da coleção com aquela raridade
 *   4. Retornar DrawnCard[] (DTO visual) para a UI
 */

import { createUserPityState, openPack } from '@world-legends/packs';
import { CLASSIC_PACK, ELITE_PACK, LEGEND_PACK, type Pack } from '@world-legends/packs';
import type { UserPityState } from '@world-legends/packs';
import type { RarityCode } from '@world-legends/types';
import { type CollectionCard, RARITY_VISUAL, getCollection } from './collection-data';

// ─── Tipos de display ─────────────────────────────────────────────────────────

export type RevealEffect =
  | 'common' // fade simples
  | 'rare' // shimmer roxo + partículas leves
  | 'elite' // flash azul + escala
  | 'legendary' // chuva de ouro + pausa dramática
  | 'ultra' // varredura arco-íris + flash branco
  | 'world_cup_hero'; // explosão platinada + desaceleração

export type DrawnCard = {
  index: number; // 0-4
  card: CollectionCard;
  effect: RevealEffect;
  wasForced: boolean; // foi garantia de pity?
  glowColor: string; // CSS color para drop-shadow
  particleColor: string; // CSS color para partículas
};

export type PackDefinitionUI = {
  id: 'classic' | 'elite' | 'legend';
  pack: Pack;
  name: string;
  tagline: string;
  price: number;
  cardCount: number;
  guarantee: string;
  /** Cor dominante do pack para gradiente de fundo */
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  glowColor: string;
  icon: string;
};

// ─── Definições visuais dos packs ─────────────────────────────────────────────

export const PACK_DEFS: readonly PackDefinitionUI[] = [
  {
    id: 'classic',
    pack: CLASSIC_PACK,
    name: 'Classic Pack',
    tagline: 'Clássicos de todas as eras',
    price: 150,
    cardCount: 5,
    guarantee: 'Mínimo 1 Rara',
    gradientFrom: '#1a1f2e',
    gradientTo: '#0d0f17',
    borderColor: 'rgba(147,51,234,0.4)',
    glowColor: 'rgba(147,51,234,0.35)',
    icon: '📦',
  },
  {
    id: 'elite',
    pack: ELITE_PACK,
    name: 'Elite Pack',
    tagline: 'Os melhores do mundo',
    price: 400,
    cardCount: 5,
    guarantee: 'Mínimo 2 Elites',
    gradientFrom: '#0a1628',
    gradientTo: '#060d1a',
    borderColor: 'rgba(59,130,246,0.5)',
    glowColor: 'rgba(59,130,246,0.4)',
    icon: '⚡',
  },
  {
    id: 'legend',
    pack: LEGEND_PACK,
    name: 'Legend Pack',
    tagline: 'Lendas imortais do futebol',
    price: 1000,
    cardCount: 3,
    guarantee: 'Mínimo 1 Lendária',
    gradientFrom: '#211500',
    gradientTo: '#0d0800',
    borderColor: 'rgba(201,168,76,0.6)',
    glowColor: 'rgba(201,168,76,0.5)',
    icon: '👑',
  },
];

// ─── Efeito por raridade ──────────────────────────────────────────────────────

const EFFECT_MAP: Record<RarityCode, RevealEffect> = {
  common: 'common',
  rare: 'rare',
  elite: 'elite',
  legendary: 'legendary',
  ultra: 'ultra',
  world_cup_hero: 'world_cup_hero',
};

const GLOW_MAP: Record<RarityCode, string> = {
  common: 'rgba(107,114,128,0.5)',
  rare: 'rgba(147,51,234,0.7)',
  elite: 'rgba(37,99,235,0.8)',
  legendary: 'rgba(201,168,76,0.9)',
  ultra: 'rgba(236,72,153,1)',
  world_cup_hero: 'rgba(240,244,255,1)',
};

const PARTICLE_MAP: Record<RarityCode, string> = {
  common: '#6b7280',
  rare: '#a855f7',
  elite: '#3b82f6',
  legendary: '#c9a84c',
  ultra: '#ec4899',
  world_cup_hero: '#e2e8f0',
};

// ─── Packs "Em Breve" (display only, sem engine) ─────────────────────────────

export type ComingSoonPack = {
  id: string;
  name: string;
  tagline: string;
  priceLabel: string;
  icon: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  glowColor: string;
};

export const COMING_SOON_DEFS: readonly ComingSoonPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tagline: 'Perfeito para começar sua jornada',
    priceLabel: '75c',
    icon: '🌟',
    gradientFrom: '#0c1a10',
    gradientTo: '#152b1a',
    borderColor: 'rgba(74,222,128,0.35)',
    glowColor: 'rgba(74,222,128,0.28)',
  },
  {
    id: 'national',
    name: 'National Pack',
    tagline: 'Lendas de uma única seleção',
    priceLabel: '250c',
    icon: '🌍',
    gradientFrom: '#070f1c',
    gradientTo: '#0e1e36',
    borderColor: 'rgba(96,165,250,0.38)',
    glowColor: 'rgba(96,165,250,0.28)',
  },
  {
    id: 'hero',
    name: 'Hero Pack',
    tagline: 'Os heróis imortais da Copa',
    priceLabel: '700c',
    icon: '🦸',
    gradientFrom: '#150020',
    gradientTo: '#220032',
    borderColor: 'rgba(192,38,211,0.38)',
    glowColor: 'rgba(192,38,211,0.28)',
  },
  {
    id: 'goat',
    name: 'GOAT Pack',
    tagline: 'Os maiores de todos os tempos',
    priceLabel: '2.500c',
    icon: '🐐',
    gradientFrom: '#1a1200',
    gradientTo: '#2c1e00',
    borderColor: 'rgba(251,191,36,0.45)',
    glowColor: 'rgba(251,191,36,0.35)',
  },
  {
    id: 'event',
    name: 'Event Pack',
    tagline: 'Exclusivo da temporada atual',
    priceLabel: 'Gems',
    icon: '⚡',
    gradientFrom: '#1a0808',
    gradientTo: '#2c1010',
    borderColor: 'rgba(239,68,68,0.38)',
    glowColor: 'rgba(239,68,68,0.28)',
  },
  {
    id: 'season',
    name: 'Season Pass Pack',
    tagline: 'Recompensa exclusiva de temporada',
    priceLabel: 'Pass',
    icon: '🏆',
    gradientFrom: '#080f00',
    gradientTo: '#101900',
    borderColor: 'rgba(132,204,22,0.38)',
    glowColor: 'rgba(132,204,22,0.28)',
  },
];

// ─── Estado de pity vazio (sem histórico) ────────────────────────────────────

function freshPityState(): UserPityState {
  return createUserPityState();
}

// ─── drawPack — usa openPack() real ──────────────────────────────────────────

let _drawCounter = 0;

export function drawPack(packDef: PackDefinitionUI, seedBase: number): DrawnCard[] {
  const allCards = getCollection();
  // Agrupar por raridade para resolver
  const byRarity = new Map<RarityCode, CollectionCard[]>();
  for (const card of allCards) {
    const list = byRarity.get(card.rarityCode) ?? [];
    list.push(card);
    byRarity.set(card.rarityCode, list);
  }

  // CardResolver — escolhe carta por raridade (round-robin por seed)
  const pickCounters: Partial<Record<RarityCode, number>> = {};
  const cardResolver = (rarityCode: RarityCode, _editionCode: string): string | null => {
    const pool = byRarity.get(rarityCode) ?? [];
    if (pool.length === 0) {
      // Fallback: pegar a raridade mais alta disponível
      const fallback = allCards[_drawCounter % allCards.length];
      return fallback?.cardId ?? null;
    }
    const idx = (pickCounters[rarityCode] ?? 0) % pool.length;
    pickCounters[rarityCode] = idx + 1;
    return pool[idx]?.cardId ?? null;
  };

  const seedStr = String(seedBase ^ (_drawCounter++ * 0x9e3779b9));

  const packResult = openPack({
    packOpeningId: `opening-${Date.now()}-${_drawCounter}`,
    pack: packDef.pack,
    seed: seedStr,
    pityState: freshPityState(),
    cardResolver,
  });

  // Mapear SlotResult → DrawnCard
  const cardMap = new Map(allCards.map((c) => [c.cardId, c]));

  return packResult.slots.map((slot, i) => {
    // Tentar encontrar a carta pelo cardId sorteado
    // Se não encontrar, pegar qualquer carta com a raridade correta
    let card = slot.cardId ? cardMap.get(slot.cardId) : undefined;
    if (!card) {
      const fallbacks = byRarity.get(slot.rarityCode);
      card = fallbacks?.[i % (fallbacks?.length ?? 1)];
    }
    // Último recurso: qualquer carta
    if (!card) card = allCards[i % allCards.length]!;

    return {
      index: i,
      card,
      effect: EFFECT_MAP[slot.rarityCode],
      wasForced: slot.wasForced,
      glowColor: GLOW_MAP[slot.rarityCode],
      particleColor: PARTICLE_MAP[slot.rarityCode],
    };
  });
}
