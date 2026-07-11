/**
 * scripts/cards/_shared.mts — Sprint 35B (Static Card Pipeline Foundation)
 * + Sprint 35D (Full Card Artwork Pipeline Reset)
 *
 * Helpers compartilhados por validate/build/manifest — carregar presets,
 * resolver caminhos de source, nunca duplicar essa lógica em 3 arquivos.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const CARDS_DIR = join(import.meta.dirname, '..', '..', 'public', 'assets', 'cards');
export const SOURCE_DIR = join(CARDS_DIR, 'source');
export const GENERATED_DIR = join(CARDS_DIR, 'generated');
export const METADATA_DIR = join(CARDS_DIR, 'metadata');
export const ARTWORKS_DIR = join(SOURCE_DIR, 'artworks');

// Duplicado (não importado) de lib/card-static/types.ts de propósito —
// scripts Node rodam fora do type-check do Next/tsconfig do app, manter
// o shape aqui evita acoplar a resolução de módulos do script ao
// bundler do Next. Os dois devem ser mantidos em sincronia manualmente
// (ambos pequenos, baixo risco de deriva).
export type CardArtworkPreset = {
  id: string;
  rarity: string;
  sourceType?: 'layered' | 'full-card-artwork';
  source: {
    background: string | null;
    player: string | null;
    light: string | null;
    particles: string | null;
  };
  composition: { playerScale: number; playerOffsetX: number; playerOffsetY: number };
  artwork?: string | null;
  hudLayout?: Record<string, { x: number; y: number; width?: number; height?: number }> | null;
  generated: { compact: string | null; standard: string | null; showcase: string | null };
  frame: string | null;
};

export function loadPresets(): CardArtworkPreset[] {
  let files: string[] = [];
  try {
    files = readdirSync(METADATA_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    return [];
  }
  return files.map(
    (f) => JSON.parse(readFileSync(join(METADATA_DIR, f), 'utf-8')) as CardArtworkPreset,
  );
}

export function sourcePath(
  channel: 'backgrounds' | 'players' | 'lights' | 'particles' | 'frames',
  filename: string,
): string {
  return join(SOURCE_DIR, channel, filename);
}

/**
 * Sprint 35D — caminho de um full-card-artwork. Aceita as DUAS
 * convenções que já apareceram em presets reais: nome de arquivo puro
 * (`"wl-artwork-goat-brazil-001-v1.png"`, resolvido contra
 * `source/artworks/<raridade>/`) OU caminho relativo já completo a
 * partir de `public/assets/cards/`
 * (`"source/artworks/goat/wl-artwork-goat-brazil-001-v1.png"`).
 */
export function artworkPath(rarity: string, artwork: string): string {
  if (artwork.includes('/')) return join(CARDS_DIR, artwork);
  return join(ARTWORKS_DIR, rarity, artwork);
}

export const CHANNEL_DIR: Record<
  'background' | 'player' | 'light' | 'particles',
  'backgrounds' | 'players' | 'lights' | 'particles'
> = {
  background: 'backgrounds',
  player: 'players',
  light: 'lights',
  particles: 'particles',
};

export const DIMENSIONS = {
  compact: { width: 400, height: 600 },
  standard: { width: 800, height: 1200 },
  showcase: { width: 1200, height: 1800 },
} as const;

export const WEIGHT_TARGET_KB = { compact: 80, standard: 180, showcase: 350 } as const;
