/**
 * Tipos do fluxo de Missions — separados de missions.ts porque um arquivo
 * 'use server' só pode exportar funções async (Next.js/Turbopack).
 */
import type { MissionDef, MissionReward, MissionStage, MissionView } from '@/lib/mission-system';

export type { MissionView, MissionDef, MissionStage, MissionReward };

export type MissionsData = {
  views: MissionView[];
  periodKeys: { daily: string; weekly: string };
};

export type ClaimMissionResult =
  | { ok: true; rewards: MissionReward[]; newBalance: number }
  | { ok: false; error: string };
