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
  type ProviderSafeDetails,
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

/**
 * Formato padrão de erro do Google (google.rpc.Status) — usado só pra
 * PARSING defensivo, nunca persistido/retornado como está. Nenhuma
 * chamada real ao Gemini validou este formato exato nesta sprint (ver
 * nota em `ProviderSafeDetails`) — é o formato documentado publicamente
 * da API, tratado como best-effort.
 */
type GoogleErrorDetail = {
  '@type'?: string;
  violations?: Array<{ quotaMetric?: string; quotaId?: string; quotaValue?: string | number }>;
  retryDelay?: string;
};
type GoogleErrorBody = {
  error?: { code?: number; status?: string; details?: GoogleErrorDetail[] };
};

/** Extrai só os campos allowlisted — nunca retorna o corpo bruto/parseado inteiro. */
type ParsedGoogleError = {
  googleErrorCode?: number;
  googleErrorStatus?: string;
  quotaMetric?: string;
  quotaId?: string;
  quotaValue?: string | number;
  retryDelay?: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(b64: string): Uint8Array {
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/**
 * Parsing defensivo do corpo de erro do Google — nunca lança (retorna
 * `null` se o JSON for inválido ou não tiver o formato esperado), e
 * nunca retorna nada além dos campos individuais allowlisted abaixo.
 */
function parseGoogleErrorBody(bodyText: string): ParsedGoogleError | null {
  let parsed: GoogleErrorBody;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    return null;
  }
  const error = parsed?.error;
  if (!error || typeof error !== 'object') return null;

  const details = Array.isArray(error.details) ? error.details : [];
  const quotaFailure = details.find((d) => d['@type']?.includes('QuotaFailure'));
  const retryInfo = details.find((d) => d['@type']?.includes('RetryInfo'));
  const violation = quotaFailure?.violations?.[0];

  const result: ParsedGoogleError = {};
  if (typeof error.code === 'number') result.googleErrorCode = error.code;
  if (typeof error.status === 'string') result.googleErrorStatus = error.status;
  if (typeof violation?.quotaMetric === 'string') result.quotaMetric = violation.quotaMetric;
  if (typeof violation?.quotaId === 'string') result.quotaId = violation.quotaId;
  if (violation?.quotaValue !== undefined) result.quotaValue = violation.quotaValue;
  if (typeof retryInfo?.retryDelay === 'string') result.retryDelay = retryInfo.retryDelay;
  return result;
}

/** `Retry-After` padrão HTTP — sempre em segundos, nunca uma data (Gemini não usa a forma de data). */
function parseRetryAfterHeader(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

/** Formato do Google pra `RetryInfo.retryDelay`: string tipo "31s" ou "31.5s". */
function parseRetryDelaySeconds(retryDelay: string | undefined): number | undefined {
  if (!retryDelay) return undefined;
  const match = /^(\d+(?:\.\d+)?)s$/.exec(retryDelay);
  if (!match) return undefined;
  const seconds = Number(match[1]);
  return Number.isFinite(seconds) ? seconds : undefined;
}

/**
 * Classificação DERIVADA e segura do tipo de rate limit — nunca muda o
 * `error_code` externo (`provider-rate-limit` continua sendo o único
 * código), só enriquece `safeDetails.rateLimitCategory`. Heurística
 * best-effort (ver nota de tipo em `ProviderSafeDetails`): sem evidência
 * suficiente no corpo, cai em "unknown-rate-limit" — nunca inventa uma
 * categoria mais específica sem base no que o Google realmente retornou.
 */
function deriveRateLimitCategory(
  parsed: ParsedGoogleError | null,
): NonNullable<ProviderSafeDetails['rateLimitCategory']> {
  const quotaValue = parsed?.quotaValue;
  const quotaId = parsed?.quotaId ?? '';
  const isZeroQuota = quotaValue === 0 || quotaValue === '0';

  if (isZeroQuota && /freetier/i.test(quotaId)) return 'unavailable-tier';
  if (isZeroQuota) return 'zero-quota';
  if (/perday/i.test(quotaId)) return 'daily-quota-exhausted';
  if (/perminute/i.test(quotaId)) return 'temporary-rate-limit';
  return 'unknown-rate-limit';
}

function classifyHttpError(
  status: number,
  bodyText: string,
  retryAfterHeader: string | null,
  model: string,
): ProviderError {
  const parsed = parseGoogleErrorBody(bodyText);
  const retryAfterSeconds =
    parseRetryAfterHeader(retryAfterHeader) ?? parseRetryDelaySeconds(parsed?.retryDelay);

  const safeDetails: ProviderSafeDetails = {
    httpStatus: status,
    model,
    ...(parsed?.googleErrorStatus !== undefined
      ? { googleErrorStatus: parsed.googleErrorStatus }
      : {}),
    ...(parsed?.googleErrorCode !== undefined ? { googleErrorCode: parsed.googleErrorCode } : {}),
    ...(parsed?.quotaMetric !== undefined ? { quotaMetric: parsed.quotaMetric } : {}),
    ...(parsed?.quotaId !== undefined ? { quotaId: parsed.quotaId } : {}),
    ...(parsed?.quotaValue !== undefined ? { quotaValue: parsed.quotaValue } : {}),
    ...(parsed?.retryDelay !== undefined ? { retryDelay: parsed.retryDelay } : {}),
    ...(retryAfterSeconds !== undefined ? { retryAfterSeconds } : {}),
  };

  if (status === 401 || status === 403) {
    return new ProviderError(
      'provider-authentication',
      'autenticação recusada pelo provedor',
      false,
      safeDetails,
    );
  }
  if (status === 429) {
    const rateLimitCategory = deriveRateLimitCategory(parsed);
    // Zero-quota/tier indisponível nunca é retentável (nada muda tentando
    // de novo); quota diária esgotada também não — o retry limitado desta
    // sprint (segundos, não horas) nunca respeitaria o reset real. Rate
    // limit temporário/desconhecido continua retryable (política já
    // limitada/bounded de `retry.ts`, inalterada).
    const retryable =
      rateLimitCategory === 'temporary-rate-limit' || rateLimitCategory === 'unknown-rate-limit';
    return new ProviderError(
      'provider-rate-limit',
      'limite de taxa do provedor atingido',
      retryable,
      { ...safeDetails, rateLimitCategory },
    );
  }
  if (status >= 500) {
    return new ProviderError(
      'provider-invalid-response',
      `erro interno do provedor (status ${status})`,
      true,
      safeDetails,
    );
  }
  // 400 etc — prompt/request inválido, nunca re-tentar sem mudar o request.
  // A mensagem nunca inclui o corpo da resposta (mesmo truncado) — só o
  // status, que já vai em `safeDetails.httpStatus`.
  return new ProviderError(
    'provider-invalid-response',
    `provedor recusou a requisição (status ${status})`,
    false,
    safeDetails,
  );
}

export class GeminiImageProvider implements ImageGenerationProvider {
  readonly name = 'gemini';
  readonly model: string;

  constructor(
    private readonly apiKey: string,
    model: string,
  ) {
    this.model = model;
  }

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
          { model: this.model },
        );
      }
      throw new ProviderError(
        'provider-invalid-response',
        `falha de rede: ${(err as Error).message}`,
        true,
        { model: this.model },
      );
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw classifyHttpError(
        response.status,
        bodyText,
        response.headers.get('retry-after'),
        this.model,
      );
    }

    const json = (await response.json()) as GeminiGenerateContentResponse;

    if (json.promptFeedback?.blockReason) {
      throw new ProviderError(
        'provider-safety-block',
        `prompt bloqueado pelo filtro de segurança do provedor: ${json.promptFeedback.blockReason}`,
        false,
        { model: this.model },
      );
    }

    const candidates = json.candidates ?? [];
    if (candidates.length === 0) {
      throw new ProviderError(
        'provider-invalid-response',
        'provedor não retornou nenhum candidate',
        false,
        { model: this.model },
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
        { model: this.model },
      );
    }

    return results;
  }
}
