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
            content: { parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('x').toString('base64') } }] },
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
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { error: 'unauthorized' })));
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    await expect(provider.generate(fixtureRequest())).rejects.toMatchObject({
      code: 'provider-authentication',
      retryable: false,
    });
  });

  it('61. resposta 429 classifica como provider-rate-limit, retryable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(429, { error: 'rate limited' })));
    const provider = new GeminiImageProvider(SECRET_KEY, 'gemini-fixture-model');
    await expect(provider.generate(fixtureRequest())).rejects.toMatchObject({
      code: 'provider-rate-limit',
      retryable: true,
    });
  });

  it('62. resposta 400 (request/prompt inválido) nunca é retryable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(400, { error: 'bad request' })));
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
                parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('y').toString('base64') } }],
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
                parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('z').toString('base64') } }],
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
                parts: [{ inlineData: { mimeType: 'image/png', data: Buffer.from('w').toString('base64') } }],
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
      expect.objectContaining({ variantIndex: 0, bytes: expect.any(Uint8Array), mimeType: 'image/png' }),
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
