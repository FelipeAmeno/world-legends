/**
 * lib/dev/card-asset-expectations.ts — Sprint 18.6.5 (Asset Production Pipeline)
 *
 * Enumera o universo de chaves esperadas por categoria de asset — a base
 * para calcular "o que falta" no inspetor (/dev/card-assets). Não altera
 * nada do motor de renderização, só descreve o que ele é capaz de usar.
 *
 * Jogadores vêm de getCollection() (não de PLAYER_SEEDS isolado) porque o
 * catálogo real combina PLAYER_SEEDS (16 lendas originais) + ALL_PLAYER_SEEDS
 * (558 jogadores de catalog-seeds.ts) = 574 no total — usar só PLAYER_SEEDS
 * sub-representaria o catálogo em ~97%.
 */
import { ALL_RARITY_CODES } from '@/lib/card-asset-loader';
import { getCollection } from '@/lib/collection-data';
import { getAllKitNationalities } from '@/lib/kit-data';

export type ExpectedAssetKind =
  | 'frames'
  | 'backgrounds'
  | 'effects-effect'
  | 'effects-glow'
  | 'kits'
  | 'player-art';

export type ExpectedEntry = { key: string; label: string };

export function expectedFrames(): ExpectedEntry[] {
  return ALL_RARITY_CODES.map((r) => ({ key: `frame-${r}`, label: r }));
}

export function expectedBackgrounds(): ExpectedEntry[] {
  return ALL_RARITY_CODES.map((r) => ({ key: `bg-${r}`, label: r }));
}

export function expectedRarityEffects(): ExpectedEntry[] {
  return ALL_RARITY_CODES.map((r) => ({ key: `effect-${r}`, label: r }));
}

export function expectedGlows(): ExpectedEntry[] {
  return ALL_RARITY_CODES.map((r) => ({ key: `glow-${r}`, label: r }));
}

export function expectedShine(): ExpectedEntry[] {
  return ALL_RARITY_CODES.map((r) => ({ key: `shine-${r}`, label: r }));
}

export function expectedKits(): ExpectedEntry[] {
  const nationalities = getAllKitNationalities();
  const out: ExpectedEntry[] = [];
  for (const nat of nationalities) {
    for (const r of ALL_RARITY_CODES) {
      out.push({ key: `kit-${nat}-${r}`, label: `${nat} · ${r}` });
    }
  }
  return out;
}

function uniquePlayers(): ReadonlyArray<{ id: string; knownAs: string; nationality: string }> {
  const seen = new Map<string, { id: string; knownAs: string; nationality: string }>();
  for (const card of getCollection()) {
    if (!seen.has(card.playerId)) {
      seen.set(card.playerId, {
        id: card.playerId,
        knownAs: card.displayName,
        nationality: card.nationality,
      });
    }
  }
  return Array.from(seen.values());
}

export function expectedPlayerArt(): ExpectedEntry[] {
  return uniquePlayers().map((p) => ({ key: p.id, label: p.knownAs }));
}

export function expectedPoses(): ExpectedEntry[] {
  return uniquePlayers().map((p) => ({ key: `pose-${p.id}`, label: p.knownAs }));
}

export function expectedPatterns(): ExpectedEntry[] {
  return getAllKitNationalities().map((n) => ({ key: `pattern-${n}`, label: n }));
}

/** Scene (Sprint 21) — cenário cinematográfico por jogador, `scene-{playerId}.webp`. */
export function expectedScenes(): ExpectedEntry[] {
  return uniquePlayers().map((p) => ({ key: `scene-${p.id}`, label: p.knownAs }));
}

export function allKitNationalities(): readonly string[] {
  return getAllKitNationalities();
}

export function allPlayers(): ReadonlyArray<{ id: string; knownAs: string; nationality: string }> {
  return uniquePlayers();
}
