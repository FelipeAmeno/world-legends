'use client';

/**
 * components/cards/pose/PoseFigure.tsx — Sprint 28 (Pose System)
 *
 * O "PoseLayer" propriamente dito: desenha UM `PoseDef` (ver
 * `lib/pose-engine`) como uma silhueta articulada — cabeça, tronco,
 * braços, pernas — via cinemática direta (`resolveRigJoints`). Nenhum
 * SVG desenhado à mão por pose: o mesmo componente serve pras 14 poses
 * do catálogo de hoje e pras centenas que vierem depois, porque tudo
 * que muda entre poses são os ÂNGULOS, nunca a lógica de desenho.
 *
 * Estilo silhueta (um tom só + rim-light da cor do kit) — mesmo
 * espírito de ícone atlético/logo esportivo, não uma ilustração
 * fotorrealista; combina com o resto do Card Engine (Frame/Glow/HUD
 * também são formas limpas, não fotografia).
 */

import type { PoseDef } from '@/lib/pose-engine/types';
import { type PoseProportions, resolveRigJoints } from '@/lib/pose-engine/rig';

type Props = {
  pose: PoseDef;
  /** Cor de preenchimento da silhueta (normalmente um tom escuro neutro). */
  fillColor?: string;
  /** Cor de destaque (rim-light) — normalmente `kit.primary` ou o accent de raridade. */
  accentColor?: string;
  width?: number | string;
  height?: number | string;
  proportions?: PoseProportions;
};

const VIEW_W = 100;
const VIEW_H = 140;
const HIP_ANCHOR = { x: 50, y: 92 };

export function PoseFigure({
  pose,
  fillColor = '#12131c',
  accentColor = '#ffffff',
  width,
  height,
  proportions,
}: Props) {
  const joints = resolveRigJoints(HIP_ANCHOR, pose.angles, proportions);
  const limbWidth = proportions?.limbWidth ?? 9;

  const bone = (a: { x: number; y: number }, b: { x: number; y: number }, key: string) => (
    <line
      key={key}
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={fillColor}
      strokeWidth={limbWidth}
      strokeLinecap="round"
    />
  );

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={width}
      height={height}
      style={{ overflow: 'visible' }}
      role="img"
      aria-label={`Pose: ${pose.label}`}
    >
      <title>{pose.label}</title>
      {/* Rim-light sutil atrás da silhueta inteira */}
      <g opacity={0.35} stroke={accentColor} fill="none">
        {bone(joints.hipCenter, joints.shoulderCenter, 'rim-torso')}
        {bone(joints.shoulderCenter, joints.leftElbow, 'rim-l-upper')}
        {bone(joints.leftElbow, joints.leftHand, 'rim-l-fore')}
        {bone(joints.shoulderCenter, joints.rightElbow, 'rim-r-upper')}
        {bone(joints.rightElbow, joints.rightHand, 'rim-r-fore')}
        {bone(joints.hipCenter, joints.leftKnee, 'rim-l-thigh')}
        {bone(joints.leftKnee, joints.leftFoot, 'rim-l-shin')}
        {bone(joints.hipCenter, joints.rightKnee, 'rim-r-thigh')}
        {bone(joints.rightKnee, joints.rightFoot, 'rim-r-shin')}
      </g>

      {/* Silhueta sólida */}
      <g strokeWidth={limbWidth - 2} style={{ mixBlendMode: 'normal' }}>
        {bone(joints.hipCenter, joints.shoulderCenter, 'torso')}
        {bone(joints.shoulderCenter, joints.leftElbow, 'l-upper')}
        {bone(joints.leftElbow, joints.leftHand, 'l-fore')}
        {bone(joints.shoulderCenter, joints.rightElbow, 'r-upper')}
        {bone(joints.rightElbow, joints.rightHand, 'r-fore')}
        {bone(joints.hipCenter, joints.leftKnee, 'l-thigh')}
        {bone(joints.leftKnee, joints.leftFoot, 'l-shin')}
        {bone(joints.hipCenter, joints.rightKnee, 'r-thigh')}
        {bone(joints.rightKnee, joints.rightFoot, 'r-shin')}
      </g>

      <circle
        cx={joints.headCenter.x}
        cy={joints.headCenter.y}
        r={proportions?.headRadius ?? 9}
        fill={fillColor}
        stroke={accentColor}
        strokeOpacity={0.35}
        strokeWidth={1.5}
      />
    </svg>
  );
}
