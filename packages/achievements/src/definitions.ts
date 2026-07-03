import type { AchievementDef } from './types.js';

// All 6 set codes used for the all_sets_completed condition
export const ALL_SET_CODES = [
  'artilheiros',
  'meio_campo_de_ouro',
  'muralha_verde_amarela',
  'copa_2002',
  'lendas_do_brasil',
  'album_completo',
] as const;

// All valid card IDs from the current catalog
export const VALID_CARD_IDS = [
  'pelé-world_cup_hero',
  'ronaldo-ultra',
  'ronaldinho-ultra',
  'maradona-world_cup_hero',
  'zico-legendary',
  'romario-legendary',
  'roberto-carlos-legendary',
  'kaka-legendary',
  'cafu-legendary',
  'rivaldo-legendary',
  'taffarel-elite',
  'lucio-elite',
  'falcao-elite',
  'socrates-rare',
  'bebeto-rare',
  'adriano-elite',
] as const;

// All 15 BR card IDs (maradona is AR)
const ALL_BR_CARD_IDS: readonly string[] = [
  'pelé-world_cup_hero',
  'ronaldo-ultra',
  'ronaldinho-ultra',
  'zico-legendary',
  'romario-legendary',
  'roberto-carlos-legendary',
  'kaka-legendary',
  'cafu-legendary',
  'rivaldo-legendary',
  'taffarel-elite',
  'lucio-elite',
  'falcao-elite',
  'socrates-rare',
  'bebeto-rare',
  'adriano-elite',
];

// ─── Collection (6) ────────────────────────────────────────────────────────────

const COLL_FIRST_CARD: AchievementDef = {
  id: 'coll_first_card',
  category: 'collection',
  rarity: 'common',
  icon: '🃏',
  name: 'Primeira Carta',
  description: 'Obtenha qualquer carta.',
  xp: 50,
  reward: { kind: 'credits', amount: 100, packId: null, label: '100 Créditos' },
  condition: { type: 'cards_owned_count', min: 1 },
  sortOrder: 1,
};

const COLL_5_CARDS: AchievementDef = {
  id: 'coll_5_cards',
  category: 'collection',
  rarity: 'common',
  icon: '📚',
  name: 'Colecionador Iniciante',
  description: 'Possua 5 cartas.',
  xp: 100,
  reward: { kind: 'credits', amount: 200, packId: null, label: '200 Créditos' },
  condition: { type: 'cards_owned_count', min: 5 },
  sortOrder: 2,
};

const COLL_ALL_BR: AchievementDef = {
  id: 'coll_all_br',
  category: 'collection',
  rarity: 'epic',
  icon: '🇧🇷',
  name: 'Brasil Completo',
  description: 'Possua todas as 15 cartas brasileiras.',
  xp: 500,
  reward: { kind: 'pack', amount: 1, packId: 'elite-pack', label: '1x Elite Pack' },
  condition: { type: 'specific_cards_owned', cardIds: ALL_BR_CARD_IDS },
  sortOrder: 3,
};

const COLL_ARTILHEIROS: AchievementDef = {
  id: 'coll_artilheiros',
  category: 'collection',
  rarity: 'rare',
  icon: '⚽',
  name: 'Artilheiros da Copa',
  description: 'Complete o álbum "artilheiros".',
  xp: 250,
  reward: { kind: 'credits', amount: 500, packId: null, label: '500 Créditos' },
  condition: { type: 'sets_completed', setCodes: ['artilheiros'] },
  sortOrder: 4,
};

const COLL_COPA_2002: AchievementDef = {
  id: 'coll_copa_2002',
  category: 'collection',
  rarity: 'epic',
  icon: '🏆',
  name: 'Pentacampeões',
  description: 'Complete o álbum "copa_2002".',
  xp: 400,
  reward: { kind: 'pack', amount: 1, packId: 'elite-pack', label: '1x Elite Pack' },
  condition: { type: 'sets_completed', setCodes: ['copa_2002'] },
  sortOrder: 5,
};

