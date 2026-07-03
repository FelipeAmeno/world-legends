import type { MockCard, Rarity } from '@/lib/mock-data';
import {
  RARITY_BG,
  RARITY_COLOR,
  RARITY_LABEL,
  getCardDisplayName,
  getContractStatus,
} from '@/lib/mock-data';

// ─── Rarity visual config ─────────────────────────────────────────────────────

const RARITY_BORDER_COLOR: Record<Rarity, string> = {
  common: 'rgba(156,163,175,0.40)',
  rare: 'rgba(168, 85,247,0.60)',
  elite: 'rgba( 59,130,246,0.65)',
  legendary: 'rgba(201,168, 76,0.75)',
  ultra: 'rgba(236, 72,153,0.65)',
  world_cup_hero: 'rgba(212,216,232,0.55)',
};

const RARITY_GLOW_CSS: Record<Rarity, string> = {
  common: '',
  rare: '0 0 14px rgba(168,85,247,0.30), 0 4px 24px rgba(0,0,0,0.8)',
  elite: '0 0 16px rgba(59,130,246,0.35), 0 4px 24px rgba(0,0,0,0.8)',
  legendary: '0 0 20px rgba(201,168,76,0.45), 0 4px 24px rgba(0,0,0,0.8)',
  ultra: '0 0 22px rgba(236,72,153,0.50), 0 4px 24px rgba(0,0,0,0.8)',
  world_cup_hero: '0 0 22px rgba(212,216,232,0.40), 0 4px 24px rgba(0,0,0,0.8)',
};

const RARITY_OVR_GRADIENT: Record<Rarity, string> = {
  common: 'linear-gradient(160deg,#d1d5db,#9ca3af)',
  rare: 'linear-gradient(160deg,#e9d5ff,#a855f7)',
  elite: 'linear-gradient(160deg,#bfdbfe,#3b82f6)',
  legendary: 'linear-gradient(160deg,#f5e098,#c9a84c)',
  ultra: 'linear-gradient(160deg,#fce7f3,#ec4899)',
  world_cup_hero: 'linear-gradient(160deg,#fff,#d4d8e8)',
};

const RARITY_TEXT_COLOR: Record<Rarity, string> = {
  common: '#9ca3af',
  rare: '#c084fc',
  elite: '#60a5fa',
  legendary: '#e6c85a',
  ultra: '#f472b6',
  world_cup_hero: '#e8eeff',
};

// ─── Position badge colors ────────────────────────────────────────────────────

const POS_COLOR: Record<string, string> = {
  GK: '#d97706',
  CB: '#1d4ed8',
  LB: '#1d4ed8',
  RB: '#1d4ed8',
  LWB: '#1d4ed8',
  RWB: '#1d4ed8',
  CDM: '#15803d',
  CM: '#15803d',
  CAM: '#15803d',
  LM: '#15803d',
  RM: '#15803d',
  LW: '#b91c1c',
  RW: '#b91c1c',
  CF: '#b91c1c',
  ST: '#b91c1c',
};

// ─── Card component ───────────────────────────────────────────────────────────

type Props = {
  card: MockCard;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
};

