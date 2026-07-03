/**
 * Tipos do bounded context Progression (T031).
 *
 * `UserProfile`     — Aggregate Root: nível, XP e metadados do jogador.
 * `RewardTrackItem` — recompensa concedida ao atingir um nível específico.
 * `LevelUpEvent`    — captura uma subida de nível com as recompensas ganhas.
 * `GainXpResult`    — output completo de gainXp().
 *
 * Doc 18 §3: sem dependência em @world-legends/db, collection ou economy.
 * O chamador aplica créditos/packs via os packages corretos.
 */
import type { ValidationError } from '@world-legends/shared';

// ─── Branded types ────────────────────────────────────────────────────────────

export type UserId = string & { readonly _brand: 'UserId' };

export function userId(v: string): UserId {
  if (!v.trim()) throw new Error('UserId não pode ser vazio');
  return v as UserId;
}

// ─── Recompensa da trilha ─────────────────────────────────────────────────────

export type RewardType = 'credits' | 'pack' | 'cosmetic';

export type RewardTrackItem = Readonly<{
  /** Nível que concede esta recompensa. */
  readonly level: number;
  readonly type: RewardType;
  /** Créditos concedidos (quando type === 'credits'). */
  readonly credits?: number;
  /** PackId do pacote concedido (quando type === 'pack'). */
  readonly packId?: string;
  /** ID do cosmético concedido (quando type === 'cosmetic'). */
  readonly cosmeticId?: string;
  readonly description: string;
}>;

// ─── Evento de level-up ───────────────────────────────────────────────────────

export type LevelUpEvent = Readonly<{
  readonly fromLevel: number;
  readonly toLevel: number;
  /** Recompensas desbloqueadas neste level-up. */
  readonly rewards: readonly RewardTrackItem[];
}>;

// ─── UserProfile — Aggregate Root ────────────────────────────────────────────

export const MAX_LEVEL = 100;

export type UserProfile = Readonly<{
  readonly userId: UserId;
  /** Nível atual (1–MAX_LEVEL). */
  readonly level: number;
  /** XP acumulado DENTRO do nível atual (0 até xpRequiredForNextLevel-1). */
  readonly currentXp: number;
  /** XP total conquistado desde a criação da conta. */
  readonly totalXpEarned: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}>;

// ─── Resultado de gainXp ──────────────────────────────────────────────────────

export type GainXpResult = Readonly<{
  /** Perfil atualizado após o ganho de XP. */
  readonly profile: UserProfile;
  /** XP efetivamente adicionado (pode ser diferente do solicitado em level máximo). */
  readonly xpGained: number;
  /** Quantos níveis foram ganhos nesta operação. */
  readonly levelsGained: number;
  /** Eventos de level-up (um por nível subido). */
  readonly levelUpEvents: readonly LevelUpEvent[];
  /** Todas as recompensas desbloqueadas (união dos levelUpEvents). */
  readonly rewardsUnlocked: readonly RewardTrackItem[];
  /** true se o perfil já estava no nível máximo antes do ganho. */
  readonly wasAlreadyMaxLevel: boolean;
}>;

// ─── Erros ────────────────────────────────────────────────────────────────────

export type ProgressionError =
  | Readonly<{ kind: 'AlreadyMaxLevel'; currentLevel: number; maxLevel: number }>
  | Readonly<{ kind: 'InvalidXpAmount'; amount: number }>
  | ValidationError;
