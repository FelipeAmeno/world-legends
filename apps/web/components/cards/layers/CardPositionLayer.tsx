/**
 * Layer 10 — Posição. Sempre texto React vindo de `card.position` — nunca
 * imagem, por definição (ver SPRINT_18_5_REPORT.md).
 */

import { POS_FONT } from '../card-tokens';
import type { CardVisualCtx } from '../card-types';

export function CardPositionLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { card, accent, size } = ctx;

  return (
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
  );
}
