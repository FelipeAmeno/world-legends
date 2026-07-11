/**
 * lib/card-static/types.ts — Sprint 35B (Static Card Pipeline Foundation)
 * + Sprint 35D (Full Card Artwork Pipeline Reset)
 *
 * Schema de um `CardArtworkPreset` — exatamente o shape do exemplo do
 * brief. Cada preset é um JSON em `public/assets/cards/metadata/<id>.json`,
 * lido pelos scripts em `scripts/cards/`. `source` referencia arquivos em
 * `public/assets/cards/source/<canal>/`; `generated` é preenchido pelo
 * PRÓPRIO script de build depois de compor (nunca escrito à mão).
 *
 * Sprint 35D — a estratégia de montar a carta com player/background/
 * frame/light/particles separados (Sprint 35B) foi REJEITADA pelo
 * product owner: a arte aprovada é uma composição artística unificada
 * (`sourceType: 'full-card-artwork'`), uma única imagem já com jogador+
 * frame+background+luz+material+efeitos+textura — só sem nenhum texto
 * dinâmico (isso continua sendo HUD React por cima). O pipeline de
 * layers antigo (`sourceType: 'layered'`, o default quando o campo
 * está ausente — nenhum preset antigo quebra) NÃO foi apagado, os dois
 * `sourceType` coexistem no mesmo schema.
 */
import type { HudFieldsLayout, HudZone } from './hud-layout';

export type { HudZone };

export type CardArtworkRarity =
  | 'common'
  | 'rare'
  | 'elite'
  | 'legendary'
  | 'ultra'
  | 'world-cup-hero'
  | 'goat';

export type CardArtworkSourceType = 'layered' | 'full-card-artwork';

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
  /** Ausente = `'layered'` (default, compatível com todo preset da Sprint 35B). */
  sourceType?: CardArtworkSourceType;
  /** Só usado quando `sourceType === 'layered'`. */
  source: CardArtworkSource;
  /** Só usado quando `sourceType === 'layered'`. */
  composition: CardArtworkComposition;
  /** Só usado quando `sourceType === 'full-card-artwork'` — filename em `source/artworks/<rarity>/`. */
  artwork?: string | null;
  /** Só usado quando `sourceType === 'full-card-artwork'` — sobrescreve zonas específicas do `DEFAULT_HUD_LAYOUT` (merge raso, percentuais únicos pras 3 densidades — ver `hud-layout.ts`). */
  hudLayout?: Partial<HudFieldsLayout> | null;
  /** Metadata livre não usada pelo pipeline (ex.: `version`) — presets reais podem trazer campos extras. */
  version?: number;
  generated: CardArtworkGenerated;
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
