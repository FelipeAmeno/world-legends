/**
 * lib/asset-studio/supabase-repository.ts — Sprint 43A (Asset Studio Foundation)
 *
 * Adapter real do `AssetStudioRepository`, sobre o client service_role
 * (`getServiceDb()`, `lib/server/db.ts` — bypassa RLS, NUNCA exposto ao
 * client-side, mesma convenção de `lib/actions/favorites.ts`). Server-only
 * por CONVENÇÃO (mesmo padrão de `lib/server/db.ts` — nenhum arquivo deste
 * projeto usa o pacote `server-only`, só o comentário + nunca ser
 * importado por um Client Component; ver teste de fronteira server/client).
 *
 * Não testado diretamente nesta sprint (mesma convenção "Fase 6" já
 * documentada em `packages/db/tests/repositories/contract.test.ts` —
 * adapters Supabase reais não são exercitados em teste unitário; toda a
 * lógica de negócio é testada contra `InMemoryAssetStudioRepository`
 * em `service.ts`/os testes deste sprint).
 *
 * NOTA sobre tipagem: as 6 tabelas novas desta sprint ainda não existem
 * em `Database` (`packages/db/src/adapters/database.types.ts`, gerado via
 * Supabase CLI contra um projeto real — este repo não tem um projeto
 * linkado pra regenerar agora). `db()` usa um cast local pra
 * `SupabaseClient<any>` só neste arquivo — quando `database.types.ts` for
 * regenerado depois da migration ser aplicada, trocar pelo `DbClient`
 * tipado normalmente é um ajuste mecânico, não estrutural.
 */

import { getServiceDb } from '@/lib/server/db';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ArtworkSchemaVersion,
  AssetCandidate,
  AssetGenerationAttempt,
  AssetGenerationJob,
  AssetPromptTemplate,
  AssetReferenceSet,
  AssetReview,
} from './domain-types';
import type {
  AssetStudioRepository,
  InsertAttemptInput,
  InsertCandidateInput,
  InsertJobInput,
  InsertReviewInput,
} from './repository';

// ─── Row ↔ domain mapping (snake_case ↔ camelCase) ─────────────────────────

type JobRow = {
  id: string;
  card_id: string | null;
  artwork_preset_id: string;
  player_id: string;
  rarity: string;
  artwork_schema_version: number;
  generation_mode: string;
  prompt_template_id: string | null;
  reference_set_id: string | null;
  provider: string;
  model: string | null;
  priority: string;
  status: string;
  requested_variants: number;
  approved_candidate_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
};

function jobFromRow(row: JobRow): AssetGenerationJob {
  return {
    id: row.id,
    cardId: row.card_id,
    artworkPresetId: row.artwork_preset_id,
    playerId: row.player_id,
    rarity: row.rarity,
    artworkSchemaVersion: row.artwork_schema_version as ArtworkSchemaVersion,
    generationMode: row.generation_mode as AssetGenerationJob['generationMode'],
    promptTemplateId: row.prompt_template_id,
    referenceSetId: row.reference_set_id,
    provider: row.provider,
    model: row.model,
    priority: row.priority as AssetGenerationJob['priority'],
    status: row.status as AssetGenerationJob['status'],
    requestedVariants: row.requested_variants,
    approvedCandidateId: row.approved_candidate_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    failedAt: row.failed_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    metadata: row.metadata ?? {},
  };
}

const JOB_FIELD_TO_COLUMN: Record<keyof AssetGenerationJob, string> = {
  id: 'id',
  cardId: 'card_id',
  artworkPresetId: 'artwork_preset_id',
  playerId: 'player_id',
  rarity: 'rarity',
  artworkSchemaVersion: 'artwork_schema_version',
  generationMode: 'generation_mode',
  promptTemplateId: 'prompt_template_id',
  referenceSetId: 'reference_set_id',
  provider: 'provider',
  model: 'model',
  priority: 'priority',
  status: 'status',
  requestedVariants: 'requested_variants',
  approvedCandidateId: 'approved_candidate_id',
  createdBy: 'created_by',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  startedAt: 'started_at',
  completedAt: 'completed_at',
  failedAt: 'failed_at',
  errorCode: 'error_code',
  errorMessage: 'error_message',
  metadata: 'metadata',
};

/** Declarativo em vez de N `if` — mesmo resultado, complexidade ciclomática 1. */
function jobToRow(patch: Partial<AssetGenerationJob>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const [field, column] of Object.entries(JOB_FIELD_TO_COLUMN) as Array<
    [keyof AssetGenerationJob, string]
  >) {
    if (field in patch) row[column] = patch[field];
  }
  row.updated_at = new Date().toISOString();
  return row;
}

