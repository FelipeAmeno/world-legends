import { Err, Ok, type Result } from '@world-legends/shared';
/**
 * MissionRepository — Porta + Adapter Supabase.
 *
 * Dois modelos de persistência:
 *   - mission_progress:    daily / weekly  (por período — `period_key`)
 *   - achievement_progress: lifetime / conquistas (permanente por usuário)
 */
import type { DbClient, TableRow } from '../../adapters/supabase-client';
import type { DbError } from '../profiles/profile-repository';

// ─── Tipos de domínio ─────────────────────────────────────────────────────────

export type MissionProgressRow = Readonly<{
  id: string;
  profileId: string;
  missionId: string;
  periodKey: string;
  currentValue: number;
  claimedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

export type AchievementProgressRow = Readonly<{
  id: string;
  profileId: string;
  missionId: string;
  currentValue: number;
  stageClaimed: number;
  firstUnlockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;

// ─── Porta ────────────────────────────────────────────────────────────────────

export interface IMissionRepository {
  // Daily / Weekly
  getMissionProgress(
    profileId: string,
    periodKey: string,
  ): Promise<Result<readonly MissionProgressRow[], DbError>>;

  incrementMissionProgress(
    profileId: string,
    missionId: string,
    periodKey: string,
    delta: number,
  ): Promise<Result<MissionProgressRow, DbError>>;

  claimMission(
    profileId: string,
    missionId: string,
    periodKey: string,
  ): Promise<Result<MissionProgressRow, DbError>>;

  // Achievements / Lifetime
  getAchievementProgress(
    profileId: string,
  ): Promise<Result<readonly AchievementProgressRow[], DbError>>;

  incrementAchievement(
    profileId: string,
    missionId: string,
    delta: number,
  ): Promise<Result<AchievementProgressRow, DbError>>;

  claimAchievementStage(
    profileId: string,
    missionId: string,
    stage: number,
  ): Promise<Result<AchievementProgressRow, DbError>>;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function toMissionProgress(row: TableRow<'mission_progress'>): MissionProgressRow {
  return Object.freeze({
    id: row.id,
    profileId: row.profile_id,
    missionId: row.mission_id,
    periodKey: row.period_key,
    currentValue: row.current_value,
    claimedAt: row.claimed_at ? new Date(row.claimed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function toAchievementProgress(row: TableRow<'achievement_progress'>): AchievementProgressRow {
  return Object.freeze({
    id: row.id,
    profileId: row.profile_id,
    missionId: row.mission_id,
    currentValue: row.current_value,
    stageClaimed: row.stage_claimed,
    firstUnlockedAt: row.first_unlocked_at ? new Date(row.first_unlocked_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });
}

function dbErr(error: { code?: string; message?: string } | null): DbError {
  return Object.freeze({
    code: error?.code ?? 'UNKNOWN',
    message: error?.message ?? 'Erro no banco',
  });
}

// ─── Adapter Supabase ─────────────────────────────────────────────────────────

export class SupabaseMissionRepository implements IMissionRepository {
  constructor(private readonly db: DbClient) {}

  async getMissionProgress(
    profileId: string,
    periodKey: string,
  ): Promise<Result<readonly MissionProgressRow[], DbError>> {
    const { data, error } = await this.db
      .from('mission_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('period_key', periodKey);
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map(toMissionProgress)));
  }

  /**
   * Upsert atômico de progresso: incrementa `current_value` em `delta`.
   * Se a linha não existir, cria com current_value = delta.
   * Usa ON CONFLICT DO UPDATE para evitar race conditions.
   */
  async incrementMissionProgress(
    profileId: string,
    missionId: string,
    periodKey: string,
    delta: number,
  ): Promise<Result<MissionProgressRow, DbError>> {
    const now = new Date().toISOString();

    // Upsert: se existe, soma delta; se não existe, cria com delta
    const { data: existing } = await this.db
      .from('mission_progress')
      .select('current_value, id')
      .eq('profile_id', profileId)
      .eq('mission_id', missionId)
      .eq('period_key', periodKey)
      .maybeSingle();

    if (existing) {
      const { data, error } = await this.db
        .from('mission_progress')
        .update({ current_value: existing.current_value + delta, updated_at: now })
        .eq('profile_id', profileId)
        .eq('mission_id', missionId)
        .eq('period_key', periodKey)
        .select('*')
        .single();
      if (error || !data) return Err(dbErr(error));
      return Ok(toMissionProgress(data));
    }

    const { data, error } = await this.db
      .from('mission_progress')
      .insert({
        profile_id: profileId,
        mission_id: missionId,
        period_key: periodKey,
        current_value: delta,
      })
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toMissionProgress(data));
  }

  async claimMission(
    profileId: string,
    missionId: string,
    periodKey: string,
  ): Promise<Result<MissionProgressRow, DbError>> {
    const { data, error } = await this.db
      .from('mission_progress')
      .update({ claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('profile_id', profileId)
      .eq('mission_id', missionId)
      .eq('period_key', periodKey)
      .is('claimed_at', null)
      .select('*')
      .single();
    if (error || !data)
      return Err(dbErr(error ?? { message: 'Missão já coletada ou não encontrada.' }));
    return Ok(toMissionProgress(data));
  }

  async getAchievementProgress(
    profileId: string,
  ): Promise<Result<readonly AchievementProgressRow[], DbError>> {
    const { data, error } = await this.db
      .from('achievement_progress')
      .select('*')
      .eq('profile_id', profileId);
    if (error) return Err(dbErr(error));
    return Ok(Object.freeze((data ?? []).map(toAchievementProgress)));
  }

  async incrementAchievement(
    profileId: string,
    missionId: string,
    delta: number,
  ): Promise<Result<AchievementProgressRow, DbError>> {
    const now = new Date().toISOString();

    const { data: existing } = await this.db
      .from('achievement_progress')
      .select('current_value, id')
      .eq('profile_id', profileId)
      .eq('mission_id', missionId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await this.db
        .from('achievement_progress')
        .update({ current_value: existing.current_value + delta, updated_at: now })
        .eq('profile_id', profileId)
        .eq('mission_id', missionId)
        .select('*')
        .single();
      if (error || !data) return Err(dbErr(error));
      return Ok(toAchievementProgress(data));
    }

    const { data, error } = await this.db
      .from('achievement_progress')
      .insert({ profile_id: profileId, mission_id: missionId, current_value: delta })
      .select('*')
      .single();
    if (error || !data) return Err(dbErr(error));
    return Ok(toAchievementProgress(data));
  }

  async claimAchievementStage(
    profileId: string,
    missionId: string,
    stage: number,
  ): Promise<Result<AchievementProgressRow, DbError>> {
    const now = new Date().toISOString();

    // Buscar estado atual para verificar idempotência
    const { data: existing, error: fetchErr } = await this.db
      .from('achievement_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('mission_id', missionId)
      .maybeSingle();

    if (fetchErr) return Err(dbErr(fetchErr));

    if (!existing) {
      return Err(dbErr({ message: 'Achievement não encontrado.' }));
    }

    if (existing.stage_claimed >= stage) {
      return Err(dbErr({ message: 'Stage já coletado.' }));
    }

    const { data, error } = await this.db
      .from('achievement_progress')
      .update({
        stage_claimed: stage,
        first_unlocked_at: existing.first_unlocked_at ?? now,
        updated_at: now,
      })
      .eq('profile_id', profileId)
      .eq('mission_id', missionId)
      .select('*')
      .single();

    if (error || !data) return Err(dbErr(error));
    return Ok(toAchievementProgress(data));
  }
}
