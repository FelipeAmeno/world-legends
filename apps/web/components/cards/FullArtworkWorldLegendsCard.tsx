'use client';

/**
 * components/cards/FullArtworkWorldLegendsCard.tsx — Sprint 35D (Full Card
 * Artwork Pipeline Reset) + Sprint 35D.3 (Unique Player Artwork and Card
 * Identity System) + Sprint 36 (moved out of components/dev/ — this is a
 * production renderer now, used by ResolvedWorldLegendsCard)
 *
 * A unidade visual é uma imagem ÚNICA (`sourceType: 'full-card-artwork'`)
 * já com tudo (jogador+frame+background+luz+material+efeitos+textura)
 * exceto texto dinâmico. Esse componente só soma o HUD React por cima,
 * nas "safe zones" percentuais que o PRÓPRIO preset define
 * (`hudLayout`/`hudLayouts`).
 *
 * Estrutura EXATA pedida pelo brief — no máximo 3 camadas DOM
 * principais sob `CardRoot`:
 *
 *   <CardRoot>
 *     <ArtworkImage />
 *     <HudReact />
 *     <InteractionLayer />
 *   </CardRoot>
 */

import Image from 'next/image';
import type { Density, HudZone } from '../../lib/card-static/hud-layout';
import { isZoneVisible, resolveHudLayout } from '../../lib/card-static/hud-layout';
import { findPresetById } from '../../lib/card-static/manifest-index';
import { CARD_STATIC_MANIFEST } from '../../lib/card-static/manifest.generated';
import { resolveGeneratedArtwork } from '../../lib/card-static/resolve-artwork';
import { useCardTilt } from './use-card-tilt';

export type FullArtworkDensity = Density;

const NATIVE_DIMENSIONS: Record<FullArtworkDensity, { width: number; height: number }> = {
  compact: { width: 400, height: 600 },
  standard: { width: 800, height: 1200 },
  showcase: { width: 1200, height: 1800 },
};

const DISPLAY_WIDTH: Record<FullArtworkDensity, number> = {
  compact: 116,
  standard: 148,
  showcase: 220,
};