type AttemptRow = {
  id: string;
  job_id: string;
  attempt_number: number;
  provider: string;
  model: string | null;
  request_snapshot: Record<string, unknown>;
  prompt_snapshot: string;
  reference_snapshot: Record<string, unknown>;
  requested_variants: number;
  status: string;
  provider_request_id: string | null;
  provider_batch_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  failed_at: string | null;
  error_code: string | null;
  error_message: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  usage_metadata: Record<string, unknown>;
  created_at: string;
};

function attemptFromRow(row: AttemptRow): AssetGenerationAttempt {
  return {
    id: row.id,
    jobId: row.job_id,
    attemptNumber: row.attempt_number,
    provider: row.provider,
    model: row.model,
    requestSnapshot: row.request_snapshot ?? {},
    promptSnapshot: row.prompt_snapshot,
    referenceSnapshot: row.reference_snapshot ?? {},
    requestedVariants: row.requested_variants,
    status: row.status as AssetGenerationAttempt['status'],
    providerRequestId: row.provider_request_id,
    providerBatchId: row.provider_batch_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    failedAt: row.failed_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    estimatedCost: row.estimated_cost,
    actualCost: row.actual_cost,
    usageMetadata: row.usage_metadata ?? {},
    createdAt: row.created_at,
  };
}

type CandidateRow = {
  id: string;
  job_id: string;
  attempt_id: string;
  variant_index: number;
  storage_path: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  file_size: number | null;
  checksum: string | null;
  perceptual_hash: string | null;
  artwork_schema_version: number;
  technical_validation: Record<string, unknown>;
  visual_validation: Record<string, unknown>;
  review_status: string;
  created_at: string;
};

function candidateFromRow(row: CandidateRow): AssetCandidate {
  return {
    id: row.id,
    jobId: row.job_id,
    attemptId: row.attempt_id,
    variantIndex: row.variant_index,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    width: row.width,
    height: row.height,
    fileSize: row.file_size,
    checksum: row.checksum,
    perceptualHash: row.perceptual_hash,
    artworkSchemaVersion: row.artwork_schema_version as ArtworkSchemaVersion,
    technicalValidation: row.technical_validation ?? {},
    visualValidation: row.visual_validation ?? {},
    reviewStatus: row.review_status as AssetCandidate['reviewStatus'],
    createdAt: row.created_at,
  };
}

type ReviewRow = {
  id: string;
  candidate_id: string;
  reviewer_id: string | null;
  decision: string;
  notes: string | null;
  issue_codes: string[];
  created_at: string;
};

function reviewFromRow(row: ReviewRow): AssetReview {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    reviewerId: row.reviewer_id,
    decision: row.decision as AssetReview['decision'],
    notes: row.notes,
    issueCodes: row.issue_codes ?? [],
    createdAt: row.created_at,
  };
}

type ReferenceSetRow = {
  id: string;
  rarity: string;
  schema_version: number;
  name: string;
  description: string | null;
  version: number;
  active: boolean;
  files: string[];
  created_at: string;
  updated_at: string;
};

