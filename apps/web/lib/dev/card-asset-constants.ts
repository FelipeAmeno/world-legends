/**
 * lib/dev/card-asset-constants.ts — Sprint 18.6.5 (Asset Production Pipeline)
 *
 * Constantes sem dependência de Node (`fs`/`path`) — seguras para import
 * tanto em Server Components quanto em Client Components. Separado de
 * card-asset-diagnostics.ts (que usa `node:fs`/`node:path` e não pode ser
 * importado do lado client).
 */

export const CARD_ASPECT_RATIO = 148 / 199; // mesma proporção de PlayerCard 'lg' (card-tokens.ts)
export const ASPECT_RATIO_TOLERANCE = 0.03;
export const RECOMMENDED_MIN_WIDTH = 512;
