'use client';

/**
 * components/dev/StaticWorldLegendsCard.tsx — Sprint 35B (Static Card
 * Pipeline Foundation)
 *
 * Renderer EXPERIMENTAL — não substitui `PlayerCard`, não é usado por
 * nenhum call site de produção, só existe em `/dev/static-card-pipeline`.
 * Composição: artwork pré-gerado (Sharp, build-time) + moldura CSS
 * (reaproveita `RARITY_FRAME_CLASS` — nenhuma moldura real existe ainda,
 * então usa a MESMA moldura que o `PlayerCard` atual usa quando não tem
 * PNG de frame) + HUD 100% React (nunca dentro da imagem) + tilt
 * (`useCardTilt`, o mesmo hook do Card Engine — interação mínima, sem
 * re-render).
 */

import Image from 'next/image';
import { CARD_STATIC_MANIFEST } from '../../lib/card-static/manifest.generated';
import { RARITY_ACCENT, RARITY_FRAME_CLASS } from '../cards/card-tokens';
import { useCardTilt } from '../cards/use-card-tilt';

export type StaticCardDensity = 'compact' | 'standard' | 'showcase';

const DISPLAY_WIDTH: Record<StaticCardDensity, number> = {
  compact: 116,
  standard: 148,
  showcase: 220,
};

const NATIVE_DIMENSIONS: Record<StaticCardDensity, { width: number; height: number }> = {
  compact: { width: 400, height: 600 },
  standard: { width: 800, height: 1200 },
  showcase: { width: 1200, height: 1800 },
};

// GOAT (rarity "goat" no preset) mapeia pra `ultra` no RarityCode real do
// jogo — mesma paleta/moldura que o resto da app usa pra essa raridade.
const RARITY_TO_GAME_CODE = { goat: 'ultra' } as const;

type Props = {
  presetId: string;
  density: StaticCardDensity;
  displayName: string;
  overall: number;
  position: string;
};

export function StaticWorldLegendsCard({
  presetId,
  density,
  displayName,
  overall,
  position,
}: Props) {
  const tiltRef = useCardTilt<HTMLDivElement>();
  const preset = CARD_STATIC_MANIFEST.find((p) => p.id === presetId);
  const generated = preset?.generated[density];
  const rarityCode = preset ? RARITY_TO_GAME_CODE[preset.rarity as 'goat'] : 'ultra';
  const accent = RARITY_ACCENT[rarityCode];
  const frameClass = RARITY_FRAME_CLASS[rarityCode];
  const { width, height } = NATIVE_DIMENSIONS[density];
  const displayWidth = DISPLAY_WIDTH[density];
  const displayHeight = Math.round(displayWidth * (height / width));

  return (
    <div
      ref={tiltRef}
      className={`noise relative shrink-0 overflow-hidden card-tilt-root ${frameClass}`}
      style={{
        width: displayWidth,
        height: displayHeight,
        borderRadius: Math.round(displayWidth * 0.09),
      }}
    >
      {/* Artwork — gerado offline via Sharp, entregue via next/image
          (responsivo, lazy por padrão, sem layout shift porque width/
          height nativos são conhecidos de antemão). */}
      {generated ? (
        <Image
          src={generated.src}
          alt={displayName}
          width={width}
          height={height}
          sizes={`${displayWidth}px`}
          loading={density === 'showcase' ? 'eager' : 'lazy'}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        // Fallback — artwork gerado ausente (preset sem build rodado
        // ainda, ou densidade não gerada). Nunca quebra a tela.
        <div
          className="absolute inset-0 flex items-center justify-center text-center"
          style={{
            background: '#0c0d12',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 10,
            padding: 8,
          }}
        >
          artwork não gerado — rode `pnpm cards:build`
        </div>
      )}

      {/* HUD — 100% React, nunca dentro da imagem gerada */}
      <div
        style={{
          position: 'absolute',
          top: displayWidth * 0.05,
          left: displayWidth * 0.07,
          zIndex: 9,
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontSize: displayWidth * 0.19,
            fontWeight: 800,
            color: '#fffdf8',
            textShadow: `0 0 10px ${accent}, 0 2px 4px rgba(0,0,0,0.95)`,
          }}
        >
          {overall}
        </span>
        <span style={{ fontSize: displayWidth * 0.055, fontWeight: 700, color: accent }}>
          {position}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9,
          background:
            'linear-gradient(0deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.72) 55%, transparent 100%)',
          padding: `${displayHeight * 0.1}px ${displayWidth * 0.05}px ${displayHeight * 0.035}px`,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontSize: displayWidth * 0.1,
            fontWeight: 800,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          {displayName}
        </span>
      </div>
    </div>
  );
}
