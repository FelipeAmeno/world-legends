/**
 * lib/asset-studio/image-provider.ts — Sprint 43B (Gemini Nano Banana
 * Image Provider)
 *
 * Contrato de provedor de geração de imagem — porta (interface) do
 * padrão Ports & Adapters já estabelecido pro resto do Asset Studio
 * (`repository.ts`). Nenhum tipo específico do Gemini escapa daqui pra
 * fora do adapter (`providers/gemini-image-provider.ts`) — o orquestrador
 * (`generation-orchestrator.ts`) só conhece este contrato.
 */

export type ProviderReferenceImage = {
  /** Rótulo curto pra depuração — nunca um nome de exibição de jogador. */
  label: string;
  bytes: Uint8Array;
  mimeType: string;
};

export type GenerateArtworkRequest = {
  jobId: string;
  attemptId: string;
  prompt: string;
  requestedVariants: number;
  referenceImages: ProviderReferenceImage[];
  artworkSchemaVersion: 2;
  output: {
    aspectRatio: '2:3';
    mimeType: 'image/png';
  };
};

export type GeneratedArtworkCandidate = {
  variantIndex: number;
  bytes: Uint8Array;
  mimeType: string;
  /** Metadata do provedor preservada pra auditoria — NUNCA contém a chave de API ou headers de autorização. */
  providerMetadata: Record<string, unknown>;
};

/**
 * Categorias de erro — usadas pra decidir retry (`retry.ts`) e pra
 * persistir um `error_code` seguro em `asset_generation_attempts`, nunca
 * a mensagem bruta do provedor sem sanitização.
 */
export type ProviderErrorCode =
  | 'provider-authentication'
  | 'provider-rate-limit'
  | 'provider-timeout'
  | 'provider-safety-block'
  | 'provider-invalid-response'
  | 'storage-failure'
  | 'configuration-error'
  | 'internal-error';

/**
 * Diagnóstico seguro e ALLOWLISTED de uma falha de provedor — Sprint
 * 43B.1 (pós-smoke-test real, rate limit 429 sem diagnóstico nenhum
 * persistido). Cada campo é extraído individualmente da resposta do
 * Google (nunca o corpo bruto, nunca headers de auth, nunca a chave).
 * `rateLimitCategory` é uma classificação DERIVADA best-effort — nenhuma
 * chamada real ao Gemini foi feita pra validar o formato exato da
 * resposta 429 do Google contra estes campos (ver
 * docs/design/07-gemini-image-provider.md); a heurística é documentada
 * como tal, não afirmada como garantidamente correta.
 */
export type ProviderSafeDetails = {
  httpStatus?: number;
  googleErrorStatus?: string;
  googleErrorCode?: number;
  quotaMetric?: string;
  quotaId?: string;
  quotaValue?: string | number;
  retryDelay?: string;
  retryAfterSeconds?: number;
  model?: string;
  rateLimitCategory?:
    | 'temporary-rate-limit'
    | 'daily-quota-exhausted'
    | 'zero-quota'
    | 'unavailable-tier'
    | 'unknown-rate-limit';
};

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  /** Se `true`, `retry.ts` pode tentar de novo (sujeito ao limite máximo). */
  readonly retryable: boolean;
  /** Nunca contém segredo, header ou corpo bruto — só campos individualmente extraídos. */
  readonly safeDetails: ProviderSafeDetails | undefined;

  constructor(
    code: ProviderErrorCode,
    message: string,
    retryable: boolean,
    safeDetails?: ProviderSafeDetails,
  ) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.retryable = retryable;
    this.safeDetails = safeDetails;
  }
}

export interface ImageGenerationProvider {
  readonly name: string;
  /** Modelo real configurado — resolvido no momento da geração, nunca confiado de input do cliente. `null` quando o provedor não tem conceito de modelo (ex.: fake). */
  readonly model: string | null;
  generate(
    request: GenerateArtworkRequest,
    signal?: AbortSignal,
  ): Promise<GeneratedArtworkCandidate[]>;
}
