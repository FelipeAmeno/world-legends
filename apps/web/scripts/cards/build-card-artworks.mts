/**
 * scripts/cards/build-card-artworks.mts — Sprint 35B (Static Card Pipeline
 * Foundation) + Sprint 35D (Full Card Artwork Pipeline Reset)
 *
 * Compõe artworks de carta em 3 tamanhos WebP por preset. Dois modos,
 * nunca misturados:
 *
 *   sourceType 'layered' (Sprint 35B, preservado) — background + player
 *   + light + particles compostos com Sharp a partir de canais
 *   separados.
 *
 *   sourceType 'full-card-artwork' (Sprint 35D, NOVO) — uma imagem
 *   ÚNICA já pronta (jogador+frame+background+luz+material+efeitos),
 *   só redimensionada pras 3 densidades — nenhuma composição, nenhum
 *   filtro, nenhuma correção de cor. "Preservar visual" é literal: o
 *   único processamento é resize + reencode WebP.
 *
 * Nunca escreve em `source/` (só lê de lá); escreve em
 * `generated/<densidade>/` e atualiza o campo `generated` do preset.
 *
 * Uso: node --experimental-strip-types scripts/cards/build-card-artworks.mts [--force]
 */
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import {
  CHANNEL_DIR,
  DIMENSIONS,
  GENERATED_DIR,
  METADATA_DIR,
  artworkPath,
  loadPresets,
  sourcePath,
} from './_shared.mts';
import type { CardArtworkPreset } from './_shared.mts';

type Density = keyof typeof DIMENSIONS;

// --force é aceito por compatibilidade com o comando do brief
// (`pnpm cards:build --force`) — o script já regenera tudo
// incondicionalmente a cada execução (nunca pula por cache), então a
// flag não muda comportamento, só é reconhecida em vez de dar erro de
// argumento desconhecido.
const FORCE = process.argv.includes('--force');

// Sprint 33 já estabeleceu a proporção "arte ocupa ~88% da largura,
// ancorada embaixo" pro Card Engine procedural — a composição LAYERED
// reaproveita a MESMA proporção, não inventa uma nova.
const PLAYER_WIDTH_RATIO = 0.88;

async function buildLayeredDensity(
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

/**
 * Sprint 35D — full-card-artwork: resize puro (`fit: 'cover'`, sem
 * composite, sem filtro, sem correção de cor), reencode WebP. É
 * deliberadamente a função mais simples deste arquivo — qualquer
 * processamento a mais violaria "preservar visual" / "não aplicar
 * filtros artísticos" do brief.
 */
async function buildFullArtworkDensity(
  preset: CardArtworkPreset,
  density: Density,
): Promise<{ outPath: string; sizeKB: number }> {
  if (!preset.artwork)
    throw new Error(`[${preset.id}] sourceType full-card-artwork sem campo "artwork"`);
  const { width, height } = DIMENSIONS[density];
  const outDir = join(GENERATED_DIR, density);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, `${preset.id}.webp`);

  await sharp(artworkPath(preset.rarity, preset.artwork))
    .resize(width, height, { fit: 'cover' })
    .webp({ quality: 90 }) // qualidade mais alta que o layered — é a ÚNICA imagem da carta, sem camadas extras compensando
    .toFile(outPath);

  const sizeKB = Math.round(statSync(outPath).size / 1024);
  return { outPath, sizeKB };
}

async function main() {
  const presets = loadPresets();
  if (presets.length === 0) {
    console.log('[cards:build] nenhum preset encontrado em public/assets/cards/metadata/');
    return;
  }
  if (FORCE) console.log('[cards:build] --force reconhecido (build já é sempre incondicional)');

  for (const preset of presets) {
    const sourceType = preset.sourceType ?? 'layered';
    console.log(`[cards:build] ${preset.id} (${preset.rarity}, ${sourceType})`);

    if (sourceType === 'full-card-artwork' && !preset.artwork) {
      console.error(
        `  ✗ [${preset.id}] sourceType full-card-artwork mas campo "artwork" ausente — pulando`,
      );
      continue;
    }
    if (sourceType === 'full-card-artwork' && preset.artwork) {
      const path = artworkPath(preset.rarity, preset.artwork);
      if (!existsSync(path)) {
        console.error(`  ✗ [${preset.id}] artwork não encontrado em ${path} — pulando`);
        continue;
      }
    }

    const generated: CardArtworkPreset['generated'] = {
      compact: null,
      standard: null,
      showcase: null,
    };

    for (const density of Object.keys(DIMENSIONS) as Density[]) {
      const { outPath, sizeKB } =
        sourceType === 'full-card-artwork'
          ? await buildFullArtworkDensity(preset, density)
          : await buildLayeredDensity(preset, density);
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

    // Atualiza SÓ o campo `generated` do preset — nunca `source`/`artwork`.
    const updated: CardArtworkPreset = { ...preset, generated };
    const presetPath = join(METADATA_DIR, `${preset.id}.json`);
    if (!existsSync(presetPath)) continue;
    writeFileSync(presetPath, `${JSON.stringify(updated, null, 2)}\n`, 'utf-8');
  }

  console.log(`[cards:build] ${presets.length} preset(s) processado(s)`);
}

main();
