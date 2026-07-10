/**
 * scripts/generate-card-asset-manifest.mts — Sprint 18.6 (Card Rendering Engine — Pipeline)
 *
 * Varre public/assets/cards/{backgrounds,effects,frames,poses,scenes,
 * shine} e gera lib/card-asset-manifest.generated.ts com a lista de
 * assets que realmente existem em disco, mais os metadados de transform
 * (scale, offset, rotation, blendMode, intensity) lidos de um sidecar
 * opcional `<nome>.json` ao lado de cada imagem.
 *
 * `kits`/`patterns`/`player-art` — removidos na Sprint 26 (Card Engine
 * 2.0 — Legacy Removal). As 3 pastas nunca receberam nenhum asset real
 * (só `.gitkeep`) — o sistema que consumiria esses assets (camisa/
 * retrato/textura da seleção) foi banido de vez em favor da Scene
 * procedural (`lib/procedural-scene/`, Sprint 27).
 *
 * Roda automaticamente via `predev`/`prebuild` (package.json) — ninguém
 * precisa lembrar de rodar isso à mão depois de soltar uma arte nova.
 *
 * Uso manual: node --experimental-strip-types scripts/generate-card-asset-manifest.mts
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CATEGORIES = ['backgrounds', 'effects', 'frames', 'poses', 'scenes', 'shine'] as const;
type Category = (typeof CATEGORIES)[number];

// Sprint 34 (Official Art Pack Integration) — árvore paralela e mais
// granular que `CATEGORIES` acima: em vez de um Scene/Pose único (uma
// imagem inteira por jogador), decompõe a composição nos MESMOS canais
// que o motor procedural já usa (Background/Light/Pattern/Player/
// Particles/Frame, Sprint 27/28) — permite substituir só uma parte por
// arte real (ex.: background de verdade + resto continua procedural)
// em vez de tudo-ou-nada. Ver `CARD_V3_ASSET_SPEC.md`.
const V3_ASSET_CATEGORIES = [
  'backgrounds',
  'players',
  'patterns',
  'lights',
  'particles',
  'frames',
] as const;
type V3AssetCategory = (typeof V3_ASSET_CATEGORIES)[number];

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

const ASSETS_DIR = join(import.meta.dirname, '..', 'public', 'assets', 'cards');
const V3_ASSETS_DIR = join(ASSETS_DIR, 'v3');
const OUT_FILE = join(import.meta.dirname, '..', 'lib', 'card-asset-manifest.generated.ts');
const V3_OUT_FILE = join(import.meta.dirname, '..', 'lib', 'card-v3', 'manifest.generated.ts');

type ManifestMeta = Partial<{
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  blendMode: string;
  intensity: number;
}>;

type ManifestEntry = { src: string; meta: ManifestMeta };

function extOf(filename: string): string {
  const i = filename.lastIndexOf('.');
  return i === -1 ? '' : filename.slice(i).toLowerCase();
}

function stemOf(filename: string): string {
  const i = filename.lastIndexOf('.');
  return i === -1 ? filename : filename.slice(0, i);
}

function readSidecarMeta(dir: string, stem: string): ManifestMeta {
  const jsonPath = join(dir, `${stem}.json`);
  try {
    const raw = readFileSync(jsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object') return parsed as ManifestMeta;
  } catch {
    // sem sidecar, ou JSON inválido — segue sem metadados customizados
  }
  return {};
}

function scanCategory(category: Category, baseDir = ASSETS_DIR): Record<string, ManifestEntry> {
  const dir = join(baseDir, category);
  let files: string[] = [];
  try {
    files = readdirSync(dir);
  } catch {
    return {};
  }

  const entries: Record<string, ManifestEntry> = {};
  for (const filename of files) {
    if (!IMAGE_EXT.has(extOf(filename))) continue;
    const stem = stemOf(filename);
    const prefix = baseDir === V3_ASSETS_DIR ? '/assets/cards/v3/' : '/assets/cards/';
    entries[stem] = {
      src: `${prefix}${category}/${filename}`,
      meta: readSidecarMeta(dir, stem),
    };
  }
  return entries;
}

/**
 * Sprint 34 — composições v3 são descritas por um JSON em
 * `v3/metadata/<id>.json` que referencia explicitamente o asset de cada
 * canal (backgroundId/playerId/patternId/lightId/particlesId/frameId) mais
 * o transform compartilhado (scale/offset/rotation/opacity/blendMode/
 * blur/intensity/parallaxDepth) — nunca por convenção de nome de arquivo
 * (frágil), sempre por referência explícita. Ver `CARD_V3_ASSET_SPEC.md`.
 */
