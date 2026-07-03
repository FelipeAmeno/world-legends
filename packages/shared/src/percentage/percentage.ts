import { type ValidationError, validationError } from '../errors/validation-error';
/**
 * Percentage — valor entre 0 e 100, usado intensamente por química,
 * normalização competitiva e taxas (doc 09 §4, doc 11 §2).
 *
 * Princípio de "estado inválido impossível de representar"
 * (docs/19-implementation-strategy-master.md, §11): o único construtor
 * que pode falhar (`createPercentage`) devolve um `Result`, nunca lança
 * exceção e nunca devolve um valor fora da faixa. `clampPercentage` é o
 * construtor irmão que nunca falha — força qualquer número para dentro
 * da faixa válida, útil quando o chamador já sabe que um corte é a
 * resposta correta (ex: acumuladores de bônus que podem ultrapassar 100).
 *
 * Value Object: imutável, sem identidade.
 */
import { Err, Ok, type Result } from '../result/result';

export type Percentage = Readonly<{ readonly value: number }>;

/** Cria uma Percentage validada — falha se o valor estiver fora de [0, 100] ou for NaN. */
export function createPercentage(value: number): Result<Percentage, ValidationError> {
  if (Number.isNaN(value)) {
    return Err(validationError('Percentage não pode ser NaN.', 'value'));
  }
  if (value < 0 || value > 100) {
    return Err(validationError(`Percentage deve estar entre 0 e 100; recebido ${value}.`, 'value'));
  }
  return Ok(Object.freeze({ value }));
}

/** Cria uma Percentage sempre válida, cortando o valor para dentro de [0, 100]. NaN se torna 0. */
export function clampPercentage(value: number): Percentage {
  if (Number.isNaN(value)) {
    return Object.freeze({ value: 0 });
  }
  const clamped = Math.min(100, Math.max(0, value));
  return Object.freeze({ value: clamped });
}

/** Converte para uma razão decimal (0–1) — ex: 25 → 0.25. */
export function toRatio(percentage: Percentage): number {
  return percentage.value / 100;
}

/** Igualdade por valor — duas Percentages com o mesmo número são equivalentes. */
export function equalsPercentage(a: Percentage, b: Percentage): boolean {
  return a.value === b.value;
}
