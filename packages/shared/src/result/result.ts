/**
 * Result<T, E> — sucesso ou falha expressos como valor, nunca como
 * exceção lançada. Primeiro Value Object do package `shared`
 * (docs/19-implementation-strategy-master.md, §9) porque tudo o que vem
 * depois — neste package e em todos os outros do monorepo — precisa de
 * um jeito de expressar falha antes de poder expressar qualquer outra
 * coisa.
 *
 * Value Object: imutável (`Object.freeze`), sem identidade própria — duas
 * instâncias com o mesmo conteúdo são equivalentes.
 *
 * Nota de nomenclatura: as funções `mapResult`/`andThenResult`/
 * `unwrapResult`/`unwrapResultOr`/`matchResult` levam o sufixo "Result"
 * porque o módulo `option` define operações homônimas para `Option<T>`
 * (`mapOption`, `andThenOption`...) — ambos os módulos são reexportados
 * juntos pelo barril público do package (`src/index.ts`), e um nome
 * ambíguo ali seria um erro de compilação, não apenas um estilo
 * discutível.
 */
export type Result<T, E> =
  | Readonly<{ readonly ok: true; readonly value: T }>
  | Readonly<{ readonly ok: false; readonly error: E }>;

/** Constrói um Result de sucesso. O tipo de erro `E` pode ser explicitado quando necessário. */
export function Ok<T, E = never>(value: T): Result<T, E> {
  return Object.freeze({ ok: true, value });
}

/** Constrói um Result de falha. O tipo de sucesso `T` pode ser explicitado quando necessário. */
export function Err<T = never, E = unknown>(error: E): Result<T, E> {
  return Object.freeze({ ok: false, error });
}

/** Type guard — confirma e estreita o tipo para o ramo de sucesso. */
export function isOk<T, E>(result: Result<T, E>): result is Readonly<{ ok: true; value: T }> {
  return result.ok;
}

/** Type guard — confirma e estreita o tipo para o ramo de falha. */
export function isErr<T, E>(result: Result<T, E>): result is Readonly<{ ok: false; error: E }> {
  return !result.ok;
}

/** Transforma o valor de sucesso; passa a falha adiante sem alteração. */
export function mapResult<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return result.ok ? Ok(fn(result.value)) : result;
}

/** Transforma o erro de falha; passa o sucesso adiante sem alteração. */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return result.ok ? result : Err(fn(result.error));
}

/** Encadeia uma próxima operação que também pode falhar (flatMap). */
export function andThenResult<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> {
  return result.ok ? fn(result.value) : result;
}

/**
 * Extrai o valor de sucesso. Lança uma exceção real se o Result for uma
 * falha — uso reservado a contextos onde a falha já é considerada um bug
 * (ex: testes), nunca dentro de um package de domínio em código de
 * produção (docs/19-implementation-strategy-master.md, §17).
 */
export function unwrapResult<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Tentativa de unwrap em um Result de erro: ${String(result.error)}`);
}

/** Extrai o valor de sucesso, ou um valor de reserva em caso de falha. */
export function unwrapResultOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

/** Pattern-match explícito sobre os dois ramos possíveis. */
export function matchResult<T, E, U>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => U; err: (error: E) => U },
): U {
  return result.ok ? handlers.ok(result.value) : handlers.err(result.error);
}
