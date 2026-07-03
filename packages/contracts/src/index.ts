/**
 * @world-legends/contracts — T038 Contracts.
 *
 * API pública:
 *   createContract(id, contracts?, max?)    Cria contrato (default: 7 usos).
 *   useContract(contract)                   −1 contrato (1 partida).
 *   useContractN(contract, n)               −N contratos de uma vez.
 *   renewContract(contract, amount)         Adiciona contratos.
 *   renewBatch(contracts, amount)           Renova vários de uma vez.
 *   isExpired(contract)                     true quando 0 contratos.
 *   canField(contract)                      !isExpired.
 *   contractStatus(remaining)              'active'|'low'|'expired'.
 *   applyMatchContracts(contracts, played)  Aplica partida ao elenco.
 *   generateContractReport(contracts)       Relatório do elenco.
 *   validateSquadContracts(contracts)       Valida squad (todos com contrato).
 */

export {
  createContract,
  useContract,
  useContractN,
  renewContract,
  renewBatch,
  isExpired,
  canField,
  contractStatus,
  applyMatchContracts,
  generateContractReport,
  validateSquadContracts,
} from './manager/contract-manager';

export type {
  MatchContractResult,
  SquadValidationResult,
} from './manager/contract-manager';

export type {
  Contract,
  ContractStatus,
  ContractReport,
  ContractError,
} from './types/types';

export {
  DEFAULT_CONTRACTS,
  MAX_CONTRACTS,
  LOW_CONTRACT_THRESHOLD,
} from './types/types';