export type FullArtworkStats = {
  pace: number;
  finishing: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

const STAT_LABELS: Array<{ key: keyof FullArtworkStats; label: string }> = [
  { key: 'pace', label: 'RIT' },
  { key: 'finishing', label: 'FIN' },
  { key: 'passing', label: 'PAS' },
  { key: 'dribbling', label: 'DRI' },
  { key: 'defending', label: 'DEF' },
  { key: 'physical', label: 'FIS' },
];

type Props = {
  presetId: string;
  density: FullArtworkDensity;
  displayName: string;
  overall: number;
  position: string;
  countryFlag: string;
  era: string;
  stats: FullArtworkStats;
  trait?: string;
  /** Sprint 35D.3 — apelido/título, sempre do dado, nunca da arte. Ausente = nenhum espaço reservado. */
  nickname?: string;
  /** Mostra o artwork sozinho, sem nenhum HUD por cima (item 10 do brief: "artwork sem HUD"). */
  hideHud?: boolean;
  /** Migração de catálogo — permite `ResolvedWorldLegendsCard` renderizar
   * exatamente na largura que o `size` procedural já ocupava
   * (`SIZES[size].card.width`), pra zero layout shift em grids/flex
   * existentes. `undefined` = usa `DISPLAY_WIDTH[density]` (comportamento
   * de sempre da dev tool). */
  displayWidth?: number;
};

/**
 * Zona visível quando: existe E (`visible` declarado explicitamente no
 * preset → respeita exatamente OU, se o preset não declarou nada pra
 * esse campo, cai no heurístico de densidade — presets legados, ex.
 * `wl-goat-brazil-001`, não declaram `visible` em canto nenhum, então
 * precisam de um piso sensato). Nunca reserva espaço quando `false`.
 */
export function shouldShowZone(
  zone: HudZone | undefined,
  density: Density,
  hideByDefaultIn: Density[] = [],
): zone is HudZone {
  if (!isZoneVisible(zone)) return false;
  if (zone.visible !== undefined) return true; // já filtrado por isZoneVisible acima
  return !hideByDefaultIn.includes(density);
}

const ALIGN_TO_JUSTIFY: Record<NonNullable<HudZone['align']>, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

function Zone({
  zone,
  baseFontSize,
  children,
}: { zone: HudZone | undefined; baseFontSize: number; children: React.ReactNode }) {
  if (!zone) return null;
  const align = zone.align ?? 'center';
  return (
    <div
      style={{
        position: 'absolute',
        left: `${zone.x}%`,
        top: `${zone.y}%`,
        width: zone.width ? `${zone.width}%` : undefined,
        height: zone.height ? `${zone.height}%` : undefined,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: ALIGN_TO_JUSTIFY[align],
        fontSize: baseFontSize * (zone.fontScale ?? 1),
        color: '#fff',
        textAlign: align,
        lineHeight: 1.1,
      }}
    >
      {children}
    </div>
  );
}

export function FullArtworkWorldLegendsCard({
  presetId,
  density,
  displayName,
  overall,
  position,
  countryFlag,
  era,
  stats,
  trait,
  nickname,
  hideHud,
  displayWidth: displayWidthOverride,
}: Props) {
  // `useCardTilt` escreve `--tilt-rx`/`--tilt-ry` no elemento ref'd, e
  // `.card-tilt-root` (globals.css) lê essas MESMAS variáveis pra girar
  // — as duas coisas têm que estar no mesmo elemento, por isso o ref
  // vai no CardRoot (que já carrega a classe), não no InteractionLayer.
  const tiltRef = useCardTilt<HTMLDivElement>();
  const preset = findPresetById(CARD_STATIC_MANIFEST, presetId);
  const generated = resolveGeneratedArtwork(CARD_STATIC_MANIFEST, presetId, density);
  const hud = resolveHudLayout(preset, density);
  const { width, height } = NATIVE_DIMENSIONS[density];
  const displayWidth = displayWidthOverride ?? DISPLAY_WIDTH[density];
  const displayHeight = Math.round(displayWidth * (height / width));
  const baseFont = displayWidth * 0.09;

  // Piso de densidade — só entra em jogo quando o preset NÃO declarou
  // `visible` pra aquele campo (ver `shouldShowZone`). Mesma filosofia
  // do Card Engine v3 (Sprint 33/34): Compact é minimalista por padrão.
  const showStatsTop = shouldShowZone(hud.statsTop, density, ['compact']);
  const showStatsBottom = shouldShowZone(hud.statsBottom, density, ['compact']);
  const showStats = shouldShowZone(hud.stats, density, ['compact']);
  const showTrait = shouldShowZone(hud.trait, density, ['compact', 'standard']);
  const showNickname = shouldShowZone(hud.nickname, density, ['compact']) && Boolean(nickname);

  return (
    // <CardRoot>
    <div
      ref={tiltRef}
      className="noise relative shrink-0 overflow-hidden card-tilt-root"
      style={{
        width: displayWidth,
        height: displayHeight,
        borderRadius: Math.round(displayWidth * 0.06),
      }}
    >
      {/* <ArtworkImage /> — a ÚNICA fonte visual, nunca decomposta */}
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
        // Fallback — artwork gerado ausente. Card Engine procedural
        // continua sendo o fallback real de produção (item 12); aqui
        // é só um placeholder visual pra não quebrar a ferramenta dev.
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

      {/* <HudReact /> — nunca dentro da imagem, sempre nas safe zones do preset */}
      {!hideHud && (
        <div className="absolute inset-0" style={{ zIndex: 9, pointerEvents: 'none' }}>
          <Zone zone={hud.overall} baseFontSize={baseFont * 1.6}>
            <span style={{ fontWeight: 800 }}>{overall}</span>
          </Zone>
          <Zone zone={hud.position} baseFontSize={baseFont * 0.75}>
            <span style={{ fontWeight: 700, opacity: 0.9 }}>{position}</span>
          </Zone>
          <Zone zone={hud.name} baseFontSize={baseFont * 0.85}>
            <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{displayName}</span>
          </Zone>
          {showNickname && (
            <Zone zone={hud.nickname} baseFontSize={baseFont * 0.55}>
              <span style={{ fontStyle: 'italic', opacity: 0.9 }}>{nickname}</span>
            </Zone>
          )}
          <Zone zone={hud.country} baseFontSize={baseFont * 0.9}>
            {countryFlag}
          </Zone>
          <Zone zone={hud.era} baseFontSize={baseFont * 0.55}>
            <span style={{ opacity: 0.75 }}>{era}</span>
          </Zone>

          {showStatsTop && (
            <Zone zone={hud.statsTop} baseFontSize={baseFont * 0.55}>
              <StatsRow stats={stats} slice={[0, 3]} />
            </Zone>
          )}
          {showStatsBottom && (
            <Zone zone={hud.statsBottom} baseFontSize={baseFont * 0.55}>
              <StatsRow stats={stats} slice={[3, 6]} />
            </Zone>
          )}
          {showStats && !hud.statsTop && !hud.statsBottom && (
            <Zone zone={hud.stats} baseFontSize={baseFont * 0.55}>
              <StatsRow stats={stats} slice={[0, 6]} />
            </Zone>
          )}

          {showTrait && trait && (
            <Zone zone={hud.trait} baseFontSize={baseFont * 0.6}>
              <span style={{ opacity: 0.85 }}>{trait}</span>
            </Zone>
          )}
        </div>
      )}

      {/* <InteractionLayer /> — reservada pra feedback futuro (glass
          shine, press bounce); o listener de tilt em si já cobre a
          carta inteira via `tiltRef` no CardRoot (ver nota acima). */}
      <div className="absolute inset-0" style={{ zIndex: 10 }} />
    </div>
    // </CardRoot>
  );
}

function StatsRow({ stats, slice }: { stats: FullArtworkStats; slice: [number, number] }) {
  const entries = STAT_LABELS.slice(slice[0], slice[1]);
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', width: '100%' }}>
      {entries.map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontWeight: 800 }}>{stats[key]}</span>
          <span style={{ fontSize: '0.7em', opacity: 0.7 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}
