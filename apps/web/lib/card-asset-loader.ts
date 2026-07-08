/**
 * lib/card-asset-loader.ts — Sprint 18.6 (Card Rendering Engine — Pipeline)
 *
 * Carregador único para todo asset de carta (frames, kits, patterns,
 * efeitos, artes). Uma função central (`resolveCardAsset`) lê o manifesto
 * gerado automaticamente (`card-asset-manifest.generated.ts`, produzido por
 * `scripts/generate-card-asset-manifest.mts` via predev/prebuild) e resolve
 * o caminho + os metadados de transform (scale, offset, rotation,
 * blendMode, intensity) de um sidecar `<nome>.json` opcional ao lado da
 * imagem — sem sidecar, usa os valores-padrão (identidade).
 *
 * As funções `resolveFrame`/`resolveKit`/etc. são wrappers finos e tipados
 * em cima do único carregador, um por categoria — cada uma só monta a
 * chave (o nome de arquivo esperado, sem extensão) e delega pra
 * `resolveCardAsset`.
 */
import type { RarityCode } from '@world-legends/types';
import { CARD_ASSET_MANIFEST } from './card-asset-manifest.generated';

export type BlendMode =
  | 'normal'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'soft-light'
  | 'hard-light'
  | 'color-dodge'
  | 'color-burn'
  | 'lighten'
  | 'darken'
  | 'plus-lighter';

export type ResolvedCardAsset = {
  src: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  blendMode: BlendMode;
  /** Opacidade efetiva do asset (0–1). */
  intensity: number;
  /** Desfoque em px aplicado ao asset (Sprint 18.9). */
  blur: number;
  /** Multiplicador de velocidade pra qualquer animação CSS da camada (Sprint 18.9) — 1 = velocidade padrão do preset da raridade, <1 mais rápido, >1 mais lento. */
  animationSpeed: number;
};

type CardAssetKind = keyof typeof CARD_ASSET_MANIFEST;

const DEFAULT_META: Omit<ResolvedCardAsset, 'src'> = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  blendMode: 'normal',
  intensity: 1,
  blur: 0,
  animationSpeed: 1,
};

/** Carregador único — toda camada asset-capable passa por aqui. */
export function resolveCardAsset(kind: CardAssetKind, key: string): ResolvedCardAsset | null {
  const entry = (
    CARD_ASSET_MANIFEST[kind] as Record<
      string,
      { src: string; meta: Partial<ResolvedCardAsset> } | undefined
    >
  )[key];
  if (!entry) return null;
  return { ...DEFAULT_META, ...entry.meta, src: entry.src };
}

// ─── Wrappers por categoria ─────────────────────────────────────────────────

export function resolveFrame(rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('frames', `frame-${rarityCode}`);
}

export function resolveBackground(rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('backgrounds', `bg-${rarityCode}`);
}

export function resolveRarityEffect(rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('effects', `effect-${rarityCode}`);
}

export function resolveGlow(rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('effects', `glow-${rarityCode}`);
}

export function resolveKit(nationality: string, rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('kits', `kit-${nationality}-${rarityCode}`);
}

export function resolvePlayerArt(playerId: string): ResolvedCardAsset | null {
  return resolveCardAsset('player-art', playerId);
}

/**
 * Pattern (Sprint 19) — textura reutilizável associada à seleção (listras,
 * xadrez etc.), pensada pra combinar com Kit. Convenção de chave:
 * `pattern-{nacionalidade}`.
 */
export function resolvePattern(nationality: string): ResolvedCardAsset | null {
  return resolveCardAsset('patterns', `pattern-${nationality}`);
}

/**
 * Pose (Sprint 19) — pose/silhueta completa do jogador, alternativa ao
 * retrato de Player Art. Ainda não existe nenhum asset; a camada cai
 * silenciosamente (fallback null), igual Player Art antes da primeira
 * entrega de arte.
 */
export function resolvePose(playerId: string): ResolvedCardAsset | null {
  return resolveCardAsset('poses', `pose-${playerId}`);
}

/** Layer nova (Sprint 18.7) — reservada para um asset de shine/holo futuro. */
export function resolveShine(rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('shine', `shine-${rarityCode}`);
}

/**
 * Reflection (Sprint 18.9) — feixe de luz físico, oficialmente asset-capable.
 * Compartilha a pasta `effects/` com rarityEffect/glow (mesmo padrão já
 * usado desde a Sprint 18.5: uma pasta, várias chaves por prefixo).
 */
export function resolveReflection(rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('effects', `reflection-${rarityCode}`);
}

/** Ambient Light (Sprint 18.9) — oficialmente asset-capable, mesma pasta `effects/`. */
export function resolveAmbient(rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('effects', `ambient-${rarityCode}`);
}

/** Partículas (Sprint 18.9) — textura de partículas por raridade, mesma pasta `effects/`. */
export function resolveParticles(rarityCode: RarityCode): ResolvedCardAsset | null {
  return resolveCardAsset('effects', `particle-${rarityCode}`);
}

/** Lista em runtime dos valores de `BlendMode` — usada pelo seletor de blend mode do Dev Tool (Sprint 18.9). */
export const ALL_BLEND_MODES: readonly BlendMode[] = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'soft-light',
  'hard-light',
  'color-dodge',
  'color-burn',
  'lighten',
  'darken',
  'plus-lighter',
];

export const ALL_RARITY_CODES: readonly RarityCode[] = [
  'common',
  'rare',
  'elite',
  'legendary',
  'ultra',
  'world_cup_hero',
];
