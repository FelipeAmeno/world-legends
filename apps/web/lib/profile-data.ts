/**
 * lib/profile-data.ts — T057
 *
 * Dados computados do perfil premium:
 *   - Conquistas com progresso
 *   - Títulos desbloqueados
 *   - Histórico de temporadas
 *   - Países desbloqueados (via coleção)
 *   - Estatísticas avançadas
 */

import type { CollectionCard } from './collection-data';

// ─── Títulos ──────────────────────────────────────────────────────────────────

export type TitleTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';

export type Title = {
  id: string;
  label: string;
  icon: string;
  tier: TitleTier;
  earned: boolean;
  earnedAt?: string;
  desc: string;
};

const TIER_BG: Record<TitleTier, string> = {
  bronze: 'from-amber-900 to-amber-700',
  silver: 'from-slate-700 to-slate-500',
  gold: 'from-amber-700 to-yellow-500',
  platinum: 'from-cyan-900 to-cyan-600',
  legendary: 'from-purple-900 to-gold-dim',
};
export { TIER_BG as TITLE_TIER_BG };

export function buildTitles(wins: number, level: number, collection: CollectionCard[]): Title[] {
  const hasLegendary = collection.some((c) => c.rarityCode === 'legendary');
  const hasUltra = collection.some((c) => c.rarityCode === 'ultra');
  const hasWCH = collection.some((c) => c.rarityCode === 'world_cup_hero');
  const total = collection.length;

  return [
    {
      id: 'first_win',
      label: 'Primeira Vitória',
      icon: '⚽',
      tier: 'bronze',
      earned: wins >= 1,
      desc: 'Vença sua primeira partida',
    },
    {
      id: '10wins',
      label: 'Veterano',
      icon: '🏆',
      tier: 'bronze',
      earned: wins >= 10,
      desc: '10 vitórias acumuladas',
    },
    {
      id: '25wins',
      label: 'Experiente',
      icon: '🎖️',
      tier: 'silver',
      earned: wins >= 25,
      desc: '25 vitórias acumuladas',
    },
    {
      id: '50wins',
      label: 'Campeão',
      icon: '👑',
      tier: 'gold',
      earned: wins >= 50,
      desc: '50 vitórias acumuladas',
    },
    {
      id: 'level5',
      label: 'Profissional',
      icon: '⭐',
      tier: 'bronze',
      earned: level >= 5,
      desc: 'Alcance o nível 5',
    },
    {
      id: 'level10',
      label: 'Internacional',
      icon: '🌍',
      tier: 'silver',
      earned: level >= 10,
      desc: 'Alcance o nível 10',
    },
    {
      id: 'level15',
      label: 'Superestrela',
      icon: '💫',
      tier: 'gold',
      earned: level >= 15,
      desc: 'Alcance o nível 15',
    },
    {
      id: 'col10',
      label: 'Colecionador Iniciante',
      icon: '🃏',
      tier: 'bronze',
      earned: total >= 10,
      desc: 'Colete 10 cartas',
    },
    {
      id: 'col25',
      label: 'Curador',
      icon: '🗄️',
      tier: 'silver',
      earned: total >= 25,
      desc: 'Colete 25 cartas',
    },
    {
      id: 'legendary',
      label: 'Caçador de Lendas',
      icon: '✨',
      tier: 'gold',
      earned: hasLegendary,
      desc: 'Obtenha uma carta Lendária',
    },
    {
      id: 'ultra',
      label: 'Ultra Raro',
      icon: '💎',
      tier: 'platinum',
      earned: hasUltra,
      desc: 'Obtenha uma carta Ultra',
    },
    {
      id: 'wch',
      label: 'Herói da Copa',
      icon: '🏅',
      tier: 'legendary',
      earned: hasWCH,
      desc: 'Obtenha um World Cup Hero',
    },
  ];
}

// ─── Conquistas ───────────────────────────────────────────────────────────────

export type Achievement = {
  id: string;
  icon: string;
  label: string;
  desc: string;
  progress: number; // 0–100
  done: boolean;
  current: number;
  target: number;
  tier: TitleTier;
};

export function buildAchievements(
  wins: number,
  draws: number,
  losses: number,
  level: number,
  credits: number,
  collection: CollectionCard[],
): Achievement[] {
  const total = wins + draws + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  const ach = (
    id: string,
    icon: string,
    label: string,
    desc: string,
    current: number,
    target: number,
    tier: TitleTier,
  ): Achievement => ({
    id,
    icon,
    label,
    desc,
    tier,
    current: Math.min(current, target),
    target,
    progress: Math.min(100, Math.round((current / target) * 100)),
    done: current >= target,
  });

  return [
    ach('wins1', '⚽', '1ª Vitória', 'Vença 1 partida', wins, 1, 'bronze'),
    ach('wins10', '🏆', '10 Vitórias', 'Vença 10 partidas', wins, 10, 'bronze'),
    ach('wins25', '🎖️', '25 Vitórias', 'Vença 25 partidas', wins, 25, 'silver'),
    ach('wins50', '👑', '50 Vitórias', 'Vença 50 partidas', wins, 50, 'gold'),
    ach('rate60', '📊', 'Dominador', '60% aproveitamento', winRate, 60, 'silver'),
    ach('level5', '⭐', 'Nível 5', 'Alcance nível 5', level, 5, 'bronze'),
    ach('level10', '🌟', 'Nível 10', 'Alcance nível 10', level, 10, 'silver'),
    ach('level20', '💫', 'Nível 20', 'Alcance nível 20', level, 20, 'gold'),
    ach('col10', '🃏', '10 Cartas', 'Colete 10 cartas', collection.length, 10, 'bronze'),
    ach('col25', '📚', '25 Cartas', 'Colete 25 cartas', collection.length, 25, 'silver'),
    ach('credits5k', '💰', '5.000 Créditos', 'Acumule 5k créditos', credits, 5000, 'silver'),
    ach('credits10k', '💎', '10.000 Créditos', 'Acumule 10k créditos', credits, 10000, 'gold'),
    ach(
      'legendary1',
      '✨',
      'Lenda!',
      'Obtenha 1 carta Lendária',
      collection.filter(
        (c) =>
          c.rarityCode === 'legendary' ||
          c.rarityCode === 'ultra' ||
          c.rarityCode === 'world_cup_hero',
      ).length,
      1,
      'gold',
    ),
    ach(
      'nations3',
      '🌎',
      '3 Nações',
      'Cartas de 3 países',
      new Set(collection.map((c) => c.nationality)).size,
      3,
      'bronze',
    ),
  ];
}

