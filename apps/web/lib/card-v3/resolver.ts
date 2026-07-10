/**
 * lib/card-v3/resolver.ts — Sprint 34 (Official Art Pack Integration)
 *
 * Resolve uma composição v3 por ID. Não existe nenhum arte real ainda
 * (ver `CARD_V3_ASSET_SPEC.md`) — `CARD_V3_ASSET_MANIFEST`/
 * `CARD_V3_COMPOSITIONS` são gerados vazios até alguém soltar arquivos
 * reais em `public/assets/cards/v3/`. Por isso `resolveCardV3` retorna
 * `null` pra qualquer ID hoje, e todo call site já sabe cair pro sistema
 * procedural (Sprint 27/28) nesse caso — o motor nunca fica sem conteúdo.
 */
import { CARD_V3_ASSET_MANIFEST, CARD_V3_COMPOSITIONS } from './manifest.generated';
import { type CardV3Composition, type CardV3CompositionRaw, DEFAULT_V3_METADATA } from './types';

type V3AssetCategory = keyof typeof CARD_V3_ASSET_MANIFEST;

function resolveV3AssetSrc(category: V3AssetCategory, key: string | undefined): string | null {
  if (!key) return null;
  const entry = (CARD_V3_ASSET_MANIFEST[category] as Record<string, { src: string } | undefined>)[
    key
  ];
  return entry?.src ?? null;
}

/** Único ponto de entrada — resolve os 6 canais + o transform de uma composição por ID. */
export function resolveCardV3(compositionId: string): CardV3Composition | null {
  const raw = (CARD_V3_COMPOSITIONS as Record<string, CardV3CompositionRaw | undefined>)[
    compositionId
  ];
  if (!raw) return null;

  return {
    id: compositionId,
    background: resolveV3AssetSrc('backgrounds', raw.backgroundId),
    player: resolveV3AssetSrc('players', raw.playerId),
    pattern: resolveV3AssetSrc('patterns', raw.patternId),
    light: resolveV3AssetSrc('lights', raw.lightId),
    particles: resolveV3AssetSrc('particles', raw.particlesId),
    frame: resolveV3AssetSrc('frames', raw.frameId),
    meta: { ...DEFAULT_V3_METADATA, ...raw },
  };
}

/** IDs de composição disponíveis hoje — usado por `/dev/card-v3-gallery`. */
export function listCardV3Compositions(): readonly string[] {
  return Object.keys(CARD_V3_COMPOSITIONS);
}
