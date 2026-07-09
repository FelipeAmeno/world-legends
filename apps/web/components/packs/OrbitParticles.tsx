'use client';

/**
 * components/packs/OrbitParticles.tsx — Sprint 25 (AAA Pack Store)
 *
 * Partículas orbitais ambiente atrás do Featured Pack. Extraído de
 * `FeaturedPackCard.tsx` pra ser importado via `next/dynamic({ ssr: false })`
 * — igual a `SmokeLayer`, usa `initial`/`animate` do Framer Motion com
 * `opacity`/`scale` numéricos, o que causa hydration mismatch quando
 * server-renderizado (o valor inicial vira string no HTML SSR mas número
 * no primeiro render client antes do Framer assumir o controle). Como é
 * puramente decorativo/idle, não precisa aparecer no HTML inicial —
 * cliente-only remove o mismatch sem mudar nada visualmente.
 */

import { motion } from 'framer-motion';

const ORBIT = Array.from({ length: 10 }, (_, i) => ({
  angle: (i / 10) * 360,
  r: i % 2 === 0 ? 150 : 126,
  size: 2 + (i % 3),
  dur: 2.4 + (i % 3) * 0.5,
  delay: i * 0.18,
}));

type Props = { borderColor: string; glowColor: string };

export function OrbitParticles({ borderColor, glowColor }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ top: '50%', left: '50%' }}>
      {ORBIT.map((p) => {
        const x = Math.cos((p.angle * Math.PI) / 180) * p.r;
        const y = Math.sin((p.angle * Math.PI) / 180) * p.r;
        return (
          <motion.div
            key={p.angle}
            className="absolute rounded-full"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: borderColor.replace(/[\d.]+\)$/, '0.8)'),
              boxShadow: `0 0 ${p.size * 3}px ${glowColor}`,
              top: `${-p.size / 2}px`,
              left: `${-p.size / 2}px`,
              x,
              y,
            }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.7, 1.3, 0.7] }}
            transition={{
              duration: p.dur,
              delay: p.delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />
        );
      })}
    </div>
  );
}
