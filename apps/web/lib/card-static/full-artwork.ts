/**
 * lib/card-static/full-artwork.ts — Sprint 35D (Full Card Artwork
 * Pipeline Reset)
 *
 * Funções puras (sem I/O) de validação — testáveis via Vitest e
 * reaproveitadas pelo script Sharp (`scripts/cards/build-card-artworks.mts`)
 * pra nunca duplicar a regra "o que é uma proporção 2:3 válida".
 */

export const CARD_ASPECT_RATIO = 2 / 3; // largura:altura
const ASPECT_TOLERANCE = 0.03; // ±3% — cobre variações de crop de export sem aceitar qualquer coisa

export const MIN_SHOWCASE_WIDTH = 1200;

export type AspectRatioCheck = { valid: true } | { valid: false; reason: string };

export function checkCardAspectRatio(width: number, height: number): AspectRatioCheck {
  if (width <= 0 || height <= 0) {
    return { valid: false, reason: `dimensões inválidas (${width}x${height})` };
  }
  const ratio = width / height;
  const diff = Math.abs(ratio - CARD_ASPECT_RATIO) / CARD_ASPECT_RATIO;
  if (diff > ASPECT_TOLERANCE) {
    return {
      valid: false,
      reason: `proporção ${ratio.toFixed(3)}:1 fora de 2:3 (esperado ${CARD_ASPECT_RATIO.toFixed(3)}:1, tolerância ${(ASPECT_TOLERANCE * 100).toFixed(0)}%)`,
    };
  }
  return { valid: true };
}

export type ResolutionCheck = { sufficient: boolean; warning?: string };

export function checkArtworkResolution(width: number): ResolutionCheck {
  if (width < MIN_SHOWCASE_WIDTH) {
    return {
      sufficient: false,
      warning: `resolução ${width}px abaixo do mínimo recomendado pro Showcase (${MIN_SHOWCASE_WIDTH}px) — vai upscale-ar e perder nitidez`,
    };
  }
  return { sufficient: true };
}
