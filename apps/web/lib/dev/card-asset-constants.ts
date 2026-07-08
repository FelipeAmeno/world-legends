/**
 * lib/dev/card-asset-constants.ts — Sprint 18.6.5 (Asset Production Pipeline)
 *
 * Constantes sem dependência de Node (`fs`/`path`) — seguras para import
 * tanto em Server Components quanto em Client Components. Separado de
 * card-asset-diagnostics.ts (que usa `node:fs`/`node:path` e não pode ser
 * importado do lado client).
 */

export const CARD_ASPECT_RATIO = 148 / 199; // mesma proporção de PlayerCard 'lg' (card-tokens.ts)
// 5% — calibrado com o primeiro lote real de frames (Sprint 18.8): saída do
// Gemini veio em 1143×1600 (≈0.714), ~3.95% fora do alvo (0.744). A camada
// estica a imagem pra preencher a carta (w-full h-full) de qualquer forma,
// então essa diferença não causa defeito visual — só recalibra o quão
// realista é esperar precisão de proporção de uma pipeline de geração externa.
export const ASPECT_RATIO_TOLERANCE = 0.05;
export const RECOMMENDED_MIN_WIDTH = 512;