export function CardTile({ card, size = 'md', onClick }: Props) {
  const isExpired = card.contracts === 0;
  const displayName = getCardDisplayName(card);
  const hasEvo = card.evolution > 0;
  const isHolo = card.rarity !== 'common';

  const sizeClass = {
    sm: 'w-[88px]  min-h-[120px]',
    md: 'w-[110px] min-h-[148px]',
    lg: 'w-[138px] min-h-[186px]',
  }[size];

  const ovrSize = {
    sm: 'text-[30px]',
    md: 'text-[38px]',
    lg: 'text-[48px]',
  }[size];

  const rarityColor = RARITY_TEXT_COLOR[card.rarity];
  const borderColor = RARITY_BORDER_COLOR[card.rarity];
  const glowCSS = RARITY_GLOW_CSS[card.rarity];
  const ovrGrad = RARITY_OVR_GRADIENT[card.rarity];

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: card tile is a visual game element, not a document interactive control
    <div
      onClick={onClick}
      className={[
        'relative flex flex-col rounded-[10px] overflow-hidden cursor-pointer select-none',
        'transition-all duration-200 ease-spring hover:scale-[1.05] hover:-translate-y-0.5 hover:z-10',
        'active:scale-[0.97]',
        sizeClass,
        RARITY_BG[card.rarity],
        isExpired ? 'opacity-45 grayscale' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        border: `1.5px solid ${borderColor}`,
        boxShadow: glowCSS || '0 4px 20px rgba(0,0,0,0.75)',
      }}
    >
      {/* Holographic sheen overlay */}
      {isHolo && (
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            background:
              'linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.05) 45%,rgba(255,255,255,0.11) 50%,rgba(255,255,255,0.05) 55%,transparent 62%)',
            backgroundSize: '200% 100%',
            animation: 'holoSlide 5s ease-in-out infinite',
          }}
        />
      )}

      {/* Ultra / WCH rainbow shimmer */}
      {(card.rarity === 'ultra' || card.rarity === 'world_cup_hero') && (
        <div
          className="absolute inset-0 pointer-events-none z-[1] opacity-[0.07]"
          style={{
            background: 'linear-gradient(90deg,#ff6b6b,#ffd93d,#6bcb77,#4d96ff,#c77dff,#ff6b6b)',
            backgroundSize: '300% 100%',
            animation: 'rainbowMove 3.5s ease infinite',
          }}
        />
      )}

      {/* Inner highlight (top edge) */}
      <div
        className="absolute inset-x-0 top-0 h-px pointer-events-none z-[3]"
        style={{ background: `linear-gradient(90deg,transparent,${rarityColor}55,transparent)` }}
      />

      {/* Top row: rarity label + position */}
      <div className="flex items-start justify-between px-1.5 pt-1.5 relative z-10">
        <span
          className="text-[8px] font-black uppercase tracking-wider leading-none"
          style={{ color: rarityColor, textShadow: `0 0 6px ${rarityColor}80` }}
        >
          {card.rarity === 'world_cup_hero' ? 'WCH' : RARITY_LABEL[card.rarity].slice(0, 3)}
        </span>
        <PosBadge position={card.position} color={POS_COLOR[card.position] ?? '#6b7280'} />
      </div>

      {/* OVR — center focal point */}
      <div className="flex-1 flex flex-col items-center justify-center py-0.5 relative z-10">
        <span
          className={`font-display ${ovrSize} leading-[0.9] tracking-tight`}
          style={{
            background: ovrGrad,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: `drop-shadow(0 1px 8px ${rarityColor}60)`,
          }}
        >
          {card.overall}
        </span>
        {hasEvo && (
          <span
            className="text-[8px] font-bold mt-0.5 px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(201,168,76,0.15)',
              color: '#e6c85a',
              border: '1px solid rgba(201,168,76,0.3)',
            }}
          >
            +{card.evolution}
          </span>
        )}
      </div>

      {/* Divider */}
      <div
        className="mx-2 h-px"
        style={{ background: `linear-gradient(90deg,transparent,${rarityColor}30,transparent)` }}
      />

      {/* Bottom: name + nationality */}
      <div className="px-1.5 pt-1 pb-1.5 text-center relative z-10">
        <p
          className="font-semibold text-[9px] leading-tight truncate"
          style={{ color: '#e8e2d8', letterSpacing: '0.02em' }}
        >
          {displayName}
        </p>
        <p className="text-[8px] mt-0.5" style={{ color: '#6a7090' }}>
          {card.nationality}
        </p>
      </div>

      {/* Contract warning badge */}
      {card.contracts <= 2 && !isExpired && (
        <div
          className="absolute top-1 left-1 text-white text-[7px] font-black px-1 rounded z-20"
          style={{ background: 'rgba(239,68,68,0.85)' }}
        >
          {card.contracts}C
        </div>
      )}

      {/* Expired overlay */}
      {isExpired && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/65 rounded-[10px] z-20">
          <span
            className="text-[9px] font-black uppercase tracking-wider"
            style={{ color: '#f87171' }}
          >
            S/CONTRATO
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Position badge ───────────────────────────────────────────────────────────

function PosBadge({ position, color }: { position: string; color: string }) {
  return (
    <span
      className="text-[7px] font-black uppercase leading-none px-1 py-0.5 rounded-[3px]"
      style={{
        background: `${color}22`,
        border: `1px solid ${color}55`,
        color,
      }}
    >
      {position}
    </span>
  );
}
