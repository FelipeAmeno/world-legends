/**
 * lib/hall-of-legends-data.ts
 *
 * Computa a estrutura do Hall of Legends a partir do catálogo completo
 * e do conjunto de cartas que o usuário possui.
 */

import type { CollectionCard } from '@/lib/collection-data';
import type { RarityCode } from '@world-legends/types';

// ─── Nomes dos países ─────────────────────────────────────────────────────────

export const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil',
  AR: 'Argentina',
  DE: 'Alemanha',
  FR: 'França',
  IT: 'Itália',
  ES: 'Espanha',
  NL: 'Holanda',
  PT: 'Portugal',
  UY: 'Uruguai',
  HR: 'Croácia',
  EN: 'Inglaterra',
  GB: 'Grã-Bretanha',
  DK: 'Dinamarca',
  SU: 'União Soviética',
  YU: 'Iugoslávia',
  CS: 'Tchecoslováquia',
  NI: 'Irlanda do Norte',
  TR: 'Turquia',
  CO: 'Colômbia',
  HU: 'Hungria',
  SE: 'Suécia',
  PL: 'Polônia',
  BE: 'Bélgica',
  MX: 'México',
  CM: 'Camarões',
  NG: 'Nigéria',
  SN: 'Senegal',
  GH: 'Gana',
  CL: 'Chile',
  EG: 'Egito',
  MA: 'Marrocos',
  AU: 'Austrália',
  JP: 'Japão',
  KR: 'Coreia do Sul',
  US: 'EUA',
  RU: 'Rússia',
  CZ: 'Rep. Tcheca',
  SK: 'Eslováquia',
  IE: 'Irlanda',
  SC: 'Escócia',
  WL: 'País de Gales',
  CI: 'Costa do Marfim',
  RO: 'Romênia',
  BG: 'Bulgária',
  AT: 'Áustria',
  CH: 'Suíça',
  NO: 'Noruega',
  EC: 'Equador',
  PE: 'Peru',
  PY: 'Paraguai',
  CR: 'Costa Rica',
  TN: 'Tunísia',
  ZA: 'África do Sul',
  AO: 'Angola',
  SA: 'Arábia Saudita',
  IR: 'Irã',
  GR: 'Grécia',
  UA: 'Ucrânia',
  IS: 'Islândia',
  RS: 'Sérvia',
  SI: 'Eslovênia',
  AL: 'Albânia',
  BY: 'Bielo-Rússia',
};

// ─── Flag emoji ───────────────────────────────────────────────────────────────

const SPECIAL_FLAGS: Record<string, string> = {
  EN: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  SC: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  WL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  NI: '🇬🇧',
  SU: '☭',
  YU: '🏴',
  CS: '🏴',
  GB: '🇬🇧',
};

export function countryFlag(code: string): string {
  if (SPECIAL_FLAGS[code]) return SPECIAL_FLAGS[code]!;
  try {
    const offset = 127397;
    return [...code.toUpperCase()]
      .map((c) => String.fromCodePoint(c.charCodeAt(0) + offset))
      .join('');
  } catch {
    return '🏳';
  }
}

export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}

// ─── Raridade ─────────────────────────────────────────────────────────────────

export const RARITY_META: Record<RarityCode, { label: string; color: string; textColor: string }> =
  {
    world_cup_hero: { label: 'WCH', color: '#e2e8f0', textColor: '#0f172a' },
    ultra: { label: 'Ultra', color: '#ec4899', textColor: '#fff' },
    legendary: { label: 'Lendária', color: '#c9a84c', textColor: '#07080f' },
    elite: { label: 'Elite', color: '#3b82f6', textColor: '#fff' },
    rare: { label: 'Rara', color: '#a855f7', textColor: '#fff' },
    common: { label: 'Comum', color: '#6b7280', textColor: '#fff' },
  };

const RARITY_ORDER: Record<RarityCode, number> = {
  world_cup_hero: 6,
  ultra: 5,
  legendary: 4,
  elite: 3,
  rare: 2,
  common: 1,
};

// ─── Tipos exportados ─────────────────────────────────────────────────────────

export type AlbumSlotData = {
  card: CollectionCard;
  owned: boolean;
};

export type CountryGroup = {
  nationality: string;
  flag: string;
  name: string;
  slots: AlbumSlotData[];
  totalCount: number;
  ownedCount: number;
  completionPct: number;
  isComplete: boolean;
};

export type RarityProgress = {
  code: RarityCode;
  label: string;
  color: string;
  total: number;
  owned: number;
  pct: number;
};

export type HallData = {
  totalCards: number;
  ownedCards: number;
  completionPct: number;
  countryGroups: CountryGroup[];
  rarityProgress: RarityProgress[];
};

// ─── Função principal ─────────────────────────────────────────────────────────

export function buildHallData(
  catalogCards: CollectionCard[],
  ownedCardIds: ReadonlySet<string>,
): HallData {
  // Agrupa por país
  const byCountry = new Map<string, CollectionCard[]>();
  for (const card of catalogCards) {
    const nat = card.nationality;
    if (!byCountry.has(nat)) byCountry.set(nat, []);
    byCountry.get(nat)?.push(card);
  }

  // Ordena cartas dentro de cada país por raridade desc, depois OVR desc
  const countryGroups: CountryGroup[] = [];
  for (const [nat, cards] of byCountry) {
    const sorted = [...cards].sort((a, b) => {
      const rd = RARITY_ORDER[b.rarityCode] - RARITY_ORDER[a.rarityCode];
      return rd !== 0 ? rd : b.overall - a.overall;
    });

    const slots: AlbumSlotData[] = sorted.map((card) => ({
      card,
      owned: ownedCardIds.has(card.cardId),
    }));

    const ownedCount = slots.filter((s) => s.owned).length;
    const totalCount = slots.length;

    countryGroups.push({
      nationality: nat,
      flag: countryFlag(nat),
      name: countryName(nat),
      slots,
      totalCount,
      ownedCount,
      completionPct: totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0,
      isComplete: ownedCount === totalCount && totalCount > 0,
    });
  }

  // Ordena países: completos por último, depois por owned desc, depois por nome
  countryGroups.sort((a, b) => {
    if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
    if (b.ownedCount !== a.ownedCount) return b.ownedCount - a.ownedCount;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  // Progresso por raridade
  const rarityTotals = new Map<RarityCode, { total: number; owned: number }>();
  for (const card of catalogCards) {
    const r = card.rarityCode;
    if (!rarityTotals.has(r)) rarityTotals.set(r, { total: 0, owned: 0 });
    const entry = rarityTotals.get(r)!;
    entry.total += 1;
    if (ownedCardIds.has(card.cardId)) entry.owned += 1;
  }

  const rarityCodes: RarityCode[] = [
    'world_cup_hero',
    'ultra',
    'legendary',
    'elite',
    'rare',
    'common',
  ];
  const rarityProgress: RarityProgress[] = rarityCodes
    .filter((code) => rarityTotals.has(code))
    .map((code) => {
      const { total, owned } = rarityTotals.get(code)!;
      return {
        code,
        label: RARITY_META[code].label,
        color: RARITY_META[code].color,
        total,
        owned,
        pct: total > 0 ? Math.round((owned / total) * 100) : 0,
      };
    });

  const totalCards = catalogCards.length;
  const ownedCards = catalogCards.filter((c) => ownedCardIds.has(c.cardId)).length;

  return {
    totalCards,
    ownedCards,
    completionPct: totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0,
    countryGroups,
    rarityProgress,
  };
}
