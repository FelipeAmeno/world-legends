'use client';

/**
 * components/packs/VolumetricLight.tsx — Sprint 22 (Pack Experience 2.0, item 2)
 *
 * Raios de luz volumétrica atrás do pack — `repeating-conic-gradient` gera
 * N feixes igualmente espaçados (sem listar cada stop à mão), rotação
 * lenta contínua, `mask-image` radial pra desvanecer nas bordas (raios
 * saindo de um ponto de luz, não um "cata-vento" preenchendo o quadrado
 * inteiro). 100% CSS — sem canvas, sem imagem.
 */

import {
  VOLUMETRIC_OPACITY_CHARGE,
  VOLUMETRIC_OPACITY_IDLE,
  VOLUMETRIC_RAY_COUNT,
  VOLUMETRIC_ROTATE_DURATION_S,
} from './pack-cinematic-tokens';

type Props = {
  color: string;
  /** true = fase de carregamento (mais intenso), false = flutuando em repouso. */
  active: boolean;
};

export function VolumetricLight({ color, active }: Props) {
  const stripeWidth = 360 / VOLUMETRIC_RAY_COUNT;
  const beamWidth = stripeWidth * 0.18;
  const opacity = active ? VOLUMETRIC_OPACITY_CHARGE : VOLUMETRIC_OPACITY_IDLE;

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
      style={{ opacity, transition: 'opacity 0.4s ease-out' }}
    >
      <div
        className="volumetric-spin"
        style={{
          width: '220%',
          height: '220%',
          background: `repeating-conic-gradient(from 0deg, ${color} 0deg, ${color} ${beamWidth}deg, transparent ${beamWidth}deg, transparent ${stripeWidth}deg)`,
          WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 62%)',
          maskImage: 'radial-gradient(circle, black 0%, transparent 62%)',
          filter: 'blur(6px)',
          animationDuration: `${VOLUMETRIC_ROTATE_DURATION_S}s`,
        }}
      />
    </div>
  );
}
