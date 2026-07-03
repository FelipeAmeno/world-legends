/**
 * Position — promovido para `engine/src/position.ts` (compartilhado entre
 * `overall` e `chemistry`, ambos precisam dele) a partir da Tarefa T005.
 * Mesmo posicionamento temporário de antes (ver nota em
 * `overall/types.ts`): o lugar correto é `packages/types`, ainda vazio.
 *
 * As 15 posições válidas — doc 02 (constraint `primary_position`),
 * confirmado por doc 17 (Invariantes) como remetendo a doc 09 §1.
 */
export type Position =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'LWB'
  | 'RWB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'CF'
  | 'ST';
