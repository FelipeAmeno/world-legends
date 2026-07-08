import {
  RARITY_KIT_OVERRIDE,
  getJerseySurname,
  getKitColors,
  getShirtNumber,
} from '@/lib/kit-data';
import type { RarityCode } from '@world-legends/types';

type Props = {
  playerId: string;
  displayName: string;
  nationality: string;
  position: string;
  rarityCode: RarityCode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
};

const SIZES = {
  xs: { w: 52, h: 70, numSize: 20, nameSize: 5 },
  sm: { w: 72, h: 96, numSize: 28, nameSize: 6.5 },
  md: { w: 100, h: 130, numSize: 38, nameSize: 8 },
  lg: { w: 130, h: 168, numSize: 48, nameSize: 10 },
};

const JERSEY_PATH =
  'M 28,10 Q 50,22 72,10 L 88,20 L 100,42 L 83,47 L 83,120 L 17,120 L 17,47 L 0,42 L 12,20 Z';
const VB = '0 0 100 130';

export function JerseyArt({
  playerId,
  displayName,
  nationality,
  position,
  rarityCode,
  size = 'md',
}: Props) {
  const kit = getKitColors(nationality);
  const over = RARITY_KIT_OVERRIDE[rarityCode];
  const num = getShirtNumber(playerId, position);
  const name = getJerseySurname(displayName);
  const dim = SIZES[size];
  const uid = `j-${playerId}-${rarityCode}`;

  const pattern = kit.pattern ?? (kit.stripes ? 'stripes' : 'solid');
  const patternColor = kit.patternColor ?? kit.stripeColor ?? '#fff';

  const collarColor = over.collarColor === 'inherit' ? kit.secondary : over.collarColor;
  const cuffColor = over.cuffColor === 'inherit' ? kit.secondary : over.cuffColor;
  const hemColor = over.hemColor === 'inherit' ? kit.secondary : over.hemColor;
  const numColor = over.numberColor === 'inherit' ? kit.number : over.numberColor;
  const nameColor = over.nameColor === 'inherit' ? kit.name : over.nameColor;

  return (
    <svg
      width={dim.w}
      height={dim.h}
      viewBox={VB}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Main jersey gradient */}
        <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={kit.primary} />
          <stop offset="100%" stopColor={kit.shadow} />
        </linearGradient>

        {/* Stripes (Argentina, Paraguai etc.) */}
        {pattern === 'stripes' && (
          <pattern
            id={`${uid}-st`}
            x="0"
            y="0"
            width="13"
            height="130"
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width="6.5" height="130" fill={kit.primary} />
            <rect x="6.5" y="0" width="6.5" height="130" fill={patternColor} />
          </pattern>
        )}

        {/* Checkerboard (Croácia) */}
        {pattern === 'checker' && (
          <pattern
            id={`${uid}-ck`}
            x="0"
            y="0"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <rect x="0" y="0" width="14" height="14" fill={kit.primary} />
            <rect x="0" y="0" width="7" height="7" fill={patternColor} />
            <rect x="7" y="7" width="7" height="7" fill={patternColor} />
          </pattern>
        )}

        {/* Jersey clip */}
        <clipPath id={`${uid}-clip`}>
          <path d={JERSEY_PATH} />
        </clipPath>

        {/* Fabric highlight */}
        <linearGradient id={`${uid}-hl`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Textura do tecido — trama fina diagonal, bem sutil */}
        <pattern
          id={`${uid}-fabric`}
          x="0"
          y="0"
          width="3"
          height="3"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="3" height="3" fill="transparent" />
          <line x1="0" y1="0" x2="0" y2="3" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" />
        </pattern>

        {/* Legendary / WCH gold shimmer */}
        {over.jerseyGold && (
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(201,168,76,0.15)" />
            <stop offset="50%" stopColor="rgba(230,200,90,0.08)" />
            <stop offset="100%" stopColor="rgba(201,168,76,0.15)" />
          </linearGradient>
        )}

        {/* Number drop shadow */}
        <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.7)" />
        </filter>

        {/* Glow filter for high rarities */}
        {over.jerseyGlowColor && (
          <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={over.jerseyGlowColor} result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Drop shadow */}
      <path
        d={JERSEY_PATH}
        fill="rgba(0,0,0,0.35)"
        transform="translate(2,3)"
        clipPath={`url(#${uid}-clip)`}
      />

      {/* Jersey base fill */}
      <path
        d={JERSEY_PATH}
        fill={`url(#${uid}-${pattern === 'stripes' ? 'st' : pattern === 'checker' ? 'ck' : 'g'})`}
        stroke={kit.secondary}
        strokeWidth="1.5"
        {...(over.jerseyGlowColor ? { filter: `url(#${uid}-glow)` } : {})}
      />

      {/* Gold/shimmer overlay for legendary/WCH */}
      {over.jerseyGold && (
        <path d={JERSEY_PATH} fill={`url(#${uid}-gold)`} clipPath={`url(#${uid}-clip)`} />
      )}

      {/* Fabric highlight (top-left corner sheen) */}
      <path d={JERSEY_PATH} fill={`url(#${uid}-hl)`} clipPath={`url(#${uid}-clip)`} />

      {/* Textura do tecido — trama diagonal por cima de tudo, bem sutil */}
      <path d={JERSEY_PATH} fill={`url(#${uid}-fabric)`} clipPath={`url(#${uid}-clip)`} />

      {/* ── Brasão simplificado (peito, lado esquerdo) — roundel discreto ── */}
      <g opacity="0.9" clipPath={`url(#${uid}-clip)`}>
        <circle
          cx="30"
          cy="26"
          r="4.2"
          fill={kit.secondary}
          stroke="rgba(0,0,0,0.35)"
          strokeWidth="0.4"
        />
        <circle cx="30" cy="26" r="2.7" fill={kit.primary} />
        <path
          d="M 30,24.3 L 30.55,25.5 L 31.85,25.65 L 30.9,26.5 L 31.2,27.8 L 30,27.1 L 28.8,27.8 L 29.1,26.5 L 28.15,25.65 L 29.45,25.5 Z"
          fill={kit.secondary}
        />
      </g>

      {/* ── Collar / V-neck ── */}
      <path
        d="M 34,10 Q 50,26 66,10"
        fill="none"
        stroke={collarColor}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ── Sleeve seams ── */}
      <line x1="12" y1="20" x2="28" y2="10" stroke={kit.secondary} strokeWidth="1" opacity="0.4" />
      <line x1="88" y1="20" x2="72" y2="10" stroke={kit.secondary} strokeWidth="1" opacity="0.4" />

      {/* ── Left cuff ── */}
      <line
        x1="1"
        y1="42"
        x2="17"
        y2="47"
        stroke={cuffColor}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ── Right cuff ── */}
      <line
        x1="99"
        y1="42"
        x2="83"
        y2="47"
        stroke={cuffColor}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* ── Bottom hem ── */}
      <line
        x1="17"
        y1="120"
        x2="83"
        y2="120"
        stroke={hemColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* ── Side seams ── */}
      <line
        x1="17"
        y1="47"
        x2="17"
        y2="120"
        stroke={kit.secondary}
        strokeWidth="0.8"
        opacity="0.3"
      />
      <line
        x1="83"
        y1="47"
        x2="83"
        y2="120"
        stroke={kit.secondary}
        strokeWidth="0.8"
        opacity="0.3"
      />

      {/* ── Shirt number (center back) ── */}
      <text
        x="50"
        y="80"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={dim.numSize}
        fontWeight="900"
        fontFamily="'Arial Black', 'Impact', 'Bebas Neue', sans-serif"
        fill={numColor}
        letterSpacing="-1"
        filter={`url(#${uid}-shadow)`}
      >
        {num}
      </text>

      {/* ── Player surname ── */}
      <text
        x="50"
        y="106"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={dim.nameSize}
        fontWeight="700"
        fontFamily="'Arial', 'Helvetica', sans-serif"
        fill={nameColor}
        letterSpacing="1.5"
        opacity="0.9"
      >
        {name}
      </text>
    </svg>
  );
}
