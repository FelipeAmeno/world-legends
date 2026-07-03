/**
 * Converte um RarityTheme em strings CSS reutilizáveis.
 * Usado pelos componentes React — zero runtime overhead.
 */
import type { RarityTheme } from './types';

export function themeToBoxShadow(t: RarityTheme): string {
  return `0 0 ${t.glow.spreadPx}px ${t.glow.color}`;
}

export function themeToHoverBoxShadow(t: RarityTheme): string {
  return `0 0 ${t.glow.hoverSpreadPx}px ${t.glow.color}`;
}

export function themeToBorderStyle(t: RarityTheme): React.CSSProperties {
  if (t.border.gradient) {
    return {
      border: 'none',
      padding: `${t.border.width}px`,
      background: t.border.gradient,
      borderRadius: t.border.radius,
    };
  }
  return {
    border: `${t.border.width}px solid ${t.border.color}`,
    borderRadius: t.border.radius,
  };
}

export function themeToArtBackground(t: RarityTheme): string {
  return t.colors.artBg;
}

// ─── Trait icons (doc 10 §8) ──────────────────────────────────────────────────

export const TRAIT_ICONS: Record<string, string> = {
  // Ofensivo
  'Artilheiro Nato':      '⚽',
  'Artilheiro':           '⚽',
  'Matador':              '🎯',
  'Goleador':             '🎯',
  'Finalizador':          '🎯',
  // Dribble
  'Driblador':            '⚡',
  'Regateador':           '⚡',
  'Velocista':            '💨',
  'Velocidade':           '💨',
  // Passe / visão
  'Maestro':              '🎼',
  'Passador':             '🎼',
  'Visão de Jogo':        '👁️',
  'Box to Box':           '🔄',
  'Totaal Football':      '🌀',
  'Pressing Alto':        '🌀',
  // Físico
  'Físico':               '💪',
  'Potência':             '💪',
  'Dombom':               '💪',
  // Defesa
  'Muralha':              '🛡️',
  'Líder Defensivo':      '🛡️',
  'Zagueiro':             '🛡️',
  'Aranh-a Negra':        '🕷️',
  'Aranh a Negra':        '🕷️',
  'Reflexos':             '🧤',
  // Lateral
  'Lateral Ofensivo':     '🏃',
  'Lat. Ofensivo':        '🏃',
  'Canhão':               '💥',
  // Liderança
  'Capitão':              '👑',
  'Líder':                '👑',
  'Copa Herói':           '🏆',
  'Copa Brasil':          '🏆',
  'Copa 82':              '🏆',
  'Copa 70':              '🏆',
  'Copa 1958':            '🏆',
  'Carrasco de Copa':     '🏆',
  'Cobr. Falta':          '🌀',
  'Cobrador de Falta':    '🌀',
  // Especiais
  'Imortal':              '✨',
  'Lenda':                '⭐',
  'GOAT':                 '👑',
};

export function getTraitIcon(trait: string): string {
  for (const [key, icon] of Object.entries(TRAIT_ICONS)) {
    if (trait.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return '🔵';
}
