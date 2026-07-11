/**
 * scripts/cards/_shared.mts — Sprint 35B (Static Card Pipeline Foundation)
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

export type CardArtworkPreset = {
  id: string;
  rarity: string;
  source: {
    background: string | null;
    player: string | null;
    light: string | null;
    particles: string | null;
  };
  composition: { playerScale: number; playerOffsetX: number; playerOffsetY: number };
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
