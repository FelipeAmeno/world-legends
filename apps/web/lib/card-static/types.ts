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
import type { Density, HudFieldsLayout, HudZone } from './hud-layout';

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

/**
 * Sprint 42B (Artwork Schema V2 Contract) — versão do CONTRATO de arte,
 * não da imagem em si (`version?: number` abaixo já existia e é outra
 * coisa — metadata livre não usada pelo pipeline). `artworkSchemaVersion`
 * ausente = 1 (nenhum preset V1 existente precisa ser editado). Só
 * presets NOVOS, desenhados sem os 6 boxes de atributo e com
 * `safeZones` formal, declaram `artworkSchemaVersion: 2` explicitamente.
 * Nenhum outro valor é válido — `resolveArtworkSchemaVersion` (mesmo
 * arquivo) e a validação de `cards:validate` tratam qualquer coisa fora
 * de `1 | 2` como erro, nunca como um V3 silencioso ou um V1 assumido.
 */
export type ArtworkSchemaVersion = 1 | 2;

/**
 * Zona normalizada em porcentagem (0-100) da carta — MESMA convenção de
 * `HudZone` (x/y = centro da zona, não canto superior-esquerdo) pra não
 * duplicar um segundo sistema de coordenadas. Diferente de `HudZone`,
 * aqui `width`/`height` são OBRIGATÓRIOS: uma safe zone sem dimensão
 * não tem como ser validada (zero-size zone é erro, não um "campo sem
 * largura própria" como em HudZone).
 */
export type ArtworkSafeZone = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Contrato de safe zones do Artwork Schema V2 — reservado só pra ONDE a
 * arte não pode ter texto/luz forte o bastante pra atrapalhar o HUD
 * React por cima (OVR/posição no canto superior-esquerdo, nome/apelido
 * embaixo). Isso é um contrato de AUTORIA/VALIDAÇÃO da imagem-fonte —
 * não alimenta `hudLayout`/`hudLayouts` (que continuam sendo o que
 * `FullArtworkWorldLegendsCard` lê em runtime pra posicionar o HUD).
 * Os dois sistemas descrevem "zonas" com o mesmo formato de propósito,
 * mas resolvem problemas diferentes — nunca foram unificados num só
 * porque um é sobre a ARTE (essa carta tem espaço aqui?) e o outro é
 * sobre o HUD (esse texto vai aqui). Ver docs/design/05-artwork-schema-v2.md.
 */
export type ArtworkSafeZones = {
  upperLeftHudZone: ArtworkSafeZone;
  lowerIdentityZone: ArtworkSafeZone;
  /** Só exigido se a UI de produção atual realmente precisar (hoje: não). */
  countryOrTraitZone?: ArtworkSafeZone;
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
  /** Legado (Sprint 35D) — sobrescreve zonas pras 3 densidades igualmente. Preferir `hudLayouts`. */
  hudLayout?: Partial<HudFieldsLayout> | null;
  /** Sprint 35D.3 — sobrescreve zonas POR densidade (`compact`/`standard`/`showcase`), cada uma com seu próprio `fontScale`/`align`/`visible`. Formato preferido pra presets novos. */
  hudLayouts?: Partial<Record<Density, Partial<HudFieldsLayout>>> | null;
  /** Sprint 35D.3 — marcador informativo de preset em rascunho/teste; não usado pelo resolver hoje (reservado). */
  experimental?: boolean;
  /** Sprint 35D.3 — só presets com `productionEligible === true` podem ser escolhidos pelo `resolvePlayerCardRenderer`; ausente/`false` cai no fallback procedural com warning (dev-only). */
  productionEligible?: boolean;
  /** Metadata livre não usada pelo pipeline (ex.: `version`) — presets reais podem trazer campos extras. */
  version?: number;
  /** Sprint 42B — ausente = 1. Ver `ArtworkSchemaVersion` acima. */
  artworkSchemaVersion?: ArtworkSchemaVersion;
  /** Sprint 42B — só obrigatório quando `artworkSchemaVersion === 2`. */
  safeZones?: ArtworkSafeZones | null;
  generated: CardArtworkGenerated;
  frame: string | null;
};

/** Ausência de `artworkSchemaVersion` sempre resolve como V1 — nunca inferido de raridade, pasta, dimensão ou presença de stat boxes. */
export function resolveArtworkSchemaVersion(
  preset: Pick<CardArtworkPreset, 'artworkSchemaVersion'> | null | undefined,
): ArtworkSchemaVersion {
  return preset?.artworkSchemaVersion ?? 1;
}

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
