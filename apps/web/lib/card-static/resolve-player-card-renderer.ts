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
import type { Density, ManifestPreset } from './resolve-artwork';
import { resolveGeneratedArtwork } from './resolve-artwork';

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

/**
 * Sprint 37 — mesma decisão de `resolvePlayerCardRenderer`, mas também
 * confirma que a densidade ESPECÍFICA pedida (Compact/Standard/Showcase)
 * tem asset gerado. `resolvePlayerCardRenderer` sozinho só confirma que
 * ALGUMA densidade existe (`hasAnyGeneratedOutput`) — um preset pode
 * "passar" no full-artwork geral mas não ter, por exemplo, o Showcase
 * gerado ainda. Quem pede uma densidade específica (Collection força
 * Compact, o hero de detalhe usa Standard, o Spotlight usa Showcase)
 * precisa dessa checagem extra pra nunca cair no placeholder interno
 * "artwork não gerado" do `FullArtworkWorldLegendsCard` — cai no
 * procedural de verdade em vez disso. Único lugar onde esse critério
 * combinado existe — `ResolvedWorldLegendsCard` chama só esta função,
 * nunca reimplementa o critério.
 */
export function resolvePlayerCardRendererForDensity(
  input: ResolvePlayerCardRendererInput,
  manifest: readonly ManifestPreset[],
  density: Density,
): PlayerCardRendererResult {
  const base = resolvePlayerCardRenderer(input, manifest);
  if (base.renderer !== 'full-artwork') return base;
  const hasDensityAsset = Boolean(resolveGeneratedArtwork(manifest, base.preset.id, density));
  return hasDensityAsset
    ? base
    : { renderer: 'procedural', fallbackReason: 'artwork-output-not-found' };
}
