/**
 * Layer 11 — Atributos. Camada nova e opcional (desligada por padrão — os
 * 8+ call sites existentes não pedem essa camada, então nada muda pra eles).
 * Sempre texto/barra React vinda de `card.attributes` — nunca imagem.
 *
 * Sprint 33: reposicionada de um grid 2-colunas flutuando no meio da carta
 * pra uma tira horizontal de linha única, renderizada DENTRO do rodapé do
 * HUD (`CardHudLayer`, logo abaixo do nome) — bate com a referência, que
 * mostra PAC/SHO/PAS/DRI/DEF/PHY numa única linha sob o nome do jogador.
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
  const { accent, size } = ctx;
  const fontSize = size === 'xs' ? 5.5 : size === 'sm' ? 6.5 : size === 'md' ? 8 : 10;

  return (
    <div
      style={{
        marginTop: 3,
        display: 'flex',
        justifyContent: 'center',
        gap: size === 'xs' ? 4 : 7,
      }}
    >
      {PIP_LABELS.map(({ key, label }) => (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize, color: accent, fontWeight: 800, lineHeight: 1.1 }}>
            {attributes[key]}
          </span>
          <span
            style={{
              fontSize: fontSize - 2,
              color: 'rgba(255,255,255,0.55)',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
