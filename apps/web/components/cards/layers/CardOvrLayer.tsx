/**
 * Layer 8 — OVR. Sempre texto React vindo de `card.overall` — nunca imagem,
 * por definição (ver SPRINT_18_5_REPORT.md).
 */

import { OVR_FONT } from '../card-tokens';
import type { CardVisualCtx } from '../card-types';

export function CardOvrLayer({ ctx }: { ctx: CardVisualCtx }) {
  const { card, accent, size } = ctx;

  return (
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
  );
}
