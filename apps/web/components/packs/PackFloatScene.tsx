'use client';

import type { PackDefinitionUI } from '@/lib/pack-logic';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import type { Phase } from './PackExperience';

type Props = {
  pack: PackDefinitionUI;
  phase: 'FLOAT' | 'CHARGE';
  onTap: () => void;
  onBack: () => void;
};

// ─── Definição visual por pack ────────────────────────────────────────────────

const PACK_VISUALS: Record<
  string,
  {
    bg: string;
    shine: string;
    icon: string;
    label: string;
  }
> = {
  classic: {
    bg: 'linear-gradient(145deg, #0d0020 0%, #1a0040 40%, #2d0060 70%, #4c1d95 100%)',
    shine: 'rgba(147,51,234,0.5)',
    icon: '📦',
    label: 'CLASSIC',
  },
  elite: {
    bg: 'linear-gradient(145deg, #000d2a 0%, #001a4d 40%, #002266 70%, #1e3a8a 100%)',
    shine: 'rgba(59,130,246,0.5)',
    icon: '⚡',
    label: 'ELITE',
  },
  legend: {
    bg: 'linear-gradient(145deg, #110800 0%, #2d1500 40%, #4a2200 70%, #78350f 100%)',
    shine: 'rgba(201,168,76,0.6)',
    icon: '👑',
    label: 'LEGEND',
  },
};

// ─── Partículas orbitais determinísticas ─────────────────────────────────────

const ORBIT = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * 360,
  r: i % 2 === 0 ? 120 : 100,
  size: 2 + (i % 3),
  dur: 2 + (i % 3) * 0.5,
  delay: i * 0.15,
}));

// ─── Component ───────────────────────────────────────────────────────────────

