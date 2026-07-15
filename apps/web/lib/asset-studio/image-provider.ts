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

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  /** Se `true`, `retry.ts` pode tentar de novo (sujeito ao limite máximo). */
  readonly retryable: boolean;

  constructor(code: ProviderErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.retryable = retryable;
  }
}

export interface ImageGenerationProvider {
  readonly name: string;
  generate(
    request: GenerateArtworkRequest,
    signal?: AbortSignal,
  ): Promise<GeneratedArtworkCandidate[]>;
}
