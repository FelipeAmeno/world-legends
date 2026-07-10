/**
 * Layer 11 — Atributos. Camada nova e opcional (desligada por padrão — os
 * 8+ call sites existentes não pedem essa camada, então nada muda pra eles).
 * Sempre texto/barra React vinda de `card.attributes` — nunca imagem.
 *
 * Sprint 33: reposicionada de um grid 2-colunas flutuando no meio da carta
 * pra uma tira horizontal de linha única, renderizada DENTRO do rodapé do
 * HUD (`CardHudLayer`, logo abaixo do nome) — bate com a referência, que
 * mostra PAC/SHO/PAS/DRI/DEF/PHY numa única linha sob o nome do jogador.
 *
 * Sprint 34: goleiro usa outro conjunto de rótulos (DIV/HAN/KIC/REF/SPD/
 * POS em vez de PAC/SHO/PAS/DRI/DEF/PHY) — os 6 SLOTS numéricos de
 * `CardAttributes` continuam os mesmos (não existe um segundo conjunto de
 * campos "attributes-goleiro" no modelo de dados; isso é puramente sobre
 * como a Sprint 34 pede pra rotular os mesmos 6 valores pra um goleiro),
 * só o texto exibido muda por posição.
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

const PIP_KEYS: Array<keyof CardAttributes> = [
  'pace',
  'finishing',
  'passing',
  'dribbling',
  'defending',
  'physical',
];

const LINE_LABELS: Record<keyof CardAttributes, string> = {
  pace: 'RIT',
  finishing: 'FIN',
  passing: 'PAS',
  dribbling: 'DRI',
  defending: 'DEF',
  physical: 'FIS',
};

const GOALKEEPER_LABELS: Record<keyof CardAttributes, string> = {
  pace: 'DIV',
  finishing: 'HAN',
  passing: 'KIC',
  dribbling: 'REF',
  defending: 'SPD',
  physical: 'POS',
};

export function CardAttributesLayer({
  ctx,
  attributes,
}: { ctx: CardVisualCtx; attributes: CardAttributes }) {
  const { accent, size, card } = ctx;
  const isGoalkeeper = card.position === 'GK';
  const labels = isGoalkeeper ? GOALKEEPER_LABELS : LINE_LABELS;
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
      {PIP_KEYS.map((key) => (
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
            {labels[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
