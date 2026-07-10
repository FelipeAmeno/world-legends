/**
 * lib/pose-engine/poseCatalog.ts — Sprint 28 (Pose System)
 *
 * O catálogo de poses do brief, uma entrada = um conjunto de ângulos
 * (ver `rig.ts`) — decisão própria de design (nenhuma referência de
 * imagem real), calibrada à mão pra cada pose parecer plausível pro
 * nome que carrega. Adicionar centenas de poses futuras é só adicionar
 * entradas aqui — `PoseFigure.tsx` desenha qualquer `PoseDef` sem
 * mudança nenhuma.
 *
 * `minRarityRank` reserva as poses mais espetaculares (voleio,
 * bicicleta) pra cartas Elite+/Legendary+ — times Common não fazem
 * bicicleta toda partida.
 */
import type { PoseDef } from './types';

export const ATTACKER_POSES: readonly PoseDef[] = [
  {
    id: 'atk-correndo',
    label: 'Correndo',
    category: 'attacker',
    angles: {
      torsoLean: 8,
      headTilt: 0,
      leftShoulder: 130,
      leftElbow: -60,
      rightShoulder: -100,
      rightElbow: 70,
      leftHip: -35,
      leftKnee: 40,
      rightHip: 35,
      rightKnee: -50,
    },
  },
  {
    id: 'atk-chutando',
    label: 'Chutando',
    category: 'attacker',
    angles: {
      torsoLean: -12,
      headTilt: 0,
      leftShoulder: -60,
      leftElbow: 30,
      rightShoulder: 100,
      rightElbow: -40,
      leftHip: -70,
      leftKnee: 10,
      rightHip: 5,
      rightKnee: -5,
    },
  },
  {
    id: 'atk-comemorando',
    label: 'Comemorando',
    category: 'attacker',
    angles: {
      torsoLean: -5,
      headTilt: 0,
      leftShoulder: -170,
      leftElbow: -10,
      rightShoulder: 170,
      rightElbow: 10,
      leftHip: -10,
      leftKnee: 15,
      rightHip: 10,
      rightKnee: 0,
    },
  },
  {
    id: 'atk-voleio',
    label: 'Voleio',
    category: 'attacker',
    minRarityRank: 2, // Elite+
    angles: {
      torsoLean: 25,
      headTilt: -15,
      leftShoulder: -100,
      leftElbow: -30,
      rightShoulder: 90,
      rightElbow: 40,
      leftHip: -90,
      leftKnee: 20,
      rightHip: 10,
      rightKnee: -10,
    },
  },
  {
    id: 'atk-bicicleta',
    label: 'Bicicleta',
    category: 'attacker',
    minRarityRank: 3, // Legendary+
    angles: {
      torsoLean: -55,
      headTilt: 20,
      leftShoulder: 150,
      leftElbow: 20,
      rightShoulder: -150,
      rightElbow: -20,
      leftHip: -120,
      leftKnee: 15,
      rightHip: -40,
      rightKnee: -60,
    },
  },
];

export const MIDFIELDER_POSES: readonly PoseDef[] = [
  {
    id: 'mid-dominando',
    label: 'Dominando',
    category: 'midfielder',
    angles: {
      torsoLean: 5,
      headTilt: 20,
      leftShoulder: -70,
      leftElbow: 20,
      rightShoulder: 75,
      rightElbow: -25,
      leftHip: -45,
      leftKnee: 55,
      rightHip: 0,
      rightKnee: 5,
    },
  },
  {
    id: 'mid-girando',
    label: 'Girando',
    category: 'midfielder',
    angles: {
      torsoLean: 15,
      headTilt: -10,
      leftShoulder: 120,
      leftElbow: -40,
      rightShoulder: -110,
      rightElbow: 50,
      leftHip: 40,
      leftKnee: -30,
      rightHip: -20,
      rightKnee: 10,
    },
  },
  {
    id: 'mid-passando',
    label: 'Passando',
    category: 'midfielder',
    angles: {
      torsoLean: 8,
      headTilt: 5,
      leftShoulder: -50,
      leftElbow: 15,
      rightShoulder: 60,
      rightElbow: -20,
      leftHip: -50,
      leftKnee: 25,
      rightHip: 8,
      rightKnee: -5,
    },
  },
];

export const DEFENDER_POSES: readonly PoseDef[] = [
  {
    id: 'def-carrinho',
    label: 'Carrinho',
    category: 'defender',
    angles: {
      torsoLean: 60,
      headTilt: -20,
      leftShoulder: 40,
      leftElbow: 60,
      rightShoulder: -30,
      rightElbow: -50,
      leftHip: -80,
      leftKnee: 5,
      rightHip: 60,
      rightKnee: 90,
    },
  },
  {
    id: 'def-interceptacao',
    label: 'Interceptação',
    category: 'defender',
    angles: {
      torsoLean: 25,
      headTilt: -10,
      leftShoulder: -90,
      leftElbow: -20,
      rightShoulder: 60,
      rightElbow: 30,
      leftHip: -55,
      leftKnee: 20,
      rightHip: 15,
      rightKnee: -10,
    },
  },
  {
    id: 'def-disputa-aerea',
    label: 'Disputa Aérea',
    category: 'defender',
    angles: {
      torsoLean: -30,
      headTilt: 30,
      leftShoulder: 130,
      leftElbow: -20,
      rightShoulder: -130,
      rightElbow: 20,
      leftHip: 20,
      leftKnee: -40,
      rightHip: -15,
      rightKnee: -45,
    },
  },
];

export const GOALKEEPER_POSES: readonly PoseDef[] = [
  {
    id: 'gk-defesa',
    label: 'Defesa',
    category: 'goalkeeper',
    angles: {
      torsoLean: 75,
      headTilt: -15,
      leftShoulder: -100,
      leftElbow: -15,
      rightShoulder: 80,
      rightElbow: 30,
      leftHip: -30,
      leftKnee: 15,
      rightHip: 40,
      rightKnee: -20,
    },
  },
  {
    id: 'gk-salto',
    label: 'Salto',
    category: 'goalkeeper',
    angles: {
      torsoLean: -8,
      headTilt: 10,
      leftShoulder: -165,
      leftElbow: -10,
      rightShoulder: 165,
      rightElbow: 10,
      leftHip: 20,
      leftKnee: -70,
      rightHip: -15,
      rightKnee: -65,
    },
  },
  {
    id: 'gk-espalmando',
    label: 'Espalmando',
    category: 'goalkeeper',
    angles: {
      torsoLean: 35,
      headTilt: -20,
      leftShoulder: -120,
      leftElbow: 40,
      rightShoulder: 100,
      rightElbow: -30,
      leftHip: -40,
      leftKnee: 10,
      rightHip: 30,
      rightKnee: -15,
    },
  },
];

export const ALL_POSES: readonly PoseDef[] = [
  ...ATTACKER_POSES,
  ...MIDFIELDER_POSES,
  ...DEFENDER_POSES,
  ...GOALKEEPER_POSES,
];
