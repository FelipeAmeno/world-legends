/**
 * lib/card-static/hud-layout.ts — Sprint 35D (Full Card Artwork Pipeline
 * Reset)
 *
 * "Safe zones" do HUD React — coordenadas em PORCENTAGEM relativa à
 * carta (0-100, `x`/`y` do canto superior-esquerdo da zona, `width`/
 * `height` opcionais quando o campo precisa caber numa caixa
 * específica do artwork, ex.: os boxes de stat desenhados na própria
 * arte). Nunca pixel fixo — o mesmo preset alimenta Compact/Standard/
 * Showcase, tamanhos bem diferentes.
 *
 * Cada preset pode sobrescrever qualquer zona (`CardArtworkPreset.hudLayout`,
 * merge raso) — por isso NENHUM layout é hardcoded de forma universal:
 * o default abaixo é só o ponto de partida pra presets que não
 * desenham suas próprias caixas de HUD na arte.
 */

export type HudZone = { x: number; y: number; width?: number; height?: number };

export type HudFieldsLayout = {
  overall: HudZone;
  position: HudZone;
  name: HudZone;
  country?: HudZone;
  era?: HudZone;
  /** Uma tira única com os 6 stats (layout simples, sem caixas na própria arte). */
  stats?: HudZone;
  /** Alternativa a `stats` — 3 stats numa linha, 3 na outra (layout com caixas desenhadas na arte, ex. wl-goat-brazil-001). */
  statsTop?: HudZone;
  statsBottom?: HudZone;
  trait?: HudZone;
};

/**
 * Default — usado quando o preset não define `hudLayout` nenhum (ex.:
 * a arte não tem caixas próprias desenhadas). Progressão de densidade
 * igual à do resto do produto: Compact é minimalista (sem stats),
 * Standard soma a tira de stats, Showcase soma o trait.
 */
export const DEFAULT_HUD_LAYOUT: HudFieldsLayout = {
  overall: { x: 12, y: 6, width: 20, height: 10 },
  position: { x: 12, y: 16, width: 20, height: 6 },
  name: { x: 50, y: 88, width: 80, height: 8 },
  country: { x: 10, y: 88, width: 10, height: 6 },
  era: { x: 90, y: 88, width: 10, height: 6 },
  stats: { x: 50, y: 80, width: 90, height: 6 },
};

/** Merge raso — um preset pode sobrescrever só um campo (ex.: `name.y`) sem precisar redeclarar o resto. */
export function resolveHudLayout(override: Partial<HudFieldsLayout> | undefined | null): HudFieldsLayout {
  if (!override) return DEFAULT_HUD_LAYOUT;
  return { ...DEFAULT_HUD_LAYOUT, ...override };
}
