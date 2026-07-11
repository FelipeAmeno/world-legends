/**
 * Layer 9 — Nome. Sempre texto React vindo de `card.displayName` (+
 * `flagEmoji`/`era` como legenda) — nunca imagem, por definição (ver
 * SPRINT_18_5_REPORT.md). A bandeira também é texto (emoji), nunca arte.
 *
 * Sprint 35D.3 — `card.nickname` (opcional, vem do dado, nunca da arte)
 * some por densidade: Compact nunca mostra (`ctx.mode === 'compact'`),
 * Standard/Showcase mostram SE existir. Sem nickname, não renderiza
 * nada — nenhum espaço reservado, o layout colapsa normalmente (a
 * regra é literal: `{card.nickname && ...}`, não uma altura fixa com
 * texto vazio).
 */

import { NAME_FONT, SUB_FONT } from '../card-tokens';
import type { CardVisualCtx } from '../card-types';

export function CardNameLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { card, accent, size, dim, isLegendaryPlus, mode } = ctx;
  const showNickname = mode !== 'compact' && Boolean(card.nickname);

  return (
    <>
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
      {showNickname && (
        <p
          style={{
            fontSize: SUB_FONT[size] * 1.05,
            fontWeight: 700,
            fontStyle: 'italic',
            color: accent,
            margin: `${dim.card.height * 0.006}px 0 0`,
            lineHeight: 1,
            letterSpacing: '0.02em',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
          }}
        >
          {card.nickname}
        </p>
      )}
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
    </>
  );
}
