'use client';

import { getKitColors } from '@/lib/kit-data';
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
  size?: 'xs' | 'sm' | 'md' | 'lg';
  glow?: boolean;
};

// ─── Identidade de raridade — reconhecível sem ler texto ──────────────────────
//
// Cada raridade combina 4 sinais independentes (cor de borda/glow, ícone,
// intensidade do brilho de fundo e efeito de acabamento) para que dê pra
// reconhecer a raridade só pela silhueta/cor da carta, mesmo em miniatura.

const RARITY_DISPLAY_LABEL: Record<RarityCode, string> = {
  common: 'COMUM',
  rare: 'RARA',
  elite: 'ELITE',
  legendary: 'LENDÁRIA',
  ultra: 'GOAT',
  world_cup_hero: 'CAMPEÃO',
};

const RARITY_ICON: Record<RarityCode, string> = {
  common: '',
  rare: '◆',
  elite: '▲',
  legendary: '★',
  ultra: '⚡',
  world_cup_hero: '🏆',
};

const RARITY_ACCENT: Record<RarityCode, string> = {
  common: '#9ca3af',
  rare: '#c084fc',
  elite: '#60a5fa',
  legendary: '#e6c85a',
  ultra: '#f472b6',
  world_cup_hero: '#ffffff',
};

const RARITY_FRAME_CLASS: Record<RarityCode, string> = {
  common: 'card-frame-common',
  rare: 'card-frame-rare',
  elite: 'card-frame-elite',
  legendary: 'card-frame-legendary',
  ultra: 'card-frame-ultra',
  world_cup_hero: 'card-frame-wch',
};

const RARITY_GLOW_CLASS: Record<RarityCode, string> = {
  common: '',
  rare: 'glow-rare',
  elite: 'glow-elite',
  legendary: 'glow-gold',
  ultra: 'glow-ultra',
  world_cup_hero: 'glow-wch',
};

const SIZES = {
  xs: { card: { width: 62, height: 84 }, jersey: 'xs' as const, jerseyScale: 1.28 },
  sm: { card: { width: 92, height: 124 }, jersey: 'sm' as const, jerseyScale: 1.22 },
  md: { card: { width: 116, height: 156 }, jersey: 'md' as const, jerseyScale: 1.18 },
  lg: { card: { width: 148, height: 199 }, jersey: 'lg' as const, jerseyScale: 1.16 },
};

const OVR_FONT: Record<keyof typeof SIZES, number> = { xs: 12, sm: 15, md: 18, lg: 23 };
const POS_FONT: Record<keyof typeof SIZES, number> = { xs: 5, sm: 5.5, md: 6.5, lg: 8 };
const NAME_FONT: Record<keyof typeof SIZES, number> = { xs: 6.5, sm: 9, md: 11.5, lg: 15 };
const SUB_FONT: Record<keyof typeof SIZES, number> = { xs: 5, sm: 6, md: 7, lg: 8.5 };
const RIBBON_FONT: Record<keyof typeof SIZES, number> = { xs: 6, sm: 6.5, md: 7.5, lg: 9 };

// ─── Component ────────────────────────────────────────────────────────────────

