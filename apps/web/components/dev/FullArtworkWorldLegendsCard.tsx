'use client';

/**
 * components/dev/FullArtworkWorldLegendsCard.tsx — Sprint 35D (Full Card
 * Artwork Pipeline Reset)
 *
 * Renderer EXPERIMENTAL — não substitui `PlayerCard` nem
 * `StaticWorldLegendsCard`, não é usado por nenhum call site de
 * produção, só existe em `/dev/full-artwork-card`. A estratégia da
 * Sprint 35B (canais separados: player/background/light/particles) foi
 * REJEITADA pelo product owner — a unidade visual agora é uma imagem
 * ÚNICA (`sourceType: 'full-card-artwork'`) já com tudo (jogador+
 * frame+background+luz+material+efeitos+textura) exceto texto
 * dinâmico. Esse componente só soma o HUD React por cima, nas "safe
 * zones" percentuais que o PRÓPRIO preset define (`hudLayout`).
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
import type { HudZone } from '../../lib/card-static/hud-layout';
import { resolveHudLayout } from '../../lib/card-static/hud-layout';
import { CARD_STATIC_MANIFEST } from '../../lib/card-static/manifest.generated';
import { resolveGeneratedArtwork } from '../../lib/card-static/resolve-artwork';
import { useCardTilt } from '../cards/use-card-tilt';

export type FullArtworkDensity = 'compact' | 'standard' | 'showcase';

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
  /** Mostra o artwork sozinho, sem nenhum HUD por cima (item 10 do brief: "artwork sem HUD"). */
  hideHud?: boolean;
};

function Zone({
  zone,
  fontSize,
  children,
}: { zone: HudZone | undefined; fontSize: number; children: React.ReactNode }) {
  if (!zone) return null;
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
        justifyContent: 'center',
        fontSize,
        color: '#fff',
        textAlign: 'center',
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
  hideHud,
}: Props) {
  // `useCardTilt` escreve `--tilt-rx`/`--tilt-ry` no elemento ref'd, e
  // `.card-tilt-root` (globals.css) lê essas MESMAS variáveis pra girar
  // — as duas coisas têm que estar no mesmo elemento, por isso o ref
  // vai no CardRoot (que já carrega a classe), não no InteractionLayer.
  const tiltRef = useCardTilt<HTMLDivElement>();
  const preset = CARD_STATIC_MANIFEST.find((p) => p.id === presetId);
  const generated = resolveGeneratedArtwork(CARD_STATIC_MANIFEST, presetId, density);
  const hud = resolveHudLayout(preset?.hudLayout ?? undefined);
  const { width, height } = NATIVE_DIMENSIONS[density];
  const displayWidth = DISPLAY_WIDTH[density];
  const displayHeight = Math.round(displayWidth * (height / width));
  const baseFont = displayWidth * 0.09;

  // Compact reduz densidade de informação (mesma filosofia do Card
  // Engine v3, Sprint 33/34) — esconde stats/trait mesmo que o preset
  // defina zonas pra eles, não porque o layout "universal" manda, mas
  // porque é uma decisão de UX por densidade.
  const showStats = density !== 'compact';
  const showTrait = density === 'showcase';

  return (
    // <CardRoot>
    <div
      ref={tiltRef}
      className="noise relative shrink-0 overflow-hidden card-tilt-root"
      style={{ width: displayWidth, height: displayHeight, borderRadius: Math.round(displayWidth * 0.06) }}
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
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        // Fallback — artwork gerado ausente. Card Engine procedural
        // continua sendo o fallback real de produção (item 12); aqui
        // é só um placeholder visual pra não quebrar a ferramenta dev.
        <div
          className="absolute inset-0 flex items-center justify-center text-center"
          style={{ background: '#0c0d12', color: 'rgba(255,255,255,0.4)', fontSize: 10, padding: 8 }}
        >
          artwork não gerado — rode `pnpm cards:build`
        </div>
      )}

      {/* <HudReact /> — nunca dentro da imagem, sempre nas safe zones do preset */}
      {!hideHud && (
        <div className="absolute inset-0" style={{ zIndex: 9, pointerEvents: 'none' }}>
          <Zone zone={hud.overall} fontSize={baseFont * 1.6}>
            <span style={{ fontWeight: 800 }}>{overall}</span>
          </Zone>
          <Zone zone={hud.position} fontSize={baseFont * 0.75}>
            <span style={{ fontWeight: 700, opacity: 0.9 }}>{position}</span>
          </Zone>
          <Zone zone={hud.name} fontSize={baseFont * 0.85}>
            <span style={{ fontWeight: 800, textTransform: 'uppercase' }}>{displayName}</span>
          </Zone>
          <Zone zone={hud.country} fontSize={baseFont * 0.9}>
            {countryFlag}
          </Zone>
          <Zone zone={hud.era} fontSize={baseFont * 0.55}>
            <span style={{ opacity: 0.75 }}>{era}</span>
          </Zone>

          {showStats &&
            (hud.statsTop && hud.statsBottom ? (
              <>
                <Zone zone={hud.statsTop} fontSize={baseFont * 0.55}>
                  <StatsRow stats={stats} slice={[0, 3]} />
                </Zone>
                <Zone zone={hud.statsBottom} fontSize={baseFont * 0.55}>
                  <StatsRow stats={stats} slice={[3, 6]} />
                </Zone>
              </>
            ) : (
              <Zone zone={hud.stats} fontSize={baseFont * 0.55}>
                <StatsRow stats={stats} slice={[0, 6]} />
              </Zone>
            ))}

          {showTrait && trait && (
            <Zone zone={hud.trait} fontSize={baseFont * 0.6}>
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

function StatsRow({
  stats,
  slice,
}: { stats: FullArtworkStats; slice: [number, number] }) {
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
