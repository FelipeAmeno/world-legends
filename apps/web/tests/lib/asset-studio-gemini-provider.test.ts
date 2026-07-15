import { ProviderError } from '@/lib/asset-studio/image-provider';
import { GeminiImageProvider } from '@/lib/asset-studio/providers/gemini-image-provider';
import { afterEach, describe, expect, it, vi } from 'vitest';

const SECRET_KEY = 'fixture-secret-never-real-0000';

function fixtureRequest() {
  return {
    jobId: 'job-1',
    attemptId: 'attempt-1',
    prompt: 'fixture prompt',
    requestedVariants: 1,
    referenceImages: [],
    artworkSchemaVersion: 2 as const,
    output: { aspectRatio: '2:3' as const, mimeType: 'image/png' as const },
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Sprint 43B — GeminiImageProvider (REST direto via fetch, adapter isolado)', () => {
  it('59. envia a chave só no header x-goog-api-key, nunca no corpo/prompt/URL', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      expect(headers['x-goog-api-key']).toBe(SECRET_KEY);
      expect(JSON.stringify(init?.body)).not.toContain(SECRET_KEY);
      return jsonResponse(200, {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: { mimeType: 'image/png', data: Buffer.from('x').toString('base64') },
                },
              ],
            },
            finishReason: 'STOP',
          },
        ],
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    await provider.generate(fixtureRequest());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('gemini-fixture-model');
    expect(url).not.toContain(SECRET_KEY);
  });

  it('60. resposta 401/403 classifica como provider-authentication, não-retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(401, { error: 'unauthorized' })),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    await expect(provider.generate(fixtureRequest())).rejects.toMatchObject({
      code: 'provider-authentication',
      retryable: false,
    });
  });

  it('61. resposta 429 classifica como provider-rate-limit, retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(429, { error: 'rate limited' })),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    await expect(provider.generate(fixtureRequest())).rejects.toMatchObject({
      code: 'provider-rate-limit',
      retryable: true,
    });
  });

  it('62. resposta 400 (request/prompt inválido) nunca é retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(400, { error: 'bad request' })),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    await expect(provider.generate(fixtureRequest())).rejects.toMatchObject({
      code: 'provider-invalid-response',
      retryable: false,
    });
  });

  it('63. promptFeedback.blockReason gera provider-safety-block, não-retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(200, { promptFeedback: { blockReason: 'SAFETY' } })),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    await expect(provider.generate(fixtureRequest())).rejects.toMatchObject({
      code: 'provider-safety-block',
      retryable: false,
    });
  });

  it('64. candidate individual bloqueado (finishReason SAFETY) é omitido, não derruba os outros', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(200, {
          candidates: [
            { finishReason: 'SAFETY' },
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: Buffer.from('y').toString('base64'),
                    },
                  },
                ],
              },
              finishReason: 'STOP',
            },
          ],
        }),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const results = await provider.generate(fixtureRequest());
    expect(results).toHaveLength(1);
    expect(results[0]?.variantIndex).toBe(1);
  });

  it('65. resposta bem-sucedida nunca inclui a chave de API na metadata do candidate', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: Buffer.from('z').toString('base64'),
                    },
                  },
                ],
              },
              finishReason: 'STOP',
            },
          ],
        }),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const results = await provider.generate(fixtureRequest());
    expect(JSON.stringify(results)).not.toContain(SECRET_KEY);
  });

  it('66. tipos/formatos específicos do Gemini não vazam pro contrato ImageGenerationProvider — resultado é sempre GeneratedArtworkCandidate[]', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(200, {
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: Buffer.from('w').toString('base64'),
                    },
                  },
                ],
              },
              finishReason: 'STOP',
            },
          ],
        }),
      ),
    );
    const provider: import('@/lib/asset-studio/image-provider').ImageGenerationProvider =
      new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const results = await provider.generate(fixtureRequest());
    expect(results[0]).toEqual(
      expect.objectContaining({
        variantIndex: 0,
        bytes: expect.any(Uint8Array),
        mimeType: 'image/png',
      }),
    );
  });

  it('erro de rede (fetch lança) é classificado como provider-invalid-response retryable, nunca escapa cru', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('network down');
      }),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    await expect(provider.generate(fixtureRequest())).rejects.toBeInstanceOf(ProviderError);
  });
});

