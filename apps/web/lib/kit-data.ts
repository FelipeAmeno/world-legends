import type { NationalityCode } from '@world-legends/types';
import type { RarityCode } from '@world-legends/types';

// ─── Kit Colors ───────────────────────────────────────────────────────────────
//
// Cores reais/plausíveis do kit principal de cada seleção. `pattern` generaliza
// o antigo `stripes` booleano para cobrir os padrões icônicos (Argentina
// listrada, Croácia quadriculada, Paraguai listrado) sem duplicar lógica.

export type KitPattern = 'solid' | 'stripes' | 'checker';

export type KitColors = {
  primary: string; // Main jersey color
  secondary: string; // Collar, cuffs, trim
  number: string; // Shirt number color
  name: string; // Shirt name text color
  shadow: string; // Jersey depth/shadow stop
  pattern?: KitPattern;
  patternColor?: string; // Color of the alternating stripe/square
  emblem?: string; // Badge/crest accent color
  /** @deprecated use `pattern === 'stripes'` */
  stripes?: boolean;
  /** @deprecated use `patternColor` */
  stripeColor?: string;
};

const KITS: Record<string, KitColors> = {
  // ── Sul-americanas ──
  AR: {
    primary: '#75AADB',
    secondary: '#FFFFFF',
    number: '#16213E',
    name: '#16213E',
    shadow: '#4A8AC4',
    pattern: 'stripes',
    patternColor: '#FFFFFF',
  },
  BR: {
    primary: '#F5D60E',
    secondary: '#006B3C',
    number: '#003087',
    name: '#003087',
    shadow: '#B8A010',
    emblem: '#003087',
  },
  CL: {
    primary: '#D52B1E',
    secondary: '#0039A6',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  CO: {
    primary: '#FCD116',
    secondary: '#003087',
    number: '#003087',
    name: '#003087',
    shadow: '#B89A0E',
  },
  EC: {
    primary: '#FFDD00',
    secondary: '#0072CE',
    number: '#0072CE',
    name: '#0072CE',
    shadow: '#B89A00',
  },
  PE: {
    primary: '#FFFFFF',
    secondary: '#D91023',
    number: '#D91023',
    name: '#D91023',
    shadow: '#D8D8D8',
  },
  PY: {
    primary: '#DA121A',
    secondary: '#FFFFFF',
    number: '#0038A8',
    name: '#0038A8',
    shadow: '#8B0000',
    pattern: 'stripes',
    patternColor: '#FFFFFF',
  },
  UY: {
    primary: '#5EB6E4',
    secondary: '#000000',
    number: '#000000',
    name: '#000000',
    shadow: '#3A8AB8',
  },

  // ── Europeias ──
  AL: {
    primary: '#E41E20',
    secondary: '#000000',
    number: '#000000',
    name: '#000000',
    shadow: '#8B0000',
  },
  AT: {
    primary: '#ED2939',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  BA: {
    primary: '#002F6C',
    secondary: '#FECB00',
    number: '#FECB00',
    name: '#FECB00',
    shadow: '#001940',
  },
  BE: {
    primary: '#DA121A',
    secondary: '#000000',
    number: '#FFD90C',
    name: '#FFD90C',
    shadow: '#8B0000',
  },
  BG: {
    primary: '#FFFFFF',
    secondary: '#00966E',
    number: '#00966E',
    name: '#00966E',
    shadow: '#D8D8D8',
  },
  CH: {
    primary: '#D52B1E',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  CS: {
    primary: '#D7141A',
    secondary: '#FFFFFF',
    number: '#001489',
    name: '#001489',
    shadow: '#8B0000',
  },
  CZ: {
    primary: '#D7141A',
    secondary: '#FFFFFF',
    number: '#001489',
    name: '#001489',
    shadow: '#8B0000',
  },
  DE: {
    primary: '#FFFFFF',
    secondary: '#000000',
    number: '#CC0000',
    name: '#000000',
    shadow: '#E8E8E8',
  },
  DK: {
    primary: '#C60C30',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  EN: {
    primary: '#FFFFFF',
    secondary: '#CC0000',
    number: '#003087',
    name: '#003087',
    shadow: '#E8E8E8',
  },
  ES: {
    primary: '#C60B1E',
    secondary: '#FFC400',
    number: '#FFC400',
    name: '#FFC400',
    shadow: '#8B0000',
  },
  FR: {
    primary: '#002F6C',
    secondary: '#ED2939',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#001940',
  },
  GR: {
    primary: '#0D5EAF',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#083C70',
  },
  HR: {
    primary: '#FF0000',
    secondary: '#FFFFFF',
    number: '#171796',
    name: '#171796',
    shadow: '#8B0000',
    pattern: 'checker',
    patternColor: '#FFFFFF',
  },
  HU: {
    primary: '#CE2939',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  IE: {
    primary: '#169B62',
    secondary: '#FF883E',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#0E6640',
  },
  IL: {
    primary: '#0038B8',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#00246E',
  },
  IS: {
    primary: '#003897',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#002460',
  },
  IT: {
    primary: '#003399',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#001F66',
  },
  NL: {
    primary: '#FF6600',
    secondary: '#003087',
    number: '#003087',
    name: '#003087',
    shadow: '#CC4400',
  },
  PL: {
    primary: '#FFFFFF',
    secondary: '#DC143C',
    number: '#DC143C',
    name: '#DC143C',
    shadow: '#D8D8D8',
  },
  PT: {
    primary: '#B22222',
    secondary: '#006600',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#7A1616',
  },
  RO: {
    primary: '#FCD116',
    secondary: '#002B7F',
    number: '#002B7F',
    name: '#002B7F',
    shadow: '#B89A0E',
  },
  RS: {
    primary: '#C6363C',
    secondary: '#FFFFFF',
    number: '#0C4076',
    name: '#0C4076',
    shadow: '#8B0000',
  },
  RU: {
    primary: '#DA1E28',
    secondary: '#FFFFFF',
    number: '#0039A6',
    name: '#0039A6',
    shadow: '#8B0000',
  },
  SC: {
    primary: '#003087',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#001F5C',
  },
  SE: {
    primary: '#FECC02',
    secondary: '#004B87',
    number: '#004B87',
    name: '#004B87',
    shadow: '#B89400',
  },
  SK: {
    primary: '#0B4EA2',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#073468',
  },
  SU: {
    primary: '#CC0000',
    secondary: '#FFD700',
    number: '#FFD700',
    name: '#FFD700',
    shadow: '#8B0000',
  },
  TR: {
    primary: '#E30A17',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  UA: {
    primary: '#005BBB',
    secondary: '#FFD500',
    number: '#FFD500',
    name: '#FFD500',
    shadow: '#003C7A',
  },
  WA: {
    primary: '#D01317',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  YU: {
    primary: '#0C4076',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#082C52',
  },

  // ── Africanas ──
  CD: {
    primary: '#5FBFF9',
    secondary: '#FCE300',
    number: '#FCE300',
    name: '#FCE300',
    shadow: '#3A8AC4',
  },
  CI: {
    primary: '#F77F00',
    secondary: '#FFFFFF',
    number: '#009E60',
    name: '#009E60',
    shadow: '#B85E00',
  },
  CM: {
    primary: '#007A5E',
    secondary: '#CE1126',
    number: '#FCD116',
    name: '#FCD116',
    shadow: '#00503E',
  },
  DZ: {
    primary: '#FFFFFF',
    secondary: '#006233',
    number: '#006233',
    name: '#006233',
    shadow: '#D8D8D8',
  },
  EG: {
    primary: '#CE1126',
    secondary: '#000000',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  GH: {
    primary: '#FFFFFF',
    secondary: '#000000',
    number: '#CE1126',
    name: '#000000',
    shadow: '#D8D8D8',
  },
  MA: {
    primary: '#C1272D',
    secondary: '#006233',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  ML: {
    primary: '#14B53A',
    secondary: '#FCD116',
    number: '#CE1126',
    name: '#FCD116',
    shadow: '#0C7A26',
  },
  NG: {
    primary: '#00A651',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#006B34',
  },
  SN: {
    primary: '#FFFFFF',
    secondary: '#00853F',
    number: '#00853F',
    name: '#00853F',
    shadow: '#D8D8D8',
  },

  // ── Ásia / Oceania / América do Norte ──
  AU: {
    primary: '#FFD200',
    secondary: '#00843D',
    number: '#00843D',
    name: '#00843D',
    shadow: '#B89400',
  },
  CA: {
    primary: '#FF0000',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  CR: {
    primary: '#CE1126',
    secondary: '#002B7F',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  CU: {
    primary: '#002A8F',
    secondary: '#CF142B',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#001C5F',
  },
  JM: {
    primary: '#000000',
    secondary: '#FED100',
    number: '#009B3A',
    name: '#FED100',
    shadow: '#000000',
  },
  JP: {
    primary: '#003399',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#001F66',
  },
  KR: {
    primary: '#C60C30',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  MX: {
    primary: '#006847',
    secondary: '#CE1126',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#00432E',
  },
  NI: {
    primary: '#0067C6',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#00427F',
  },
  PF: {
    primary: '#CE1126',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#8B0000',
  },
  QA: {
    primary: '#8A1538',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#5C0E24',
  },
  SA: {
    primary: '#006C35',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#004623',
  },
  US: {
    primary: '#FFFFFF',
    secondary: '#B22234',
    number: '#002868',
    name: '#002868',
    shadow: '#D8D8D8',
  },
};

const DEFAULT_KIT: KitColors = {
  primary: '#1A1A2E',
  secondary: '#4A4A6A',
  number: '#FFFFFF',
  name: '#FFFFFF',
  shadow: '#0D0D1A',
};

export function getKitColors(nationality: NationalityCode): KitColors {
  return KITS[nationality] ?? DEFAULT_KIT;
}

/** Todas as nacionalidades com kit mapeado — usado pelo inspetor de assets (Sprint 18.6.5). */
export function getAllKitNationalities(): readonly string[] {
  return Object.keys(KITS);
}

// ─── Rarity kit overrides ─────────────────────────────────────────────────────

export type RarityKitOverride = {
  numberColor: string;
  nameColor: string;
  collarColor: string;
  cuffColor: string;
  hemColor: string;
  jerseyGlowColor?: string;
  jerseyShimmer?: boolean;
  jerseyRainbow?: boolean;
  jerseyGold?: boolean;
};

export const RARITY_KIT_OVERRIDE: Record<RarityCode, RarityKitOverride> = {
  common: {
    numberColor: 'inherit',
    nameColor: 'inherit',
    collarColor: 'inherit',
    cuffColor: 'inherit',
    hemColor: 'inherit',
  },
  rare: {
    numberColor: 'inherit',
    nameColor: 'inherit',
    collarColor: '#a855f7',
    cuffColor: '#a855f7',
    hemColor: 'inherit',
    jerseyGlowColor: 'rgba(147,51,234,0.25)',
  },
  elite: {
    numberColor: '#93c5fd',
    nameColor: '#93c5fd',
    collarColor: '#3b82f6',
    cuffColor: '#3b82f6',
    hemColor: '#3b82f6',
    jerseyGlowColor: 'rgba(59,130,246,0.3)',
  },
  legendary: {
    numberColor: '#c9a84c',
    nameColor: '#c9a84c',
    collarColor: '#c9a84c',
    cuffColor: '#c9a84c',
    hemColor: '#c9a84c',
    jerseyGold: true,
    jerseyGlowColor: 'rgba(201,168,76,0.35)',
  },
  ultra: {
    numberColor: '#ffffff',
    nameColor: '#f9a8d4',
    collarColor: '#ec4899',
    cuffColor: '#ec4899',
    hemColor: '#ec4899',
    jerseyRainbow: true,
    jerseyGlowColor: 'rgba(236,72,153,0.4)',
  },
  world_cup_hero: {
    numberColor: '#f5e098',
    nameColor: '#f5e098',
    collarColor: '#c9a84c',
    cuffColor: '#c9a84c',
    hemColor: '#c9a84c',
    jerseyGold: true,
    jerseyShimmer: true,
    jerseyGlowColor: 'rgba(201,168,76,0.5)',
  },
};

// ─── Stadium backgrounds ──────────────────────────────────────────────────────

export type StadiumBg = {
  from: string;
  mid: string;
  to: string;
  name: string;
};

const STADIUMS: Record<string, StadiumBg> = {
  BR: { from: '#0d1a0a', mid: '#0a1c06', to: '#061207', name: 'Maracanã' },
  AR: { from: '#0a0f1f', mid: '#0d1530', to: '#060b18', name: 'El Monumental' },
  DE: { from: '#111111', mid: '#1a1a1a', to: '#0a0a0a', name: 'Olympiastadion' },
  FR: { from: '#06091a', mid: '#0a0d24', to: '#050710', name: 'Stade de France' },
  IT: { from: '#05081a', mid: '#08102a', to: '#040610', name: 'Olimpico Roma' },
  ES: { from: '#1a0505', mid: '#250808', to: '#100303', name: 'Bernabéu' },
  EN: { from: '#050b1a', mid: '#08102a', to: '#040810', name: 'Wembley' },
  UY: { from: '#050d1a', mid: '#08132a', to: '#040910', name: 'Centenario' },
  PT: { from: '#060f08', mid: '#091508', to: '#040b05', name: 'Estádio da Luz' },
  NL: { from: '#1a0a00', mid: '#251000', to: '#100600', name: 'Johan Cruyff ArenA' },
};

const DEFAULT_STADIUM: StadiumBg = {
  from: '#060510',
  mid: '#0a0a18',
  to: '#04040c',
  name: 'Estádio',
};

export function getStadiumBg(nationality: NationalityCode): StadiumBg {
  return STADIUMS[nationality] ?? DEFAULT_STADIUM;
}
