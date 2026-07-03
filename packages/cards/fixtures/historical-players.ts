/**
 * Fixtures históricas de Players para testes e demonstração.
 *
 * ATRIBUTOS CALIBRADOS por raridade (doc 10 §6): os atributos-base aqui
 * são escalados para que a fórmula produza Overalls corretos nas raridades
 * que cada jogador lendário deve ter. Um jogador como Pelé não tem carta
 * Common (seria overall ~61 nas suas mãos, mas os atributos-base dele produzem
 * 89 já com mult 1.0). As fixtures criam somente as raridades matematicamente
 * válidas para cada jogador.
 *
 * Atributos derivados de fatos históricos verificáveis (doc 08 §2.1).
 * AVISO LEGAL (doc 08 §2.3): uso interno/desenvolvimento apenas.
 */
import type { CreatePlayerInput } from '../src/player/player';

// ─── Pelé ─────────────────────────────────────────────────────────────────────
// Calibrado para: legendary(89), ultra(95), world_cup_hero(97) como ST
export const PELE_PLAYER_INPUT: CreatePlayerInput = {
  id: 'player-pele',
  fullName: 'Edson Arantes do Nascimento',
  knownAs: 'Pelé',
  birthYear: 1940,
  nationality: 'BR',
  primaryPosition: 'ST',
  secondaryPositions: ['CF'],
  preferredFoot: 'right',
  heightCm: 173,
  eraStart: 1958,
  eraEnd: 1974,
  baseAttributes: {
    pace: 75,
    stamina: 72,
    physical: 70,
    heading: 74,
    finishing: 78,
    shot_power: 75,
    passing: 72,
    vision: 79,
    dribbling: 82,
    penalty_kicks: 73,
    defending: 28,
    composure: 78,
    aggression: 40,
    leadership: 77,
    gk_reflexes: 10,
    gk_positioning: 10,
    gk_handling: 10,
    gk_kicking: 10,
    gk_penalty_save: 10,
  },
  bioShort:
    'Único tricampeão mundial, eleito o maior jogador do século XX pela FIFA. Artilheiro histórico da Seleção com 77 gols.',
  sourceNotes:
    'Atributos calibrados para Legendary/Ultra/WCH. Fontes: estatísticas oficiais FIFA (12 gols em 14 jogos de Copa), Bola de Ouro de Copa 1970, artilheiro Copa 1958.',
};

// ─── Maradona ─────────────────────────────────────────────────────────────────
// Calibrado para: legendary(90), ultra(95), world_cup_hero(98) como CAM
export const MARADONA_PLAYER_INPUT: CreatePlayerInput = {
  id: 'player-maradona',
  fullName: 'Diego Armando Maradona',
  knownAs: 'Maradona',
  birthYear: 1960,
  nationality: 'AR',
  primaryPosition: 'CAM',
  secondaryPositions: ['CF', 'LW'],
  preferredFoot: 'left',
  heightCm: 165,
  eraStart: 1982,
  eraEnd: 1994,
  baseAttributes: {
    pace: 72,
    stamina: 73,
    physical: 68,
    heading: 60,
    finishing: 74,
    shot_power: 71,
    passing: 75,
    vision: 78,
    dribbling: 76,
    penalty_kicks: 72,
    defending: 30,
    composure: 76,
    aggression: 61,
    leadership: 77,
    gk_reflexes: 10,
    gk_positioning: 10,
    gk_handling: 10,
    gk_kicking: 10,
    gk_penalty_save: 10,
  },
  bioShort:
    'Campeão mundial em 1986, eleito MVP e autor do "Gol do Século". Considerado por muitos o maior de todos os tempos.',
  sourceNotes:
    'Atributos calibrados para Legendary/Ultra/WCH. Fontes: Bola de Ouro Copa 1986, 5 gols + 5 assist na Copa 86, consensus histórico.',
};

// ─── Ronaldo (Fenômeno) ───────────────────────────────────────────────────────
// Calibrado para: elite(83), legendary(88), ultra(93), world_cup_hero(96) como ST
export const RONALDO_PLAYER_INPUT: CreatePlayerInput = {
  id: 'player-ronaldo-r9',
  fullName: 'Ronaldo Luís Nazário de Lima',
  knownAs: 'Ronaldo',
  birthYear: 1976,
  nationality: 'BR',
  primaryPosition: 'ST',
  secondaryPositions: ['CF'],
  preferredFoot: 'right',
  heightCm: 183,
  eraStart: 1994,
  eraEnd: 2006,
  baseAttributes: {
    pace: 78,
    stamina: 68,
    physical: 74,
    heading: 70,
    finishing: 76,
    shot_power: 73,
    passing: 63,
    vision: 69,
    dribbling: 81,
    penalty_kicks: 70,
    defending: 25,
    composure: 74,
    aggression: 44,
    leadership: 66,
    gk_reflexes: 10,
    gk_positioning: 10,
    gk_handling: 10,
    gk_kicking: 10,
    gk_penalty_save: 10,
  },
  bioShort:
    'Bicampeão mundial (1994, 2002), artilheiro histórico de Copas com 15 gols. Considerado o melhor centroavante da história.',
  sourceNotes:
    'Atributos calibrados para Elite/Legendary/Ultra/WCH. Fontes: 8 gols Copa 2002, FIFA World Player of the Year 1996/1997/2002, Bola de Ouro 1997/2002.',
};

