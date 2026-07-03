/**
 * calculateOverall — segundo submódulo do Match Engine
 * (docs/19-implementation-strategy-master.md, §10 e §18 — Tarefa T013 no
 * roteiro mestre, chamada aqui de T004), implementando ao pé da letra o
 * algoritmo `calcularOverall` de `docs/09-match-engine-master.md`, §2:
 *
 * ```
 * ALGORITMO calcularOverall(atributos, posicao):
 *     pesos = TABELA_PESOS[posicao]
 *     soma_ponderada = Σ (atributos[chave] * pesos[chave])  para cada chave em pesos
 *     overall = arredondar(clamp(soma_ponderada, 40, 99))
 *     RETORNA overall
 * ```
 *
 * Função pura: nenhum I/O, nenhum estado global, nenhuma dependência além
 * dos dois parâmetros. Calculada uma única vez na criação da `card`
 * (doc 09 §2) — não em runtime de partida, daí o alvo de performance de
 * <1ms por chamada (docs/19-implementation-strategy-master.md, §15), o
 * que também justifica NÃO revalidar aqui a faixa/completude de
 * `attributes` a cada chamada (ver nota em `types.ts`).
 */
import type { AttributeKey, AttributeSet, Position } from './types';

/** Pesos de um subconjunto dos atributos — cada posição usa só os atributos relevantes a ela. */
type PositionWeights = Readonly<Partial<Record<AttributeKey, number>>>;

// Tabela de pesos por posição — transcrita literalmente de doc 09 §1.3.
// Posições agrupadas no doc com "/" (LB/RB, LWB/RWB, LM/RM, LW/RW,
// ST/CF) compartilham EXATAMENTE o mesmo objeto de pesos abaixo — o doc
// as trata como espelhos (esquerda/direita) ou variação posicional sem
// distinção de exigência técnica, então duas posições do mesmo par
// produzem sempre o mesmo overall para os mesmos atributos (testado
// explicitamente em overall.test.ts).

const GK_WEIGHTS: PositionWeights = {
  gk_reflexes: 0.35,
  gk_positioning: 0.25,
  gk_handling: 0.2,
  gk_kicking: 0.1,
  composure: 0.1,
};

const CB_WEIGHTS: PositionWeights = {
  defending: 0.35,
  physical: 0.2,
  heading: 0.15,
  passing: 0.1,
  pace: 0.1,
  composure: 0.1,
};

const FULL_BACK_WEIGHTS: PositionWeights = {
  // LB/RB
  pace: 0.2,
  defending: 0.25,
  physical: 0.15,
  passing: 0.15,
  dribbling: 0.1,
  heading: 0.15,
};

const WING_BACK_WEIGHTS: PositionWeights = {
  // LWB/RWB
  pace: 0.25,
  defending: 0.15,
  dribbling: 0.15,
  passing: 0.2,
  physical: 0.1,
  heading: 0.15,
};

const CDM_WEIGHTS: PositionWeights = {
  defending: 0.3,
  passing: 0.2,
  physical: 0.2,
  composure: 0.15,
  vision: 0.1,
  aggression: 0.05,
};

const CM_WEIGHTS: PositionWeights = {
  passing: 0.25,
  vision: 0.2,
  defending: 0.15,
  physical: 0.15,
  dribbling: 0.15,
  composure: 0.1,
};

const CAM_WEIGHTS: PositionWeights = {
  vision: 0.25,
  passing: 0.2,
  dribbling: 0.2,
  finishing: 0.15,
  composure: 0.15,
  pace: 0.05,
};

const WIDE_MIDFIELD_WEIGHTS: PositionWeights = {
  // LM/RM
  pace: 0.2,
  dribbling: 0.2,
  passing: 0.2,
  finishing: 0.15,
  defending: 0.15,
  physical: 0.1,
};

const WINGER_WEIGHTS: PositionWeights = {
  // LW/RW
  pace: 0.25,
  dribbling: 0.25,
  finishing: 0.2,
  passing: 0.15,
  composure: 0.15,
};

const STRIKER_WEIGHTS: PositionWeights = {
  // ST/CF
  finishing: 0.3,
  shot_power: 0.15,
  pace: 0.2,
  dribbling: 0.1,
  heading: 0.1,
  physical: 0.15,
};

const WEIGHTS_BY_POSITION: Readonly<Record<Position, PositionWeights>> = {
  GK: GK_WEIGHTS,
  CB: CB_WEIGHTS,
  LB: FULL_BACK_WEIGHTS,
  RB: FULL_BACK_WEIGHTS,
  LWB: WING_BACK_WEIGHTS,
  RWB: WING_BACK_WEIGHTS,
  CDM: CDM_WEIGHTS,
  CM: CM_WEIGHTS,
  CAM: CAM_WEIGHTS,
  LM: WIDE_MIDFIELD_WEIGHTS,
  RM: WIDE_MIDFIELD_WEIGHTS,
  LW: WINGER_WEIGHTS,
  RW: WINGER_WEIGHTS,
  CF: STRIKER_WEIGHTS,
  ST: STRIKER_WEIGHTS,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Calcula o Overall de um jogador: média ponderada por posição dos
 * atributos efetivos, depois arredondada e limitada a [40, 99]
 * (doc 09 §2). O multiplicador de raridade já deve ter sido aplicado a
 * `attributes` antes de chamar esta função — overall é consequência da
 * raridade, não o contrário (mesma seção do doc).
 */
export function calculateOverall(attributes: AttributeSet, position: Position): number {
  const weights = WEIGHTS_BY_POSITION[position];
  let weightedSum = 0;
  for (const key in weights) {
    const attributeKey = key as AttributeKey;
    const weight = weights[attributeKey];
    if (weight === undefined) {
      continue;
    }
    weightedSum += attributes[attributeKey] * weight;
  }
  return Math.round(clamp(weightedSum, 40, 99));
}