const COLL_ALBUM_COMPLETO: AchievementDef = {
  id: 'coll_album_completo',
  category: 'collection',
  rarity: 'legendary',
  icon: '👑',
  name: 'Álbum Dourado',
  description: 'Complete TODOS os 6 álbuns.',
  xp: 1000,
  reward: { kind: 'pack', amount: 1, packId: 'legend-pack', label: '1x Legend Pack' },
  condition: { type: 'all_sets_completed' },
  sortOrder: 6,
};

// ─── Gameplay (6) ──────────────────────────────────────────────────────────────

const GAME_FIRST_MATCH: AchievementDef = {
  id: 'game_first_match',
  category: 'gameplay',
  rarity: 'common',
  icon: '🎮',
  name: 'Primeiro Apito',
  description: 'Jogue 1 partida.',
  xp: 50,
  reward: { kind: 'credits', amount: 150, packId: null, label: '150 Créditos' },
  condition: { type: 'matches_played', min: 1 },
  sortOrder: 7,
};

const GAME_10_WINS: AchievementDef = {
  id: 'game_10_wins',
  category: 'gameplay',
  rarity: 'common',
  icon: '🥇',
  name: 'Em Forma',
  description: 'Vença 10 partidas.',
  xp: 150,
  reward: { kind: 'credits', amount: 300, packId: null, label: '300 Créditos' },
  condition: { type: 'wins', min: 10 },
  sortOrder: 8,
};

const GAME_50_WINS: AchievementDef = {
  id: 'game_50_wins',
  category: 'gameplay',
  rarity: 'rare',
  icon: '🏅',
  name: 'Maestro',
  description: 'Vença 50 partidas.',
  xp: 400,
  reward: { kind: 'credits', amount: 800, packId: null, label: '800 Créditos' },
  condition: { type: 'wins', min: 50 },
  sortOrder: 9,
};

const GAME_100_WINS: AchievementDef = {
  id: 'game_100_wins',
  category: 'gameplay',
  rarity: 'epic',
  icon: '🌟',
  name: 'Lenda Viva',
  description: 'Vença 100 partidas.',
  xp: 750,
  reward: { kind: 'credits', amount: 1500, packId: null, label: '1500 Créditos' },
  condition: { type: 'wins', min: 100 },
  sortOrder: 10,
};

const GAME_STREAK_10: AchievementDef = {
  id: 'game_streak_10',
  category: 'gameplay',
  rarity: 'rare',
  icon: '🔥',
  name: 'Série de Ouro',
  description: 'Conquiste uma sequência de 10 vitórias.',
  xp: 350,
  reward: { kind: 'pack', amount: 1, packId: 'elite-pack', label: '1x Elite Pack' },
  condition: { type: 'win_streak', min: 10 },
  sortOrder: 11,
};

const GAME_500_GOALS: AchievementDef = {
  id: 'game_500_goals',
  category: 'gameplay',
  rarity: 'epic',
  icon: '⚡',
  name: 'Artilheiro Épico',
  description: 'Marque 500 gols.',
  xp: 600,
  reward: { kind: 'credits', amount: 1200, packId: null, label: '1200 Créditos' },
  condition: { type: 'goals', min: 500 },
  sortOrder: 12,
};

// ─── Seasons (6) ───────────────────────────────────────────────────────────────

const SEASON_FIRST_LOGIN: AchievementDef = {
  id: 'season_first_login',
  category: 'seasons',
  rarity: 'common',
  icon: '🌅',
  name: 'Bem-vindo!',
  description: 'Reivindique o pack inicial.',
  xp: 50,
  reward: { kind: 'credits', amount: 100, packId: null, label: '100 Créditos' },
  condition: { type: 'starter_claimed' },
  sortOrder: 13,
};

const SEASON_3_STREAK: AchievementDef = {
  id: 'season_3_streak',
  category: 'seasons',
  rarity: 'common',
  icon: '📅',
  name: 'Consistente',
  description: 'Faça login por 3 dias consecutivos.',
  xp: 100,
  reward: { kind: 'credits', amount: 200, packId: null, label: '200 Créditos' },
  condition: { type: 'streak_days', min: 3 },
  sortOrder: 14,
};