// ─── Zidane ───────────────────────────────────────────────────────────────────
// Calibrado para: legendary(88), ultra(93), world_cup_hero(95) como CM
export const ZIDANE_PLAYER_INPUT: CreatePlayerInput = {
  id: 'player-zidane',
  fullName: 'Zinédine Yazid Zidane',
  knownAs: 'Zidane',
  birthYear: 1972,
  nationality: 'FR',
  primaryPosition: 'CM',
  secondaryPositions: ['CAM'],
  preferredFoot: 'both',
  heightCm: 185,
  eraStart: 1998,
  eraEnd: 2006,
  baseAttributes: {
    pace: 67,
    stamina: 75,
    physical: 70,
    heading: 72,
    finishing: 70,
    shot_power: 70,
    passing: 79,
    vision: 77,
    dribbling: 77,
    penalty_kicks: 73,
    defending: 47,
    composure: 77,
    aggression: 53,
    leadership: 77,
    gk_reflexes: 10,
    gk_positioning: 10,
    gk_handling: 10,
    gk_kicking: 10,
    gk_penalty_save: 10,
  },
  bioShort:
    'Campeão mundial em 1998, Bola de Ouro Copa 1998 e 2006. Eleito o melhor jogador do mundo 3 vezes.',
  sourceNotes:
    'Atributos calibrados para Legendary/Ultra/WCH. Fontes: Bola de Ouro FIFA 1998/2000/2003, MVP Copa 1998 e 2006.',
};

// ─── Um jogador comum para testar raridades baixas ────────────────────────────
// Carlos Alberto (lateral, Copa 70) — jogador relevante mas não lenda GOAT
// Calibrado para: common(61), rare(65), elite(73... wait, elite is 82-87)
// Vamos usar common e rare apenas
export const CARLOS_ALBERTO_INPUT: CreatePlayerInput = {
  id: 'player-carlos-alberto',
  fullName: 'Carlos Alberto Torres',
  knownAs: 'Carlos Alberto',
  birthYear: 1944,
  nationality: 'BR',
  primaryPosition: 'RB',
  secondaryPositions: ['RWB'],
  preferredFoot: 'right',
  heightCm: 180,
  eraStart: 1966,
  eraEnd: 1974,
  baseAttributes: {
    pace: 70,
    stamina: 68,
    physical: 67,
    heading: 63,
    finishing: 55,
    shot_power: 62,
    passing: 65,
    vision: 60,
    dribbling: 60,
    penalty_kicks: 52,
    defending: 68,
    composure: 64,
    aggression: 62,
    leadership: 65,
    gk_reflexes: 10,
    gk_positioning: 10,
    gk_handling: 10,
    gk_kicking: 10,
    gk_penalty_save: 10,
  },
  bioShort:
    'Capitão do Brasil tricampeão em 1970. Lateral-direito que foi símbolo do futebol arte.',
  sourceNotes:
    'Atributos calibrados para Common/Rare como RB. Fontes: participação Copa 1966/1970, capitão na final de 1970.',
};

// ─── TournamentContext helpers ────────────────────────────────────────────────
export const WC_1970_CONTEXT = {
  tournament: 'FIFA World Cup',
  year: 1970,
  hostCountry: 'Mexico',
  narrativeDescription:
    'Copa de 1970: Pelé lidera o Brasil ao tricampeonato com futebol arte incomparável. Eleito MVP do torneio.',
  performanceIndicator: 99,
} as const;

export const WC_1986_CONTEXT = {
  tournament: 'FIFA World Cup',
  year: 1986,
  hostCountry: 'Mexico',
  narrativeDescription:
    'Copa de 1986: Maradona carrega a Argentina ao título — "Gol do Século" e MVP do torneio.',
  performanceIndicator: 99,
} as const;

export const WC_2002_CONTEXT = {
  tournament: 'FIFA World Cup',
  year: 2002,
  hostCountry: 'South Korea/Japan',
  narrativeDescription:
    'Copa de 2002: Ronaldo supera a tragédia de 1998 e marca 8 gols — a maior redenção do futebol.',
  performanceIndicator: 97,
} as const;

export const WC_1998_CONTEXT = {
  tournament: 'FIFA World Cup',
  year: 1998,
  hostCountry: 'France',
  narrativeDescription:
    'Copa de 1998: Zidane marca dois gols de cabeça na final e leva a França ao primeiro título mundial.',
  performanceIndicator: 98,
} as const;
