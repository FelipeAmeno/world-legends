/**
 * lib/asset-studio/retry.ts — Sprint 43B (Gemini Nano Banana Image Provider)
 *
 * Utilitário genérico de timeout + retry com backoff exponencial e
 * jitter — usado pelo adapter Gemini (nenhum outro lugar do projeto
 * tinha essa necessidade antes, confirmado na auditoria desta sprint).
 * Só tenta de novo erros marcados `retryable` (`ProviderError.retryable`)
 * — autenticação, prompt inválido e bloqueio de segurança NUNCA são
 * re-tentados automaticamente.
 */

import { ProviderError } from './image-provider';

export const DEFAULT_MAX_RETRIES = 2;
export const DEFAULT_BASE_DELAY_MS = 500;
export const DEFAULT_MAX_DELAY_MS = 4000;

export type RetryOptions = {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs: number;
  /** Injetável nos testes pra não depender de `setTimeout` real. */
  sleep?: (ms: number) => Promise<void>;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Backoff exponencial com jitter — nunca o mesmo delay duas vezes seguidas, evita thundering herd. */
export function computeBackoffDelay(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
): number {
  const exponential = baseDelayMs * 2 ** attempt;
  const capped = Math.min(exponential, maxDelayMs);
  const jitter = capped * (0.5 + Math.random() * 0.5);
  return Math.round(jitter);
}

/** Classifica um erro capturado — sempre um `ProviderError`, nunca deixa um erro cru escapar sem categoria. */
function classifyCaughtError(err: unknown, timedOut: boolean): ProviderError {
  if (err instanceof ProviderError) return err;
  return timedOut
    ? new ProviderError('provider-timeout', 'requisição excedeu o tempo limite', true)
    : new ProviderError('internal-error', String(err), false);
}

async function attemptOnce<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<{ ok: true; value: T } | { ok: false; error: ProviderError }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return { ok: true, value: await fn(controller.signal) };
  } catch (err) {
    return { ok: false, error: classifyCaughtError(err, controller.signal.aborted) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Roda `fn(signal)` com timeout (`AbortController`) e retry limitado.
 * `fn` deve lançar `ProviderError` pra que a classificação de
 * retryable/não-retryable funcione — qualquer outro erro é tratado como
 * não-retryable (`internal-error`) por segurança (nunca re-tenta um erro
 * desconhecido indefinidamente).
 */
export async function withTimeoutAndRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
  const sleep = options.sleep ?? defaultSleep;

  let lastError = new ProviderError('internal-error', 'nenhuma tentativa executada', false);

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await attemptOnce(fn, options.timeoutMs);
    if (result.ok) return result.value;

    lastError = result.error;
    const isLastAttempt = attempt === maxRetries;
    if (!lastError.retryable || isLastAttempt) throw lastError;
    await sleep(computeBackoffDelay(attempt, baseDelayMs, maxDelayMs));
  }

  // Inalcançável (o loop sempre retorna ou lança), mas satisfaz o checker de tipos.
  throw lastError;
}
