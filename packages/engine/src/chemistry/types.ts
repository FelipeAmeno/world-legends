/**
 * Tipos de entrada de `calculateChemistry` — posicionamento temporário,
 * mesma nota de `overall/types.ts`.
 *
 * Decisão deliberada de escopo: nenhuma das 7 formações do doc 09 §15
 * tem, em qualquer documento, um mapa concreto de adjacência de slots
 * (o doc apenas AFIRMA que "cada formação define o mapa de slots usado
 * pelo cálculo de química", sem nunca desenhar esse mapa para nenhuma
 * formação específica). Inventar essa geometria agora seria violar
 * "seguir rigorosamente a documentação" — são dados de balanceamento
 * que não existem em doc nenhum. Por isso `calculateChemistry` recebe a
 * lista de pares adjacentes como PARÂMETRO, em vez de derivá-la
 * internamente a partir de um código de formação. Derivar essa
 * geometria fica para uma tarefa futura (`packages/engine/src/formations`,
 * ou similar), quando o mapa de slots por formação for de fato
 * especificado em algum doc.
 */
import type { Position } from '../position';

/** Os dados de um jogador relevantes ao cálculo de química — não o agregado Player completo. */
export type ChemistryPlayer = Readonly<{
  /** Código de seleção/nação (ex: 'BRA') — comparado por igualdade simples, doc 09 §4 e doc 10 §7. */
  nationality: string;
  /** Ano de início da era de carreira relevante a esta carta (doc 17, invariante `era_start <= era_end`). */
  eraStart: number;
  /** Ano de fim da era de carreira relevante a esta carta. */
  eraEnd: number;
  /**
   * Edição específica de Copa que ESTA CARTA representa (ex: 1970),
   * se houver — doc 10 §7. `undefined` para cartas que representam a
   * carreira em geral, sem vínculo a uma campanha específica (doc 04 §1,
   * exemplo do Pelé "Comum" vs "Ultra Lendária edição Copa 1970").
   */
  worldCupYear?: number;
  /** Posição primária do jogador — usada no bônus de encaixe posicional (doc 09 §4). */
  primaryPosition: Position;
}>;

/** Um slot ocupado na formação: qual posição ele exige, e qual jogador está nele. */
export type ChemistrySquadSlot = Readonly<{
  /** Identificador único do slot dentro desta formação (ex: 'LB', 'CB1', 'ST1'). */
  slotId: string;
  /** A posição que ESTE SLOT exige na formação — pode diferir da posição primária do jogador. */
  formationPosition: Position;
  player: ChemistryPlayer;
}>;

/** Um par de slots considerados adjacentes nesta formação (ver nota de escopo acima). */
export type AdjacentSlotPair = Readonly<{ slotIdA: string; slotIdB: string }>;