describe('Sprint 43B.1 — diagnóstico seguro de 429 (regressão pós-smoke-test real, sem diagnóstico nenhum antes)', () => {
  function rateLimitResponse(body: unknown, headers: Record<string, string> = {}): Response {
    return new Response(JSON.stringify(body), { status: 429, headers });
  }

  const QUOTA_FAILURE_DAILY = {
    error: {
      code: 429,
      status: 'RESOURCE_EXHAUSTED',
      details: [
        {
          '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
          violations: [
            {
              quotaMetric: 'generativelanguage.googleapis.com/generate_content_requests',
              quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier',
              quotaValue: '1500',
            },
          ],
        },
      ],
    },
  };

  it('98. 429 com QuotaFailure extrai quotaMetric/quotaId/quotaValue com segurança (nunca o corpo bruto)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => rateLimitResponse(QUOTA_FAILURE_DAILY)),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(result).toBeInstanceOf(ProviderError);
    expect(result.safeDetails).toMatchObject({
      httpStatus: 429,
      googleErrorStatus: 'RESOURCE_EXHAUSTED',
      quotaMetric: 'generativelanguage.googleapis.com/generate_content_requests',
      quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier',
      quotaValue: '1500',
      model: 'gemini-fixture-model',
    });
  });

  it('99. 429 com RetryInfo extrai o retryDelay em segundos com segurança', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        rateLimitResponse({
          error: {
            code: 429,
            status: 'RESOURCE_EXHAUSTED',
            details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '31s' }],
          },
        }),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(result.safeDetails).toMatchObject({ retryDelay: '31s', retryAfterSeconds: 31 });
  });

  it('100. header Retry-After padrão é lido com segurança e tem prioridade sobre RetryInfo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        rateLimitResponse(
          {
            error: {
              code: 429,
              status: 'RESOURCE_EXHAUSTED',
              details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '99s' }],
            },
          },
          { 'retry-after': '15' },
        ),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(result.safeDetails.retryAfterSeconds).toBe(15);
  });

  it('101. quota zerada (quotaValue "0") é classificada como zero-quota/unavailable-tier e NUNCA retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        rateLimitResponse({
          error: {
            code: 429,
            status: 'RESOURCE_EXHAUSTED',
            details: [
              {
                '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
                violations: [
                  {
                    quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier',
                    quotaValue: '0',
                  },
                ],
              },
            ],
          },
        }),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(result.safeDetails.rateLimitCategory).toBe('unavailable-tier');
    expect(result.retryable).toBe(false);
  });

  it('102. rate limit por minuto é classificado temporary-rate-limit e continua retryable (política bounded existente)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        rateLimitResponse({
          error: {
            code: 429,
            status: 'RESOURCE_EXHAUSTED',
            details: [
              {
                '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
                violations: [
                  { quotaId: 'GenerateRequestsPerMinutePerProjectPerModel', quotaValue: '10' },
                ],
              },
            ],
          },
        }),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(result.safeDetails.rateLimitCategory).toBe('temporary-rate-limit');
    expect(result.retryable).toBe(true);
  });

  it('103. quota diária esgotada (não-zero) é classificada daily-quota-exhausted e NÃO é retryable (nunca re-tenta em segundos algo que só reseta em horas)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => rateLimitResponse(QUOTA_FAILURE_DAILY)),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(result.safeDetails.rateLimitCategory).toBe('daily-quota-exhausted');
    expect(result.retryable).toBe(false);
  });

  it('104. JSON de erro malformado nunca lança uma segunda exceção — cai fechado preservando httpStatus e o error_code genérico', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not valid json {{{', { status: 429 })),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(result).toBeInstanceOf(ProviderError);
    expect(result.code).toBe('provider-rate-limit');
    expect(result.safeDetails).toMatchObject({ httpStatus: 429, model: 'gemini-fixture-model' });
    expect(result.safeDetails.rateLimitCategory).toBe('unknown-rate-limit');
  });

  it('105. o corpo bruto da resposta NUNCA aparece em safeDetails, na mensagem de erro, ou em qualquer campo persistível', async () => {
    const rawMarker = 'RAW_BODY_MARKER_SHOULD_NEVER_LEAK_qwerty123';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        rateLimitResponse({ error: { code: 429, status: 'RESOURCE_EXHAUSTED' }, extra: rawMarker }),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(JSON.stringify(result.safeDetails)).not.toContain(rawMarker);
    expect(result.message).not.toContain(rawMarker);
  });

  it('106. headers de resposta (incluindo auth) nunca aparecem em safeDetails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        rateLimitResponse(
          { error: { code: 429, status: 'RESOURCE_EXHAUSTED' } },
          { 'x-fixture-internal-header': 'should-never-leak', 'retry-after': '5' },
        ),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(JSON.stringify(result.safeDetails)).not.toContain('should-never-leak');
    // Só o campo allowlisted (retryAfterSeconds) atravessa — nunca o header/objeto bruto.
    expect(result.safeDetails.retryAfterSeconds).toBe(5);
  });

  it('107. a chave de API nunca aparece em safeDetails mesmo quando a resposta de erro é ecoada de volta por engano', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        rateLimitResponse({
          error: { code: 429, status: 'RESOURCE_EXHAUSTED', message: `key was ${SECRET_KEY}` },
        }),
      ),
    );
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    const result = await provider.generate(fixtureRequest()).catch((e) => e);
    expect(JSON.stringify(result.safeDetails)).not.toContain(SECRET_KEY);
    expect(result.message).not.toContain(SECRET_KEY);
  });
});
