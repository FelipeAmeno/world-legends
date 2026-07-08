/**
 * lib/geo/continents.ts — Sprint 17
 *
 * Mapeamento de nacionalidade → continente, usado só para a COR das linhas
 * de química no campo (mesmo país = verde, mesmo continente = azul). Não
 * afeta o cálculo real de química (@world-legends/chemistry), que continua
 * sendo a fonte de verdade para OVR/bônus.
 */

export type Continent =
  | 'south_america'
  | 'north_america'
  | 'europe'
  | 'africa'
  | 'asia'
  | 'oceania';

const CONTINENT_MAP: Record<string, Continent> = {
  // América do Sul
  AR: 'south_america',
  BR: 'south_america',
  CL: 'south_america',
  CO: 'south_america',
  EC: 'south_america',
  PY: 'south_america',
  PE: 'south_america',
  UY: 'south_america',
  // América do Norte / Central / Caribe
  CA: 'north_america',
  CR: 'north_america',
  CU: 'north_america',
  JM: 'north_america',
  MX: 'north_america',
  US: 'north_america',
  // Europa
  AL: 'europe',
  AT: 'europe',
  BA: 'europe',
  BE: 'europe',
  BG: 'europe',
  CH: 'europe',
  CS: 'europe',
  CZ: 'europe',
  DE: 'europe',
  DK: 'europe',
  EN: 'europe',
  GB: 'europe',
  ES: 'europe',
  FR: 'europe',
  GR: 'europe',
  HR: 'europe',
  HU: 'europe',
  IE: 'europe',
  IS: 'europe',
  IT: 'europe',
  NL: 'europe',
  PL: 'europe',
  PT: 'europe',
  RO: 'europe',
  RS: 'europe',
  RU: 'europe',
  SE: 'europe',
  SK: 'europe',
  SU: 'europe',
  TR: 'europe',
  UA: 'europe',
  WA: 'europe',
  YU: 'europe',
  // África
  CD: 'africa',
  CI: 'africa',
  CM: 'africa',
  DZ: 'africa',
  EG: 'africa',
  GH: 'africa',
  MA: 'africa',
  ML: 'africa',
  NG: 'africa',
  SN: 'africa',
  // Ásia
  JP: 'asia',
  KR: 'asia',
  QA: 'asia',
  SA: 'asia',
  // Oceania
  AU: 'oceania',
  PF: 'oceania',
};

export function getContinent(nationality: string): Continent | null {
  return CONTINENT_MAP[nationality] ?? null;
}

export function sameContinent(a: string, b: string): boolean {
  const ca = getContinent(a);
  const cb = getContinent(b);
  return ca !== null && ca === cb;
}