// ─── Temporadas ───────────────────────────────────────────────────────────────

export type Season = {
  id: string;
  label: string;
  position: number;
  wins: number;
  losses: number;
  maxOvr: number;
  reward: string;
  rewardIcon: string;
  isActive: boolean;
};

// Temporadas históricas (mock determinístico)
export const SEASONS: Season[] = [
  {
    id: 's4',
    label: 'T4 – Atual',
    position: 3,
    wins: 34,
    losses: 12,
    maxOvr: 89,
    reward: '1.200c',
    rewardIcon: '💰',
    isActive: true,
  },
  {
    id: 's3',
    label: 'T3 – Passada',
    position: 5,
    wins: 28,
    losses: 16,
    maxOvr: 86,
    reward: '800c',
    rewardIcon: '💰',
    isActive: false,
  },
  {
    id: 's2',
    label: 'T2',
    position: 8,
    wins: 21,
    losses: 21,
    maxOvr: 82,
    reward: 'Classic Pack',
    rewardIcon: '📦',
    isActive: false,
  },
  {
    id: 's1',
    label: 'T1 – Estreia',
    position: 12,
    wins: 14,
    losses: 28,
    maxOvr: 74,
    reward: '400c',
    rewardIcon: '💰',
    isActive: false,
  },
];

// ─── Estatísticas avançadas ───────────────────────────────────────────────────

export type AdvancedStats = {
  winRate: number;
  avgOvr: number;
  maxOvr: number;
  bestCard: CollectionCard | null;
  rareCards: number;
  legendaryPlus: number;
  uniqueCountries: string[];
  uniqueEras: string[];
  uniquePositions: string[];
  totalTraits: number;
  completionPct: number; // % da coleção possível obtida
  totalPossible: number;
};

const CATALOG_SIZE = 24; // total de cartas no catálogo

export function buildAdvancedStats(collection: CollectionCard[]): AdvancedStats {
  const total = collection.length;

  const sorted = [...collection].sort((a, b) => b.overall - a.overall);
  const bestCard = sorted[0] ?? null;
  const maxOvr = bestCard?.overall ?? 0;
  const avgOvr = total > 0 ? Math.round(collection.reduce((s, c) => s + c.overall, 0) / total) : 0;

  const rareCards = collection.filter((c) =>
    ['rare', 'elite', 'legendary', 'ultra', 'world_cup_hero'].includes(c.rarityCode),
  ).length;

  const legendaryPlus = collection.filter((c) =>
    ['legendary', 'ultra', 'world_cup_hero'].includes(c.rarityCode),
  ).length;

  const uniqueCountries = [...new Set(collection.map((c) => c.nationality))];
  const uniqueEras = [...new Set(collection.map((c) => c.era))];
  const uniquePositions = [...new Set(collection.map((c) => c.position))];
  const totalTraits = collection.reduce((s, c) => s + c.traits.length, 0);
  const completionPct = Math.round((total / CATALOG_SIZE) * 100);

  return {
    winRate: 0, // será preenchido externamente
    avgOvr,
    maxOvr,
    bestCard,
    rareCards,
    legendaryPlus,
    uniqueCountries,
    uniqueEras,
    uniquePositions,
    totalTraits,
    completionPct,
    totalPossible: CATALOG_SIZE,
  };
}

// ─── Mapa de países com flag ──────────────────────────────────────────────────

export const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷',
  AR: '🇦🇷',
  FR: '🇫🇷',
  DE: '🇩🇪',
  IT: '🇮🇹',
  ES: '🇪🇸',
  PT: '🇵🇹',
  NL: '🇳🇱',
  CM: '🇨🇲',
  SN: '🇸🇳',
  NG: '🇳🇬',
  EN: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  US: '🇺🇸',
  JP: '🇯🇵',
  MX: '🇲🇽',
  CO: '🇨🇴',
  CL: '🇨🇱',
  UY: '🇺🇾',
  CI: '🇨🇮',
  GH: '🇬🇭',
  XX: '🌍',
};

export const COUNTRY_NAMES: Record<string, string> = {
  BR: 'Brasil',
  AR: 'Argentina',
  FR: 'França',
  DE: 'Alemanha',
  IT: 'Itália',
  ES: 'Espanha',
  PT: 'Portugal',
  NL: 'Holanda',
  CM: 'Camarões',
  SN: 'Senegal',
  NG: 'Nigéria',
  EN: 'Inglaterra',
  US: 'EUA',
  JP: 'Japão',
  MX: 'México',
  XX: 'Outro',
};

// ─── Nível máximo de raridade alcançado ──────────────────────────────────────

export function topRarity(collection: CollectionCard[]): string {
  const ORDER = ['world_cup_hero', 'ultra', 'legendary', 'elite', 'rare', 'common'];
  for (const r of ORDER) {
    if (collection.some((c) => c.rarityCode === r)) return r;
  }
  return 'common';
}
