/**
 * `FriendlyMatch` — amistoso entre dois jogadores (doc 06 §1, §3.1).
 *
 * Invariante central (doc 06 §3.1):
 * "Ligas privadas e amistosos entre amigos NÃO afetam o Elo global —
 * evita combinar resultado entre amigos para inflar rating."
 *
 * O amistoso é o caso mais simples de liga: 2 membros, 1 partida, sem
 * classificação. Implementado como conjunto de funções puras sobre
 * FriendlyMatch imutável.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import type { FriendlyMatch, MatchResult } from '../types/types';

export type CreateFriendlyInput = Readonly<{
  id: string;
  homeProfileId: string;
  awayProfileId: string;
  scheduledAt?: Date;
}>;

export type FriendlyError =
  | Readonly<{ kind: 'SamePlayer' }>
  | Readonly<{ kind: 'AlreadyFinished' }>
  | Readonly<{ kind: 'AlreadyCancelled' }>
  | ReturnType<typeof validationError>;

// ─── createFriendlyMatch ──────────────────────────────────────────────────────

export function createFriendlyMatch(
  input: CreateFriendlyInput,
): Result<FriendlyMatch, FriendlyError> {
  if (!input.id.trim()) {
    return Err(validationError('id não pode ser vazio', 'id'));
  }
  if (input.homeProfileId === input.awayProfileId) {
    return Err(Object.freeze({ kind: 'SamePlayer' as const }));
  }

  return Ok(
    Object.freeze({
      id: input.id,
      homeProfileId: input.homeProfileId,
      awayProfileId: input.awayProfileId,
      status: 'pending' as const,
      result: null,
      scheduledAt: input.scheduledAt ?? new Date(),
      createdAt: new Date(),
    }),
  );
}

// ─── recordFriendlyResult ─────────────────────────────────────────────────────

/**
 * Registra o resultado de um amistoso.
 * Retorna nova FriendlyMatch com status='done' e result preenchido.
 * NÃO atualiza Elo — responsabilidade da camada de aplicação verificar
 * que este resultado NUNCA é passado para o serviço de Elo (doc 06 §3.1).
 */
export function recordFriendlyResult(
  match: FriendlyMatch,
  result: MatchResult,
): Result<FriendlyMatch, FriendlyError> {
  if (match.status === 'done') {
    return Err(Object.freeze({ kind: 'AlreadyFinished' as const }));
  }
  if (match.status === 'cancelled') {
    return Err(Object.freeze({ kind: 'AlreadyCancelled' as const }));
  }

  return Ok(Object.freeze({ ...match, status: 'done' as const, result }));
}

// ─── cancelFriendlyMatch ──────────────────────────────────────────────────────

export function cancelFriendlyMatch(match: FriendlyMatch): Result<FriendlyMatch, FriendlyError> {
  if (match.status === 'done') {
    return Err(Object.freeze({ kind: 'AlreadyFinished' as const }));
  }
  return Ok(Object.freeze({ ...match, status: 'cancelled' as const }));
}

// ─── getFriendlyOutcome ───────────────────────────────────────────────────────

/**
 * Retorna o resultado do ponto de vista de um profileId.
 * Nunca deve ser usado para calcular Elo (doc 06 §3.1).
 */
export function getFriendlyOutcome(
  match: FriendlyMatch,
  profileId: string,
): 'win' | 'draw' | 'loss' | null {
  if (match.result === null || match.status !== 'done') return null;
  const { homeGoals, awayGoals } = match.result;
  const isHome = match.homeProfileId === profileId;

  const myGoals = isHome ? homeGoals : awayGoals;
  const theirGoals = isHome ? awayGoals : homeGoals;

  if (myGoals > theirGoals) return 'win';
  if (myGoals < theirGoals) return 'loss';
  return 'draw';
}
