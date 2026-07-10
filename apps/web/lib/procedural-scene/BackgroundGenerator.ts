/**
 * lib/procedural-scene/BackgroundGenerator.ts — Sprint 27 (Procedural
 * Scene Engine)
 *
 * Fundo procedural determinístico — parte da Scene gerada quando a
 * carta não tem um asset de Scene real. Base: a paleta de estádio da
 * seleção do jogador (`getStadiumBg`, `lib/kit-data.ts` — já existia,
 * criado numa sprint anterior e nunca consumido em lugar nenhum; a
 * Scene procedural é o primeiro uso real). A raridade clareia/intensifica
 * o gradiente (cartas mais raras "brilham mais"); o seed varia levemente
 * o ângulo do gradiente e a opacidade da vinheta, pra duas cartas do
 * mesmo país/raridade não ficarem 100% idênticas.
 */
import type { NationalityCode, RarityCode } from '@world-legends/types';
import { getStadiumBg } from '../kit-data';
import { type Rng, rngRange } from './seed';

export type ProceduralBackground = Readonly<{
  gradientFrom: string;
  gradientMid: string;
  gradientTo: string;
  /** Ângulo do gradiente radial (posição do "centro de luz"), 0-100% top. */
  glowCenterYPercent: number;
  vignetteOpacity: number;
  stadiumName: string;
}>;

// Sprint 33: piso levantado pra Common/Rare — em cartas pequenas (Pack
// Reveal, ~116x156) elas ficavam apagadas perto do frame escuro; a
// referência mostra presença visual forte em toda raridade.
const RARITY_BRIGHTNESS_BOOST: Record<RarityCode, number> = {
  common: 0.08,
  rare: 0.13,
  elite: 0.16,
  legendary: 0.2,
  ultra: 0.26,
  world_cup_hero: 0.32,
};

export function generateBackground(
  nationality: string,
  rarityCode: RarityCode,
  rng: Rng,
): ProceduralBackground {
  const stadium = getStadiumBg(nationality as NationalityCode);
  const boost = RARITY_BRIGHTNESS_BOOST[rarityCode];

  return {
    gradientFrom: stadium.from,
    gradientMid: stadium.mid,
    gradientTo: stadium.to,
    glowCenterYPercent: rngRange(rng, 8, 22),
    vignetteOpacity: 0.55 - boost,
    stadiumName: stadium.name,
  };
}
