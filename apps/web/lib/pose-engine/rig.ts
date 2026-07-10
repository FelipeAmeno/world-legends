/**
 * lib/pose-engine/rig.ts — Sprint 28 (Pose System)
 *
 * O Pose Engine NÃO guarda um desenho por pose — guarda um conjunto de
 * ÂNGULOS (ombro/cotovelo/quadril/joelho/tronco/cabeça) por pose, e um
 * único "rig" (esqueleto articulado) desenha qualquer combinação de
 * ângulos. Adicionar uma pose nova = adicionar um objeto de ângulos em
 * `poseCatalog.ts` — nunca um SVG novo desenhado à mão. É isso que torna
 * "preparado para centenas de poses futuras" verdade: a superfície de
 * customização é um punhado de números, não arte vetorial.
 *
 * Cinemática direta (forward kinematics) simples de boneco articulado
 * 2D: cada membro é um segmento de reta a partir do ponto de ancoragem
 * do membro anterior, na direção do ângulo configurado. Ângulo 0° =
 * apontando reto pra baixo; positivo = rotação horária (perna/braço
 * jogado pra direita do boneco).
 */

export type PoseAngles = Readonly<{
  /** Inclinação do tronco a partir da vertical (negativo = pra trás). */
  torsoLean: number;
  /** Inclinação da cabeça relativa ao tronco. */
  headTilt: number;
  leftShoulder: number;
  leftElbow: number;
  rightShoulder: number;
  rightElbow: number;
  leftHip: number;
  leftKnee: number;
  rightHip: number;
  rightKnee: number;
}>;

export type PoseProportions = Readonly<{
  headRadius: number;
  torsoLength: number;
  upperArmLength: number;
  forearmLength: number;
  thighLength: number;
  shinLength: number;
  limbWidth: number;
}>;

export const DEFAULT_PROPORTIONS: PoseProportions = {
  headRadius: 9,
  torsoLength: 34,
  upperArmLength: 20,
  forearmLength: 18,
  thighLength: 26,
  shinLength: 24,
  limbWidth: 9,
};

export type Point = Readonly<{ x: number; y: number }>;

/** Ponto a `length` de distância de `origin`, na direção `angleDeg` (0° = reto pra baixo, horário). */
function polarOffset(origin: Point, angleDeg: number, length: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: origin.x + Math.sin(rad) * length,
    y: origin.y + Math.cos(rad) * length,
  };
}

export type RigJoints = Readonly<{
  hipCenter: Point;
  shoulderCenter: Point;
  headCenter: Point;
  leftElbow: Point;
  leftHand: Point;
  rightElbow: Point;
  rightHand: Point;
  leftKnee: Point;
  leftFoot: Point;
  rightKnee: Point;
  rightFoot: Point;
}>;

/**
 * Resolve todas as posições de junta a partir dos ângulos + proporções —
 * pura, determinística, sem nenhum estado. `hipCenter` é o ponto de
 * ancoragem raiz do boneco inteiro (coordenadas do viewBox do SVG).
 */
export function resolveRigJoints(
  hipCenter: Point,
  angles: PoseAngles,
  proportions: PoseProportions = DEFAULT_PROPORTIONS,
): RigJoints {
  const p = proportions;
  // Tronco sobe (ângulo invertido: "reto pra cima" é o padrão de repouso do tronco).
  const shoulderCenter = polarOffset(hipCenter, 180 + angles.torsoLean, p.torsoLength);
  const headCenter = polarOffset(
    shoulderCenter,
    180 + angles.torsoLean + angles.headTilt,
    p.headRadius * 1.6,
  );

  const leftElbow = polarOffset(shoulderCenter, angles.leftShoulder, p.upperArmLength);
  const leftHand = polarOffset(leftElbow, angles.leftShoulder + angles.leftElbow, p.forearmLength);
  const rightElbow = polarOffset(shoulderCenter, angles.rightShoulder, p.upperArmLength);
  const rightHand = polarOffset(
    rightElbow,
    angles.rightShoulder + angles.rightElbow,
    p.forearmLength,
  );

  const leftKnee = polarOffset(hipCenter, angles.leftHip, p.thighLength);
  const leftFoot = polarOffset(leftKnee, angles.leftHip + angles.leftKnee, p.shinLength);
  const rightKnee = polarOffset(hipCenter, angles.rightHip, p.thighLength);
  const rightFoot = polarOffset(rightKnee, angles.rightHip + angles.rightKnee, p.shinLength);

  return {
    hipCenter,
    shoulderCenter,
    headCenter,
    leftElbow,
    leftHand,
    rightElbow,
    rightHand,
    leftKnee,
    leftFoot,
    rightKnee,
    rightFoot,
  };
}