const SEASON_7_STREAK: AchievementDef = {
  id: 'season_7_streak',
  category: 'seasons',
  rarity: 'rare',
  icon: '🗓️',
  name: 'Dedicado',
  description: 'Faça login por 7 dias consecutivos.',
  xp: 300,
  reward: { kind: 'credits', amount: 600, packId: null, label: '600 Créditos' },
  condition: { type: 'streak_days', min: 7 },
  sortOrder: 15,
};

const SEASON_14_STREAK: AchievementDef = {
  id: 'season_14_streak',
  category: 'seasons',
  rarity: 'epic',
  icon: '⭐',
  name: 'Fanático',
  description: 'Faça login por 14 dias consecutivos.',
  xp: 600,
  reward: { kind: 'pack', amount: 1, packId: 'elite-pack', label: '1x Elite Pack' },
  condition: { type: 'streak_days', min: 14 },
  sortOrder: 16,
};

const SEASON_30_STREAK: AchievementDef = {
  id: 'season_30_streak',
  category: 'seasons',
  rarity: 'legendary',
  icon: '💎',
  name: 'Mestre da Disciplina',
  description: 'Faça login por 30 dias consecutivos.',
  xp: 1200,
  reward: { kind: 'pack', amount: 1, packId: 'legend-pack', label: '1x Legend Pack' },
  condition: { type: 'streak_days', min: 30 },
  sortOrder: 17,
};

const SEASON_10_DAILY: AchievementDef = {
  id: 'season_10_daily',
  category: 'seasons',
  rarity: 'rare',
  icon: '🎯',
  name: 'Caçador de Missões',
  description: 'Complete 10 missões diárias.',
  xp: 250,
  reward: { kind: 'credits', amount: 500, packId: null, label: '500 Créditos' },
  condition: { type: 'daily_missions_completed', min: 10 },
  sortOrder: 18,
};

// ─── Events (6) ────────────────────────────────────────────────────────────────

const EVENT_STARTER: AchievementDef = {
  id: 'event_starter',
  category: 'events',
  rarity: 'common',
  icon: '🎁',
  name: 'Os Primeiros Passos',
  description: 'Reivindique o pack inicial.',
  xp: 50,
  reward: { kind: 'credits', amount: 150, packId: null, label: '150 Créditos' },
  condition: { type: 'starter_claimed' },
  sortOrder: 19,
};

const EVENT_FIRST_PACK: AchievementDef = {
  id: 'event_first_pack',
  category: 'events',
  rarity: 'common',
  icon: '📦',
  name: 'Primeiro Pack Aberto',
  description: 'Abra 1 pack.',
  xp: 75,
  reward: { kind: 'credits', amount: 150, packId: null, label: '150 Créditos' },
  condition: { type: 'packs_opened', min: 1 },
  sortOrder: 20,
};

const EVENT_FIRST_WIN: AchievementDef = {
  id: 'event_first_win',
  category: 'events',
  rarity: 'common',
  icon: '🏆',
  name: 'Primeira Vitória',
  description: 'Vença 1 partida.',
  xp: 75,
  reward: { kind: 'credits', amount: 200, packId: null, label: '200 Créditos' },
  condition: { type: 'wins', min: 1 },
  sortOrder: 21,
};

const EVENT_MISSION_DAILY: AchievementDef = {
  id: 'event_mission_daily',
  category: 'events',
  rarity: 'common',
  icon: '✅',
  name: 'Missão do Dia',
  description: 'Complete 1 missão diária.',
  xp: 100,
  reward: { kind: 'credits', amount: 250, packId: null, label: '250 Créditos' },
  condition: { type: 'daily_missions_completed', min: 1 },
  sortOrder: 22,
};

const EVENT_10_MATCHES: AchievementDef = {
  id: 'event_10_matches',
  category: 'events',
  rarity: 'common',
  icon: '🎖️',
  name: 'Veterano',
  description: 'Jogue 10 partidas.',
  xp: 150,
  reward: { kind: 'credits', amount: 300, packId: null, label: '300 Créditos' },
  condition: { type: 'matches_played', min: 10 },
  sortOrder: 23,
};

