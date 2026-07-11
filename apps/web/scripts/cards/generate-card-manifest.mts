/**
 * scripts/cards/generate-card-manifest.mts — Sprint 35B (Static Card
 * Pipeline Foundation)
 *
 * Varre `public/assets/cards/generated/{compact,standard,showcase}/*.webp`
 * + `metadata/*.json` e gera `lib/card-static/manifest.generated.ts` — o
 * componente `StaticWorldLegendsCard` só CONSOME esse arquivo, nunca lê
 * disco em runtime (mesmo padrão de `generate-card-asset-manifest.mts`
 * já usado pelo Card Engine v2/v3).
 *
 * Uso: node --experimental-strip-types scripts/cards/generate-card-manifest.mts
 */
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GENERATED_DIR, loadPresets } from './_shared.mts';

const OUT_FILE = join(
  import.meta.dirname,
  '..',
  '..',
  'lib',
  'card-static',
  'manifest.generated.ts',
);

function main() {
  const presets = loadPresets();
  const manifest = presets.map((preset) => {
    const densities = (['compact', 'standard', 'showcase'] as const).map((density) => {
      const rel = preset.generated[density];
      if (!rel) return [density, null] as const;
      const abs = join(GENERATED_DIR, rel);
      const exists = existsSync(abs);
      return [
        density,
        exists
          ? { src: `/assets/cards/generated/${rel}`, sizeKB: Math.round(statSync(abs).size / 1024) }
          : null,
      ] as const;
    });

    return {
      id: preset.id,
      rarity: preset.rarity,
      sourceType: preset.sourceType ?? 'layered',
      hudLayout: preset.hudLayout ?? null,
      hudLayouts: preset.hudLayouts ?? null,
      experimental: preset.experimental ?? false,
      productionEligible: preset.productionEligible ?? false,
      frame: preset.frame,
      generated: Object.fromEntries(densities),
    };
  });

  const body = `/**
 * lib/card-static/manifest.generated.ts
 *
 * GERADO AUTOMATICAMENTE por scripts/cards/generate-card-manifest.mts —
 * não editar à mão. Reflete o que existe em public/assets/cards/generated/
 * no momento em que \`pnpm cards:manifest\` (ou \`cards:build\`) rodou por
 * último.
 *
 * Total de presets: ${manifest.length}
 */

export const CARD_STATIC_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;
`;

  writeFileSync(OUT_FILE, body, 'utf-8');
  console.log(`[cards:manifest] manifest gerado com ${manifest.length} preset(s) em ${OUT_FILE}`);
}

main();