function referenceSetFromRow(row: ReferenceSetRow): AssetReferenceSet {
  return {
    id: row.id,
    rarity: row.rarity,
    schemaVersion: row.schema_version as ArtworkSchemaVersion,
    name: row.name,
    description: row.description,
    version: row.version,
    active: row.active,
    files: row.files ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type PromptTemplateRow = {
  id: string;
  name: string;
  schema_version: number;
  template_version: number;
  content: string;
  required_placeholders: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
};

function promptTemplateFromRow(row: PromptTemplateRow): AssetPromptTemplate {
  return {
    id: row.id,
    name: row.name,
    schemaVersion: row.schema_version as ArtworkSchemaVersion,
    templateVersion: row.template_version,
    content: row.content,
    requiredPlaceholders: row.required_placeholders ?? [],
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseAssetStudioRepository implements AssetStudioRepository {
  private db(): SupabaseClient {
    // Cast local — ver nota de tipagem no cabeçalho do arquivo.
    return getServiceDb() as unknown as SupabaseClient;
  }

  async insertJob(input: InsertJobInput): Promise<AssetGenerationJob> {
    const { data, error } = await this.db()
      .from('asset_generation_jobs')
      .insert({
        card_id: input.cardId,
        artwork_preset_id: input.artworkPresetId,
        player_id: input.playerId,
        rarity: input.rarity,
        artwork_schema_version: input.artworkSchemaVersion,
        generation_mode: input.generationMode,
        prompt_template_id: input.promptTemplateId,
        reference_set_id: input.referenceSetId,
        provider: input.provider,
        model: input.model,
        priority: input.priority,
        requested_variants: input.requestedVariants,
        created_by: input.createdBy,
        metadata: input.metadata,
        status: input.status ?? 'draft',
      })
      .select()
      .single();
    if (error || !data) throw new Error(`insertJob falhou: ${error?.message}`);
    return jobFromRow(data as JobRow);
  }

  async getJob(id: string): Promise<AssetGenerationJob | null> {
    const { data } = await this.db()
      .from('asset_generation_jobs')
      .select()
      .eq('id', id)
      .maybeSingle();
    return data ? jobFromRow(data as JobRow) : null;
  }

  async updateJob(id: string, patch: Partial<AssetGenerationJob>): Promise<AssetGenerationJob> {
    const { data, error } = await this.db()
      .from('asset_generation_jobs')
      .update(jobToRow(patch))
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(`updateJob falhou: ${error?.message}`);
    return jobFromRow(data as JobRow);
  }

  async listJobs(filter?: { status?: AssetGenerationJob['status'] }): Promise<
    AssetGenerationJob[]
  > {
    let query = this.db().from('asset_generation_jobs').select();
    if (filter?.status) query = query.eq('status', filter.status);
    const { data } = await query.order('created_at', { ascending: false });
    return ((data ?? []) as JobRow[]).map(jobFromRow);
  }

  async claimJobForGenerating(jobId: string): Promise<boolean> {
    const { data, error } = await this.db()
      .from('asset_generation_jobs')
      .update({
        status: 'generating',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
      .eq('status', 'queued') // condição atômica — 0 linhas afetadas = outra chamada já reivindicou
      .select('id');
    if (error) throw new Error(`claimJobForGenerating falhou: ${error.message}`);
    return (data?.length ?? 0) > 0;
  }

  async insertAttempt(input: InsertAttemptInput): Promise<AssetGenerationAttempt> {
    const { data, error } = await this.db()
      .from('asset_generation_attempts')
      .insert({
        job_id: input.jobId,
        attempt_number: input.attemptNumber,
        provider: input.provider,
        model: input.model,
        request_snapshot: input.requestSnapshot,
        prompt_snapshot: input.promptSnapshot,
        reference_snapshot: input.referenceSnapshot,
        requested_variants: input.requestedVariants,
        status: input.status,
        provider_request_id: input.providerRequestId,
        provider_batch_id: input.providerBatchId,
        estimated_cost: input.estimatedCost,
        actual_cost: input.actualCost,
        usage_metadata: input.usageMetadata,
      })
      .select()
      .single();
    if (error || !data) throw new Error(`insertAttempt falhou: ${error?.message}`);
    return attemptFromRow(data as AttemptRow);
  }

  async updateAttempt(
    id: string,
    patch: Partial<AssetGenerationAttempt>,
  ): Promise<AssetGenerationAttempt> {
    const row: Record<string, unknown> = {};
    if ('status' in patch) row.status = patch.status;
    if ('startedAt' in patch) row.started_at = patch.startedAt;
    if ('completedAt' in patch) row.completed_at = patch.completedAt;
    if ('failedAt' in patch) row.failed_at = patch.failedAt;
    if ('errorCode' in patch) row.error_code = patch.errorCode;
    if ('errorMessage' in patch) row.error_message = patch.errorMessage;
    if ('actualCost' in patch) row.actual_cost = patch.actualCost;
    if ('usageMetadata' in patch) row.usage_metadata = patch.usageMetadata;
    const { data, error } = await this.db()
      .from('asset_generation_attempts')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(`updateAttempt falhou: ${error?.message}`);
    return attemptFromRow(data as AttemptRow);
  }

  async listAttemptsForJob(jobId: string): Promise<AssetGenerationAttempt[]> {
    const { data } = await this.db()
      .from('asset_generation_attempts')
      .select()
      .eq('job_id', jobId)
      .order('attempt_number', { ascending: true });
    return ((data ?? []) as AttemptRow[]).map(attemptFromRow);
  }

  async getLatestAttemptNumber(jobId: string): Promise<number> {
    const attempts = await this.listAttemptsForJob(jobId);
    return attempts.length === 0 ? 0 : Math.max(...attempts.map((a) => a.attemptNumber));
  }

  async insertCandidate(input: InsertCandidateInput): Promise<AssetCandidate> {
    const { data, error } = await this.db()
      .from('asset_candidates')
      .insert({
        job_id: input.jobId,
        attempt_id: input.attemptId,
        variant_index: input.variantIndex,
        storage_path: input.storagePath,
        mime_type: input.mimeType,
        width: input.width,
        height: input.height,
        file_size: input.fileSize,
        checksum: input.checksum,
        perceptual_hash: input.perceptualHash,
        artwork_schema_version: input.artworkSchemaVersion,
        technical_validation: input.technicalValidation,
        visual_validation: input.visualValidation,
        review_status: input.reviewStatus,
      })
      .select()
      .single();
    if (error || !data) throw new Error(`insertCandidate falhou: ${error?.message}`);
    return candidateFromRow(data as CandidateRow);
  }

  async getCandidate(id: string): Promise<AssetCandidate | null> {
    const { data } = await this.db().from('asset_candidates').select().eq('id', id).maybeSingle();
    return data ? candidateFromRow(data as CandidateRow) : null;
  }

  async updateCandidate(id: string, patch: Partial<AssetCandidate>): Promise<AssetCandidate> {
    const row: Record<string, unknown> = {};
    if ('reviewStatus' in patch) row.review_status = patch.reviewStatus;
    if ('technicalValidation' in patch) row.technical_validation = patch.technicalValidation;
    if ('visualValidation' in patch) row.visual_validation = patch.visualValidation;
    if ('perceptualHash' in patch) row.perceptual_hash = patch.perceptualHash;
    if ('checksum' in patch) row.checksum = patch.checksum;
    const { data, error } = await this.db()
      .from('asset_candidates')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw new Error(`updateCandidate falhou: ${error?.message}`);
    return candidateFromRow(data as CandidateRow);
  }

  async listCandidatesForJob(jobId: string): Promise<AssetCandidate[]> {
    const { data } = await this.db().from('asset_candidates').select().eq('job_id', jobId);
    return ((data ?? []) as CandidateRow[]).map(candidateFromRow);
  }

  async findCandidatesByChecksum(checksum: string): Promise<AssetCandidate[]> {
    const { data } = await this.db().from('asset_candidates').select().eq('checksum', checksum);
    return ((data ?? []) as CandidateRow[]).map(candidateFromRow);
  }

  async insertReview(input: InsertReviewInput): Promise<AssetReview> {
    const { data, error } = await this.db()
      .from('asset_reviews')
      .insert({
        candidate_id: input.candidateId,
        reviewer_id: input.reviewerId,
        decision: input.decision,
        notes: input.notes,
        issue_codes: input.issueCodes,
      })
      .select()
      .single();
    if (error || !data) throw new Error(`insertReview falhou: ${error?.message}`);
    return reviewFromRow(data as ReviewRow);
  }

  async listReviewsForCandidate(candidateId: string): Promise<AssetReview[]> {
    const { data } = await this.db()
      .from('asset_reviews')
      .select()
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true });
    return ((data ?? []) as ReviewRow[]).map(reviewFromRow);
  }

  async getReferenceSet(id: string): Promise<AssetReferenceSet | null> {
    const { data } = await this.db()
      .from('asset_reference_sets')
      .select()
      .eq('id', id)
      .maybeSingle();
    return data ? referenceSetFromRow(data as ReferenceSetRow) : null;
  }

  async getActiveReferenceSet(
    rarity: string,
    schemaVersion: ArtworkSchemaVersion,
  ): Promise<AssetReferenceSet | null> {
    const { data } = await this.db()
      .from('asset_reference_sets')
      .select()
      .eq('rarity', rarity)
      .eq('schema_version', schemaVersion)
      .eq('active', true)
      .maybeSingle();
    return data ? referenceSetFromRow(data as ReferenceSetRow) : null;
  }

  async listReferenceSets(): Promise<AssetReferenceSet[]> {
    const { data } = await this.db().from('asset_reference_sets').select();
    return ((data ?? []) as ReferenceSetRow[]).map(referenceSetFromRow);
  }

  async getPromptTemplate(id: string): Promise<AssetPromptTemplate | null> {
    const { data } = await this.db()
      .from('asset_prompt_templates')
      .select()
      .eq('id', id)
      .maybeSingle();
    return data ? promptTemplateFromRow(data as PromptTemplateRow) : null;
  }

  async listPromptTemplates(): Promise<AssetPromptTemplate[]> {
    const { data } = await this.db().from('asset_prompt_templates').select();
    return ((data ?? []) as PromptTemplateRow[]).map(promptTemplateFromRow);
  }
}