const EVENT_LEGEND_CARD: AchievementDef = {
  id: 'event_legend_card',
  category: 'events',
  rarity: 'rare',
  icon: '✨',
  name: 'Descobridor Lendário',
  description: 'Possua qualquer carta legendary, ultra ou world_cup_hero.',
  xp: 300,
  reward: { kind: 'credits', amount: 600, packId: null, label: '600 Créditos' },
  condition: { type: 'rarity_owned_count', rarity: 'high_rarity', min: 1 },
  sortOrder: 24,
};

// ─── Packs (6) ─────────────────────────────────────────────────────────────────

const PACK_10: AchievementDef = {
  id: 'pack_10',
  category: 'packs',
  rarity: 'common',
  icon: '🎴',
  name: 'Explorador',
  description: 'Abra 10 packs.',
  xp: 100,
  reward: { kind: 'credits', amount: 200, packId: null, label: '200 Créditos' },
  condition: { type: 'packs_opened', min: 10 },
  sortOrder: 25,
};

const PACK_50: AchievementDef = {
  id: 'pack_50',
  category: 'packs',
  rarity: 'rare',
  icon: '🎰',
  name: 'Viciado',
  description: 'Abra 50 packs.',
  xp: 350,
  reward: { kind: 'credits', amount: 700, packId: null, label: '700 Créditos' },
  condition: { type: 'packs_opened', min: 50 },
  sortOrder: 26,
};

const PACK_100: AchievementDef = {
  id: 'pack_100',
  category: 'packs',
  rarity: 'epic',
  icon: '💫',
  name: 'Magnata dos Packs',
  description: 'Abra 100 packs.',
  xp: 700,
  reward: { kind: 'credits', amount: 1400, packId: null, label: '1400 Créditos' },
  condition: { type: 'packs_opened', min: 100 },
  sortOrder: 27,
};

const PACK_LUCKY: AchievementDef = {
  id: 'pack_lucky',
  category: 'packs',
  rarity: 'rare',
  icon: '🍀',
  name: 'Sortudo',
  description: 'Possua uma carta Legendary.',
  xp: 250,
  reward: { kind: 'credits', amount: 500, packId: null, label: '500 Créditos' },
  condition: { type: 'rarity_owned_count', rarity: 'legendary', min: 1 },
  sortOrder: 28,
};

const PACK_ULTRA: AchievementDef = {
  id: 'pack_ultra',
  category: 'packs',
  rarity: 'epic',
  icon: '🌠',
  name: 'Ultra Raro',
  description: 'Possua uma carta World Cup Hero.',
  xp: 500,
  reward: { kind: 'pack', amount: 1, packId: 'elite-pack', label: '1x Elite Pack' },
  condition: { type: 'rarity_owned_count', rarity: 'world_cup_hero', min: 1 },
  sortOrder: 29,
};

const PACK_ALL_LEGENDARY: AchievementDef = {
  id: 'pack_all_legendary',
  category: 'packs',
  rarity: 'epic',
  icon: '💥',
  name: 'Arsenal Lendário',
  description: 'Possua 10 ou mais cartas legendary, ultra ou world_cup_hero.',
  xp: 600,
  reward: { kind: 'pack', amount: 1, packId: 'elite-pack', label: '1x Elite Pack' },
  condition: { type: 'rarity_owned_count', rarity: 'high_rarity', min: 10 },
  sortOrder: 30,
};

// ─── Legends (6) ───────────────────────────────────────────────────────────────

const LEGEND_FIRST: AchievementDef = {
  id: 'legend_first',
  category: 'legends',
  rarity: 'common',
  icon: '⚡',
  name: 'Descobridor',
  description: 'Possua qualquer carta legendary.',
  xp: 150,
  reward: { kind: 'credits', amount: 300, packId: null, label: '300 Créditos' },
  condition: { type: 'rarity_owned_count', rarity: 'legendary', min: 1 },
  sortOrder: 31,
};

