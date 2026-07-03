/**
 * Use-cases do Bench System (T035).
 *
 *   createBench()       Inicializa banco vazio para um squad.
 *   addToBench()        Adiciona reserva (máx 7).
 *   removeFromBench()   Remove reserva por userCardId.
 *   substitute()        Realiza substituição (banco ↔ titular).
 *
 * Regras de substituição:
 *   - Jogador a entrar deve estar no banco.
 *   - Jogador a entrar não pode estar lesionado ou suspenso.
 *   - Limite de MAX_SUBSTITUTIONS_MATCH (3) por partida.
 *   - Uma vez que sai, titular não volta como banco na mesma partida.
 *   - Histórico imutável: cada Substitution é preservada.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import type {
  Bench,
  BenchError,
  BenchPlayer,
  Substitution,
  SubstitutionReason,
} from '../types/types';
import { MAX_BENCH_SIZE, MAX_SUBSTITUTIONS_MATCH } from '../types/types';

// ─── createBench ──────────────────────────────────────────────────────────────

export function createBench(squadId: string): Result<Bench, BenchError> {
  if (!squadId.trim()) {
    return Err(validationError('squadId não pode ser vazio', 'squadId'));
  }
  return Ok(
    Object.freeze({
      squadId,
      players: Object.freeze([]),
      substitutions: Object.freeze([]),
      subsRemaining: MAX_SUBSTITUTIONS_MATCH,
    }),
  );
}

// ─── addToBench ───────────────────────────────────────────────────────────────

export type AddToBenchInput = Readonly<{
  readonly bench: Bench;
  readonly player: BenchPlayer;
}>;

export function addToBench(input: AddToBenchInput): Result<Bench, BenchError> {
  const { bench, player } = input;

  if (bench.players.length >= MAX_BENCH_SIZE) {
    return Err({ kind: 'BenchFull', currentSize: bench.players.length } as const);
  }

  if (bench.players.some((p) => p.userCardId === player.userCardId)) {
    return Err({ kind: 'PlayerAlreadyOnBench', userCardId: player.userCardId } as const);
  }

  return Ok(
    Object.freeze({
      ...bench,
      players: Object.freeze([...bench.players, player]),
    }),
  );
}

// ─── removeFromBench ─────────────────────────────────────────────────────────

export type RemoveFromBenchInput = Readonly<{
  readonly bench: Bench;
  readonly userCardId: string;
}>;

export function removeFromBench(input: RemoveFromBenchInput): Result<Bench, BenchError> {
  const { bench, userCardId } = input;

  const idx = bench.players.findIndex((p) => p.userCardId === userCardId);
  if (idx === -1) {
    return Err({ kind: 'PlayerNotOnBench', userCardId } as const);
  }

  return Ok(
    Object.freeze({
      ...bench,
      players: Object.freeze(bench.players.filter((p) => p.userCardId !== userCardId)),
    }),
  );
}

// ─── substitute ───────────────────────────────────────────────────────────────

export type SubstituteInput = Readonly<{
  readonly bench: Bench;
  /** OVR do titular que sai (para auditoria no histórico). */
  readonly playerOutId: string;
  readonly playerOutOvr: number;
  /** UserCardId do reserva que entra. */
  readonly playerInId: string;
  readonly minute: number;
  readonly reason: SubstitutionReason;
  /** Gerador de ID (injetável para testes determinísticos). */
  readonly generateId?: () => string;
}>;

export function substitute(input: SubstituteInput): Result<Bench, BenchError> {
  const { bench, playerOutId, playerOutOvr, playerInId, minute, reason } = input;

  // Substituições disponíveis?
  if (bench.subsRemaining <= 0) {
    return Err({
      kind: 'NoSubsRemaining',
      used: MAX_SUBSTITUTIONS_MATCH - bench.subsRemaining,
      max: MAX_SUBSTITUTIONS_MATCH,
    } as const);
  }

  // Reserva existe no banco?
  const benchPlayer = bench.players.find((p) => p.userCardId === playerInId);
  if (!benchPlayer) {
    return Err({ kind: 'PlayerNotOnBench', userCardId: playerInId } as const);
  }

  // Reserva disponível?
  if (benchPlayer.isInjured) {
    return Err({ kind: 'PlayerInjured', userCardId: playerInId } as const);
  }
  if (benchPlayer.suspendedMatches > 0) {
    return Err({
      kind: 'PlayerSuspended',
      userCardId: playerInId,
      matches: benchPlayer.suspendedMatches,
    } as const);
  }

  // Jogador já entrou antes nesta partida (via substituições anteriores)?
  const alreadySubbedIn = bench.substitutions.some((s) => s.playerInId === playerInId);
  if (alreadySubbedIn) {
    return Err({ kind: 'PlayerAlreadySubbedIn', userCardId: playerInId } as const);
  }

  // Criar registro de substituição
  const subId = (
    input.generateId ?? (() => `sub-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  )();
  const newSub: Substitution = Object.freeze({
    id: subId,
    minute,
    playerOutId,
    playerInId,
    reason,
    playerOutOvr,
    playerInOvr: benchPlayer.overall,
  });

  // Remover reserva do banco (entrou em campo)
  const updatedPlayers = bench.players.filter((p) => p.userCardId !== playerInId);

  return Ok(
    Object.freeze({
      ...bench,
      players: Object.freeze(updatedPlayers),
      substitutions: Object.freeze([...bench.substitutions, newSub]),
      subsRemaining: bench.subsRemaining - 1,
    }),
  );
}
