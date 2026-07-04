/**
 * lib/motion-tokens.ts — Sprint 3
 *
 * Fonte única de verdade para todos os valores de animação.
 * Mapeado aos CSS vars existentes em globals.css.
 *
 * Regra de uso:
 *   - Sempre importe DURATION, EASE, SPRING, VARIANTS deste arquivo.
 *   - Nunca escreva durações ou beziers diretamente nos componentes.
 */

// ─── Durações (ms) ────────────────────────────────────────────────────────────

export const DURATION = {
  instant: 80,    // feedback imediato (ripple, flash)
  fast:    120,   // hover, micro-interações
  base:    200,   // transições padrão
  slow:    350,   // elementos complexos
  enter:   500,   // entrada de tela / modal
  exit:    220,   // saída de tela (sempre mais rápido que entrada)
  long:    800,   // animações elaboradas (reveal, levelup)
} as const;

export type DurationKey = keyof typeof DURATION;

// ─── Easing curves ───────────────────────────────────────────────────────────

export const EASE = {
  spring:  [0.34, 1.56, 0.64, 1],    // elástico — botões, cards
  smooth:  [0.22, 1.00, 0.36, 1],    // fluido — modais, drawers
  out:     [0.16, 1.00, 0.30, 1],    // snappy — entradas de tela
  in:      [0.55, 0.00, 1.00, 0.45], // acelerado — saídas de tela
  inOut:   [0.87, 0.00, 0.13, 1.00], // simétrico — progress bars
  linear:  [0.00, 0.00, 1.00, 1.00], // progresso linear
} as const;

export type EaseKey = keyof typeof EASE;

// ─── Spring configs (Framer Motion) ──────────────────────────────────────────

export const SPRING = {
  /** Resposta instantânea — feedback de toque */
  snappy:  { type: 'spring' as const, stiffness: 500, damping: 35, mass: 0.8 },
  /** Padrão — transições de UI */
  smooth:  { type: 'spring' as const, stiffness: 280, damping: 24, mass: 1.0 },
  /** Entrada de elemento — visível e legível */
  bouncy:  { type: 'spring' as const, stiffness: 200, damping: 14, mass: 1.0 },
  /** Modais e drawers */
  gentle:  { type: 'spring' as const, stiffness: 160, damping: 20, mass: 1.2 },
  /** Efeitos dramáticos (cards lendários, level up) */
  wobbly:  { type: 'spring' as const, stiffness: 80,  damping:  8, mass: 1.5 },
} as const;

export type SpringKey = keyof typeof SPRING;

// ─── Variant factories ────────────────────────────────────────────────────────

export const VARIANTS = {
  /** Fade simples */
  fade: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: DURATION.base / 1000, ease: EASE.smooth } },
    exit:    { opacity: 0, transition: { duration: DURATION.exit / 1000, ease: EASE.in } },
  },

  /** Slide para cima — entrada de componentes e listas */
  slideUp: {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow / 1000, ease: EASE.out } },
    exit:    { opacity: 0, y: 8,  transition: { duration: DURATION.exit / 1000, ease: EASE.in } },
  },

  /** Slide da direita — navegação lateral */
  slideRight: {
    hidden:  { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: DURATION.slow / 1000, ease: EASE.out } },
    exit:    { opacity: 0, x: 20, transition: { duration: DURATION.exit / 1000, ease: EASE.in } },
  },

  /** Pop — botões, badges, recompensas */
  pop: {
    hidden:  { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: SPRING.bouncy },
    exit:    { opacity: 0, scale: 0.9, transition: { duration: DURATION.fast / 1000 } },
  },

  /** Scale de entrada — modais, overlays */
  scale: {
    hidden:  { opacity: 0, scale: 0.92 },
    visible: { opacity: 1, scale: 1, transition: SPRING.smooth },
    exit:    { opacity: 0, scale: 0.96, transition: { duration: DURATION.exit / 1000, ease: EASE.in } },
  },

  /** Toast — slide do topo */
  toast: {
    hidden:  { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: SPRING.snappy },
    exit:    { opacity: 0, y: -12, scale: 0.96, transition: { duration: DURATION.fast / 1000 } },
  },

  /** Stagger container — para listas */
  staggerContainer: {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  },

  /** Item de lista com stagger */
  staggerItem: {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow / 1000, ease: EASE.out } },
  },
} as const;

// ─── Press / tap interaction ──────────────────────────────────────────────────

export const PRESS = {
  whileHover:  { scale: 1.04, transition: { duration: DURATION.fast / 1000 } },
  whileTap:    { scale: 0.96, transition: SPRING.snappy },
  heroHover:   { scale: 1.02, y: -2, transition: { duration: DURATION.base / 1000 } },
  heroTap:     { scale: 0.97, transition: SPRING.snappy },
  subtleHover: { scale: 1.015, transition: { duration: DURATION.fast / 1000 } },
  subtleTap:   { scale: 0.985, transition: SPRING.snappy },
} as const;

// ─── Glow pulse (CSS animation via style) ────────────────────────────────────

export const GLOW_PULSE = {
  gold:  { animate: { boxShadow: ['0 0 12px rgba(201,168,76,0.25)', '0 0 28px rgba(201,168,76,0.55)', '0 0 12px rgba(201,168,76,0.25)'] } },
  green: { animate: { boxShadow: ['0 0 8px rgba(16,185,129,0.2)', '0 0 20px rgba(16,185,129,0.5)', '0 0 8px rgba(16,185,129,0.2)'] } },
  red:   { animate: { boxShadow: ['0 0 8px rgba(239,68,68,0.2)', '0 0 20px rgba(239,68,68,0.5)', '0 0 8px rgba(239,68,68,0.2)'] } },
} as const;

// ─── Page transition ──────────────────────────────────────────────────────────

export const PAGE_TRANSITION = {
  initial:   { opacity: 0, y: 8 },
  animate:   { opacity: 1, y: 0, transition: { duration: DURATION.enter / 1000, ease: EASE.out } },
  exit:      { opacity: 0, y: -4, transition: { duration: DURATION.exit / 1000, ease: EASE.in } },
} as const;