function scanV3Compositions(): Record<string, unknown> {
  const dir = join(V3_ASSETS_DIR, 'metadata');
  let files: string[] = [];
  try {
    files = readdirSync(dir);
  } catch {
    return {};
  }

  const compositions: Record<string, unknown> = {};
  for (const filename of files) {
    if (extOf(filename) !== '.json') continue;
    const stem = stemOf(filename);
    try {
      compositions[stem] = JSON.parse(readFileSync(join(dir, filename), 'utf-8'));
    } catch {
      // JSON inválido — composição ignorada, resolver cai pro procedural
    }
  }
  return compositions;
}

function main(): void {
  const manifest = Object.fromEntries(
    CATEGORIES.map((category) => [category, scanCategory(category)]),
  );

  const totalAssets = Object.values(manifest).reduce(
    (sum, entries) => sum + Object.keys(entries as object).length,
    0,
  );

  const body = `/**
 * lib/card-asset-manifest.generated.ts
 *
 * GERADO AUTOMATICAMENTE por scripts/generate-card-asset-manifest.mts — não
 * editar à mão. Reflete o que existe em public/assets/cards/ no momento em
 * que \`pnpm dev\` ou \`pnpm build\` rodou por último (predev/prebuild).
 *
 * Total de assets encontrados: ${totalAssets}
 */

export const CARD_ASSET_MANIFEST = ${JSON.stringify(manifest, null, 2)} as const;
`;

  const v3Assets = Object.fromEntries(
    V3_ASSET_CATEGORIES.map((category) => [category, scanCategory(category, V3_ASSETS_DIR)]),
  );
  const v3Compositions = scanV3Compositions();
  const v3TotalAssets = Object.values(v3Assets).reduce(
    (sum, entries) => sum + Object.keys(entries as object).length,
    0,
  );

  const v3Body = `/**
 * lib/card-v3/manifest.generated.ts — Sprint 34 (Official Art Pack Integration)
 *
 * GERADO AUTOMATICAMENTE por scripts/generate-card-asset-manifest.mts — não
 * editar à mão. Reflete o que existe em public/assets/cards/v3/ no momento
 * em que \`pnpm dev\` ou \`pnpm build\` rodou por último (predev/prebuild).
 *
 * Total de assets v3 encontrados: ${v3TotalAssets}
 * Total de composições v3 encontradas: ${Object.keys(v3Compositions).length}
 */

export const CARD_V3_ASSET_MANIFEST = ${JSON.stringify(v3Assets, null, 2)} as const;

export const CARD_V3_COMPOSITIONS = ${JSON.stringify(v3Compositions, null, 2)} as const;
`;

  writeFileSync(OUT_FILE, body, 'utf-8');
  mkdirSync(join(import.meta.dirname, '..', 'lib', 'card-v3'), { recursive: true });
  writeFileSync(V3_OUT_FILE, v3Body, 'utf-8');

  try {
    execFileSync('pnpm', ['exec', 'biome', 'format', '--write', OUT_FILE, V3_OUT_FILE], {
      cwd: join(import.meta.dirname, '..'),
      stdio: 'ignore',
    });
  } catch {
    // biome pode não estar disponível em todo ambiente (ex.: CI enxuto) — o
    // conteúdo já é válido, só não fica formatado; não deve quebrar o build.
  }

  console.log(`[card-assets] manifest gerado com ${totalAssets} asset(s) em ${OUT_FILE}`);
  console.log(
    `[card-assets-v3] manifest gerado com ${v3TotalAssets} asset(s) e ${Object.keys(v3Compositions).length} composição(ões) em ${V3_OUT_FILE}`,
  );
}

main();
