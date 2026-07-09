'use client';

/**
 * components/packs/LightBirth.tsx — Sprint 22 (Pack Experience 2.0, item 10:
 * "carta nasce da luz").
 *
 * Núcleo branco que converge de um flash grande pro tamanho da carta no
 * instante exato do flip — a carta "nasce" de dentro da luz em vez de só
 * aparecer. Monta uma única vez por reveal (a própria `CardRevealScene`
 * troca a `key` a cada carta), então não precisa de lógica de reset.
 */

import { motion } from 'framer-motion';
import { LIGHT_BIRTH_DURATION_MS, LIGHT_BIRTH_START_SCALE } from './pack-cinematic-tokens';

type Props = { color: string };

export function LightBirth({ color }: Props) {
  return (
    <motion.div
      className="absolute inset-0 rounded-xl pointer-events-none"
      style={{
        background: `radial-gradient(circle, #ffffff 0%, ${color} 45%, transparent 75%)`,
      }}
      initial={{ opacity: 1, scale: LIGHT_BIRTH_START_SCALE }}
      animate={{ opacity: 0, scale: 1 }}
      transition={{ duration: LIGHT_BIRTH_DURATION_MS / 1000, ease: 'easeOut' }}
    />
  );
}
