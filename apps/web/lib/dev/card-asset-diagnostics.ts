/**
 * lib/dev/card-asset-diagnostics.ts — Sprint 18.6.5 (Asset Production Pipeline)
 *
 * Junta o manifesto gerado (o que existe) com o universo esperado (o que
 * deveria existir) e a inspeção de arquivo (resolução/alpha/tamanho) numa
 * única lista de diagnóstico por categoria. Server-only.
 */
import { join } from 'node:path';
import { CARD_ASSET_MANIFEST } from '@/lib/card-asset-manifest.generated';
import {
  ASPECT_RATIO_TOLERANCE,
  CARD_ASPECT_RATIO,
  RECOMMENDED_MIN_WIDTH,
} from './card-asset-constants';
import {
  type ExpectedEntry,
  expectedBackgrounds,
  expectedFrames,
  expectedGlows,
  expectedKits,
  expectedPatterns,
  expectedPlayerArt,
  expectedPoses,
  expectedRarityEffects,
  expectedShine,
} from './card-asset-expectations';
import { bytesToKb, inspectImageFile } from './png-inspect';

export type AssetDiagnostic = {
  key: string;
  label: string;
  found: boolean;
  filename?: string;
  src?: string;
  width?: number;
  height?: number;
  aspectRatioOk?: boolean;
  resolutionOk?: boolean;
  hasAlpha?: boolean;
  sizeKb?: number;
  meta?: Record<string, unknown>;
};

export type CategoryDiagnostics = {
  category: string;
  manifestKind: keyof typeof CARD_ASSET_MANIFEST;
  expectedCount: number;
  foundCount: number;
  assets: AssetDiagnostic[];
};

const PUBLIC_DIR = join(process.cwd(), 'public');

function diagnoseOne(
  key: string,
  label: string,
  manifestKind: keyof typeof CARD_ASSET_MANIFEST,
): AssetDiagnostic {
  const entry = (
    CARD_ASSET_MANIFEST[manifestKind] as Record<
      string,
      { src: string; meta: Record<string, unknown> }
    >
  )[key];

  if (!entry) return { key, label, found: false };

  const inspection = inspectImageFile(join(PUBLIC_DIR, entry.src.replace(/^\//, '')));
  const filename = entry.src.split('/').pop() ?? entry.src;

  if (!inspection) {
    return { key, label, found: true, src: entry.src, filename, meta: entry.meta };
  }

  const ar = inspection.height > 0 ? inspection.width / inspection.height : 0;
  const aspectRatioOk =
    Math.abs(ar - CARD_ASPECT_RATIO) / CARD_ASPECT_RATIO <= ASPECT_RATIO_TOLERANCE;
  const resolutionOk = inspection.width >= RECOMMENDED_MIN_WIDTH;

  return {
    key,
    label,
    found: true,
    src: entry.src,
    filename,
    width: inspection.width,
    height: inspection.height,
    aspectRatioOk,
    resolutionOk,
    hasAlpha: inspection.hasAlpha,
    sizeKb: bytesToKb(inspection.sizeBytes),
    meta: entry.meta,
  };
}

function buildCategory(
  category: string,
  manifestKind: keyof typeof CARD_ASSET_MANIFEST,
  expected: ExpectedEntry[],
): CategoryDiagnostics {
  const assets = expected.map((e) => diagnoseOne(e.key, e.label, manifestKind));
  return {
    category,
    manifestKind,
    expectedCount: expected.length,
    foundCount: assets.filter((a) => a.found).length,
    assets,
  };
}

export function buildAllCardAssetDiagnostics(): CategoryDiagnostics[] {
  return [
    buildCategory('frames', 'frames', expectedFrames()),
    buildCategory('backgrounds', 'backgrounds', expectedBackgrounds()),
    buildCategory('effects (efeito de raridade)', 'effects', expectedRarityEffects()),
    buildCategory('effects (glow)', 'effects', expectedGlows()),
    buildCategory('kits', 'kits', expectedKits()),
    buildCategory('player-art', 'player-art', expectedPlayerArt()),
    buildCategory('poses', 'poses', expectedPoses()),
    buildCategory('patterns', 'patterns', expectedPatterns()),
    buildCategory('shine', 'shine', expectedShine()),
  ];
}
