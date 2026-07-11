/**
 * lib/card-v3/types.ts — Sprint 34 (Official Art Pack Integration) +
 * Sprint 35 (First Real Asset Integration)
 *
 * Schema de metadata — exatamente os 9 campos do brief (scale/offsetX/
 * offsetY/rotation/opacity/blendMode/blur/intensity/parallaxDepth).
 * Nunca inferimos o asset de um canal por convenção de nome de arquivo —
 * sempre por ID explícito no JSON, resolvido pelo manifesto gerado. Isso
 * evita "exceções específicas direto no JSX" (proibido pelo brief): quem
 * decide o que aparece é o dado (`CardV3Composition`), nunca um `if`
 * hardcoded num componente.
 *
 * Sprint 35 — metadata é POR CANAL, não mais um blob único por
 * composição. Cada asset real (background, player, ...) tem seu próprio
 * `metadata/<assetId>.json` com seu próprio transform (ex.: o background
 * do primeiro asset real tem `parallaxDepth: 0.15`, o player
 * `parallaxDepth: 0.65` — valores intencionalmente diferentes, um blob
 * compartilhado não permitiria isso). A composição (`metadata/
 * <compositionId>.json`) só referencia os IDs; cada `*Id` é resolvido
 * pra seu PRÓPRIO metadata, com fallback pro default se aquele asset não
 * tiver um sidecar próprio.
 */
import type { BlendMode } from '../card-asset-loader';

export type CardV3Metadata = {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotation: number;
  opacity: number;
  blendMode: BlendMode;
  blur: number;
  intensity: number;
  /** Profundidade de parallax (Sprint 18.7) — 0 = nenhum, 1 = máximo. */
  parallaxDepth: number;
};

export const DEFAULT_V3_METADATA: CardV3Metadata = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  opacity: 1,
  blendMode: 'normal',
  blur: 0,
  intensity: 1,
  parallaxDepth: 0,
};

/** JSON cru esperado em `v3/metadata/<id>.json` — todo campo é opcional. */
export type CardV3CompositionRaw = Partial<CardV3Metadata> & {
  backgroundId?: string;
  playerId?: string;
  patternId?: string;
  lightId?: string;
  particlesId?: string;
  frameId?: string;
};

/** Um canal resolvido — `src` pronto pra `<img>`/CSS + o metadata PRÓPRIO
 * daquele asset (nunca compartilhado com os outros canais). `null` quando
 * o `*Id` está ausente na composição ou não existe no manifesto de assets. */
export type CardV3ResolvedChannel = { src: string; meta: CardV3Metadata } | null;

/** Composição resolvida — cada canal já vem com seu próprio transform. */
export type CardV3Composition = {
  id: string;
  background: CardV3ResolvedChannel;
  player: CardV3ResolvedChannel;
  pattern: CardV3ResolvedChannel;
  light: CardV3ResolvedChannel;
  particles: CardV3ResolvedChannel;
  frame: CardV3ResolvedChannel;
};
