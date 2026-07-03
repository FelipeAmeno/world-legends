'use client';

/**
 * FlippableCard — o componente mais caprichado do World Legends.
 *
 * Estados:
 *   sealed   → carta de costas (WL logo + shimmer cor da raridade)
 *   flipping → animação 3D 0.72s
 *   revealed → face da carta com efeito de entrada por raridade
 *
 * Efeitos por raridade:
 *   common       → fade, glow cinza sutil
 *   rare         → varredura roxa + partículas leves
 *   elite        → flash azul + scale-up
 *   legendary    → chuva de ouro (20 partículas) + glow pulsante dourado
 *   ultra        → varredura arco-íris + flash branco
 *   world_cup_hero → shimmer platinado + desaceleração dramática
 */

import { OvrDisplay } from '@/components/ui/OvrDisplay';
import { RarityBadge } from '@/components/ui/RarityBadge';
import { RARITY_VISUAL } from '@/lib/collection-data';
import type { DrawnCard } from '@/lib/pack-logic';
import type { RevealEffect } from '@/lib/pack-logic';
import { useEffect, useState } from 'react';

// ─── Partículas por raridade ──────────────────────────────────────────────────

type ParticleConfig = { count: number; size: [number, number]; speed: number };

const PARTICLE_CFG: Record<RevealEffect, ParticleConfig> = {
  common: { count: 0, size: [2, 4], speed: 60 },
  rare: { count: 8, size: [3, 5], speed: 70 },
  elite: { count: 12, size: [3, 6], speed: 80 },
  legendary: { count: 20, size: [4, 7], speed: 90 },
  ultra: { count: 24, size: [4, 8], speed: 100 },
  world_cup_hero: { count: 28, size: [5, 9], speed: 110 },
};

// Posições de partícula determinísticas (sem Math.random → sem hydration issues)
const PARTICLE_POSITIONS = Array.from({ length: 28 }, (_, i) => ({
  tx: Math.round(Math.cos((i / 28) * Math.PI * 2) * (40 + (i % 3) * 20)),
  ty: Math.round(Math.sin((i / 28) * Math.PI * 2) * (40 + (i % 3) * 20)),
  dur: 0.5 + (i % 5) * 0.12,
  delay: (i % 6) * 40,
  size: 3 + (i % 3),
}));

// ─── Card back (face de costas) ────────────────────────────────────────────────

