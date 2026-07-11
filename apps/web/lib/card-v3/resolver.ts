/**
 * lib/card-v3/resolver.ts — Sprint 34 (Official Art Pack Integration) +
 * Sprint 35 (First Real Asset Integration — metadata por canal)
 *
 * Resolve uma composição v3 por ID. `CARD_V3_COMPOSITIONS` guarda TODO
 * JSON de `v3/metadata/` num único mapa plano, chave = nome do arquivo
 * sem extensão — isso serve dois papéis com a MESMA estrutura de dados,
 * sem precisar de duas varreduras: (1) uma composição referencia os
 * `*Id` de cada canal; (2) cada `*Id` é TAMBÉM uma chave válida nesse
 * mesmo mapa, com o metadata PRÓPRIO daquele asset (scale/offset/
 * rotation/opacity/blendMode/blur/intensity/parallaxDepth). Um asset sem
 * sidecar próprio cai no default (`DEFAULT_V3_METADATA`) — nunca fica
 * sem transform.
 */
import { CARD_V3_ASSET_MANIFEST, CARD_V3_COMPOSITIONS } from './manifest.generated';
import {
  type CardV3Composition,
  type CardV3CompositionRaw,
  type CardV3ResolvedChannel,
  DEFAULT_V3_METADATA,
} from './types';

type V3AssetCategory = keyof typeof CARD_V3_ASSET_MANIFEST;

const compositions = CARD_V3_COMPOSITIONS as Record<string, CardV3CompositionRaw | undefined>;

function resolveChannel(
  category: V3AssetCategory,
  assetId: string | undefined,
): CardV3ResolvedChannel {
  if (!assetId) return null;
  const entry = (CARD_V3_ASSET_MANIFEST[category] as Record<string, { src: string } | undefined>)[
    assetId
  ];
  if (!entry) return null;
  const ownMeta = compositions[assetId];
  return { src: entry.src, meta: { ...DEFAULT_V3_METADATA, ...ownMeta } };
}

/** Único ponto de entrada — resolve os 6 canais de uma composição por ID, cada um com seu próprio transform. */
export function resolveCardV3(compositionId: string): CardV3Composition | null {
  const raw = compositions[compositionId];
  if (!raw) return null;

  return {
    id: compositionId,
    background: resolveChannel('backgrounds', raw.backgroundId),
    player: resolveChannel('players', raw.playerId),
    pattern: resolveChannel('patterns', raw.patternId),
    light: resolveChannel('lights', raw.lightId),
    particles: resolveChannel('particles', raw.particlesId),
    frame: resolveChannel('frames', raw.frameId),
  };
}

/** IDs de composição disponíveis hoje — usado por `/dev/card-v3-gallery`. */
export function listCardV3Compositions(): readonly string[] {
  return Object.keys(CARD_V3_COMPOSITIONS);
}
