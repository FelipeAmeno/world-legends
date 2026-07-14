/**
 * lib/asset-studio/domain-types.ts — Sprint 43A (Asset Studio Foundation)
 *
 * Tipos de domínio pras 6 tabelas de `supabase/migrations/..._asset_studio_foundation.sql`.
 * Espelham as colunas 1:1 (snake_case, igual o schema) — nenhum mapeamento
 * camelCase/DTO intermediário nesta camada, pra nunca ter dois formatos
 * do mesmo dado pra manter sincronizados.
 *
 * Nenhum destes tipos é gameplay/economia. Nenhum provedor de geração é
 * chamado nesta sprint — jobs reais ficam em `draft` (nunca avançam
 * sozinhos); attempts/candidates/reviews só existem via fixture de teste
 * ou ação manual interna explícita.
 */

export type ArtworkSchemaVersion = 1 | 2;

export type JobStatus =
  | 'draft'
  | 'queued'
  | 'generating'
  | 'generated'
  | 'validating'
  | 'needs_review'
  | 'approved'
  | 'rejected'
  | 'failed'
  | 'published'
  | 'cancelled';

export type GenerationMode = 'new' | 'revision' | 'variant';
export type JobPriority = 'low' | 'normal' | 'high';

export type AttemptStatus = 'pending' | 'running' | 'succeeded' | 'failed';

export type CandidateReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_revision';

export type ReviewDecision = 'approve' | 'reject' | 'request_revision';

export type AssetGenerationJob = {
  id: string;
  cardId: string | null;
  artworkPresetId: string;
  playerId: string;
  rarity: string;
  artworkSchemaVersion: ArtworkSchemaVersion;
  generationMode: GenerationMode;
  promptTemplateId: string | null;
  referenceSetId: string | null;
  provider: string;
  model: string | null;
  priority: JobPriority;
  status: JobStatus;
  requestedVariants: number;
  approvedCandidateId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown>;
};

export type AssetGenerationAttempt = {
  id: string;
  jobId: string;
  attemptNumber: number;
  provider: string;
  model: string | null;
  requestSnapshot: Record<string, unknown>;
  promptSnapshot: string;
  referenceSnapshot: Record<string, unknown>;
  requestedVariants: number;
  status: AttemptStatus;
  providerRequestId: string | null;
  providerBatchId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  estimatedCost: number | null;
  actualCost: number | null;
  usageMetadata: Record<string, unknown>;
  createdAt: string;
};

export type AssetCandidate = {
  id: string;
  jobId: string;
  attemptId: string;
  variantIndex: number;
  storagePath: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  checksum: string | null;
  perceptualHash: string | null;
  artworkSchemaVersion: ArtworkSchemaVersion;
  technicalValidation: Record<string, unknown>;
  visualValidation: Record<string, unknown>;
  reviewStatus: CandidateReviewStatus;
  createdAt: string;
};

export type AssetReview = {
  id: string;
  candidateId: string;
  reviewerId: string | null;
  decision: ReviewDecision;
  notes: string | null;
  issueCodes: string[];
  createdAt: string;
};

export type AssetReferenceSet = {
  id: string;
  rarity: string;
  schemaVersion: ArtworkSchemaVersion;
  name: string;
  description: string | null;
  version: number;
  active: boolean;
  files: string[];
  createdAt: string;
  updatedAt: string;
};

export type AssetPromptTemplate = {
  id: string;
  name: string;
  schemaVersion: ArtworkSchemaVersion;
  templateVersion: number;
  content: string;
  requiredPlaceholders: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Detalhe completo de um job — o que a UI interna precisa pra auditoria (quem criou, template/reference usados, attempts, candidates, reviews). */
export type JobDetails = {
  job: AssetGenerationJob;
  promptTemplate: AssetPromptTemplate | null;
  referenceSet: AssetReferenceSet | null;
  attempts: AssetGenerationAttempt[];
  candidates: AssetCandidate[];
  reviewsByCandidateId: Record<string, AssetReview[]>;
};
