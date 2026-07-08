'use client';

import { getKitColors } from '@/lib/kit-data';
import type { RarityCode } from '@world-legends/types';
import { motion } from 'framer-motion';
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

// Intensidade do banho de cor nacional no fundo — cresce com a raridade,
// para que Common (quase sem cor) e Legendary/GOAT/Campeão (cor vibrante)
// pareçam universos diferentes mesmo antes de olhar pra camisa.
const RARITY_BG_ALPHA: Record<RarityCode, string> = {
  common: '14',
  rare: '2c',
  elite: '3a',
  legendary: '4a',
  ultra: '52',
  world_cup_hero: '5c',
};

const RARITY_SHIMMER: Record<RarityCode, boolean> = {
  common: false,
  rare: true,
  elite: true,
  legendary: true,
  ultra: true,
  world_cup_hero: true,
};

const SIZES = {
  xs: { card: { width: 62, height: 84 }, jersey: 'xs' as const, jerseyScale: 1.5 },
  sm: { card: { width: 92, height: 124 }, jersey: 'sm' as const, jerseyScale: 1.42 },
  md: { card: { width: 116, height: 156 }, jersey: 'md' as const, jerseyScale: 1.36 },
  lg: { card: { width: 148, height: 199 }, jersey: 'lg' as const, jerseyScale: 1.32 },
};

const OVR_FONT: Record<keyof typeof SIZES, number> = { xs: 14, sm: 18, md: 22, lg: 28 };
const POS_FONT: Record<keyof typeof SIZES, number> = { xs: 5, sm: 5.5, md: 6.5, lg: 8 };
const NAME_FONT: Record<keyof typeof SIZES, number> = { xs: 8, sm: 11.5, md: 15, lg: 20 };
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
  const isElitePlus = card.rarityCode === 'elite' || isLegendaryPlus;
  const bgAlpha = RARITY_BG_ALPHA[card.rarityCode];

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
        // Identidade nacional: gradiente de duas cores reais do kit (não só
        // uma tinta genérica), com intensidade que cresce por raridade — uma
        // Common e uma Legendary do MESMO país já parecem cartas diferentes
        // antes mesmo de olhar pra camisa.
        background: [
          `radial-gradient(ellipse 100% 70% at 50% 0%, ${kit.primary}${bgAlpha}, transparent 68%)`,
          `radial-gradient(ellipse 90% 60% at 50% 100%, ${kit.secondary}${bgAlpha}, transparent 62%)`,
          '#06060c',
        ].join(', '),
      }}
    >
      {/* Reflexo de vidro — diagonal, mais forte em raridades altas */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 6,
          background:
            'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, transparent 22%, transparent 78%, rgba(255,255,255,0.05) 100%)',
          opacity: isElitePlus ? 1 : 0.5,
        }}
      />

      {/* Sheen animado — todas as raridades exceto Common (que fica "chapada" de propósito) */}
      {RARITY_SHIMMER[card.rarityCode] && (
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 7,
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)',
            backgroundSize: '250% 100%',
          }}
          animate={{ backgroundPositionX: ['-120%', '220%'] }}
          transition={{
            duration: isGoat ? 2.2 : isUltra ? 2.6 : card.rarityCode === 'legendary' ? 3 : 3.6,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
            repeatDelay: isElitePlus ? 0.4 : 1.4,
          }}
        />
      )}

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

      {/* ── OVR — compacto mas com presença: glow colorido atrás do número ── */}
      <div
        style={{
          position: 'absolute',
          top: dim.card.width * 0.05,
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
            color: '#fffdf8',
            textShadow: `0 0 10px ${accent}, 0 0 22px ${accent}90, 0 2px 4px rgba(0,0,0,0.95)`,
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
            textShadow: `0 0 6px ${accent}80`,
          }}
        >
          {card.position}
        </span>
        <div
          style={{
            marginTop: 2,
            width: '75%',
            height: 2,
            background: accent,
            opacity: 0.95,
            borderRadius: 1,
            boxShadow: `0 0 6px ${accent}`,
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

      {/* ── Camisa — protagonista absoluta da carta ── */}
      <div
        style={{
          position: 'absolute',
          top: dim.card.height * 0.06,
          left: 0,
          right: 0,
          bottom: dim.card.height * 0.19,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          overflow: 'visible',
        }}
      >
        {/* Glow atrás da camisa — reforça a cor da raridade e dá profundidade */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            width: '70%',
            height: '60%',
            borderRadius: '50%',
            background: `radial-gradient(ellipse, ${accent}45, transparent 72%)`,
            filter: 'blur(4px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            transform: `scale(${dim.jerseyScale})`,
            transformOrigin: 'top center',
            filter: `drop-shadow(0 6px 14px rgba(0,0,0,0.6)) drop-shadow(0 0 18px ${accent}50)`,
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
              height: 1.5,
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              marginBottom: dim.card.height * 0.02,
              boxShadow: `0 0 8px ${accent}`,
            }}
          />
        )}
        <p
          className="font-display"
          style={{
            fontSize: NAME_FONT[size],
            color: '#fffdf8',
            lineHeight: 1.02,
            letterSpacing: '0.015em',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            margin: 0,
            textShadow: isLegendaryPlus
              ? `0 0 12px ${accent}90, 0 2px 5px rgba(0,0,0,0.95)`
              : '0 2px 5px rgba(0,0,0,0.95)',
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
