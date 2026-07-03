/**
 * Use-cases do bounded context Progression (T031).
 *
 * Quatro funções puras exportadas:
 *   createProfile()  — cria UserProfile no nível 1
 *   gainXp()         — adiciona XP, sobe níveis, concede recompensas
 *   levelUp()        — verifica e aplica um único level-up
 *   rewardTrack()    — retorna recompensas de um nível específico
 *
 * Todas as funções são puras — sem I/O, sem estado global.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import { getRewardsForLevel } from '../rewards/reward-track';
import type {
  GainXpResult,
  LevelUpEvent,
  ProgressionError,
  RewardTrackItem,
  UserId,
  UserProfile,
} from '../types/types';
import { MAX_LEVEL, userId as makeUserId } from '../types/types';
import {
  currentXpInLevel,
  levelFromTotalXp,
  totalXpForLevel,
  xpRequiredForNextLevel,
  xpToNextLevel,
} from '../xp/xp-curve';

// ─── createProfile ────────────────────────────────────────────────────────────

export function createProfile(rawUserId: string): Result<UserProfile, ProgressionError> {
  if (!rawUserId.trim()) {
    return Err(validationError('userId não pode ser vazio', 'userId'));
  }

  // Nível 1, XP zero — concede as recompensas de nível 1 ao criar
  return Ok(
    Object.freeze({
      userId: rawUserId as UserId,
      level: 1,
      currentXp: 0,
      totalXpEarned: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  );
}

// ─── rewardTrack ──────────────────────────────────────────────────────────────

/**
 * Retorna as recompensas definidas para um nível específico.
 * Wrapper de use-case em cima de getRewardsForLevel().
 */
export function rewardTrack(level: number): readonly RewardTrackItem[] {
  return getRewardsForLevel(level);
}

// ─── levelUp ─────────────────────────────────────────────────────────────────

/**
 * Verifica se o perfil deve subir de nível e aplica UM level-up.
 * Retorna o perfil atualizado e o evento de level-up, ou null se
 * não há nível a subir.
 *
 * Chamado internamente por gainXp() em loop para suportar multi-level-up.
 */
export function levelUp(profile: UserProfile): {
  updatedProfile: UserProfile;
  event: LevelUpEvent;
} | null {
  if (profile.level >= MAX_LEVEL) return null;

  const xpNeeded = xpRequiredForNextLevel(profile.level);
  if (profile.currentXp < xpNeeded) return null;

  const newLevel = profile.level + 1;
  const xpAfter = profile.currentXp - xpNeeded;
  const rewards = getRewardsForLevel(newLevel);

  const updatedProfile: UserProfile = Object.freeze({
    ...profile,
    level: newLevel,
    currentXp: xpAfter,
    updatedAt: new Date(),
  });

  const event: LevelUpEvent = Object.freeze({
    fromLevel: profile.level,
    toLevel: newLevel,
    rewards,
  });

  return { updatedProfile, event };
}

// ─── gainXp ───────────────────────────────────────────────────────────────────

/**
 * Adiciona XP ao perfil do usuário.
 *
 * Comportamento:
 *   - Se já está no nível máximo, retorna sem alterar nada (wasAlreadyMaxLevel=true).
 *   - Processa level-ups em cascata: se o XP adicionado cobrir vários níveis,
 *     todos são processados e suas recompensas são coletadas.
 *   - No nível máximo, XP excedente é descartado (não há nível para avançar).
 *
 * @param profile  Perfil atual do usuário.
 * @param xpAmount XP a adicionar (deve ser > 0).
 */
export function gainXp(
  profile: UserProfile,
  xpAmount: number,
): Result<GainXpResult, ProgressionError> {
  // ── Validação ───────────────────────────────────────────────────────────────
  if (!Number.isFinite(xpAmount) || xpAmount <= 0) {
    return Err({ kind: 'InvalidXpAmount', amount: xpAmount } as const);
  }

  // ── Level máximo ────────────────────────────────────────────────────────────
  if (profile.level >= MAX_LEVEL) {
    return Ok(
      Object.freeze({
        profile,
        xpGained: 0,
        levelsGained: 0,
        levelUpEvents: Object.freeze([]),
        rewardsUnlocked: Object.freeze([]),
        wasAlreadyMaxLevel: true,
      }),
    );
  }

  // ── Adicionar XP ────────────────────────────────────────────────────────────
  const xpAdded = Math.floor(xpAmount);
  let current = Object.freeze({
    ...profile,
    currentXp: profile.currentXp + xpAdded,
    totalXpEarned: profile.totalXpEarned + xpAdded,
    updatedAt: new Date(),
  } as UserProfile);

  // ── Processar level-ups em cascata ──────────────────────────────────────────
  const levelUpEvents: LevelUpEvent[] = [];

  let levelResult = levelUp(current);
  while (levelResult !== null) {
    levelUpEvents.push(levelResult.event);
    current = levelResult.updatedProfile;
    levelResult = levelUp(current);
  }

  // ── Coletar todas as recompensas ────────────────────────────────────────────
  const rewardsUnlocked = levelUpEvents.flatMap((ev) => ev.rewards);

  return Ok(
    Object.freeze({
      profile: current,
      xpGained: xpAdded,
      levelsGained: levelUpEvents.length,
      levelUpEvents: Object.freeze(levelUpEvents),
      rewardsUnlocked: Object.freeze(rewardsUnlocked),
      wasAlreadyMaxLevel: false,
    }),
  );
}
