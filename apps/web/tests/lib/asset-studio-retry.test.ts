import { ProviderError } from '@/lib/asset-studio/image-provider';
import {
  DEFAULT_MAX_DELAY_MS,
  computeBackoffDelay,
  withTimeoutAndRetry,
} from '@/lib/asset-studio/retry';
import { describe, expect, it, vi } from 'vitest';

function fakeSleep() {
  const calls: number[] = [];
  const sleep = vi.fn(async (ms: number) => {
    calls.push(ms);
  });
  return { sleep, calls };
}

describe('Sprint 43B — retry (timeout + backoff, só retenta erro marcado retryable)', () => {
  it('32. sucesso na primeira tentativa nunca chama sleep/retry', async () => {
    const { sleep, calls } = fakeSleep();
    const fn = vi.fn(async () => 'ok');
    const result = await withTimeoutAndRetry(fn, { timeoutMs: 1000, sleep });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(calls.length).toBe(0);
  });

  it('33. erro retryable (rate-limit) é re-tentado até o limite, depois lança', async () => {
    const { sleep } = fakeSleep();
    const fn = vi.fn(async () => {
      throw new ProviderError('provider-rate-limit', 'limite atingido', true);
    });
    await expect(
      withTimeoutAndRetry(fn, { timeoutMs: 1000, maxRetries: 2, sleep }),
    ).rejects.toMatchObject({ code: 'provider-rate-limit' });
    // 1 tentativa inicial + 2 retries = 3 chamadas.
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('34. erro não-retryable (autenticação) nunca é re-tentado', async () => {
    const { sleep } = fakeSleep();
    const fn = vi.fn(async () => {
      throw new ProviderError('provider-authentication', 'chave inválida', false);
    });
    await expect(withTimeoutAndRetry(fn, { timeoutMs: 1000, sleep })).rejects.toMatchObject({
      code: 'provider-authentication',
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('35. bloqueio de segurança (safety block) nunca é re-tentado automaticamente', async () => {
    const { sleep } = fakeSleep();
    const fn = vi.fn(async () => {
      throw new ProviderError('provider-safety-block', 'prompt bloqueado', false);
    });
    await expect(withTimeoutAndRetry(fn, { timeoutMs: 1000, sleep })).rejects.toMatchObject({
      code: 'provider-safety-block',
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('36. timeout aborta via AbortSignal e classifica como provider-timeout (retryable)', async () => {
    const { sleep } = fakeSleep();
    const fn = vi.fn(async (signal: AbortSignal) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (signal.aborted) throw new Error('aborted');
      return 'unreachable';
    });
    await expect(
      withTimeoutAndRetry(fn, { timeoutMs: 5, maxRetries: 0, sleep }),
    ).rejects.toMatchObject({ code: 'provider-timeout', retryable: true });
  });

  it('37. erro desconhecido (não ProviderError) é tratado como internal-error não-retryable, nunca re-tentado indefinidamente', async () => {
    const { sleep } = fakeSleep();
    const fn = vi.fn(async () => {
      throw new Error('algo inesperado');
    });
    await expect(withTimeoutAndRetry(fn, { timeoutMs: 1000, sleep })).rejects.toMatchObject({
      code: 'internal-error',
    });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('backoff exponencial nunca excede o delay máximo configurado, mesmo em tentativas altas', () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const delay = computeBackoffDelay(attempt, 500, DEFAULT_MAX_DELAY_MS);
      expect(delay).toBeLessThanOrEqual(DEFAULT_MAX_DELAY_MS);
      expect(delay).toBeGreaterThanOrEqual(0);
    }
  });
});
