/**
 * lib/card-static/resolve-player-card-renderer.ts — Sprint 35D.3 (Unique
 * Player Artwork and Card Identity System)
 *
 * Função pura e central — decide se uma carta usa
 * `FullArtworkWorldLegendsCard` (arte exclusiva real) ou o Card Engine
 * procedural (fallback de sempre). Nenhuma tela decide isso sozinha, no
 * JSX — toda tela (dev tool hoje, Pack Reveal/Squad/Collection num
 * futuro de migração) chama a MESMA função, então o critério nunca
 * diverge entre lugares.
 *
 * Fluxo (item 2/7 do brief):
 *   artworkPresetId ausente               → procedural (missing-artwork-preset-id)
 *   preset não existe no manifesto        → procedural (preset-not-found)
 *   preset existe, nenhuma densidade gerada → procedural (artwork-output-not-found)
 *   preset gerado mas productionEligible !== true → procedural (preset-not-production-eligible)
 *   tudo OK                                → full-artwork
 */

import { findPresetById } from './manifest-index';
import type { ManifestPreset } from './resolve-artwork';

export type PlayerCardRendererFallbackReason =
  | 'missing-artwork-preset-id'
  | 'preset-not-found'
  | 'artwork-output-not-found'
  | 'preset-not-production-eligible';

export type PlayerCardRendererResult =
  | { renderer: 'full-artwork'; preset: ManifestPreset }
  | {
      renderer: 'procedural';
      preset?: undefined;
      fallbackReason: PlayerCardRendererFallbackReason;
    };

export type ResolvePlayerCardRendererInput = {
  artworkPresetId?: string | null | undefined;
  cardId: string;
  playerId: string;
  rarity: string;
};

function hasAnyGeneratedOutput(preset: ManifestPreset): boolean {
  return Boolean(
    preset.generated.compact || preset.generated.standard || preset.generated.showcase,
  );
}

export function resolvePlayerCardRenderer(
  input: ResolvePlayerCardRendererInput,
  manifest: readonly ManifestPreset[],
): PlayerCardRendererResult {
  if (!input.artworkPresetId) {
    return { renderer: 'procedural', fallbackReason: 'missing-artwork-preset-id' };
  }

  const preset = findPresetById(manifest, input.artworkPresetId);
  if (!preset) {
    return { renderer: 'procedural', fallbackReason: 'preset-not-found' };
  }

  if (!hasAnyGeneratedOutput(preset)) {
    return { renderer: 'procedural', fallbackReason: 'artwork-output-not-found' };
  }

  if (preset.productionEligible !== true) {
    return { renderer: 'procedural', fallbackReason: 'preset-not-production-eligible' };
  }

  return { renderer: 'full-artwork', preset };
}