export function PackFloatScene({ pack, phase, onTap, onBack }: Props) {
  const vis = PACK_VISUALS[pack.id] ?? PACK_VISUALS.classic!;

  const isCharging = phase === 'CHARGE';

  return (
    <div className="flex flex-col items-center gap-8 w-full px-5">
      {/* Back button */}
      {!isCharging && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onBack}
          className="self-start text-muted text-xs flex items-center gap-1 hover:text-parchment transition-colors"
        >
          ← Trocar pack
        </motion.button>
      )}

      {/* Pack nome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p
          className="font-display text-3xl tracking-[0.2em]"
          style={{
            background: `linear-gradient(90deg, #fff, ${pack.glowColor})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {vis.label}
        </p>
        <p className="text-muted text-xs mt-1">{pack.tagline}</p>
      </motion.div>

      {/* Pack principal com animações */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 240, height: 300 }}
      >
        {/* Aura de fundo */}
        <motion.div
          className="absolute rounded-full blur-3xl"
          style={{ width: 240, height: 240, background: pack.glowColor }}
          animate={
            isCharging
              ? { opacity: [0.3, 0.9, 0.3], scale: [1, 1.5, 1] }
              : { opacity: [0.15, 0.35, 0.15], scale: [1, 1.1, 1] }
          }
          transition={{ duration: isCharging ? 0.4 : 2.5, repeat: Number.POSITIVE_INFINITY }}
        />

        {/* Anéis de pulso */}
        {isCharging &&
          [0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border"
              style={{ width: 160 + i * 40, height: 160 + i * 40, borderColor: pack.glowColor }}
              initial={{ opacity: 0.8, scale: 0.7 }}
              animate={{ opacity: 0, scale: 1.8 }}
              transition={{ duration: 1, delay: i * 0.25, repeat: Number.POSITIVE_INFINITY }}
            />
          ))}

        {/* Partículas orbitais */}
        {!isCharging && (
          <div className="absolute inset-0 pointer-events-none" style={{ top: '50%', left: '50%' }}>
            {ORBIT.map((p, i) => {
              const x = Math.cos((p.angle * Math.PI) / 180) * p.r;
              const y = Math.sin((p.angle * Math.PI) / 180) * p.r;
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: p.size,
                    height: p.size,
                    background: pack.borderColor.replace(/[\d.]+\)$/, '0.8)'),
                    boxShadow: `0 0 ${p.size * 3}px ${pack.glowColor}`,
                    top: -p.size / 2,
                    left: -p.size / 2,
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
        )}

        {/* O pack em si */}
        <motion.button
          onClick={onTap}
          className="relative z-10 cursor-pointer"
          style={{ transformStyle: 'preserve-3d' }}
          /* Flutuação idle */
          animate={
            isCharging
              ? {
                  // Vibração / charge
                  x: [0, -10, 10, -8, 8, -5, 5, -3, 3, 0],
                  rotateZ: [0, -5, 5, -4, 4, -2, 2, 0],
                  scale: [1, 1.06, 1.12, 1.1, 1.18, 1.14, 1.22],
                }
              : {
                  y: [0, -14, 0],
                  rotateZ: [-1, 1.5, -1],
                  rotateY: [0, 10, 0, -10, 0],
                }
          }
          transition={
            isCharging
              ? { duration: 1.3, ease: 'easeInOut' }
              : {
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: 'easeInOut',
                  repeatType: 'mirror',
                }
          }
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Corpo do pack */}
          <div
            className="w-44 h-60 rounded-3xl relative overflow-hidden"
            style={{
              background: vis.bg,
              border: `2px solid ${pack.borderColor}`,
              boxShadow: `0 0 40px ${pack.glowColor}, inset 0 0 60px ${pack.glowColor.replace(/[\d.]+\)$/, '0.15)')}`,
            }}
          >
            {/* Linhas decorativas */}
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

            {/* Radial interno */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 50% 30%, ${vis.shine}, transparent 70%)`,
              }}
            />

            {/* Shimmer sweep */}
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

            {/* Ícone central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                className="text-6xl mb-2"
                style={{ filter: `drop-shadow(0 0 20px ${pack.glowColor})` }}
                animate={{ scale: isCharging ? [1, 1.2, 1] : [1, 1.06, 1] }}
                transition={{ duration: isCharging ? 0.35 : 2, repeat: Number.POSITIVE_INFINITY }}
              >
                {vis.icon}
              </motion.div>
              <p
                className="font-display text-xl tracking-[0.25em] opacity-80"
                style={{ color: pack.borderColor.replace(/[\d.]+\)$/, '1)') }}
              >
                {vis.label}
              </p>
              <p className="text-white/30 text-[9px] mt-0.5 tracking-widest uppercase">
                World Legends
              </p>
            </div>

            {/* Charge glow overlay */}
            {isCharging && (
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle, ${pack.glowColor}, transparent 70%)`,
                }}
                animate={{ opacity: [0.2, 0.7, 0.2] }}
                transition={{ duration: 0.4, repeat: Number.POSITIVE_INFINITY }}
              />
            )}
          </div>
        </motion.button>
      </div>

      {/* Instrução / charge text */}
      <motion.div
        className="text-center min-h-[48px] flex flex-col items-center justify-center"
        animate={isCharging ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
        transition={isCharging ? { duration: 0.1 } : { duration: 2, repeat: Number.POSITIVE_INFINITY }}
      >
        {isCharging ? (
          <motion.p
            className="font-display text-xl tracking-widest"
            style={{
              background: `linear-gradient(90deg,${pack.borderColor},#fff,${pack.borderColor})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: `drop-shadow(0 0 12px ${pack.glowColor})`,
            }}
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.06, 1] }}
            transition={{ duration: 0.45, repeat: Number.POSITIVE_INFINITY }}
          >
            ABRINDO...
          </motion.p>
        ) : (
          <>
            <p className="text-parchment text-sm font-medium">▼  Toque no pack para abrir</p>
            <p className="text-muted text-[10px] mt-1">
              {pack.guarantee} · {pack.cardCount} cartas
            </p>
          </>
        )}
      </motion.div>

      {/* Preço */}
      {!isCharging && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="font-display text-lg gold-text"
        >
          {pack.price.toLocaleString('pt-BR')}c
        </motion.p>
      )}
    </div>
  );
}
