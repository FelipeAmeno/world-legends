/**
 * lib/card-static/hud-layout.ts — Sprint 35D (Full Card Artwork Pipeline
 * Reset) + Sprint 35D.3 (Unique Player Artwork and Card Identity System)
 *
 * "Safe zones" do HUD React — coordenadas em PORCENTAGEM relativa à
 * carta (0-100, `x`/`y` do CENTRO da zona, `width`/`height` opcionais
 * quando o campo precisa caber numa caixa específica do artwork, ex.:
 * os boxes de stat desenhados na própria arte). Nunca pixel fixo — o
 * mesmo preset alimenta Compact/Standard/Showcase.
 *
 * Sprint 35D.3 — dois formatos de preset coexistem:
 *
 *   `hudLayout` (legado, Sprint 35D — flat, uma zona por campo, usada
 *   em TODAS as densidades igualmente, ex.: `wl-goat-brazil-001.json`).
 *
 *   `hudLayouts` (novo, Sprint 35D.3 — POR densidade, cada zona também
 *   carrega `fontScale`/`align`/`visible`, ex.:
 *   `wl-legendary-ronaldinho-001.json`). É o formato daqui pra frente.
 *
 * Cada preset pode sobrescrever qualquer zona (merge raso) — por isso
 * NENHUM layout é hardcoded de forma universal: o default abaixo é só
 * o ponto de partida pra presets que não desenham suas próprias caixas
 * de HUD na arte.
 */

export type HudAlign = 'left' | 'center' | 'right';

export type HudZone = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  /** Multiplicador sobre o font-size base do campo — 1 = tamanho padrão. */
  fontScale?: number;
  align?: HudAlign;
  /** `false` esconde o campo mesmo que a zona exista (ex.: nickname em Compact). Ausente = visível. */
  visible?: boolean;
};

export type HudFieldsLayout = {
  overall: HudZone;
  position: HudZone;
  name: HudZone;
  /** Sprint 35D.3 — apelido/título, sempre do dado (`card.nickname`), nunca da arte. */
  nickname?: HudZone;
  country?: HudZone;
  era?: HudZone;
  /** Uma tira única com os 6 stats (layout simples, sem caixas na própria arte). */
  stats?: HudZone;
  /** Alternativa a `stats` — 3 stats numa linha, 3 na outra (layout com caixas desenhadas na arte). */
  statsTop?: HudZone;
  statsBottom?: HudZone;
  trait?: HudZone;
};

export type Density = 'compact' | 'standard' | 'showcase';

/**
 * Default — usado quando o preset não define `hudLayout`/`hudLayouts`
 * nenhum (ex.: a arte não tem caixas próprias desenhadas). Mesma
 * progressão de densidade do resto do produto: Compact é minimalista
 * (sem stats/nickname), Standard soma a tira de stats + nickname
 * opcional, Showcase soma o trait.
 */
const DEFAULT_HUD_FIELDS: HudFieldsLayout = {
  overall: { x: 12, y: 6, width: 20, height: 10 },
  position: { x: 12, y: 16, width: 20, height: 6 },
  name: { x: 50, y: 82, width: 80, height: 8 },
  nickname: { x: 50, y: 88, width: 80, height: 5, fontScale: 0.6 },
  country: { x: 10, y: 86, width: 10, height: 6 },
  era: { x: 90, y: 86, width: 10, height: 6 },
  stats: { x: 50, y: 78, width: 90, height: 6 },
};

const { stats: _standardStats, trait: _standardTrait, ...COMPACT_BASE } = DEFAULT_HUD_FIELDS;

export const DEFAULT_HUD_LAYOUT: Record<Density, HudFieldsLayout> = {
  compact: {
    ...COMPACT_BASE,
    nickname: { ...(DEFAULT_HUD_FIELDS.nickname as HudZone), visible: false },
  },
  standard: DEFAULT_HUD_FIELDS,
  showcase: { ...DEFAULT_HUD_FIELDS, trait: { x: 50, y: 70, width: 60, height: 5 } },
};

/** Formato bruto de um preset — aceita as duas convenções (ver cabeçalho do arquivo). */
export type HudLayoutPresetInput = {
  hudLayout?: Partial<HudFieldsLayout> | null;
  hudLayouts?: Partial<Record<Density, Partial<HudFieldsLayout>>> | null;
};

/**
 * Resolve o layout de HUD pra uma densidade específica. Prioridade:
 * 1. `hudLayouts[density]` (novo formato, por densidade) — merge sobre o default DAQUELA densidade.
 * 2. `hudLayout` (legado, flat) — mesma zona pras 3 densidades, merge sobre o default Standard.
 * 3. Nenhum dos dois — `DEFAULT_HUD_LAYOUT[density]` puro.
 */
export function resolveHudLayout(
  preset: HudLayoutPresetInput | null | undefined,
  density: Density,
): HudFieldsLayout {
  const base = DEFAULT_HUD_LAYOUT[density];
  if (!preset) return base;

  if (preset.hudLayouts?.[density]) {
    return mergeZones(base, preset.hudLayouts[density] as Partial<HudFieldsLayout>);
  }
  if (preset.hudLayout) {
    return mergeZones(base, preset.hudLayout);
  }
  return base;
}

function mergeZones(base: HudFieldsLayout, override: Partial<HudFieldsLayout>): HudFieldsLayout {
  const result = { ...base } as HudFieldsLayout;
  for (const key of Object.keys(override) as Array<keyof HudFieldsLayout>) {
    const zone = override[key];
    if (zone) result[key] = zone as HudZone;
  }
  return result;
}

/** Um campo é exibido quando a zona existe E `visible` não é explicitamente `false`. */
export function isZoneVisible(zone: HudZone | undefined): zone is HudZone {
  return Boolean(zone) && zone?.visible !== false;
}
