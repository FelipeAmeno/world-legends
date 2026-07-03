'use server';

import {
  ALL_MISSION_DEFS,
  ACHIEVEMENT_IDS,
  type MissionDef,
  type MissionProgress,
  type MissionReward,
  type MissionStage,
  type MissionView,
  type TrackKey,
  dailyPeriodKey,
  weeklyPeriodKey,
} from '@/lib/mission-system';
import { getAuthenticatedUserId, getServiceDb } from '@/lib/server/db';
import type { AchievementProgressRow, MissionProgressRow } from '@world-legends/db';
import { SupabaseMissionRepository, SupabaseProfileRepository } from '@world-legends/db';

// ─── Tipos públicos ───────────────────────────────────────────────────────────

export type { MissionView, MissionDef, MissionStage, MissionReward };

export type MissionsData = {
  views: MissionView[];
  periodKeys: { daily: string; weekly: string };
};

export type ClaimMissionResult =
  | { ok: true; rewards: MissionReward[]; newBalance: number }
  | { ok: false; error: string };

// ─── getMissionsAction ────────────────────────────────────────────────────────

/**
 * Carrega todo o progresso de missões do usuário e devolve views prontas para UI.
 * Chamado no mount do MissionsPage (useEffect ou Server Component).
 */
export async function getMissionsAction(): Promise<MissionsData> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { views: buildEmptyViews(), periodKeys: { daily: dailyPeriodKey(), weekly: weeklyPeriodKey() } };
  }

  const db = getServiceDb();
  const repo = new SupabaseMissionRepository(db);
  const daily = dailyPeriodKey();
  const weekly = weeklyPeriodKey();

  const [dailyProgress, weeklyProgress, achievementProgress] = await Promise.all([
    repo.getMissionProgress(userId, daily),
    repo.getMissionProgress(userId, weekly),
    repo.getAchievementProgress(userId),
  ]);

  const progressByMissionId = new Map<string, MissionProgress>();

  // Daily progress rows
  if (dailyProgress.ok) {
    for (const row of dailyProgress.value) {
      progressByMissionId.set(row.missionId, dbRowToProgress(row));
    }
  }

  // Weekly progress rows
  if (weeklyProgress.ok) {
    for (const row of weeklyProgress.value) {
      progressByMissionId.set(row.missionId, dbRowToProgress(row));
    }
  }

  // Achievement rows
  if (achievementProgress.ok) {
    for (const row of achievementProgress.value) {
      progressByMissionId.set(row.missionId, achievementRowToProgress(row));
    }
  }

  const views = ALL_MISSION_DEFS.map((def) => buildView(def, progressByMissionId.get(def.id)));

  return { views, periodKeys: { daily, weekly } };
}

// ─── claimMissionRewardAction ─────────────────────────────────────────────────

/**
 * Coleta recompensa de uma missão.
 * Valida server-side que a missão está realmente completa antes de creditar.
 */
export async function claimMissionRewardAction(
  missionId: string,
  stage: number,
  periodKey: string,
): Promise<ClaimMissionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: 'Não autenticado.' };

  const def = ALL_MISSION_DEFS.find((d) => d.id === missionId);
  if (!def) return { ok: false, error: 'Missão não encontrada.' };

  const stageDef = def.stages.find((s) => s.stage === stage);
  if (!stageDef) return { ok: false, error: 'Stage inválido.' };

  const db = getServiceDb();
  const repo = new SupabaseMissionRepository(db);
  const profileRepo = new SupabaseProfileRepository(db);

  const isAchievement = def.type === 'lifetime';

  // Verificar progresso atual antes de permitir o claim
  let currentValue = 0;

  if (isAchievement) {
    const progress = await repo.getAchievementProgress(userId);
    if (progress.ok) {
      const row = progress.value.find((r) => r.missionId === missionId);
      currentValue = row?.currentValue ?? 0;
      if (row && row.stageClaimed >= stage) {
        return { ok: false, error: 'Stage já coletado.' };
      }
    }
  } else {
    const progress = await repo.getMissionProgress(userId, periodKey);
    if (progress.ok) {
      const row = progress.value.find((r) => r.missionId === missionId);
      if (row?.claimedAt) return { ok: false, error: 'Missão já coletada.' };
      currentValue = row?.currentValue ?? 0;
    }
  }

  // Validação: o progresso deve ter atingido o target do stage
  if (currentValue < stageDef.target) {
    return { ok: false, error: 'Missão não concluída.' };
  }

  // Creditar recompensas
  const credits = stageDef.rewards.reduce((s, r) => s + (r.kind === 'credits' ? r.amount : 0), 0);
  const fragments = stageDef.rewards.reduce(
    (s, r) => s + (r.kind === 'fragments' ? r.amount : 0),
    0,
  );

  let newBalance = 0;

  if (credits > 0) {
    const creditResult = await profileRepo.creditSoftCurrency(userId, credits);
    if (creditResult.ok) newBalance = creditResult.value;
  }

  if (fragments > 0) {
    await profileRepo.creditFragments(userId, fragments);
  }

  // Marcar como coletado
  if (isAchievement) {
    await repo.claimAchievementStage(userId, missionId, stage);
  } else {
    // Para daily/weekly sem progresso no DB ainda, garantir que a linha existe
    await repo.incrementMissionProgress(userId, missionId, periodKey, 0);
    await repo.claimMission(userId, missionId, periodKey);
  }

  return { ok: true, rewards: [...stageDef.rewards], newBalance };
}

