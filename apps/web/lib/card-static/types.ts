/**
 * lib/card-static/types.ts — Sprint 35B (Static Card Pipeline Foundation)
 *
 * Schema de um `CardArtworkPreset` — exatamente o shape do exemplo do
 * brief. Cada preset é um JSON em `public/assets/cards/metadata/<id>.json`,
 * lido pelos scripts em `scripts/cards/`. `source` referencia arquivos em
 * `public/assets/cards/source/<canal>/`; `generated` é preenchido pelo
 * PRÓPRIO script de build depois de compor (nunca escrito à mão).
 */

export type CardArtworkRarity = 'common' | 'rare' | 'elite' | 'legendary' | 'goat';

export type CardArtworkSource = {
  background: string | null;
  player: string | null;
  light: string | null;
  particles: string | null;
};

export type CardArtworkComposition = {
  playerScale: number;
  playerOffsetX: number;
  playerOffsetY: number;
};

export type CardArtworkGenerated = {
  compact: string | null;
  standard: string | null;
  showcase: string | null;
};

export type CardArtworkPreset = {
  id: string;
  rarity: CardArtworkRarity;
  source: CardArtworkSource;
  composition: CardArtworkComposition;
  /** Preenchido pelo script de build (`build-card-artworks.ts`) — `null` até a primeira geração. */
  generated: CardArtworkGenerated;
  /** SVG/imagem de moldura — `null` quando nenhuma moldura real existe ainda (cai no CSS `.card-frame-*` do Card Engine atual). */
  frame: string | null;
};

export const DEFAULT_COMPOSITION: CardArtworkComposition = {
  playerScale: 1,
  playerOffsetX: 0,
  playerOffsetY: 0,
};

/** Resoluções de saída por densidade (item 7 do brief). */
export const ARTWORK_DIMENSIONS: Record<
  'compact' | 'standard' | 'showcase',
  { width: number; height: number }
> = {
  compact: { width: 400, height: 600 },
  standard: { width: 800, height: 1200 },
  showcase: { width: 1200, height: 1800 },
};

/** Metas de peso em KB — só gera warning se ultrapassar, nunca falha o build (item 8). */
export const ARTWORK_WEIGHT_TARGETS_KB: Record<'compact' | 'standard' | 'showcase', number> = {
  compact: 80,
  standard: 180,
  showcase: 350,
};
