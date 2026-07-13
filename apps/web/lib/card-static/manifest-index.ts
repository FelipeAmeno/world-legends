/**
 * lib/card-static/manifest-index.ts — Sprint 36 (Collection Renderer
 * Integration)
 *
 * `CARD_STATIC_MANIFEST` só tem ~11 presets hoje — um `.find()` linear
 * já é rápido o bastante — mas Collection renderiza dezenas de cartas
 * por página, cada uma chamando `resolvePlayerCardRenderer` +
 * `resolveGeneratedArtwork`, cada um fazendo seu PRÓPRIO `.find()`
 * sobre o MESMO array. Esse módulo troca N buscas lineares por N
 * lookups O(1) num `Map` construído uma vez por referência de array
 * (`WeakMap` — nunca é uma segunda fonte de verdade: se o manifesto
 * mudar de referência, ex. num teste com fixture diferente, o índice
 * é reconstruído automaticamente).
 */

export type ManifestPresetLike = { id: string };

const indexCache = new WeakMap<readonly ManifestPresetLike[], Map<string, ManifestPresetLike>>();

function getManifestIndex<T extends ManifestPresetLike>(manifest: readonly T[]): Map<string, T> {
  const cached = indexCache.get(manifest);
  if (cached) return cached as Map<string, T>;
  const index = new Map(manifest.map((preset) => [preset.id, preset] as const));
  indexCache.set(manifest, index);
  return index;
}

/** Substitui `manifest.find((p) => p.id === id)` por um lookup O(1) memoizado por array. */
export function findPresetById<T extends ManifestPresetLike>(
  manifest: readonly T[],
  id: string,
): T | undefined {
  return getManifestIndex(manifest).get(id);
}
