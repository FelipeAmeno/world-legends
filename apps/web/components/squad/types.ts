// Tipos compartilhados entre componentes do SquadBuilder
export type DragSource =
  | { type: 'pool'; cardId: string }
  | { type: 'slot'; cardId: string; slotId: string }
  | { type: 'bench'; cardId: string; benchIdx: number };