export function PlayerCard({ card, size = 'md', glow }: Props) {
  const kit = getKitColors(card.nationality);
  const accent = RARITY_ACCENT[card.rarityCode];
  const dim = SIZES[size];
  const icon = RARITY_ICON[card.rarityCode];
  const label = RARITY_DISPLAY_LABEL[card.rarityCode];
  const isCommon = card.rarityCode === 'common';
  const isGoat = card.rarityCode === 'world_cup_hero';
  const isUltra = card.rarityCode === 'ultra';
  const isLegendaryPlus = card.rarityCode === 'legendary' || isUltra || isGoat;

  return (
    <div
      className={[
        'noise relative shrink-0 overflow-hidden',
        RARITY_FRAME_CLASS[card.rarityCode],
        glow ? RARITY_GLOW_CLASS[card.rarityCode] : '',
        isLegendaryPlus ? 'card-holo' : '',
        card.rarityCode === 'legendary' && glow ? 'legendary-aura' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        width: dim.card.width,
        height: dim.card.height,
        borderRadius: Math.round(dim.card.width * 0.09),
        overflow: 'hidden',
        // Identidade nacional: gradiente ambiente derivado da cor real do kit,
        // não de uma lista fixa de "estádios" — funciona para as 65 seleções.
        background: `radial-gradient(ellipse 95% 65% at 50% 0%, ${kit.primary}2e, #030308 78%)`,
      }}
    >
      {/* Vinheta de profundidade */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 120% 90% at 50% 100%, rgba(0,0,0,0.55) 0%, transparent 55%)',
        }}
      />

      {/* Acabamento GOAT: chuva de estrelas sutil */}
      {isGoat && (
        <div
          className="goat-shimmer-overlay"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }}
        />
      )}

      {/* Acabamento Ultra (GOAT-label): véu arco-íris */}
      {isUltra && (
        <div
          className="ultra-rainbow-overlay"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        />
      )}

      {/* ── OVR — pequeno e elegante ── */}
      <div
        style={{
          position: 'absolute',
          top: dim.card.width * 0.055,
          left: dim.card.width * 0.07,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1,
        }}
      >
        <span
          className="font-display"
          style={{
            fontSize: OVR_FONT[size],
            color: '#f4f1ea',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}
        >
          {card.overall}
        </span>
        <span
          style={{
            fontSize: POS_FONT[size],
            fontWeight: 700,
            color: accent,
            letterSpacing: '0.08em',
            marginTop: 1,
          }}
        >
          {card.position}
        </span>
        <div
          style={{
            marginTop: 2,
            width: '70%',
            height: 1.5,
            background: accent,
            opacity: 0.85,
            borderRadius: 1,
          }}
        />
      </div>

      {/* ── Raridade — ícone + rótulo curto, sem precisar ler ── */}
      {!isCommon && (
        <div
          style={{
            position: 'absolute',
            top: dim.card.width * 0.055,
            right: dim.card.width * 0.06,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 20,
            padding: `${dim.card.width * 0.02}px ${dim.card.width * 0.045}px`,
            border: `1px solid ${accent}55`,
          }}
        >
          <span style={{ fontSize: RIBBON_FONT[size], lineHeight: 1 }}>{icon}</span>
          {size !== 'xs' && (
            <span
              style={{
                fontSize: RIBBON_FONT[size] - 1.5,
                fontWeight: 800,
                color: accent,
                letterSpacing: '0.06em',
              }}
            >
              {label}
            </span>
          )}
        </div>
      )}

      {/* ── Camisa — domina a carta (~70%+ da altura) ── */}
      <div
        style={{
          position: 'absolute',
          top: dim.card.height * 0.1,
          left: 0,
          right: 0,
          bottom: dim.card.height * 0.24,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'visible',
        }}
      >
        <div style={{ transform: `scale(${dim.jerseyScale})`, transformOrigin: 'top center' }}>
          <JerseyArt
            playerId={card.playerId}
            displayName={card.displayName}
            nationality={card.nationality}
            position={card.position}
            rarityCode={card.rarityCode}
            size={dim.jersey}
          />
        </div>
      </div>

      {/* ── Nome — muito mais destacado ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 8,
          background:
            'linear-gradient(0deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.72) 55%, transparent 100%)',
          padding: `${dim.card.height * 0.1}px ${dim.card.width * 0.05}px ${dim.card.height * 0.035}px`,
          textAlign: 'center',
        }}
      >
        {isLegendaryPlus && (
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`,
              marginBottom: dim.card.height * 0.02,
            }}
          />
        )}
        <p
          className="font-display"
          style={{
            fontSize: NAME_FONT[size],
            color: '#f7f3ea',
            lineHeight: 1.05,
            letterSpacing: '0.02em',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            margin: 0,
            textShadow: '0 1px 4px rgba(0,0,0,0.9)',
          }}
        >
          {card.displayName}
        </p>
        <p
          style={{
            fontSize: SUB_FONT[size],
            color: 'rgba(255,255,255,0.55)',
            margin: `${dim.card.height * 0.012}px 0 0`,
            lineHeight: 1,
          }}
        >
          {card.flagEmoji} {card.era}
        </p>
      </div>
    </div>
  );
}
