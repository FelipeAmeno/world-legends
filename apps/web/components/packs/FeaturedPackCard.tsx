'use client';

/**
 * components/packs/FeaturedPackCard.tsx — Sprint 25 (AAA Pack Store)
 *
 * A loja hoje era um dashboard: N cards do mesmo tamanho numa grade, sem
 * hierarquia visual. Referência explícita do usuário: Clash Royale / Marvel
 * Snap sempre têm UM item em destaque com muito impacto visual, e o resto
 * da loja organiza as outras opções — isso é o que cria sensação de valor.
 *
 * Reaproveita 100% dos componentes cinematográficos da Sprint 22 (Pack
 * Experience 2.0) — VolumetricLight, SmokeLayer, PackContactShadow,
 * usePackTilt, PACK_VISUALS — em vez de reinventar a apresentação do pack;
 * a diferença é que aqui ele fica "em repouso" permanente (idle only, sem
 * fase CHARGE) porque é uma vitrine, não a tela de abertura.
 */

import type { PackDefinitionUI } from '@/lib/pack-logic';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { PackArt } from './PackArt';
import { PackContactShadow } from './PackContactShadow';
import { VolumetricLight } from './VolumetricLight';
import { usePackTilt } from './hooks/usePackTilt';
import { PACK_TILT_PERSPECTIVE_PX } from './pack-cinematic-tokens';
import { resolvePackVisual } from './pack-visuals';

// SmokeLayer/OrbitParticles usam `initial`+`animate` numéricos do Framer
// Motion — SSR desses valores causa hydration mismatch (ver comentário em
// OrbitParticles.tsx). São puramente decorativos/idle, então client-only
// remove o mismatch sem nenhuma mudança visual perceptível.
const SmokeLayer = dynamic(() => import('./SmokeLayer').then((m) => m.SmokeLayer), { ssr: false });
const OrbitParticles = dynamic(() => import('./OrbitParticles').then((m) => m.OrbitParticles), {
  ssr: false,
});

type Props = {
  pack: PackDefinitionUI;
  canAfford: boolean;
  onClick: () => void;
};

export function FeaturedPackCard({ pack, canAfford, onClick }: Props) {
  const vis = resolvePackVisual(pack.id);
  const tiltRef = usePackTilt<HTMLDivElement>();

  return (
    <div
      className="relative rounded-3xl border overflow-hidden mb-8"
      style={{
        borderColor: pack.borderColor,
        background: `radial-gradient(ellipse at 50% 15%, ${pack.glowColor} 0%, transparent 60%), linear-gradient(180deg, #060606 0%, #0a0a0a 100%)`,
        boxShadow: `0 0 70px -10px ${pack.glowColor}`,
      }}
    >
      {/* Kicker */}
      <div className="relative z-20 flex items-center justify-center gap-3 pt-5">
        <span className="h-px w-8 bg-white/20" />
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 font-bold">
          Em destaque
        </p>
        <span className="h-px w-8 bg-white/20" />
      </div>

      {/* Palco cinematográfico */}
      <div className="relative flex items-center justify-center h-[260px] sm:h-[320px]">
        <VolumetricLight color={pack.glowColor} active={false} />
        <div className="absolute inset-0 opacity-50">
          <SmokeLayer />
        </div>

        {/* Partículas orbitais */}
        <OrbitParticles borderColor={pack.borderColor} glowColor={pack.glowColor} />

        {/* Tilt 3D real reagindo ao ponteiro (Sprint 22) */}
        <div
          ref={tiltRef}
          className="pack-tilt-wrapper relative z-10"
          style={{ perspective: PACK_TILT_PERSPECTIVE_PX }}
        >
          <motion.button
            type="button"
            onClick={onClick}
            disabled={!canAfford}
            className={[
              'relative',
              canAfford ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
            ].join(' ')}
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ y: [0, -16, 0], rotateZ: [-1.5, 1.5, -1.5], rotateY: [0, 12, 0, -12, 0] }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
              repeatType: 'mirror',
            }}
            {...(canAfford ? { whileHover: { scale: 1.04 }, whileTap: { scale: 0.97 } } : {})}
          >
            <div
              className="w-48 h-64 sm:w-56 sm:h-72 rounded-3xl relative overflow-hidden"
              style={{
                background: vis.bg,
                border: `2px solid ${pack.borderColor}`,
                boxShadow: `0 0 50px ${pack.glowColor}, inset 0 0 70px ${pack.glowColor.replace(/[\d.]+\)$/, '0.15)')}`,
              }}
            >
              <div
                className="absolute inset-x-6 top-5 h-px opacity-20"
                style={{
                  background: `linear-gradient(90deg, transparent, ${pack.borderColor}, transparent)`,
                }}
              />
              <div
                className="absolute inset-x-6 bottom-5 h-px opacity-20"
                style={{
                  background: `linear-gradient(90deg, transparent, ${pack.borderColor}, transparent)`,
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 50% 30%, ${vis.shine}, transparent 70%)`,
                }}
              />
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.09) 50%, transparent 70%)',
                  backgroundSize: '200% 100%',
                }}
                animate={{ backgroundPositionX: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  className="mb-2"
                  style={{ filter: `drop-shadow(0 0 22px ${pack.glowColor})` }}
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                >
                  <PackArt
                    packId={pack.id}
                    borderColor={pack.borderColor}
                    glowColor={pack.glowColor}
                    size={116}
                  />
                </motion.div>
                <p
                  className="font-display text-xl tracking-[0.25em] opacity-90"
                  style={{ color: pack.borderColor.replace(/[\d.]+\)$/, '1)') }}
                >
                  {vis.label}
                </p>
              </div>
            </div>
          </motion.button>
        </div>

        <PackContactShadow active={false} />
      </div>

      {/* Info + CTA */}
      <div className="relative z-20 px-6 pb-6 -mt-4 text-center">
        <h3 className="font-display text-3xl tracking-[0.12em] text-parchment">{pack.name}</h3>
        <p className="text-muted text-xs mt-1">{pack.tagline}</p>
        <div className="flex items-center justify-center gap-4 text-[10px] text-white/50 mt-2">
          <span>📦 {pack.cardCount} cartas</span>
          <span>✨ {pack.guarantee}</span>
        </div>

        <motion.button
          type="button"
          onClick={onClick}
          disabled={!canAfford}
          {...(canAfford ? { whileHover: { scale: 1.03 }, whileTap: { scale: 0.97 } } : {})}
          className="mt-5 inline-flex items-center gap-3 rounded-full px-8 py-3 font-display text-lg tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(90deg, ${pack.borderColor}, ${pack.glowColor})`,
            color: '#0a0a0a',
            boxShadow: canAfford ? `0 0 34px ${pack.glowColor}` : 'none',
          }}
        >
          {canAfford ? 'ABRIR' : 'SALDO INSUFICIENTE'} · {pack.price.toLocaleString('pt-BR')}c
        </motion.button>
      </div>
    </div>
  );
}