// ─── incrementMissionProgressAction ──────────────────────────────────────────

/**
 * Incrementa o progresso de um track key em todas as missões relevantes.
 * Chamado internamente por playMatchAction, openPackAction etc.
 * Não é chamado diretamente pelo cliente.
 */
export async function incrementMissionProgressInternal(
  userId: string,
  trackKey: TrackKey,
  delta: number,
): Promise<void> {
  if (delta <= 0) return;

  const db = getServiceDb();
  const repo = new SupabaseMissionRepository(db);
  const daily = dailyPeriodKey();
  const weekly = weeklyPeriodKey();

  const relevantDefs = ALL_MISSION_DEFS.filter((d) => d.trackKey === trackKey);

  await Promise.all(
    relevantDefs.map(async (def) => {
      if (def.type === 'daily') {
        await repo.incrementMissionProgress(userId, def.id, daily, delta);
      } else if (def.type === 'weekly') {
        await repo.incrementMissionProgress(userId, def.id, weekly, delta);
      } else {
        // lifetime / achievement
        await repo.incrementAchievement(userId, def.id, delta);
      }
    }),
  );
}

/**
 * Seta o valor absoluto de um achievement (usado para winStreak, brazilianCards, etc.)
 * que não é incremental mas sim um valor snapshot.
 */
export async function setAchievementValueInternal(
  userId: string,
  missionId: string,
  value: number,
): Promise<void> {
  const db = getServiceDb();
  const repo = new SupabaseMissionRepository(db);

  // Para achievements de snapshot: sobreescrever com o valor atual
  const existing = await repo.getAchievementProgress(userId);
  if (!existing.ok) return;

  const row = existing.value.find((r) => r.missionId === missionId);
  const current = row?.currentValue ?? 0;

  // Só incrementar se o novo valor for maior (para evitar regressão de streak, etc.)
  if (value > current) {
    const delta = value - current;
    await repo.incrementAchievement(userId, missionId, delta);
  }
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

function dbRowToProgress(row: MissionProgressRow): MissionProgress {
  return {
    missionId: row.missionId,
    current: row.currentValue,
    stageClaimed: row.claimedAt ? 1 : 0,
    lastRefresh: row.updatedAt.toISOString(),
  };
}

function achievementRowToProgress(row: AchievementProgressRow): MissionProgress {
  return {
    missionId: row.missionId,
    current: row.currentValue,
    stageClaimed: row.stageClaimed,
    lastRefresh: row.updatedAt.toISOString(),
  };
}

function buildEmptyViews(): MissionView[] {
  const now = new Date();
  return ALL_MISSION_DEFS.map((def) => buildView(def, undefined, now));
}

function buildView(
  def: MissionDef,
  p: MissionProgress | undefined,
  now: Date = new Date(),
): MissionView {
  const progress = p ?? {
    missionId: def.id,
    current: 0,
    stageClaimed: 0,
    lastRefresh: now.toISOString(),
  };

  const rawValue = progress.current;

  const nextUnclaimedStage =
    def.stages.find((s) => s.stage > progress.stageClaimed) ?? def.stages[def.stages.length - 1]!;
  const prevStageTarget = def.stages.find((s) => s.stage === progress.stageClaimed)?.target ?? 0;
  const currentTarget = nextUnclaimedStage.target;

  const stageProgress = Math.max(0, rawValue - prevStageTarget);
  const stageRange = Math.max(1, currentTarget - prevStageTarget);
  const pct = Math.min(100, Math.round((stageProgress / stageRange) * 100));
  const claimable = rawValue >= currentTarget && progress.stageClaimed < nextUnclaimedStage.stage;
  const lastStage = def.stages[def.stages.length - 1]!;
  const allDone = progress.stageClaimed >= lastStage.stage;

  return {
    def,
    progress: { ...progress, current: rawValue },
    currentStage: nextUnclaimedStage,
    nextStage: def.stages.find((s) => s.stage === nextUnclaimedStage.stage + 1) ?? null,
    pct,
    claimable,
    allDone,
  };
}

export { ACHIEVEMENT_IDS };
