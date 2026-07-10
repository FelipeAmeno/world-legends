/**
 * lib/card-v3/types.ts — Sprint 34 (Official Art Pack Integration)
 *
 * Schema de metadata de uma composição v3 — exatamente os 9 campos do
 * brief (scale/offsetX/offsetY/rotation/opacity/blendMode/blur/intensity/
 * parallaxDepth), mais as referências explícitas a cada asset de canal.
 * Nunca inferimos o asset de um canal por convenção de nome de arquivo —
 * sempre por ID explícito no JSON, resolvido pelo manifesto gerado. Isso
 * evita "exceções específicas direto no JSX" (proibido pelo brief): quem
 * decide o que aparece é o dado (`CardV3Composition`), nunca um `if`
 * hardcoded num componente.
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

/** Composição resolvida — cada campo de asset já é um `src` pronto pra `<img>`/CSS, ou `null` se ausente. */
export type CardV3Composition = {
  id: string;
  background: string | null;
  player: string | null;
  pattern: string | null;
  light: string | null;
  particles: string | null;
  frame: string | null;
  meta: CardV3Metadata;
};
