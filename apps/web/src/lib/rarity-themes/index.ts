/**
 * Temas de raridade — T026.1
 * Cada tema é um objeto imutável que concentra todos os tokens visuais.
 * Zero lógica de negócio.
 */
import type { RarityTheme } from './types';

// ─── COMMON ───────────────────────────────────────────────────────────────────
export const commonTheme: RarityTheme = Object.freeze({
  code: 'common', label: 'Comum', badgeLabel: 'COM',
  colors: { primary: '#9e9e9e', secondary: '#616161', text: '#bdbdbd', artBg: '#0f0f0f', footerBg: 'rgba(0,0,0,.7)' },
  border: { color: '#4a4a4a', width: 2, radius: 16, gradient: null },
  glow: { color: 'rgba(158,158,158,.0)', spreadPx: 0, hoverSpreadPx: 8, pulsating: false, pulseDurationS: 0 },
  particles: { enabled: false, color: '#9e9e9e', count: 0, sizePx: 2, speedS: 4 },
  shimmer: { enabled: false, type: 'none', opacity: 0, durationS: 0 },
  extras: { serialNumber: false, editionBadge: false, stars: 0, cornerDecoration: false, historicalSignature: false },
});

// ─── RARE ─────────────────────────────────────────────────────────────────────
export const rareTheme: RarityTheme = Object.freeze({
  code: 'rare', label: 'Rara', badgeLabel: 'RAR',
  colors: { primary: '#42a5f5', secondary: '#1565c0', text: '#bbdefb', artBg: '#060f1f', footerBg: 'rgba(0,10,30,.75)' },
  border: { color: '#1565c0', width: 2, radius: 16, gradient: null },
  glow: { color: 'rgba(66,165,245,.3)', spreadPx: 16, hoverSpreadPx: 28, pulsating: false, pulseDurationS: 0 },
  particles: { enabled: false, color: '#42a5f5', count: 0, sizePx: 2, speedS: 4 },
  shimmer: { enabled: false, type: 'none', opacity: 0, durationS: 0 },
  extras: { serialNumber: false, editionBadge: false, stars: 1, cornerDecoration: false, historicalSignature: false },
});

// ─── ELITE ────────────────────────────────────────────────────────────────────
export const eliteTheme: RarityTheme = Object.freeze({
  code: 'elite', label: 'Elite', badgeLabel: 'ELI',
  colors: { primary: '#ce93d8', secondary: '#6a1b9a', text: '#f3e5f5', artBg: '#0c0618', footerBg: 'rgba(10,2,20,.78)' },
  border: { color: '#6a1b9a', width: 2, radius: 16, gradient: 'linear-gradient(135deg,#ab47bc,#4a148c)' },
  glow: { color: 'rgba(206,147,216,.35)', spreadPx: 20, hoverSpreadPx: 34, pulsating: false, pulseDurationS: 0 },
  particles: { enabled: false, color: '#ce93d8', count: 0, sizePx: 2, speedS: 4 },
  shimmer: { enabled: false, type: 'none', opacity: 0, durationS: 0 },
  extras: { serialNumber: false, editionBadge: false, stars: 2, cornerDecoration: false, historicalSignature: false },
});

// ─── LEGENDARY ────────────────────────────────────────────────────────────────
export const legendaryTheme: RarityTheme = Object.freeze({
  code: 'legendary', label: 'Lendária', badgeLabel: 'LND',
  colors: { primary: '#ffca28', secondary: '#e65100', text: '#fff8e1', artBg: '#100900', footerBg: 'rgba(16,8,0,.82)' },
  border: { color: '#f57f17', width: 2, radius: 16, gradient: 'linear-gradient(135deg,#ffca28,#e65100,#ffca28)' },
  glow: { color: 'rgba(255,202,40,.4)', spreadPx: 24, hoverSpreadPx: 40, pulsating: false, pulseDurationS: 0 },
  particles: { enabled: false, color: '#ffca28', count: 0, sizePx: 2, speedS: 4 },
  shimmer: { enabled: true, type: 'gold', opacity: 0.14, durationS: 2.4 },
  extras: { serialNumber: false, editionBadge: false, stars: 3, cornerDecoration: false, historicalSignature: false },
});

