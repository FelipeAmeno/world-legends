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

const RARITY_BRIGHTNESS_BOOST: Record<RarityCode, number> = {
  common: 0,
  rare: 0.05,
  elite: 0.1,
  legendary: 0.18,
  ultra: 0.24,
  world_cup_hero: 0.3,
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