const BACK_HINT: Record<RevealEffect, { border: string; shimmer: string; label: string }> = {
  common: { border: 'rgba(107,114,128,0.4)', shimmer: 'rgba(107,114,128,0.08)', label: '?' },
  rare: { border: 'rgba(147,51,234,0.5)', shimmer: 'rgba(147,51,234,0.12)', label: '?' },
  elite: { border: 'rgba(59,130,246,0.6)', shimmer: 'rgba(59,130,246,0.15)', label: '?' },
  legendary: { border: 'rgba(201,168,76,0.7)', shimmer: 'rgba(201,168,76,0.18)', label: '?' },
  ultra: { border: 'rgba(236,72,153,0.8)', shimmer: 'rgba(236,72,153,0.20)', label: '?' },
  world_cup_hero: {
    border: 'rgba(240,244,255,0.9)',
    shimmer: 'rgba(240,244,255,0.22)',
    label: '?',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  drawn: DrawnCard;
  flipped: boolean; // controlado pelo pai
  onFlip: () => void;
  delay?: number; // ms de delay para entrada escalonada
};

// ─── Component ───────────────────────────────────────────────────────────────

export function FlippableCard({ drawn, flipped, onFlip, delay = 0 }: Props) {
  const [visible, setVisible] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [showFlash, setShowFlash] = useState(false);

  // Entrada escalonada
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  // Quando flipa — dispara efeitos
  useEffect(() => {
    if (!flipped) return;
    // Flash no meio do flip (~360ms)
    const tFlash = setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 350);
    }, 320);
    // Partículas logo depois
    const tPart = setTimeout(() => {
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 900);
    }, 400);
    return () => {
      clearTimeout(tFlash);
      clearTimeout(tPart);
    };
  }, [flipped]);

  if (!visible) return <div className="w-[130px] h-[175px]" />;

  const { card, effect, glowColor, particleColor } = drawn;
  const visual = RARITY_VISUAL[card.rarityCode];
  const backHint = BACK_HINT[effect];
  const cfg = PARTICLE_CFG[effect];

  const isSpecial = effect === 'legendary' || effect === 'ultra' || effect === 'world_cup_hero';

  return (
    <div className="relative card-scene" style={{ width: 130, height: 175 }}>
      {/* Flash de revelação */}
      {showFlash && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none z-30 reveal-flash"
          style={{ background: glowColor, borderRadius: 12 }}
        />
      )}

      {/* Partículas */}
      {showParticles && cfg.count > 0 && (
        <div
          className="absolute inset-0 pointer-events-none z-40 overflow-visible"
          style={{ width: 130, height: 175, top: 0, left: 0 }}
        >
          {PARTICLE_POSITIONS.slice(0, cfg.count).map((p, i) => (
            <div
              key={i}
              className="particle"
              style={{
                width: p.size,
                height: p.size,
                top: '50%',
                left: '50%',
                marginLeft: -p.size / 2,
                marginTop: -p.size / 2,
                background: particleColor,
                boxShadow: `0 0 ${p.size * 2}px ${particleColor}`,
                ['--tx' as string]: `${p.tx}px`,
                ['--ty' as string]: `${p.ty}px`,
                ['--dur' as string]: `${p.dur}s`,
                ['--delay' as string]: `${p.delay}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Container 3D */}
      <div
        className={`card-3d relative w-full h-full ${flipped ? 'flipped' : ''}`}
        onClick={!flipped ? onFlip : undefined}
        style={{ cursor: flipped ? 'default' : 'pointer' }}
      >
        {/* FACE SEALED (costas) */}
        <div
          className={[
            'card-face-sealed w-full h-full rounded-xl border-2 flex flex-col items-center justify-center overflow-hidden',
            !flipped ? 'hover:scale-[1.02] transition-transform duration-150' : '',
          ].join(' ')}
          style={{
            background: '#0a0c14',
            borderColor: backHint.border,
            boxShadow: `0 0 20px ${backHint.shimmer}, inset 0 0 30px ${backHint.shimmer}`,
          }}
        >
          {/* Shimmer interno */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${backHint.shimmer}, transparent 70%)`,
            }}
          />

          {/* WL logo */}
          <div className="relative z-10 text-center">
            <p
              className="font-display text-4xl"
              style={{
                color: backHint.border
                  .replace('0.', '')
                  .replace(')', ',0.9)')
                  .replace('rgba(', 'rgba('),
              }}
            >
              WL
            </p>
            <p className="text-[8px] tracking-[0.3em] text-muted mt-1 uppercase">World Legends</p>
          </div>

          {/* Sweep animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, transparent 30%, ${backHint.shimmer} 50%, transparent 70%)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s infinite',
              }}
            />
          </div>

          {/* Toque para virar */}
          {!flipped && (
            <p className="absolute bottom-3 text-[8px] text-muted/60 uppercase tracking-widest">
              toque para revelar
            </p>
          )}
        </div>

        {/* FACE REVEALED (frente) */}
        <div
          className={[
            'card-face-revealed w-full h-full rounded-xl border-2 overflow-hidden flex flex-col',
            visual.bgClass,
            visual.borderClass,
            flipped ? `${visual.glowClass} card-entrance` : '',
          ].join(' ')}
          style={
            flipped
              ? {
                  boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor.replace(/[\d.]+\)$/, '0.3)')}`,
                }
              : {}
          }
        >
          {/* Ultra/WCH: overlay especial */}
          {(effect === 'ultra' || effect === 'world_cup_hero') && (
            <div
              className={[
                'absolute inset-0 pointer-events-none opacity-15 rounded-xl',
                effect === 'ultra' ? 'rainbow-shimmer' : 'platinum-shimmer',
              ].join(' ')}
            />
          )}

          {/* Legendary: gold shimmer extra */}
          {effect === 'legendary' && (
            <div
              className="absolute inset-0 pointer-events-none opacity-10 rounded-xl"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(201,168,76,0.8), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          )}

          {/* Raridade + posição */}
          <div className="flex items-start justify-between px-2 pt-2 relative z-10">
            <RarityBadge
              code={card.rarityCode}
              label={card.rarityCode === 'world_cup_hero' ? 'WCH' : card.rarityLabel}
              size="xs"
            />
            <PosBadge position={card.position} />
          </div>

          {/* OVR — elemento assinatura */}
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="text-center">
              <OvrDisplay value={card.overall} size="lg" />
              {isSpecial && (
                <div
                  className="w-full h-px mt-1 mx-auto"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Nome + bandeira */}
          <div className="px-1.5 pb-2 text-center relative z-10">
            <p className="text-parchment font-bold text-[11px] leading-tight truncate">
              {card.displayName}
            </p>
            <p className="text-muted text-[9px] mt-0.5">
              {card.flagEmoji} {card.era}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PosBadge ────────────────────────────────────────────────────────────────

const POS_BG: Partial<Record<string, string>> = {
  GK: 'bg-amber-700',
  CB: 'bg-blue-800',
  LB: 'bg-blue-800',
  RB: 'bg-blue-800',
  CDM: 'bg-green-800',
  CM: 'bg-green-800',
  CAM: 'bg-green-800',
  LW: 'bg-red-800',
  RW: 'bg-red-800',
  ST: 'bg-red-800',
  CF: 'bg-red-800',
};

function PosBadge({ position }: { position: string }) {
  const bg = POS_BG[position] ?? 'bg-gray-700';
  return (
    <span className={`${bg} text-white text-[7px] font-bold px-1 py-0.5 rounded`}>{position}</span>
  );
}
