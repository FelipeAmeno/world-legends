/**
 * ContractManager — T038 Contracts.
 *
 * Funções puras para gerenciar contratos de cartas:
 *
 *   createContract()        Cria contrato com DEFAULT_CONTRACTS usos.
 *   useContract()           Consome 1 contrato (partida disputada).
 *   useContractN()          Consome N contratos de uma vez.
 *   renewContract()         Adiciona contratos (renovação).
 *   isExpired()             true quando contractsRemaining === 0.
 *   canField()              true quando contractsRemaining > 0.
 *   applyMatchContracts()   Aplica −1 a cada carta que jogou.
 *   renewBatch()            Renova múltiplas cartas de uma vez.
 *
 * Nenhuma função muta — todas retornam novos objetos.
 */
import { Err, Ok, type Result, validationError } from '@world-legends/shared';
import type { Contract, ContractError, ContractReport, ContractStatus } from '../types/types';
import { DEFAULT_CONTRACTS, LOW_CONTRACT_THRESHOLD, MAX_CONTRACTS } from '../types/types';

// ─── contractStatus ───────────────────────────────────────────────────────────

export function contractStatus(remaining: number): ContractStatus {
  if (remaining <= 0) return 'expired';
  if (remaining <= LOW_CONTRACT_THRESHOLD) return 'low';
  return 'active';
}

// ─── createContract ───────────────────────────────────────────────────────────

/**
 * Cria um contrato para uma carta.
 *
 * @param userCardId   ID da UserCard.
 * @param contracts    Contratos iniciais (padrão: DEFAULT_CONTRACTS = 7).
 * @param maxContracts Máximo permitido (padrão: MAX_CONTRACTS = 99).
 */
export function createContract(
  userCardId: string,
  contracts: number = DEFAULT_CONTRACTS,
  maxContracts: number = MAX_CONTRACTS,
): Result<Contract, ContractError> {
  if (!userCardId.trim()) {
    return Err(validationError('userCardId não pode ser vazio', 'userCardId'));
  }
  if (!Number.isFinite(contracts) || contracts < 0) {
    return Err({
      kind: 'InvalidAmount',
      amount: contracts,
      reason: 'contratos devem ser ≥ 0',
    } as const);
  }
  if (contracts > maxContracts) {
    return Err({ kind: 'ExceedsMax', current: 0, adding: contracts, max: maxContracts } as const);
  }

  const remaining = Math.floor(contracts);
  return Ok(
    Object.freeze({
      userCardId,
      contractsRemaining: remaining,
      maxContracts,
      status: contractStatus(remaining),
    }),
  );
}

// ─── isExpired / canField ─────────────────────────────────────────────────────

export function isExpired(contract: Contract): boolean {
  return contract.contractsRemaining <= 0;
}

export function canField(contract: Contract): boolean {
  return !isExpired(contract);
}

// ─── useContract ─────────────────────────────────────────────────────────────

/**
 * Consome 1 contrato (o jogador disputou uma partida).
 * Retorna erro se o contrato já estiver expirado.
 */
export function useContract(contract: Contract): Result<Contract, ContractError> {
  if (isExpired(contract)) {
    return Err({ kind: 'ContractExpired', userCardId: contract.userCardId } as const);
  }

  const remaining = contract.contractsRemaining - 1;
  return Ok(
    Object.freeze({
      ...contract,
      contractsRemaining: remaining,
      status: contractStatus(remaining),
    }),
  );
}

/**
 * Consome N contratos de uma vez (múltiplas partidas em lote).
 * `floor(n, 0)` — nunca vai abaixo de 0.
 */
export function useContractN(contract: Contract, n: number): Result<Contract, ContractError> {
  if (!Number.isFinite(n) || n < 1) {
    return Err({ kind: 'InvalidAmount', amount: n, reason: 'n deve ser ≥ 1' } as const);
  }
  if (isExpired(contract)) {
    return Err({ kind: 'ContractExpired', userCardId: contract.userCardId } as const);
  }

  const remaining = Math.max(0, contract.contractsRemaining - Math.floor(n));
  return Ok(
    Object.freeze({
      ...contract,
      contractsRemaining: remaining,
      status: contractStatus(remaining),
    }),
  );
}

// ─── renewContract ───────────────────────────────────────────────────────────