const LEGEND_PELE: AchievementDef = {
  id: 'legend_pele',
  category: 'legends',
  rarity: 'epic',
  icon: '👑',
  name: 'O Rei',
  description: 'Possua pelé-world_cup_hero.',
  xp: 500,
  reward: { kind: 'credits', amount: 1000, packId: null, label: '1000 Créditos' },
  condition: { type: 'specific_cards_owned', cardIds: ['pelé-world_cup_hero'] },
  sortOrder: 32,
};

const LEGEND_RONALDO: AchievementDef = {
  id: 'legend_ronaldo',
  category: 'legends',
  rarity: 'rare',
  icon: '🔥',
  name: 'O Fenômeno',
  description: 'Possua ronaldo-ultra.',
  xp: 350,
  reward: { kind: 'credits', amount: 700, packId: null, label: '700 Créditos' },
  condition: { type: 'specific_cards_owned', cardIds: ['ronaldo-ultra'] },
  sortOrder: 33,
};

const LEGEND_TRIO_BR: AchievementDef = {
  id: 'legend_trio_br',
  category: 'legends',
  rarity: 'legendary',
  icon: '🇧🇷',
  name: 'Trindade Brasileira',
  description: 'Possua pelé-world_cup_hero, ronaldo-ultra e ronaldinho-ultra.',
  xp: 800,
  reward: { kind: 'pack', amount: 1, packId: 'legend-pack', label: '1x Legend Pack' },
  condition: {
    type: 'specific_cards_owned',
    cardIds: ['pelé-world_cup_hero', 'ronaldo-ultra', 'ronaldinho-ultra'],
  },
  sortOrder: 34,
};

const LEGEND_5_LEGENDARY: AchievementDef = {
  id: 'legend_5_legendary',
  category: 'legends',
  rarity: 'rare',
  icon: '🌟',
  name: 'Os Maiores',
  description: 'Possua 5 cartas legendary, ultra ou world_cup_hero.',
  xp: 400,
  reward: { kind: 'credits', amount: 800, packId: null, label: '800 Créditos' },
  condition: { type: 'rarity_owned_count', rarity: 'high_rarity', min: 5 },
  sortOrder: 35,
};

const LEGEND_WCH_ALL: AchievementDef = {
  id: 'legend_wch_all',
  category: 'legends',
  rarity: 'legendary',
  icon: '🏆',
  name: 'Campeões do Mundo',
  description: 'Possua pelé-world_cup_hero e maradona-world_cup_hero.',
  xp: 900,
  reward: { kind: 'pack', amount: 1, packId: 'legend-pack', label: '1x Legend Pack' },
  condition: {
    type: 'specific_cards_owned',
    cardIds: ['pelé-world_cup_hero', 'maradona-world_cup_hero'],
  },
  sortOrder: 36,
};

// ─── GOAT (6) ──────────────────────────────────────────────────────────────────

const GOAT_MARADONA: AchievementDef = {
  id: 'goat_maradona',
  category: 'goat',
  rarity: 'epic',
  icon: '🎩',
  name: 'El Diego',
  description: 'Possua maradona-world_cup_hero.',
  xp: 500,
  reward: { kind: 'credits', amount: 1000, packId: null, label: '1000 Créditos' },
  condition: { type: 'specific_cards_owned', cardIds: ['maradona-world_cup_hero'] },
  sortOrder: 37,
};

const GOAT_RONALDINHO: AchievementDef = {
  id: 'goat_ronaldinho',
  category: 'goat',
  rarity: 'rare',
  icon: '🪄',
  name: 'O Gênio',
  description: 'Possua ronaldinho-ultra.',
  xp: 350,
  reward: { kind: 'credits', amount: 700, packId: null, label: '700 Créditos' },
  condition: { type: 'specific_cards_owned', cardIds: ['ronaldinho-ultra'] },
  sortOrder: 38,
};

