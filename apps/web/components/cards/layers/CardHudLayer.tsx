'use client';

/**
 * Layer 7 — HUD: os "plates" estruturais atrás dos blocos de texto (OVR,
 * ribbon de raridade, rodapé de nome). Sem asset próprio — precisa se
 * adaptar a texto de tamanho variável (nome do jogador, etc.), então
 * permanece 100% React/CSS por design. As camadas de texto (OVR, Nome,
 * Posição) são renderizadas como filhas, nos slots que este layer posiciona.
 */

import type { CardVisualCtx } from '../card-types';

type Props = {
  ctx: CardVisualCtx;
  ovrSlot: React.ReactNode;
  positionSlot: React.ReactNode;
  ribbonSlot: React.ReactNode | null;
  nameSlot: React.ReactNode;
  /** Sprint 33 — linha de atributos, renderizada dentro do mesmo rodapé,
   * logo abaixo do nome (bate com a referência: stat row sob o nome). */
  attributesSlot?: React.ReactNode;
};

export function CardHudLayer({
  ctx,
  ovrSlot,
  positionSlot,
  ribbonSlot,
  nameSlot,
  attributesSlot,
}: Props) {
  const { dim, accent, mode } = ctx;
  if (ctx.hiddenLayers?.has('hud')) return null;

  // Sprint 33 — a barra de destaque sob OVR/posição escala com o modo:
  // mais fina/discreta em Compact (telas pequenas, menos ruído visual),
  // mais grossa/brilhante em Showcase (Spotlight, Card Detail).
  const accentBarHeight = mode === 'compact' ? 1.5 : mode === 'showcase' ? 2.5 : 2;
  const accentBarGlow = mode === 'showcase' ? 9 : 6;

  return (
    <>
      {/* Plate superior-esquerdo: OVR + posição + barra de destaque */}
      <div
        className="card-parallax-hud"
        style={{
          position: 'absolute',
          top: dim.card.width * 0.05,
          left: dim.card.width * 0.07,
          zIndex: 9,
          display: 'flex',
          flexDirection: 'column',
          lineHeight: 1,
        }}
      >
        {ovrSlot}
        {positionSlot}
        <div
          style={{
            marginTop: 2,
            width: '75%',
            height: accentBarHeight,
            background: accent,
            opacity: 0.95,
            borderRadius: 1,
            boxShadow: `0 0 ${accentBarGlow}px ${accent}`,
          }}
        />
      </div>

      {/* Plate superior-direito: ribbon de raridade */}
      {ribbonSlot && (
        <div
          className="card-parallax-hud"
          style={{
            position: 'absolute',
            top: dim.card.width * 0.055,
            right: dim.card.width * 0.06,
            zIndex: 9,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 20,
            padding: `${dim.card.width * 0.02}px ${dim.card.width * 0.045}px`,
            border: `1px solid ${accent}55`,
          }}
        >
          {ribbonSlot}
        </div>
      )}

      {/* Plate inferior: rodapé do nome */}
      <div
        className="card-parallax-hud"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9,
          background:
            'linear-gradient(0deg, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.72) 55%, transparent 100%)',
          padding: `${dim.card.height * 0.1}px ${dim.card.width * 0.05}px ${dim.card.height * 0.035}px`,
          textAlign: 'center',
        }}
      >
        {nameSlot}
        {attributesSlot}
      </div>
    </>
  );
}
