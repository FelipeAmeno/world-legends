/**
 * lib/card-assets.ts — Sprint 18.5 (Card Rendering Engine)
 *
 * Convenção de nomes/caminhos para os assets de arte das cartas em
 * public/assets/cards/. Nenhum arquivo existe ainda — as camadas em
 * components/cards/layers/* tentam carregar essas imagens e caem de volta
 * no visual procedural atual (CSS/SVG) via onError quando o arquivo não
 * existe. Quando uma arte real (gerada pelo Gemini) for colocada no caminho
 * certo, ela passa a aparecer automaticamente, sem nenhuma mudança de código.
 */
import type { RarityCode } from '@world-legends/types';

const BASE = '/assets/cards';

export const ALL_RARITY_CODES: readonly RarityCode[] = [
  'common',
  'rare',
  'elite',
  'legendary',
  'ultra',
  'world_cup_hero',
];

/** Layer 1 — fundo ambiente atrás de tudo, por raridade. */
export function getBackgroundAssetPath(rarityCode: RarityCode): string {
  return `${BASE}/backgrounds/bg-${rarityCode}.png`;
}

/** Layer 2 — efeito visual específico da raridade (textura de brilho, partículas pré-renderizadas). */
export function getRarityEffectAssetPath(rarityCode: RarityCode): string {
  return `${BASE}/effects/effect-${rarityCode}.png`;
}

/** Layer 3 — moldura/borda decorativa da carta, por raridade. */
export function getFrameAssetPath(rarityCode: RarityCode): string {
  return `${BASE}/frames/frame-${rarityCode}.png`;
}

/** Layer 4 — camisa da seleção. Combina nacionalidade + raridade (acabamentos especiais em raridades altas). */
export function getKitAssetPath(nationality: string, rarityCode: RarityCode): string {
  return `${BASE}/kits/kit-${nationality}-${rarityCode}.png`;
}

/** Layer 5 — arte do jogador (retrato/pose gerado pelo Gemini), por jogador. */
export function getPlayerArtAssetPath(playerId: string): string {
  return `${BASE}/player-art/${playerId}.png`;
}

/** Layer 6 — glow/aura por raridade, como textura pré-renderizada (separado do efeito de raridade). */
export function getGlowAssetPath(rarityCode: RarityCode): string {
  return `${BASE}/effects/glow-${rarityCode}.png`;
}

// Layer 7 (HUD) não tem asset próprio: são os "plates" estruturais atrás dos
// blocos de texto (OVR, ribbon, rodapé de nome), que precisam se adaptar a
// texto de tamanho variável — permanece 100% React/CSS por design. Ver
// SPRINT_18_5_REPORT.md.

/** Padrões reutilizáveis (listras, xadrez etc.) — usados por getKitAssetPath quando aplicável. */
export function getPatternAssetPath(patternKey: string): string {
  return `${BASE}/patterns/${patternKey}.png`;
}