const GOAT_TRINITY: AchievementDef = {
  id: 'goat_trinity',
  category: 'goat',
  rarity: 'legendary',
  icon: '🌍',
  name: 'Santíssima Trindade',
  description: 'Possua pelé-world_cup_hero, maradona-world_cup_hero e ronaldo-ultra.',
  xp: 1000,
  reward: { kind: 'pack', amount: 1, packId: 'legend-pack', label: '1x Legend Pack' },
  condition: {
    type: 'specific_cards_owned',
    cardIds: ['pelé-world_cup_hero', 'maradona-world_cup_hero', 'ronaldo-ultra'],
  },
  sortOrder: 39,
};

const GOAT_ALL_ULTRA: AchievementDef = {
  id: 'goat_all_ultra',
  category: 'goat',
  rarity: 'epic',
  icon: '💎',
  name: 'Ultra Elite',
  description: 'Possua ronaldo-ultra e ronaldinho-ultra.',
  xp: 600,
  reward: { kind: 'credits', amount: 1200, packId: null, label: '1200 Créditos' },
  condition: {
    type: 'specific_cards_owned',
    cardIds: ['ronaldo-ultra', 'ronaldinho-ultra'],
  },
  sortOrder: 40,
};

const GOAT_ALL_WCH: AchievementDef = {
  id: 'goat_all_wch',
  category: 'goat',
  rarity: 'legendary',
  icon: '🌟',
  name: 'Heróis da Copa',
  description: 'Possua ambas as cartas World Cup Hero.',
  xp: 900,
  reward: { kind: 'pack', amount: 1, packId: 'legend-pack', label: '1x Legend Pack' },
  condition: {
    type: 'specific_cards_owned',
    cardIds: ['pelé-world_cup_hero', 'maradona-world_cup_hero'],
  },
  sortOrder: 41,
};

const GOAT_SUPREME: AchievementDef = {
  id: 'goat_supreme',
  category: 'goat',
  rarity: 'goat',
  icon: '🐐',
  name: 'GOAT Supremo',
  description:
    'Possua TODAS as cartas ultra e world_cup_hero: pelé-world_cup_hero, ronaldo-ultra, ronaldinho-ultra e maradona-world_cup_hero.',
  xp: 2000,
  reward: { kind: 'pack', amount: 1, packId: 'legend-pack', label: '1x Legend Pack' },
  condition: {
    type: 'specific_cards_owned',
    cardIds: [
      'pelé-world_cup_hero',
      'ronaldo-ultra',
      'ronaldinho-ultra',
      'maradona-world_cup_hero',
    ],
  },
  sortOrder: 42,
};

// ─── Full catalog ───────────────────────────────────────────────────────────────

export const ACHIEVEMENT_CATALOG: readonly AchievementDef[] = [
  // Collection
  COLL_FIRST_CARD,
  COLL_5_CARDS,
  COLL_ALL_BR,
  COLL_ARTILHEIROS,
  COLL_COPA_2002,
  COLL_ALBUM_COMPLETO,
  // Gameplay
  GAME_FIRST_MATCH,
  GAME_10_WINS,
  GAME_50_WINS,
  GAME_100_WINS,
  GAME_STREAK_10,
  GAME_500_GOALS,
  // Seasons
  SEASON_FIRST_LOGIN,
  SEASON_3_STREAK,
  SEASON_7_STREAK,
  SEASON_14_STREAK,
  SEASON_30_STREAK,
  SEASON_10_DAILY,
  // Events
  EVENT_STARTER,
  EVENT_FIRST_PACK,
  EVENT_FIRST_WIN,
  EVENT_MISSION_DAILY,
  EVENT_10_MATCHES,
  EVENT_LEGEND_CARD,
  // Packs
  PACK_10,
  PACK_50,
  PACK_100,
  PACK_LUCKY,
  PACK_ULTRA,
  PACK_ALL_LEGENDARY,
  // Legends
  LEGEND_FIRST,
  LEGEND_PELE,
  LEGEND_RONALDO,
  LEGEND_TRIO_BR,
  LEGEND_5_LEGENDARY,
  LEGEND_WCH_ALL,
  // GOAT
  GOAT_MARADONA,
  GOAT_RONALDINHO,
  GOAT_TRINITY,
  GOAT_ALL_ULTRA,
  GOAT_ALL_WCH,
  GOAT_SUPREME,
];
