/**
 * lib/procedural-scene/CountryPatternGenerator.ts — Sprint 27
 * (Procedural Scene Engine)
 *
 * Substitui de vez o antigo asset `pattern-{nacionalidade}.png` (nunca
 * chegou a existir nenhum, ver relatório da Sprint 26 de remoção do
 * legado) — em vez de esperar um PNG, gera a textura de listras/xadrez
 * da seleção 100% em CSS a partir dos dados REAIS já existentes em
 * `lib/kit-data.ts`'s `KitColors.pattern`/`patternColor` (Argentina
 * listrada, Croácia quadriculada etc.) — determinístico por definição,
 * já que vem direto do dado da seleção, sem nenhum sorteio; o seed só
 * varia o ângulo/opacidade pra dar uma variação sutil entre cartas do
 * mesmo país.
 */
import type { NationalityCode } from '@world-legends/types';
import { getKitColors } from '../kit-data';
import { type Rng, rngRange } from './seed';

export type ProceduralCountryPattern = Readonly<{
  kind: 'solid' | 'stripes' | 'checker';
  colorA: string;
  colorB: string;
  angleDeg: number;
  opacity: number;
}>;

export function generateCountryPattern(nationality: string, rng: Rng): ProceduralCountryPattern {
  const kit = getKitColors(nationality as NationalityCode);
  return {
    kind: kit.pattern ?? 'solid',
    colorA: kit.primary,
    colorB: kit.patternColor ?? kit.secondary,
    angleDeg: rngRange(rng, -20, 20),
    opacity: rngRange(rng, 0.05, 0.12),
  };
}
