import { type ValidationError, validationError } from '../errors/validation-error';
/**
 * `Money` — quantia + tipo de moeda (doc 18 §15).
 *
 * Usado por `economy`, `packs`, `craft`, `market`. Definido em `shared`
 * para que todos esses packages compartilhem o mesmo tipo sem criar
 * dependência circular entre eles.
 *
 * Invariante: `amount` é inteiro não-negativo. O domínio opera em
 * unidades inteiras (doc 10 §18: "créditos", "fragmentos" — sem
 * frações ou centavos em nenhum documento).
 */
import { Err, Ok, type Result } from '../result/result';

export type CurrencyCode = 'credits' | 'fragments' | 'premium';

export const ALL_CURRENCY_CODES: readonly CurrencyCode[] = ['credits', 'fragments', 'premium'];

export type Money = Readonly<{
  readonly amount: number;
  readonly currency: CurrencyCode;
}>;

export function createMoney(
  amount: number,
  currency: CurrencyCode,
): Result<Money, ValidationError> {
  if (!Number.isInteger(amount)) {
    return Err(validationError(`Money.amount deve ser um inteiro, recebido: ${amount}`, 'amount'));
  }
  if (amount < 0) {
    return Err(
      validationError(`Money.amount não pode ser negativo, recebido: ${amount}`, 'amount'),
    );
  }
  return Ok(Object.freeze({ amount, currency }));
}

/** Soma dois Money da mesma moeda. */
export function addMoney(a: Money, b: Money): Result<Money, ValidationError> {
  if (a.currency !== b.currency) {
    return Err(
      validationError(
        `Não é possível somar moedas diferentes: ${a.currency} + ${b.currency}`,
        'currency',
      ),
    );
  }
  return createMoney(a.amount + b.amount, a.currency);
}

/**
 * Subtrai b de a. Retorna Err se o resultado seria negativo.
 * Garante a invariante de saldo não-negativo em qualquer contexto.
 */
export function subtractMoney(a: Money, b: Money): Result<Money, ValidationError> {
  if (a.currency !== b.currency) {
    return Err(
      validationError(
        `Não é possível subtrair moedas diferentes: ${a.currency} - ${b.currency}`,
        'currency',
      ),
    );
  }
  if (a.amount < b.amount) {
    return Err(
      validationError(
        `Saldo insuficiente: tem ${a.amount} ${a.currency}, precisa ${b.amount}`,
        'amount',
      ),
    );
  }
  return createMoney(a.amount - b.amount, a.currency);
}

export const ZERO_CREDITS: Money = Object.freeze({ amount: 0, currency: 'credits' as const });
export const ZERO_FRAGMENTS: Money = Object.freeze({ amount: 0, currency: 'fragments' as const });
export const ZERO_PREMIUM: Money = Object.freeze({ amount: 0, currency: 'premium' as const });
