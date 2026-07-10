'use client';

import { motion } from 'framer-motion';

type PackId = 'starter' | 'classic' | 'national' | 'elite' | 'hero' | 'legend' | 'goat';

type Props = {
  packId: PackId;
  borderColor: string;
  glowColor: string;
  size?: number;
};

// Sprint 33.6 — escalada de riqueza visual por tier (1 = Starter, 7 = GOAT),
// mesmo princípio da escalada de raridade do Card Engine (mais raro = mais
// presença visual). Cada tier soma camadas em cima do "pouch" base, nunca
// troca a silhueta inteira — assim os 7 pacotes continuam claramente da
// mesma família de produto, só com exclusividade crescente (mood Clash
// Royale/Marvel Snap: baús comuns são discretos, os lendários têm luz,
// facetas e aura própria — sem copiar o layout de nenhum dos dois).
const PACK_TIER: Record<PackId, number> = {
  starter: 1,
  classic: 2,
  national: 3,
  elite: 4,
  hero: 5,
  legend: 6,
  goat: 7,
};

// ─── Emblema por pack — silhueta simples, reconhecível sem texto ─────────────

function Emblem({ packId, color }: { packId: PackId; color: string }) {
  switch (packId) {
    case 'starter':
      return (
        <path
          d="M0,-11 L2.9,-3.4 L11,-3.4 L4.6,1.6 L7,9.3 L0,4.6 L-7,9.3 L-4.6,1.6 L-11,-3.4 L-2.9,-3.4 Z"
          fill={color}
        />
      );
    case 'classic':
      return (
        <path
          d="M0,-11 C5,-11 9,-8.5 9,-4 C9,3 5,9 0,12 C-5,9 -9,3 -9,-4 C-9,-8.5 -5,-11 0,-11 Z"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      );
    case 'national':
      return (
        <g>
          <circle cx="0" cy="0" r="10" fill="none" stroke={color} strokeWidth="2" />
          <path
            d="M0,-5.5 L1.4,-1.7 L5.5,-1.7 L2.3,0.8 L3.5,4.7 L0,2.3 L-3.5,4.7 L-2.3,0.8 L-5.5,-1.7 L-1.4,-1.7 Z"
            fill={color}
          />
        </g>
      );
    case 'elite':
      return <path d="M2,-12 L-6,1 L-1,1 L-2,12 L7,-2 L2,-2 Z" fill={color} />;
    case 'hero':
      return (
        <path
          d="M0,-11 C6,-11 9,-7 9,-2 C9,5 4,10 0,12 C-4,10 -9,5 -9,-2 C-9,-7 -6,-11 0,-11 Z M0,-6 L0,4 M-4,-1 L4,-1"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      );
    case 'legend':
      return (
        <path
          d="M-9,4 L-9,-3 L-5,1 L0,-7 L5,1 L9,-3 L9,4 Z"
          fill={color}
          stroke={color}
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      );
    case 'goat':
      return (
        <g fill={color}>
          <path d="M0,-11 C4,-8 6,-3 6,2 C6,7 3,11 0,11 C-3,11 -6,7 -6,2 C-6,-3 -4,-8 0,-11 Z" />
          <rect x="-7" y="8" width="14" height="2.4" rx="1.2" />
        </g>
      );
    default:
      return null;
  }
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function PackArt({ packId, borderColor, glowColor, size = 96 }: Props) {
  const w = size * 0.72;
  const h = size;
  const uid = `pack-${packId}`;
  const tier = PACK_TIER[packId];
  const hasFacets = tier >= 3; // national+
  const hasRays = tier >= 5; // hero+
  const hasAura = tier >= 7; // goat

  return (
    <div style={{ width: w, height: h, position: 'relative' }}>
      {/* Aura pulsante externa — só no tier máximo (GOAT), o "melhor de todos" */}
      {hasAura && (
        <motion.div
          style={{
            position: 'absolute',
            inset: -size * 0.18,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
          animate={{ opacity: [0.35, 0.7, 0.35], scale: [0.94, 1.04, 0.94] }}
          transition={{ duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
      )}

      {/* Raios de luz traseiros — hero/legend/goat, mesma técnica do VolumetricLight */}
      {hasRays && (
        <div
          className="volumetric-spin"
          style={{
            position: 'absolute',
            inset: 0,
            margin: 'auto',
            width: w * 2.1,
            height: w * 2.1,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            background: `repeating-conic-gradient(from 0deg, ${borderColor} 0deg, ${borderColor} 4deg, transparent 4deg, transparent ${360 / (tier === 7 ? 14 : 10)}deg)`,
            WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 62%)',
            maskImage: 'radial-gradient(circle, black 0%, transparent 62%)',
            opacity: 0.3,
            filter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      )}

      <svg
        width={w}
        height={h}
        viewBox="0 0 72 100"
        style={{ overflow: 'visible', position: 'relative' }}
      >
        <defs>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
          </linearGradient>
          <linearGradient id={`${uid}-seal`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={borderColor} stopOpacity="0.2" />
            <stop offset="50%" stopColor={borderColor} stopOpacity="0.9" />
            <stop offset="100%" stopColor={borderColor} stopOpacity="0.2" />
          </linearGradient>
          <filter id={`${uid}-shadow`} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.55)" />
          </filter>
        </defs>

        {/* Corpo do pacote — silhueta "pouch" premium, nada de caixa de papelão */}
        <path
          d="M 14,8 Q 36,-2 58,8 L 64,30 Q 68,60 58,90 Q 36,100 14,90 Q 4,60 8,30 Z"
          fill={`url(#${uid}-body)`}
          stroke={borderColor}
          strokeWidth={tier >= 6 ? 2 : 1.4}
          filter={`url(#${uid}-shadow)`}
        />

        {/* Facetas internas — national+ (tier 3), reforça "material precioso"
            crescente sem trocar a silhueta do pouch */}
        {hasFacets && (
          <g opacity={0.22} stroke={borderColor} strokeWidth="0.5">
            <path d="M 18,16 L 54,16" />
            <path d="M 14,40 L 58,40" />
            <path d="M 16,64 L 56,64" />
            <path d="M 20,82 L 52,82" />
          </g>
        )}

        {/* Costura lateral */}
        <path
          d="M 14,8 Q 4,30 8,30 Q 4,60 14,90"
          fill="none"
          stroke={borderColor}
          strokeWidth="0.6"
          strokeDasharray="1.5 2"
          opacity="0.5"
        />
        <path
          d="M 58,8 Q 68,30 64,30 Q 68,60 58,90"
          fill="none"
          stroke={borderColor}
          strokeWidth="0.6"
          strokeDasharray="1.5 2"
          opacity="0.5"
        />

        {/* Selo metálico horizontal (topo) */}
        <rect x="10" y="24" width="52" height="7" rx="3.5" fill={`url(#${uid}-seal)`} />

        {/* Anel de destaque ao redor do emblema — hero+ (tier 5), reforça
            exclusividade crescente igual ao ribbon de raridade das cartas */}
        {hasRays && (
          <circle
            cx="36"
            cy="58"
            r="15"
            fill="none"
            stroke={borderColor}
            strokeWidth="0.8"
            opacity="0.5"
          />
        )}

        {/* Emblema central */}
        <g transform="translate(36,58)">
          <Emblem packId={packId} color={borderColor} />
        </g>

        {/* Brilho diagonal fixo */}
        <path d="M 16,14 L 26,10 L 20,50 L 10,54 Z" fill="rgba(255,255,255,0.10)" clipPath="none" />
      </svg>

      {/* Sheen animado por cima — reforça "produto premium" */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `linear-gradient(115deg, transparent 30%, ${glowColor} 48%, transparent 66%)`,
          backgroundSize: '250% 100%',
          mixBlendMode: 'screen',
          opacity: 0.8,
        }}
        animate={{ backgroundPositionX: ['-100%', '200%'] }}
        transition={{
          duration: 3.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
          repeatDelay: 0.6,
        }}
      />
    </div>
  );
}
