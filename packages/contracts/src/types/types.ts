/**
 * Tipos do bounded context Contracts (T038).
 *
 * Cada carta possui um número de contratos restantes.
 * Ao ser escalada em uma partida, consome 1 contrato.
 * Com 0 contratos, a carta não pode ser escalada como titular.
 *
 * Ciclo de vida:
 *   createContract()    → contrato ativo com DEFAULT_CONTRACTS usos
 *   useContract()       → −1 contrato por partida disputada
 *   renewContract()     → adiciona contratos (via item do jogo)
 *   isExpired()         → true quando contractsRemaining === 0
 *   canField()          → !isExpired()
 *
 * Analogia com FIFA/FC Ultimate Team:
 *   Cartas precisam de "contratos" para jogar.
 *   Contratos esgotam com o uso e podem ser renovados.
 *
 * Invariantes:
 *   0 ≤ contractsRemaining ≤ maxContracts
 *   Nenhuma operação leva contractsRemaining abaixo de 0
 *   useContract em carta expirada retorna erro (ContractExpired)
 */
import type { ValidationError } from '@world-legends/shared';

// ─── Status qualitativo ───────────────────────────────────────────────────────

export type ContractStatus =
  | 'active' // > LOW_CONTRACT_THRESHOLD contratos — seguro
  | 'low' // 1–LOW_CONTRACT_THRESHOLD contratos — aviso
  | 'expired'; // 0 contratos — não pode escalar

/** Limite abaixo do qual o contrato entra em aviso 'low'. */
export const LOW_CONTRACT_THRESHOLD = 2;

/** Contratos padrão ao criar uma carta nova. */
export const DEFAULT_CONTRACTS = 7;

/** Limite máximo de contratos (evita acumulação infinita). */
export const MAX_CONTRACTS = 99;

// ─── Contract — Aggregate ─────────────────────────────────────────────────────

export type Contract = Readonly<{
  readonly userCardId: string;
  /** Contratos restantes (0–maxContracts). */
  readonly contractsRemaining: number;
  /** Máximo de contratos que esta carta pode ter. */
  readonly maxContracts: number;
  /** Status qualitativo derivado de contractsRemaining. */
  readonly status: ContractStatus;
}>;

// ─── ContractReport — visão do elenco ────────────────────────────────────────

export type ContractReport = Readonly<{
  /** Total de cartas avaliadas. */
  readonly totalCards: number;
  /** Cartas com status 'active'. */
  readonly activeCount: number;
  /** Cartas com status 'low' (aviso). */
  readonly lowCount: number;
  /** Cartas com status 'expired' (bloqueadas). */
  readonly expiredCount: number;
  /** UserCardIds das cartas expiradas. */
  readonly expiredCardIds: readonly string[];
  /** UserCardIds com aviso 'low'. */
  readonly lowCardIds: readonly string[];
}>;

// ─── Erros ────────────────────────────────────────────────────────────────────

export type ContractError =
  | Readonly<{ kind: 'ContractExpired'; userCardId: string }>
  | Readonly<{ kind: 'InvalidAmount'; amount: number; reason: string }>
  | Readonly<{ kind: 'ExceedsMax'; current: number; adding: number; max: number }>
  | ValidationError;
