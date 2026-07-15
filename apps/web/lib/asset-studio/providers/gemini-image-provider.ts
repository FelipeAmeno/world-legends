/**
 * lib/asset-studio/providers/gemini-image-provider.ts — Sprint 43B
 * (Gemini Nano Banana Image Provider)
 *
 * Adapter server-only sobre a Gemini API (REST direto via `fetch` — sem
 * SDK novo, "menor superfície de dependência estável" per o brief desta
 * sprint; nenhum SDK do Google já existia no projeto). Nenhum tipo
 * deste arquivo é importado fora de `provider-config.ts`
 * (`createImageProvider`) — o resto do Asset Studio só conhece
 * `ImageGenerationProvider`.
 *
 * IMPORTANTE — limitação honesta: este adapter não foi exercitado
 * contra a API real nesta sprint (nenhuma credencial existe neste
 * ambiente, `ASSET_STUDIO_GEMINI_ENABLED=false` por padrão). O formato
 * de request/response segue o padrão documentado e estável da Gemini
 * API multimodal (`generateContent` com `inlineData` pra imagens de
 * entrada/saída) — mesmo espírito da Sprint 43A não testar
 * `SupabaseAssetStudioRepository` diretamente (convenção "Fase 6"). Ver
 * docs/design/07-gemini-image-provider.md.
 */

import {
  type GenerateArtworkRequest,
  type GeneratedArtworkCandidate,
  type ImageGenerationProvider,
  ProviderError,
} from '../image-provider';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

type GeminiInlineDataPart = { inlineData: { mimeType: string; data: string } };
type GeminiTextPart = { text: string };
type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
};

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function classifyHttpError(status: number, bodyText: string): ProviderError {
  if (status === 401 || status === 403) {
    return new ProviderError(
      'provider-authentication',
      'autenticação recusada pelo provedor',
      false,
    );
  }
  if (status === 429) {
    return new ProviderError('provider-rate-limit', 'limite de taxa do provedor atingido', true);
  }
  if (status >= 500) {
    return new ProviderError(
      'provider-invalid-response',
      `erro interno do provedor (status ${status})`,
      true,
    );
  }
  // 400 etc — prompt/request inválido, nunca re-tentar sem mudar o request.
  return new ProviderError(
    'provider-invalid-response',
    `provedor recusou a requisição (status ${status}): ${bodyText.slice(0, 200)}`,
    false,
  );
}

export class GeminiImageProvider implements ImageGenerationProvider {
  readonly name = 'gemini';

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generate(
    request: GenerateArtworkRequest,
    signal?: AbortSignal,
  ): Promise<GeneratedArtworkCandidate[]> {
    const parts: GeminiPart[] = [{ text: request.prompt }];
    for (const ref of request.referenceImages) {
      parts.push({ inlineData: { mimeType: ref.mimeType, data: bytesToBase64(ref.bytes) } });
    }

    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ['IMAGE'],
        // "one or more output variants where provider behavior permits" —
        // pede N, mas trata a resposta com qualquer quantidade <= N como válida.
        candidateCount: Math.max(1, request.requestedVariants),
      },
    };

    let response: Response;
    try {
      response = await fetch(`${GEMINI_API_BASE}/models/${this.model}:generateContent`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          // Header de auth — NUNCA logado, nunca incluído em request_snapshot.
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
        signal: signal ?? null,
      });
    } catch (err) {
      if (signal?.aborted) {
        throw new ProviderError(
          'provider-timeout',
          'requisição ao provedor excedeu o tempo limite',
          true,
        );
      }
      throw new ProviderError(
        'provider-invalid-response',
        `falha de rede: ${(err as Error).message}`,
        true,
      );
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw classifyHttpError(response.status, bodyText);
    }

    const json = (await response.json()) as GeminiGenerateContentResponse;

    if (json.promptFeedback?.blockReason) {
      throw new ProviderError(
        'provider-safety-block',
        `prompt bloqueado pelo filtro de segurança do provedor: ${json.promptFeedback.blockReason}`,
        false,
      );
    }

    const candidates = json.candidates ?? [];
    if (candidates.length === 0) {
      throw new ProviderError(
        'provider-invalid-response',
        'provedor não retornou nenhum candidate',
        false,
      );
    }

    const results: GeneratedArtworkCandidate[] = [];
    candidates.forEach((candidate, index) => {
      if (candidate.finishReason === 'SAFETY') {
        // Um candidate individual bloqueado não derruba os outros — só é omitido.
        return;
      }
      const imagePart = candidate.content?.parts?.find(
        (p): p is GeminiInlineDataPart => 'inlineData' in p,
      );
      if (!imagePart) return;
      results.push({
        variantIndex: index,
        bytes: base64ToBytes(imagePart.inlineData.data),
        mimeType: imagePart.inlineData.mimeType,
        providerMetadata: {
          provider: 'gemini',
          model: this.model,
          finishReason: candidate.finishReason,
        },
      });
    });

    if (results.length === 0) {
      throw new ProviderError(
        'provider-safety-block',
        'todos os candidates retornados foram bloqueados pelo filtro de segurança',
        false,
      );
    }

    return results;
  }
}
