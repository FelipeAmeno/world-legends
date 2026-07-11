/**
 * lib/card-static/resolve-artwork.ts — Sprint 35D (Full Card Artwork
 * Pipeline Reset)
 *
 * Função pura de lookup no manifesto gerado — extraída à parte pra ser
 * testável sem precisar montar o componente React (`FullArtworkWorldLegendsCard`
 * só CONSOME o resultado, nunca reimplementa a busca).
 */

export type GeneratedEntry = { src: string; sizeKB: number } | null;

export type ManifestPreset = {
  id: string;
  generated: { compact: GeneratedEntry; standard: GeneratedEntry; showcase: GeneratedEntry };
  hudLayout?: unknown;
  hudLayouts?: unknown;
  /** Sprint 35D.3 — só presets elegíveis podem ser escolhidos em produção pelo resolver. */
  productionEligible?: boolean;
};

export type Density = 'compact' | 'standard' | 'showcase';

/**
 * `null` cobre os dois casos de "artwork ausente" do brief: preset não
 * existe no manifesto (id errado/removido) OU existe mas aquela
 * densidade específica nunca foi gerada (`cards:build` não rodou ainda
 * pra esse tamanho). O consumidor (componente) trata os dois IGUAL —
 * mostra o fallback — porque pro usuário final a diferença não importa.
 */
export function resolveGeneratedArtwork(
  manifest: readonly ManifestPreset[],
  presetId: string,
  density: Density,
): GeneratedEntry {
  const preset = manifest.find((p) => p.id === presetId);
  if (!preset) return null;
  return preset.generated[density];
}
