/**
 * lib/card-v3/adapter.ts — Sprint 34 (Official Art Pack Integration)
 *
 * Converte o transform de uma composição v3 (`CardV3Metadata`, schema do
 * brief) pro shape que `ImageLayer` já sabe consumir (`ResolvedCardAsset`,
 * Sprint 18.6) — reaproveita a primitiva existente em vez de duplicar a
 * lógica de scale/offset/rotation/blend/blur.
 */
import type { ResolvedCardAsset } from '../card-asset-loader';
import type { CardV3Metadata } from './types';

export function v3ToResolvedCardAsset(src: string, meta: CardV3Metadata): ResolvedCardAsset {
  return {
    src,
    scale: meta.scale,
    offsetX: meta.offsetX,
    offsetY: meta.offsetY,
    rotation: meta.rotation,
    blendMode: meta.blendMode,
    // ImageLayer só entende um único canal de opacidade — combina os dois
    // conceitos do brief (opacity de composição × intensity do canal).
    intensity: meta.opacity * meta.intensity,
    blur: meta.blur,
    animationSpeed: 1,
  };
}
