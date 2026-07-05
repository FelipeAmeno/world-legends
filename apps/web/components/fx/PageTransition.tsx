'use client';

/**
 * components/fx/PageTransition.tsx — Sprint 3
 *
 * Wrapper de transição de tela para Next.js App Router.
 * Usa AnimatePresence via pathname como key.
 *
 * Uso:
 *   <PageTransition>
 *     {children}
 *   </PageTransition>
 *
 * Modos:
 *   'fade'       — dissolve simples (padrão)
 *   'slide-up'   — sobe na entrada, desce na saída
 *   'slide-left' — desliza da esquerda (navegação back/forward)
 *   'scale'      — zoom leve (modais e overlays)
 */

import { PAGE_TRANSITION, SPRING, VARIANTS } from '@/lib/motion-tokens';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export type TransitionMode = 'fade' | 'slide-up' | 'slide-left' | 'scale';

type Props = {
  children: ReactNode;
  mode?: TransitionMode;
  className?: string;
};

const MODE_VARIANTS: Record<
  TransitionMode,
  {
    initial: object;
    animate: object;
    exit: object;
  }
> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.25 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  },
  'slide-up': {
    initial: PAGE_TRANSITION.initial,
    animate: PAGE_TRANSITION.animate,
    exit: PAGE_TRANSITION.exit,
  },
  'slide-left': {
    initial: { opacity: 0, x: -12 },
    animate: { opacity: 1, x: 0, transition: SPRING.smooth },
    exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
  },
  scale: {
    initial: VARIANTS.scale.hidden,
    animate: VARIANTS.scale.visible,
    exit: VARIANTS.scale.exit,
  },
};

export function PageTransition({ children, mode = 'slide-up', className = '' }: Props) {
  const v = MODE_VARIANTS[mode];

  return (
    <motion.div
      className={`w-full h-full ${className}`}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initial={v.initial as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      animate={v.animate as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exit={v.exit as any}
    >
      {children}
    </motion.div>
  );
}

// ─── Fade wrapper simples (sem key management) ────────────────────────────────

export function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Stagger list ─────────────────────────────────────────────────────────────

export function StaggerList({
  children,
  className = '',
  staggerDelay = 0.06,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.04 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={VARIANTS.staggerItem}>
      {children}
    </motion.div>
  );
}