// ─── ULTRA ────────────────────────────────────────────────────────────────────
export const ultraTheme: RarityTheme = Object.freeze({
  code: 'ultra', label: 'Ultra', badgeLabel: 'ULT',
  colors: { primary: '#ef5350', secondary: '#b71c1c', text: '#ffcdd2', artBg: '#120202', footerBg: 'rgba(18,2,2,.85)' },
  border: { color: '#b71c1c', width: 2, radius: 16, gradient: 'linear-gradient(135deg,#ef5350,#ff8f00,#ce93d8,#42a5f5,#ef5350)' },
  glow: { color: 'rgba(239,83,80,.45)', spreadPx: 30, hoverSpreadPx: 48, pulsating: false, pulseDurationS: 0 },
  particles: { enabled: false, color: '#ef5350', count: 0, sizePx: 2, speedS: 4 },
  shimmer: { enabled: true, type: 'holographic', opacity: 0.22, durationS: 1.8 },
  extras: { serialNumber: false, editionBadge: false, stars: 4, cornerDecoration: false, historicalSignature: false },
});

// ─── WORLD CUP HERO ───────────────────────────────────────────────────────────
export const worldCupHeroTheme: RarityTheme = Object.freeze({
  code: 'world_cup_hero', label: 'World Cup Hero', badgeLabel: 'WCH',
  colors: { primary: '#26c6da', secondary: '#006064', text: '#e0f7fa', artBg: '#001318', footerBg: 'rgba(0,18,24,.88)' },
  border: { color: '#006064', width: 2, radius: 14, gradient: 'linear-gradient(135deg,#26c6da,#00838f,#26c6da)' },
  glow: { color: 'rgba(38,198,218,.48)', spreadPx: 32, hoverSpreadPx: 52, pulsating: true, pulseDurationS: 3.5 },
  particles: { enabled: false, color: '#26c6da', count: 0, sizePx: 2, speedS: 4 },
  shimmer: { enabled: true, type: 'cyan', opacity: 0.16, durationS: 2.0 },
  extras: { serialNumber: false, editionBadge: true, stars: 4, cornerDecoration: true, historicalSignature: false },
});

// ─── GOAT ─────────────────────────────────────────────────────────────────────
export const goatTheme: RarityTheme = Object.freeze({
  code: 'goat', label: 'G.O.A.T.', badgeLabel: 'GOAT',
  colors: { primary: '#ffd700', secondary: '#b8860b', text: '#fff9c4', artBg: '#0e0900', footerBg: 'rgba(14,9,0,.9)' },
  border: { color: '#b8860b', width: 3, radius: 16, gradient: 'linear-gradient(135deg,#ffd700,#ff8c00,#ffd700,#fffde7,#ffd700)' },
  glow: { color: 'rgba(255,215,0,.6)', spreadPx: 48, hoverSpreadPx: 68, pulsating: true, pulseDurationS: 2.8 },
  particles: { enabled: true, color: '#ffd700', count: 14, sizePx: 3, speedS: 3 },
  shimmer: { enabled: true, type: 'gold', opacity: 0.2, durationS: 2.0 },
  extras: { serialNumber: true, editionBadge: false, stars: 5, cornerDecoration: true, historicalSignature: true },
});

// ─── Mapa por código ──────────────────────────────────────────────────────────
export const RARITY_THEMES: Record<string, RarityTheme> = {
  common:         commonTheme,
  rare:           rareTheme,
  elite:          eliteTheme,
  legendary:      legendaryTheme,
  ultra:          ultraTheme,
  world_cup_hero: worldCupHeroTheme,
  goat:           goatTheme,
};

export function getRarityTheme(code: string): RarityTheme {
  return RARITY_THEMES[code] ?? commonTheme;
}
