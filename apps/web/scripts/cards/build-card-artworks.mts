/**
 * scripts/cards/build-card-artworks.mts — Sprint 35B (Static Card Pipeline
 * Foundation)
 *
 * Compõe background + player + light + particles (Sharp, offline/
 * build-time) em 3 tamanhos WebP por preset. A composição só aplica o
 * transform que o PRÓPRIO preset pede (scale/offset do player) — nunca
 * um filtro artístico não pedido. Nunca escreve em `source/` (só lê de
 * lá); escreve em `generated/<densidade>/` e atualiza o campo
 * `generated` do preset (não os campos `source`).
 *
 * Uso: node --experimental-strip-types scripts/cards/build-card-artworks.mts
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  CHANNEL_DIR,
  DIMENSIONS,
  GENERATED_DIR,
  METADATA_DIR,
  loadPresets,
  sourcePath,
} from './_shared.mts';
import type { CardArtworkPreset } from './_shared.mts';

type Density = keyof typeof DIMENSIONS;

// Sprint 33 já estabeleceu a proporção "arte ocupa ~88% da largura,
// ancorada embaixo" pro Card Engine procedural — a composição estática
// reaproveita a MESMA proporção, não inventa uma nova (item "não
// alterar composição visual" do brief).
const PLAYER_WIDTH_RATIO = 0.88;

async function buildDensity(
  preset: CardArtworkPreset,
  density: Density,
): Promise<{ outPath: string; sizeKB: number }> {
  const { width, height } = DIMENSIONS[density];
  const outDir = join(GENERATED_DIR, density);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${preset.id}.webp`);

  // Base: background real (cover) ou gradiente escuro liso — nunca fica
  // sem conteúdo, mesmo sem asset real (mesma garantia do motor React).
  let base = preset.source.background
    ? sharp(sourcePath(CHANNEL_DIR.background, preset.source.background)).resize(width, height, {
        fit: 'cover',
      })
    : sharp({
        create: { width, height, channels: 3, background: { r: 12, g: 13, b: 20 } },
      });

  const composites: sharp.OverlayOptions[] = [];

  if (preset.source.player) {
    const playerTargetWidth = Math.round(
      width * PLAYER_WIDTH_RATIO * preset.composition.playerScale,
    );
    const playerBuffer = await sharp(sourcePath(CHANNEL_DIR.player, preset.source.player))
      .resize({ width: playerTargetWidth, fit: 'inside', withoutEnlargement: false })
      .toBuffer();
    const playerMeta = await sharp(playerBuffer).metadata();
    const left = Math.round(
      (width - (playerMeta.width ?? playerTargetWidth)) / 2 + preset.composition.playerOffsetX,
    );
    // Ancorado embaixo, mesma lógica de `object-bottom` do Card Engine.
    const top = Math.round(
      height - (playerMeta.height ?? 0) - height * 0.03 + preset.composition.playerOffsetY,
    );
    composites.push({ input: playerBuffer, left, top });
  }

  if (preset.source.light) {
    const lightBuffer = await sharp(sourcePath(CHANNEL_DIR.light, preset.source.light))
      .resize(width, height, { fit: 'cover' })
      .toBuffer();
    composites.push({ input: lightBuffer, blend: 'screen' });
  }

  if (preset.source.particles) {
    const particlesBuffer = await sharp(sourcePath(CHANNEL_DIR.particles, preset.source.particles))
      .resize(width, height, { fit: 'cover' })
      .toBuffer();
    composites.push({ input: particlesBuffer, blend: 'screen' });
  }

  if (composites.length > 0) base = base.composite(composites);

  await base.webp({ quality: 82 }).toFile(outPath);
  const sizeKB = Math.round(statSync(outPath).size / 1024);
  return { outPath, sizeKB };
}

async function main() {
  const presets = loadPresets();
  if (presets.length === 0) {
    console.log('[cards:build] nenhum preset encontrado em public/assets/cards/metadata/');
    return;
  }

  for (const preset of presets) {
    console.log(`[cards:build] ${preset.id} (${preset.rarity})`);
    const generated: CardArtworkPreset['generated'] = {
      compact: null,
      standard: null,
      showcase: null,
    };

    for (const density of Object.keys(DIMENSIONS) as Density[]) {
      const { outPath, sizeKB } = await buildDensity(preset, density);
      const relPath = `${density}/${preset.id}.webp`;
      generated[density] = relPath;

      const targetKB = { compact: 80, standard: 180, showcase: 350 }[density];
      const status = sizeKB > targetKB ? '⚠' : '✓';
      console.log(`  ${status} ${density}: ${sizeKB}KB (alvo ${targetKB}KB) → ${outPath}`);
      if (sizeKB > targetKB) {
        console.warn(
          `  ⚠ [${preset.id}] ${density} passou do peso-alvo (${sizeKB}KB > ${targetKB}KB) — build continua, não falha por isso`,
        );
      }
    }

    // Atualiza SÓ o campo `generated` do preset — nunca `source`.
    const updated: CardArtworkPreset = { ...preset, generated };
    const presetPath = join(METADATA_DIR, `${preset.id}.json`);
    if (!existsSync(presetPath)) continue;
    writeFileSync(presetPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8');
  }

  console.log(`[cards:build] ${presets.length} preset(s) processado(s)`);
}

main();
