'use client';

import { RARITY_KIT_OVERRIDE, getStadiumBg } from '@/lib/kit-data';
import type { RarityCode } from '@world-legends/types';
import { JerseyArt } from './JerseyArt';

export type PlayerCardData = {
  cardId: string;
  playerId: string;
  displayName: string;
  nationality: string;
  position: string;
  rarityCode: RarityCode;
  rarityLabel: string;
  overall: number;
  flagEmoji: string;
  era: string;
};

type Props = {
  card: PlayerCardData;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  animate?: boolean;
};

// ─── Rarity chrome colors ─────────────────────────────────────────────────────

const RARITY_CHROME: Record<RarityCode, { border: string; ovrColor: string; badge: string }> = {
  common: { border: 'rgba(150,150,150,0.35)', ovrColor: '#d1d5db', badge: '#6b7280' },
  rare: { border: 'rgba(147,51,234,0.55)', ovrColor: '#c084fc', badge: '#a855f7' },
  elite: { border: 'rgba(59,130,246,0.65)', ovrColor: '#60a5fa', badge: '#3b82f6' },
  legendary: { border: 'rgba(201,168,76,0.80)', ovrColor: '#e6c85a', badge: '#c9a84c' },
  ultra: { border: 'rgba(236,72,153,0.85)', ovrColor: '#f472b6', badge: '#ec4899' },
  world_cup_hero: { border: 'rgba(240,244,255,0.90)', ovrColor: '#ffffff', badge: '#e2e8f0' },
};

const RARITY_LABEL_SHORT: Partial<Record<RarityCode, string>> = {
  common: 'CMN',
  rare: 'RAR',
  elite: 'ELT',
  legendary: 'LGD',
  ultra: 'ULT',
  world_cup_hero: 'WCH',
};

const SIZES = {
  sm: { card: { width: 88, height: 117 }, jersey: 'sm' as const },
  md: { card: { width: 110, height: 148 }, jersey: 'md' as const },
  lg: { card: { width: 138, height: 184 }, jersey: 'lg' as const },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerCard({ card, size = 'md', glow, animate }: Props) {
  const stadium = getStadiumBg(card.nationality);
  const chrome = RARITY_CHROME[card.rarityCode];
  const over = RARITY_KIT_OVERRIDE[card.rarityCode];
  const dim = SIZES[size];

  const isGoat = card.rarityCode === 'world_cup_hero';
  const isUltra = card.rarityCode === 'ultra';
  const isLeg = card.rarityCode === 'legendary';

  const glowCss =
    glow && over.jerseyGlowColor
      ? `0 0 28px ${over.jerseyGlowColor}, 0 4px 20px rgba(0,0,0,0.8)`
      : '0 4px 20px rgba(0,0,0,0.75)';

  return (
    <div
      style={{
        position: 'relative',
        width: dim.card.width,
        height: dim.card.height,
        borderRadius: 10,
        overflow: 'hidden',
        border: `1.5px solid ${chrome.border}`,
        boxShadow: glowCss,
        background: `radial-gradient(ellipse 90% 60% at 50% 0%, ${stadium.mid}, ${stadium.to} 80%)`,
        flexShrink: 0,
      }}
    >
      {/* Stadium ambient glow — top */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${over.jerseyGlowColor ?? 'rgba(255,255,255,0.03)'} 0%, transparent 65%)`,
        }}
      />

      {/* Ultra rainbow shimmer */}
      {isUltra && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'linear-gradient(90deg,#ff6b6b22,#ffd93d22,#6bcb7722,#4d96ff22,#c77dff22,#ff6b6b22)',
            backgroundSize: '300% 100%',
            animation: 'rainbowMove 3.5s ease infinite',
          }}
        />
      )}

      {/* WCH gold scan line */}
      {isGoat && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'linear-gradient(105deg, transparent 35%, rgba(201,168,76,0.08) 50%, transparent 65%)',
            backgroundSize: '200% 100%',
            animation: 'holoSlide 2.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Top chrome strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${chrome.ovrColor}55, transparent)`,
        }}
      />

      {/* ── OVR badge (top-left) ── */}
      <div
        style={{
          position: 'absolute',
          top: 5,
          left: 6,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.65)',
          borderRadius: 5,
          padding: '2px 5px',
          border: `1px solid ${chrome.border}`,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display, "Bebas Neue", Impact)',
            fontSize: size === 'sm' ? 18 : size === 'md' ? 22 : 28,
            lineHeight: 1,
            color: chrome.ovrColor,
            textShadow: `0 0 8px ${chrome.ovrColor}80`,
            display: 'block',
          }}
        >
          {card.overall}
        </span>
        <span
          style={{
            fontSize: size === 'sm' ? 6 : 7,
            fontWeight: 700,
            color: chrome.ovrColor,
            letterSpacing: '0.05em',
            opacity: 0.8,
            lineHeight: 1,
          }}
        >
          {card.position}
        </span>
      </div>

      {/* ── Rarity badge (top-right) ── */}
      <div
        style={{
          position: 'absolute',
          top: 5,
          right: 6,
          zIndex: 10,
          background: `${chrome.badge}22`,
          border: `1px solid ${chrome.border}`,
          borderRadius: 4,
          padding: '2px 4px',
        }}
      >
        <span
          style={{
            fontSize: size === 'sm' ? 6 : 7,
            fontWeight: 800,
            color: chrome.badge,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {RARITY_LABEL_SHORT[card.rarityCode]}
        </span>
      </div>

      {/* ── Jersey art (centered) ── */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: 0.95,
        }}
      >
        <JerseyArt
          playerId={card.playerId}
          displayName={card.displayName}
          nationality={card.nationality}
          position={card.position}
          rarityCode={card.rarityCode}
          size={dim.jersey}
        />
      </div>

      {/* WCH: trophy + year overlay */}
      {isGoat && (
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 4,
            zIndex: 5,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 10, opacity: 0.6, color: '#c9a84c' }}>🏆</span>
          <span
            style={{
              fontSize: 7,
              color: '#c9a84c',
              opacity: 0.7,
              letterSpacing: '0.2em',
              alignSelf: 'center',
            }}
          >
            {card.era}
          </span>
        </div>
      )}

      {/* ── Bottom info strip ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background:
            'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 60%, transparent 100%)',
          padding: '14px 6px 5px',
          textAlign: 'center',
          zIndex: 8,
        }}
      >
        {/* Legendary/WCH: gold shimmer line above name */}
        {(isLeg || isGoat) && (
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${chrome.ovrColor}60, transparent)`,
              marginBottom: 4,
            }}
          />
        )}
        <p
          style={{
            fontWeight: 700,
            fontSize: size === 'sm' ? 8 : 9,
            color: '#e8e2d8',
            lineHeight: 1.2,
            letterSpacing: '0.02em',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            margin: 0,
          }}
        >
          {card.displayName}
        </p>
        <p
          style={{
            fontSize: size === 'sm' ? 6.5 : 7.5,
            color: chrome.badge,
            margin: '2px 0 0',
            lineHeight: 1,
            opacity: 0.85,
          }}
        >
          {card.flagEmoji} {card.era}
        </p>
      </div>
    </div>
  );
}
