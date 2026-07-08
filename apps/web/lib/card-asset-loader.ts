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
  | 'darken';

export type ResolvedCardAsset = {
  src: string;
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  blendMode: BlendMode;
  /** Opacidade efetiva do asset (0–1). */
  intensity: number;
};

type CardAssetKind = keyof typeof CARD_ASSET_MANIFEST;

const DEFAULT_META: Omit<ResolvedCardAsset, 'src'> = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  blendMode: 'normal',
  intensity: 1,
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

export function resolvePattern(patternKey: string): ResolvedCardAsset | null {
  return resolveCardAsset('patterns', patternKey);
}

export const ALL_RARITY_CODES: readonly RarityCode[] = [
  'common',
  'rare',
  'elite',
  'legendary',
  'ultra',
  'world_cup_hero',
];
