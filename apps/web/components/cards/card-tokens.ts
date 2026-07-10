/**
 * components/cards/card-tokens.ts — Sprint 18.5 (Card Rendering Engine)
 *
 * Fonte única das tabelas de identidade visual por raridade e das dimensões
 * por tamanho de carta. PlayerCard.tsx computa os valores derivados uma vez
 * e passa para cada camada — nenhuma camada redefine esses tokens.
 */
import type { RarityCode } from '@world-legends/types';

export type CardSize = 'xs' | 'sm' | 'md' | 'lg';

// ─── Identidade de raridade — reconhecível sem ler texto ──────────────────────
//
// Cada raridade combina 4 sinais independentes (cor de borda/glow, ícone,
// intensidade do brilho de fundo e efeito de acabamento) para que dê pra
// reconhecer a raridade só pela silhueta/cor da carta, mesmo em miniatura.

export const RARITY_DISPLAY_LABEL: Record<RarityCode, string> = {
  common: 'COMUM',
  rare: 'RARA',
  elite: 'ELITE',
  legendary: 'LENDÁRIA',
  ultra: 'GOAT',
  world_cup_hero: 'CAMPEÃO',
};

export const RARITY_ICON: Record<RarityCode, string> = {
  common: '',
  rare: '◆',
  elite: '▲',
  legendary: '★',
  ultra: '⚡',
  world_cup_hero: '🏆',
};

export const RARITY_ACCENT: Record<RarityCode, string> = {
  common: '#9ca3af',
  rare: '#c084fc',
  elite: '#60a5fa',
  legendary: '#e6c85a',
  ultra: '#f472b6',
  world_cup_hero: '#ffffff',
};

export const RARITY_FRAME_CLASS: Record<RarityCode, string> = {
  common: 'card-frame-common',
  rare: 'card-frame-rare',
  elite: 'card-frame-elite',
  legendary: 'card-frame-legendary',
  ultra: 'card-frame-ultra',
  world_cup_hero: 'card-frame-wch',
};

export const RARITY_GLOW_CLASS: Record<RarityCode, string> = {
  common: '',
  rare: 'glow-rare',
  elite: 'glow-elite',
  legendary: 'glow-gold',
  ultra: 'glow-ultra',
  world_cup_hero: 'glow-wch',
};

// Intensidade do banho de cor nacional no fundo — cresce com a raridade,
// para que Common (quase sem cor) e Legendary/GOAT/Campeão (cor vibrante)
// pareçam universos diferentes mesmo antes de olhar pra camisa.
export const RARITY_BG_ALPHA: Record<RarityCode, string> = {
  common: '14',
  rare: '2c',
  elite: '3a',
  legendary: '4a',
  ultra: '52',
  world_cup_hero: '5c',
};

export const RARITY_SHIMMER: Record<RarityCode, boolean> = {
  common: false,
  rare: true,
  elite: true,
  legendary: true,
  ultra: true,
  world_cup_hero: true,
};

export const SIZES: Record<CardSize, { card: { width: number; height: number } }> = {
  xs: { card: { width: 62, height: 84 } },
  sm: { card: { width: 92, height: 124 } },
  md: { card: { width: 116, height: 156 } },
  lg: { card: { width: 148, height: 199 } },
};

export const OVR_FONT: Record<CardSize, number> = { xs: 14, sm: 18, md: 22, lg: 28 };
export const POS_FONT: Record<CardSize, number> = { xs: 5, sm: 5.5, md: 6.5, lg: 8 };
export const NAME_FONT: Record<CardSize, number> = { xs: 8, sm: 11.5, md: 15, lg: 20 };
export const SUB_FONT: Record<CardSize, number> = { xs: 5, sm: 6, md: 7, lg: 8.5 };
export const RIBBON_FONT: Record<CardSize, number> = { xs: 6, sm: 6.5, md: 7.5, lg: 9 };
