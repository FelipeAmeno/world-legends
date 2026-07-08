/**
 * Layer 11 — Atributos. Camada nova e opcional (desligada por padrão — os
 * 8+ call sites existentes não pedem essa camada, então nada muda pra eles).
 * Sempre texto/barra React vinda de `card.attributes` — nunca imagem.
 * Só faz sentido em tamanhos maiores (lg), onde há espaço.
 */

import type { CardVisualCtx } from '../card-types';

export type CardAttributes = {
  pace: number;
  finishing: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
};

const PIP_LABELS: Array<{ key: keyof CardAttributes; label: string }> = [
  { key: 'pace', label: 'RIT' },
  { key: 'finishing', label: 'FIN' },
  { key: 'passing', label: 'PAS' },
  { key: 'dribbling', label: 'DRI' },
  { key: 'defending', label: 'DEF' },
  { key: 'physical', label: 'FIS' },
];

export function CardAttributesLayer({
  ctx,
  attributes,
}: { ctx: CardVisualCtx; attributes: CardAttributes }) {
  const { accent } = ctx;

  return (
    <div
      style={{
        position: 'absolute',
        left: 6,
        right: 6,
        bottom: '30%',
        zIndex: 9,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2px 8px',
        background: 'rgba(0,0,0,0.55)',
        borderRadius: 6,
        padding: '4px 6px',
      }}
    >
      {PIP_LABELS.map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          <span style={{ fontSize: 6, color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
            {label}
          </span>
          <span style={{ fontSize: 6, color: accent, fontWeight: 800 }}>{attributes[key]}</span>
        </div>
      ))}
    </div>
  );
}
