/**
 * @world-legends/bench — T035 Bench System.
 *
 * API pública:
 *   createBench()         Cria banco vazio para um squad.
 *   addToBench()          Adiciona reserva (máx 7).
 *   removeFromBench()     Remove reserva por ID.
 *   substitute()          Realiza substituição (banco ↔ titular).
 *   calculateBenchMoral() Calcula moral 0–100 baseada no banco.
 *   moralLevel()          Converte score em 'poor'|'fair'|'good'|'excellent'.
 */

export { createBench, addToBench, removeFromBench, substitute } from './use-cases/bench-operations';
export type {
  AddToBenchInput,
  RemoveFromBenchInput,
  SubstituteInput,
} from './use-cases/bench-operations';

export { calculateBenchMoral, moralLevel } from './moral/moral';

export type {
  Bench,
  BenchPlayer,
  Substitution,
  SubstitutionReason,
  BenchMoral,
  MoralLevel,
  BenchError,
  MAX_BENCH_SIZE as BenchMaxSize,
} from './types/types';
export { MAX_BENCH_SIZE, MAX_SUBSTITUTIONS_MATCH } from './types/types';
