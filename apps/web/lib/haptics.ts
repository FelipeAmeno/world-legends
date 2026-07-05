/**
 * lib/haptics.ts — Sprint 3 (expanded)
 *
 * Biblioteca centralizada de vibração — Vibration API.
 * Padrões agrupados por contexto:
 *   Packs    — pack opening flow
 *   Cards    — por raridade
 *   UI       — microinterações gerais
 *   Match    — eventos de partida
 *   Rewards  — conquistas e recompensas
 */

const PATTERNS = {
  // ── Pack flow ──────────────────────────────────────────────────────────────
  packSelect: [20],
  packCharge: [40, 30, 80, 20, 120],
  packOpen: [100, 50, 200, 50, 300],

  // ── Cards por raridade ────────────────────────────────────────────────────
  cardCommon: [15],
  cardRare: [30, 20, 40],
  cardElite: [50, 20, 80, 20, 30],
  cardLegendary: [80, 30, 120, 30, 200],
  cardUltra: [100, 20, 150, 20, 250, 20, 100],
  cardGoat: [200, 50, 300, 50, 500, 100, 200],

  // ── UI microinterações ────────────────────────────────────────────────────
  tap: [8], // toque leve em botão
  tapHeavy: [25], // toque em ação importante
  toggle: [10, 10, 10], // ligar/desligar toggle
  swipe: [15, 5, 10], // swipe / drag
  error: [40, 20, 40], // erro / validação falhou
  success: [20, 10, 30], // ação concluída
  warning: [30, 15, 30, 15, 30], // atenção

  // ── Match events ──────────────────────────────────────────────────────────
  goalScored: [100, 30, 150, 30, 200, 50, 100], // goooool
  goalConceded: [60, 40, 80], // gol sofrido
  matchStart: [50, 20, 80], // apito inicial
  matchEnd: [30, 20, 50, 20, 100], // fim de partida
  foul: [25, 15, 25], // falta
  redCard: [80, 30, 120], // cartão vermelho

  // ── Recompensas ───────────────────────────────────────────────────────────
  rewardSmall: [20, 10, 40], // +50c
  rewardMedium: [40, 20, 60, 20, 80], // +200c
  rewardLarge: [60, 20, 100, 30, 150, 30, 60], // pack grátis
  levelUp: [100, 40, 150, 40, 200, 50, 100, 50, 150], // LEVEL UP!
  missionComplete: [50, 20, 80, 20, 120], // missão concluída

  // ── Navigation ───────────────────────────────────────────────────────────
  navTap: [6], // tab bar navigation
  pageEnter: [12], // nova tela carregada
} as const;

export type HapticKey = keyof typeof PATTERNS;

// ─── Vibrate ─────────────────────────────────────────────────────────────────

export function vibrate(key: HapticKey): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate([...PATTERNS[key]]);
  } catch {
    /* silencioso */
  }
}

/** Vibra com padrão customizado (ms on, off, on, off...) */
export function vibrateCustom(pattern: number[]): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* silencioso */
  }
}

/** Para qualquer vibração ativa */
export function vibrateStop(): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(0);
  } catch {
    /* silencioso */
  }
}

// ─── Maps convenientes ────────────────────────────────────────────────────────

export const RARITY_HAPTIC: Record<string, HapticKey> = {
  common: 'cardCommon',
  rare: 'cardRare',
  elite: 'cardElite',
  legendary: 'cardLegendary',
  ultra: 'cardUltra',
  world_cup_hero: 'cardGoat',
};

export const UI_HAPTIC = {
  tap: () => vibrate('tap'),
  tapHeavy: () => vibrate('tapHeavy'),
  success: () => vibrate('success'),
  error: () => vibrate('error'),
  toggle: () => vibrate('toggle'),
  navTap: () => vibrate('navTap'),
  levelUp: () => vibrate('levelUp'),
  missionDone: () => vibrate('missionComplete'),
  reward: (size: 'small' | 'medium' | 'large' = 'medium') =>
    vibrate(size === 'small' ? 'rewardSmall' : size === 'large' ? 'rewardLarge' : 'rewardMedium'),
} as const;
