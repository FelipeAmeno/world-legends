/**
 * lib/pose-engine/types.ts — Sprint 28 (Pose System)
 */
import type { PoseAngles } from './rig';

/**
 * Categoria de pose — mapeada a partir da posição real do jogador
 * (`positionToPoseCategory`, em `poseResolver.ts`). Corresponde
 * exatamente aos 4 grupos do brief.
 */
export type PoseCategory = 'attacker' | 'midfielder' | 'defender' | 'goalkeeper';

export type PoseDef = Readonly<{
  id: string;
  /** Rótulo em PT-BR — usado no Pose Preview/Debug do Dev Tool. */
  label: string;
  category: PoseCategory;
  angles: PoseAngles;
  /**
   * Raridade mínima pra esta pose poder ser sorteada (opcional). Uso:
   * poses mais "espetaculares" (bicicleta, voleio) reservadas pra
   * cartas Elite+ — igual o brief pede implicitamente ao listar poses
   * mais dramáticas separado das básicas.
   */
  minRarityRank?: number;
}>;
