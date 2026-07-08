/**
 * scripts/generate-card-asset-manifest.mts — Sprint 18.6 (Card Rendering Engine — Pipeline)
 *
 * Varre public/assets/cards/{backgrounds,effects,frames,kits,patterns,player-art}
 * e gera lib/card-asset-manifest.generated.ts com a lista de assets que
 * realmente existem em disco, mais os metadados de transform (scale, offset,
 * rotation, blendMode, intensity) lidos de um sidecar opcional `<nome>.json`
 * ao lado de cada imagem.
 *
 * Roda automaticamente via `predev`/`prebuild` (package.json) — ninguém
 * precisa lembrar de rodar isso à mão depois de soltar uma arte nova.
 *
 * Uso manual: node --experimental-strip-types scripts/generate-card-asset-manifest.mts
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CATEGORIES = [
  'backgrounds',
  'effects',
  'frames',
  'kits',
  'patterns',
  'player-art',
  'poses',
  'shine',
] as const;
type Category = (typeof CATEGORIES)[number];

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

const ASSETS_DIR = join(import.meta.dirname, '..', 'public', 'assets', 'cards');
const OUT_FILE = join(import.meta.dirname, '..', 'lib', 'card-asset-manifest.generated.ts');

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

function scanCategory(category: Category): Record<string, ManifestEntry> {
  const dir = join(ASSETS_DIR, category);
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
    entries[stem] = {
      src: `/assets/cards/${category}/${filename}`,
      meta: readSidecarMeta(dir, stem),
    };
  }
  return entries;
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

  writeFileSync(OUT_FILE, body, 'utf-8');

  try {
    execFileSync('pnpm', ['exec', 'biome', 'format', '--write', OUT_FILE], {
      cwd: join(import.meta.dirname, '..'),
      stdio: 'ignore',
    });
  } catch {
    // biome pode não estar disponível em todo ambiente (ex.: CI enxuto) — o
    // conteúdo já é válido, só não fica formatado; não deve quebrar o build.
  }

  console.log(`[card-assets] manifest gerado com ${totalAssets} asset(s) em ${OUT_FILE}`);
}

main();
