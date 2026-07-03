'use client';

import type { PackDefinitionUI } from '@/lib/pack-logic';
import { useEffect, useState } from 'react';

type Props = {
  pack: PackDefinitionUI;
  opening: boolean; // true = animação de abertura rodando
  onOpen: () => void;
};

export function SealedPackView({ pack, opening, onOpen }: Props) {
  const [clicked, setClicked] = useState(false);

  // Resetar quando pack muda
  useEffect(() => {
    setClicked(false);
  }, [pack.id]);

  const handleClick = () => {
    if (clicked || opening) return;
    setClicked(true);
    onOpen();
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-8">
      {/* Instrução */}
      <p className="text-muted text-sm animate-[fadeIn_0.5s_ease-out]">
        {opening ? 'Abrindo…' : 'Toque no pack para abrir'}
      </p>

      {/* Pack principal */}
      <div className="relative flex items-center justify-center">
        {/* Aura de fundo */}
        <div
          className="absolute rounded-full blur-3xl"
          style={{
            width: 240,
            height: 240,
            background: pack.glowColor.replace(')', ', 0.25)').replace('rgba', 'rgba'),
            animation: opening ? 'none' : 'packGlow 2s ease-in-out infinite',
            ['--glow-color' as string]: pack.glowColor,
          }}
        />

        {/* O pack em si */}
        <button
          onClick={handleClick}
          disabled={opening || clicked}
          className={[
            'relative z-10 select-none transition-all duration-300',
            opening ? 'pack-burst' : 'pack-float pack-glow cursor-pointer hover:scale-105',
            !opening && !clicked ? 'active:scale-95' : '',
          ].join(' ')}
          style={{ ['--glow-color' as string]: pack.glowColor }}
          aria-label="Abrir pack"
        >
          {/* Corpo do pack */}
          <div
            className="relative w-48 h-64 rounded-3xl border-2 flex flex-col items-center justify-center overflow-hidden"
            style={{
              background: `linear-gradient(145deg, ${pack.gradientFrom}, ${pack.gradientTo})`,
              borderColor: pack.borderColor,
              boxShadow: `inset 0 0 60px ${pack.glowColor}`,
            }}
          >
            {/* Gradiente interno */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(ellipse at 50% 20%, ${pack.glowColor}, transparent 70%)`,
              }}
            />

            {/* Linhas decorativas */}
            <div
              className="absolute top-5 left-5 right-5 h-px opacity-20"
              style={{ background: pack.borderColor }}
            />
            <div
              className="absolute bottom-5 left-5 right-5 h-px opacity-20"
              style={{ background: pack.borderColor }}
            />

            {/* Ícone central */}
            <div
              className="relative z-10 text-7xl mb-4"
              style={{ filter: `drop-shadow(0 0 24px ${pack.glowColor})` }}
            >
              {pack.icon}
            </div>

            {/* Texto */}
            <p
              className="relative z-10 font-display text-3xl tracking-[0.15em]"
              style={{ color: pack.borderColor.replace(/[\d.]+\)$/, '1)') }}
            >
              {(pack.name.split(' ')[0] ?? pack.name).toUpperCase()}
            </p>
            <p className="relative z-10 text-muted text-[10px] uppercase tracking-widest mt-1">
              World Legends
            </p>

            {/* Shimmer sweep */}
            {!opening && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s infinite',
                }}
              />
            )}
          </div>
        </button>

        {/* Partículas orbitais (antes de abrir) */}
        {!opening && <OrbitalParticles color={pack.glowColor} />}
      </div>

      {/* Info do pack selecionado */}
      {!opening && (
        <div className="text-center animate-[fadeIn_0.6s_ease-out]">
          <p className="text-parchment font-semibold text-sm">{pack.name}</p>
          <p className="text-muted text-xs mt-1">
            {pack.cardCount} cartas · {pack.guarantee}
          </p>
          <p className="gold-text font-display text-lg mt-1">
            {pack.price.toLocaleString('pt-BR')}c
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Partículas orbitais ──────────────────────────────────────────────────────

// Posições determinísticas (sem Math.random para evitar hydration mismatch)
const ORBITAL_POSITIONS = [
  { angle: 0, r: 110, dur: 2.0, size: 3, delay: 0 },
  { angle: 45, r: 120, dur: 2.4, size: 2, delay: 0.3 },
  { angle: 90, r: 115, dur: 1.8, size: 4, delay: 0.6 },
  { angle: 135, r: 108, dur: 2.2, size: 2, delay: 0.9 },
  { angle: 180, r: 118, dur: 2.6, size: 3, delay: 0.2 },
  { angle: 225, r: 112, dur: 2.0, size: 2, delay: 0.7 },
  { angle: 270, r: 122, dur: 1.9, size: 4, delay: 0.4 },
  { angle: 315, r: 109, dur: 2.3, size: 2, delay: 1.0 },
];

function OrbitalParticles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {ORBITAL_POSITIONS.map((p, i) => {
        const x = Math.cos((p.angle * Math.PI) / 180) * p.r;
        const y = Math.sin((p.angle * Math.PI) / 180) * p.r;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: color,
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              boxShadow: `0 0 ${p.size * 2}px ${color}`,
              animation: `pulseGold ${p.dur}s ease-in-out ${p.delay}s infinite`,
              opacity: 0.6,
            }}
          />
        );
      })}
    </div>
  );
}
