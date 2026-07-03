/**
 * Option<T> — presença ou ausência de valor, sem usar `null`/`undefined`
 * diretamente no resto do código. Par natural de `Result`
 * (docs/19-implementation-strategy-master.md, §9).
 *
 * Value Object: imutável, sem identidade.
 *
 * Nota de nomenclatura: ver o comentário equivalente em `result.ts` —
 * `mapOption`/`andThenOption`/`unwrapOption`/`unwrapOptionOr`/
 * `matchOption` levam o sufixo "Option" para não colidir com as
 * operações homônimas de `Result` no barril público do package.
 */
import { Err, Ok, type Result } from '../result/result';

export type Option<T> =
  | Readonly<{ readonly some: true; readonly value: T }>
  | Readonly<{ readonly some: false }>;

/** Constrói uma Option presente. */
export function Some<T>(value: T): Option<T> {
  return Object.freeze({ some: true, value });
}

// Instância única e congelada para o caso ausente — o conteúdo de uma
// Option ausente nunca varia, então não há motivo para alocar um objeto
// novo a cada chamada de None().
const NONE_INSTANCE: Option<never> = Object.freeze({ some: false });

/** Constrói uma Option ausente. */
export function None<T = never>(): Option<T> {
  return NONE_INSTANCE as Option<T>;
}

/** Type guard — confirma e estreita o tipo para o ramo presente. */
export function isSome<T>(option: Option<T>): option is Readonly<{ some: true; value: T }> {
  return option.some;
}

/** Type guard — confirma e estreita o tipo para o ramo ausente. */
export function isNone<T>(option: Option<T>): option is Readonly<{ some: false }> {
  return !option.some;
}

/** Transforma o valor presente; passa a ausência adiante sem alteração. */
export function mapOption<T, U>(option: Option<T>, fn: (value: T) => U): Option<U> {
  return option.some ? Some(fn(option.value)) : option;
}

/** Encadeia uma próxima operação que também pode resultar em ausência. */
export function andThenOption<T, U>(option: Option<T>, fn: (value: T) => Option<U>): Option<U> {
  return option.some ? fn(option.value) : option;
}

/**
 * Extrai o valor presente. Lança uma exceção real se a Option for
 * ausente — mesma ressalva de uso de `unwrapResult` em `Result`.
 */
export function unwrapOption<T>(option: Option<T>): T {
  if (option.some) {
    return option.value;
  }
  throw new Error('Tentativa de unwrap em uma Option ausente (None).');
}

/** Extrai o valor presente, ou um valor de reserva em caso de ausência. */
export function unwrapOptionOr<T>(option: Option<T>, fallback: T): T {
  return option.some ? option.value : fallback;
}

/** Pattern-match explícito sobre os dois ramos possíveis. */
export function matchOption<T, U>(
  option: Option<T>,
  handlers: { some: (value: T) => U; none: () => U },
): U {
  return option.some ? handlers.some(option.value) : handlers.none();
}

/** Converte `null`/`undefined` em Option — única ponte aceita com o mundo "nullable". */
export function fromNullable<T>(value: T | null | undefined): Option<T> {
  return value === null || value === undefined ? None<T>() : Some(value);
}

/** Converte uma Option em Result, fornecendo o erro a usar caso seja None. */
export function toResult<T, E>(option: Option<T>, errorIfNone: E): Result<T, E> {
  return option.some ? Ok(option.value) : Err(errorIfNone);
}
