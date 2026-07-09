'use client';

/**
 * components/packs/PackContactShadow.tsx — Sprint 22 (Pack Experience 2.0,
 * item 9 — "sombras reais").
 *
 * Sombra de contato no "chão" — não tilta com o pack (fica fora do
 * `pack-tilt-wrapper`), reforça que ele está flutuando acima de uma
 * superfície em vez de só desenhado sobre o fundo. Extraída como
 * componente próprio (mesmo padrão de `VolumetricLight`/`SmokeLayer`) pra
 * manter a complexidade de `PackFloatScene` dentro do limite do lint.
 */

import { motion } from 'framer-motion';
import {
  CONTACT_SHADOW_BLUR_PX,
  CONTACT_SHADOW_HEIGHT_PX,
  CONTACT_SHADOW_OPACITY,
  CONTACT_SHADOW_WIDTH_PX,
} from './pack-cinematic-tokens';

type Props = { active: boolean };

export function PackContactShadow({ active }: Props) {
  const animate = active
    ? {
        scaleX: [1, 1.12, 1],
        opacity: [CONTACT_SHADOW_OPACITY, CONTACT_SHADOW_OPACITY * 0.7, CONTACT_SHADOW_OPACITY],
      }
    : {
        scaleX: [1, 0.85, 1],
        opacity: [
          CONTACT_SHADOW_OPACITY * 0.8,
          CONTACT_SHADOW_OPACITY,
          CONTACT_SHADOW_OPACITY * 0.8,
        ],
      };
  const transition = active
    ? { duration: 1.3, ease: 'easeInOut' as const }
    : {
        duration: 4,
        repeat: Number.POSITIVE_INFINITY,
        ease: 'easeInOut' as const,
        repeatType: 'mirror' as const,
      };

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        bottom: 8,
        width: CONTACT_SHADOW_WIDTH_PX,
        height: CONTACT_SHADOW_HEIGHT_PX,
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.9), transparent 72%)',
        filter: `blur(${CONTACT_SHADOW_BLUR_PX}px)`,
        opacity: CONTACT_SHADOW_OPACITY,
      }}
      animate={animate}
      transition={transition}
    />
  );
}
