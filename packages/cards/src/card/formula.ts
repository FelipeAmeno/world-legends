/**
 * Fórmula de atributos de cartas (doc 10 §6) e cálculo de Overall para o
 * domínio `cards`.
 *
 * Doc 18 §6 diz que os atributos finais são derivados "via engine.overall/
 * fórmula do doc 09 §6", mas `cards` não pode importar `engine` (doc 18 §3).
 * Solução: reimplementamos a mesma matemática aqui. É a mesma fórmula
 * (média ponderada por posição + multiplicador de raridade), sem nenhum
 * acoplamento de runtime ao package `engine`.
 *
 * FÓRMULA BASE (doc 10 §6):
 *   AtributoFinal = clamp(AtributoBase × Mult_Raridade + BônusEdição, 1, 99)
 *
 * FÓRMULA DE MOMENTO (doc 10 §6, para cartas ancoradas a um recorte):
 *   AtributoMomento = (performanceIndicator × 0.7) + (AtributoBase × 0.3)
 *   AtributoFinal   = clamp(AtributoMomento × Mult_Raridade + BônusEdição, 1, 99)
 *
 * OVERALL (doc 09 §2): média ponderada dos atributos na posição,
 * arredondada e limitada a [40, 99].
 */
import type { Position } from '@world-legends/types';
import type { BaseAttributeSet } from '../player/types';
import type { FinalAttributeSet, TournamentContext } from './types';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Pesos por posição (doc 09 §1.3) — mesma tabela de `engine/overall/types.ts`.
 * Duplicação intencional e documentada (ver types.ts desta pasta).
 */
const POSITION_WEIGHTS: Readonly<
  Record<Position, Readonly<Partial<Record<keyof BaseAttributeSet, number>>>>
> = {
  GK: {
    gk_reflexes: 30,
    gk_positioning: 25,
    gk_handling: 20,
    gk_kicking: 10,
    gk_penalty_save: 10,
    composure: 5,
  },
  CB: {
    defending: 30,
    physical: 20,
    heading: 20,
    pace: 10,
    composure: 10,
    passing: 5,
    leadership: 5,
  },
  LB: {
    defending: 25,
    pace: 20,
    physical: 15,
    passing: 15,
    dribbling: 10,
    heading: 10,
    composure: 5,
  },
  RB: {
    defending: 25,
    pace: 20,
    physical: 15,
    passing: 15,
    dribbling: 10,
    heading: 10,
    composure: 5,
  },
  LWB: {
    defending: 20,
    pace: 20,
    dribbling: 15,
    passing: 15,
    physical: 15,
    stamina: 10,
    composure: 5,
  },
  RWB: {
    defending: 20,
    pace: 20,
    dribbling: 15,
    passing: 15,
    physical: 15,
    stamina: 10,
    composure: 5,
  },
  CDM: {
    defending: 25,
    passing: 20,
    physical: 20,
    composure: 15,
    vision: 10,
    heading: 5,
    stamina: 5,
  },
  CM: {
    passing: 25,
    vision: 20,
    composure: 15,
    stamina: 15,
    defending: 10,
    dribbling: 10,
    leadership: 5,
  },
  CAM: {
    vision: 25,
    passing: 20,
    dribbling: 20,
    composure: 15,
    finishing: 10,
    pace: 5,
    leadership: 5,
  },
  LM: { pace: 20, dribbling: 20, passing: 20, stamina: 15, vision: 10, finishing: 10, physical: 5 },
  RM: { pace: 20, dribbling: 20, passing: 20, stamina: 15, vision: 10, finishing: 10, physical: 5 },
  LW: { pace: 25, dribbling: 25, finishing: 20, vision: 10, passing: 10, composure: 5, stamina: 5 },
  RW: { pace: 25, dribbling: 25, finishing: 20, vision: 10, passing: 10, composure: 5, stamina: 5 },
  CF: { finishing: 25, vision: 20, dribbling: 20, composure: 15, pace: 10, passing: 5, heading: 5 },
  ST: {
    finishing: 30,
    shot_power: 20,
    pace: 15,
    heading: 15,
    physical: 10,
    composure: 5,
    penalty_kicks: 5,
  },
};

/**
 * Calcula o Overall de uma carta a partir dos atributos finais e posição.
 * Média ponderada → arredondamento → clamp [40, 99].
 */
export function calculateOverall(attrs: FinalAttributeSet, position: Position): number {
  const weights = POSITION_WEIGHTS[position];
  let weightedSum = 0;
  let totalWeight = 0;
  const entries = Object.entries(weights) as [string, number | undefined][];
  for (const [key, weight] of entries) {
    if (weight !== undefined) {
      weightedSum += (attrs[key as keyof FinalAttributeSet] ?? 0) * weight;
      totalWeight += weight;
    }
  }
  const raw = totalWeight > 0 ? weightedSum / totalWeight : 50;
  return clamp(Math.round(raw), 40, 99);
}

/**
 * Aplica a fórmula de atributos (doc 10 §6) para produzir FinalAttributeSet.
 *
 * Se `tournamentContext` presente, usa a fórmula de Momento para todos os
 * atributos (70% performanceIndicator + 30% base). Em v1, o
 * performanceIndicator é um escalar único que afeta todos os atributos
 * igualmente — refinamento futuro pode usar vetores por grupo.
 */
export function applyAttributeFormula(
  base: BaseAttributeSet,
  rarityMultiplier: number,
  editionBonus: number,
  tournamentContext: TournamentContext | null,
): FinalAttributeSet {
  function calcAttr(baseValue: number): number {
    let effective = baseValue;
    if (tournamentContext !== null) {
      // Fórmula de Momento (doc 10 §6)
      effective = tournamentContext.performanceIndicator * 0.7 + baseValue * 0.3;
    }
    return clamp(Math.round(effective * rarityMultiplier + editionBonus), 1, 99);
  }

  return Object.freeze({
    pace: calcAttr(base.pace),
    stamina: calcAttr(base.stamina),
    physical: calcAttr(base.physical),
    heading: calcAttr(base.heading),
    finishing: calcAttr(base.finishing),
    shot_power: calcAttr(base.shot_power),
    passing: calcAttr(base.passing),
    vision: calcAttr(base.vision),
    dribbling: calcAttr(base.dribbling),
    penalty_kicks: calcAttr(base.penalty_kicks),
    defending: calcAttr(base.defending),
    composure: calcAttr(base.composure),
    aggression: calcAttr(base.aggression),
    leadership: calcAttr(base.leadership),
    gk_reflexes: calcAttr(base.gk_reflexes),
    gk_positioning: calcAttr(base.gk_positioning),
    gk_handling: calcAttr(base.gk_handling),
    gk_kicking: calcAttr(base.gk_kicking),
    gk_penalty_save: calcAttr(base.gk_penalty_save),
  });
}
