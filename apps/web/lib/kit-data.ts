import type { NationalityCode } from '@world-legends/types';
import type { RarityCode } from '@world-legends/types';

// ─── Kit Colors ───────────────────────────────────────────────────────────────

export type KitColors = {
  primary: string; // Main jersey color
  secondary: string; // Collar, cuffs, trim
  number: string; // Shirt number color
  name: string; // Shirt name text color
  shadow: string; // Jersey depth/shadow stop
  stripes?: boolean; // e.g. Argentina
  stripeColor?: string; // Color of alternating stripe
  emblem?: string; // Badge/crest accent color
};

const KITS: Record<string, KitColors> = {
  BR: {
    primary: '#F5D60E',
    secondary: '#006B3C',
    number: '#003087',
    name: '#003087',
    shadow: '#B8A010',
    emblem: '#003087',
  },
  AR: {
    primary: '#74ACE0',
    secondary: '#FFFFFF',
    number: '#16213E',
    name: '#16213E',
    shadow: '#4A8AC4',
    stripes: true,
    stripeColor: '#FFFFFF',
  },
  DE: {
    primary: '#FFFFFF',
    secondary: '#000000',
    number: '#CC0000',
    name: '#000000',
    shadow: '#E8E8E8',
  },
  FR: {
    primary: '#002F6C',
    secondary: '#ED2939',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#001940',
  },
  IT: {
    primary: '#003399',
    secondary: '#FFFFFF',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#001F66',
  },
  ES: {
    primary: '#C60B1E',
    secondary: '#FFC400',
    number: '#FFC400',
    name: '#FFC400',
    shadow: '#8B0000',
  },
  EN: {
    primary: '#FFFFFF',
    secondary: '#CC0000',
    number: '#003087',
    name: '#003087',
    shadow: '#E8E8E8',
  },
  UY: {
    primary: '#5EB6E4',
    secondary: '#000000',
    number: '#000000',
    name: '#000000',
    shadow: '#3A8AB8',
  },
  PT: {
    primary: '#006600',
    secondary: '#CC0000',
    number: '#FFFFFF',
    name: '#FFFFFF',
    shadow: '#004400',
  },
  NL: {
    primary: '#FF6600',
    secondary: '#003087',
    number: '#003087',
    name: '#003087',
    shadow: '#CC4400',
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

// ─── Shirt numbers ────────────────────────────────────────────────────────────

const PLAYER_NUMBERS: Record<string, number> = {
  pele: 10,
  garrincha: 7,
  taffarel: 1,
  cafu: 2,
  lucio: 3,
  'roberto-carlos': 6,
  'falcao-roberto': 8,
  socrates: 8,
  rivaldo: 10,
  bebeto: 9,
  ronaldo: 9,
  zico: 10,
  romario: 11,
  maradona: 10,
};

const POSITION_NUMBERS: Record<string, number> = {
  GK: 1,
  CB: 4,
  LB: 3,
  RB: 2,
  LWB: 3,
  RWB: 2,
  CDM: 5,
  CM: 8,
  CAM: 10,
  LM: 11,
  RM: 7,
  LW: 11,
  RW: 7,
  CF: 9,
  ST: 9,
};

export function getShirtNumber(playerId: string, position: string): number {
  return PLAYER_NUMBERS[playerId] ?? POSITION_NUMBERS[position] ?? 10;
}

// ─── Display surname ──────────────────────────────────────────────────────────

export function getJerseySurname(displayName: string, maxLen = 9): string {
  const parts = displayName.trim().split(' ');
  if (parts.length === 1) return displayName.toUpperCase().slice(0, maxLen);
  const last = parts[parts.length - 1]!;
  return last.toUpperCase().slice(0, maxLen);
}