/**
 * Adiciona contratos à carta (renovação).
 *
 * @param amount  Contratos a adicionar (1–MAX_CONTRACTS).
 *                Não pode exceder maxContracts − contractsRemaining.
 */
export function renewContract(contract: Contract, amount: number): Result<Contract, ContractError> {
  if (!Number.isFinite(amount) || amount < 1) {
    return Err({ kind: 'InvalidAmount', amount, reason: 'amount deve ser ≥ 1' } as const);
  }

  const newTotal = contract.contractsRemaining + Math.floor(amount);
  if (newTotal > contract.maxContracts) {
    return Err({
      kind: 'ExceedsMax',
      current: contract.contractsRemaining,
      adding: Math.floor(amount),
      max: contract.maxContracts,
    } as const);
  }

  return Ok(
    Object.freeze({
      ...contract,
      contractsRemaining: newTotal,
      status: contractStatus(newTotal),
    }),
  );
}

// ─── applyMatchContracts ─────────────────────────────────────────────────────

export type MatchContractResult = Readonly<{
  readonly userCardId: string;
  readonly contract: Contract;
  /** true se o contrato expirou nesta partida. */
  readonly justExpired: boolean;
}>;

/**
 * Aplica −1 contrato a todas as cartas que jogaram.
 * Cartas não na lista `playedCardIds` permanecem intactas.
 * Cartas já expiradas na lista são ignoradas (sem erro — log apenas).
 *
 * @param contracts     Mapa de userCardId → Contract.
 * @param playedCardIds IDs dos jogadores que participaram da partida.
 */
export function applyMatchContracts(
  contracts: readonly Contract[],
  playedCardIds: readonly string[],
): readonly MatchContractResult[] {
  const playedSet = new Set(playedCardIds);

  return Object.freeze(
    contracts.map((contract) => {
      if (!playedSet.has(contract.userCardId)) {
        return Object.freeze({ userCardId: contract.userCardId, contract, justExpired: false });
      }
      if (isExpired(contract)) {
        return Object.freeze({ userCardId: contract.userCardId, contract, justExpired: false });
      }

      const remaining = contract.contractsRemaining - 1;
      const updated: Contract = Object.freeze({
        ...contract,
        contractsRemaining: remaining,
        status: contractStatus(remaining),
      });
      return Object.freeze({
        userCardId: contract.userCardId,
        contract: updated,
        justExpired: remaining === 0,
      });
    }),
  );
}

// ─── renewBatch ──────────────────────────────────────────────────────────────

/**
 * Renova N contratos para um conjunto de cartas.
 * Retorna array paralelo com resultado (ok | error) por carta.
 */
export function renewBatch(
  contracts: readonly Contract[],
  amount: number,
): readonly Result<Contract, ContractError>[] {
  return Object.freeze(contracts.map((c) => renewContract(c, amount)));
}

// ─── generateContractReport ──────────────────────────────────────────────────

/**
 * Gera um relatório de contratos de um elenco de cartas.
 */
export function generateContractReport(contracts: readonly Contract[]): ContractReport {
  const expired = contracts.filter((c) => c.status === 'expired');
  const low = contracts.filter((c) => c.status === 'low');
  const active = contracts.filter((c) => c.status === 'active');

  return Object.freeze({
    totalCards: contracts.length,
    activeCount: active.length,
    lowCount: low.length,
    expiredCount: expired.length,
    expiredCardIds: Object.freeze(expired.map((c) => c.userCardId)),
    lowCardIds: Object.freeze(low.map((c) => c.userCardId)),
  });
}

// ─── validateSquadContracts ──────────────────────────────────────────────────

export type SquadValidationResult = Readonly<{
  readonly valid: boolean;
  readonly blockedCardIds: readonly string[];
  readonly message: string;
}>;

/**
 * Verifica se todas as cartas de um squad têm contratos válidos.
 * Retorna lista de cartas bloqueadas (expiradas).
 */
export function validateSquadContracts(contracts: readonly Contract[]): SquadValidationResult {
  const blocked = contracts.filter(isExpired).map((c) => c.userCardId);

  return Object.freeze({
    valid: blocked.length === 0,
    blockedCardIds: Object.freeze(blocked),
    message:
      blocked.length === 0
        ? 'Todos os contratos válidos.'
        : `${blocked.length} carta(s) sem contrato: ${blocked.join(', ')}`,
  });
}
