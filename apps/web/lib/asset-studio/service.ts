/**
 * lib/asset-studio/service.ts — Sprint 43A (Asset Studio Foundation)
 *
 * Camada de serviço — toda regra de negócio do Asset Studio mora aqui,
 * nunca em server actions ou na UI. Cada função recebe o repositório
 * (`AssetStudioRepository`) por parâmetro (injeção de dependência) — em
 * produção, server actions passam a implementação Supabase real
 * (`supabase-repository.ts`); em teste, passam `InMemoryAssetStudioRepository`.
 * Isso é o que torna toda a lógica abaixo testável sem tocar banco
 * nenhum, mesma convenção de `packages/db`.
 *
 * Nenhuma dessas funções chama um provedor de geração de imagem —
 * `startAttempt` só REGISTRA a intenção (snapshot de prompt/reference),
 * nunca invoca Gemini ou qualquer API externa.
 */

import type {
  AssetCandidate,
  AssetGenerationAttempt,
  AssetGenerationJob,
  JobStatus,
} from './domain-types';
import { type CreateDraftJobInput, validateCreateDraftJob } from './job-validation';
import type { AssetStudioRepository, InsertCandidateInput } from './repository';
import { assertJobStatusTransition } from './status-transitions';

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

function ok<T>(data: T): ServiceResult<T> {
  return { ok: true, data };
}
function fail<T>(error: string): ServiceResult<T> {
  return { ok: false, error };
}

async function transitionJob(
  repo: AssetStudioRepository,
  jobId: string,
  to: JobStatus,
  extraPatch: Partial<AssetGenerationJob> = {},
): Promise<ServiceResult<AssetGenerationJob>> {
  const job = await repo.getJob(jobId);
  if (!job) return fail(`job ${jobId} não encontrado`);
  const transition = assertJobStatusTransition(job.status, to);
  if (!transition.ok) return fail(transition.error);
  const updated = await repo.updateJob(jobId, { ...extraPatch, status: to });
  return ok(updated);
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

export async function createJob(
  repo: AssetStudioRepository,
  input: CreateDraftJobInput,
  createdBy: string | null,
): Promise<ServiceResult<AssetGenerationJob>> {
  const [promptTemplate, referenceSet] = await Promise.all([
    repo.getPromptTemplate(input.promptTemplateId),
    repo.getReferenceSet(input.referenceSetId),
  ]);
  const validation = validateCreateDraftJob(input, promptTemplate, referenceSet);
  if (!validation.ok) return fail(validation.errors.join('; '));

  const job = await repo.insertJob({
    cardId: null,
    artworkPresetId: validation.input.artworkPresetId,
    playerId: validation.input.playerId,
    rarity: validation.input.rarity,
    artworkSchemaVersion: validation.input.artworkSchemaVersion,
    generationMode: validation.input.generationMode ?? 'new',
    promptTemplateId: validation.input.promptTemplateId,
    referenceSetId: validation.input.referenceSetId,
    provider: 'none',
    model: null,
    priority: validation.input.priority ?? 'normal',
    requestedVariants: validation.input.requestedVariants,
    createdBy,
    metadata: validation.input.identityNotes
      ? { identityNotes: validation.input.identityNotes }
      : {},
    status: 'draft',
  });
  return ok(job);
}

export async function updateDraftJob(
  repo: AssetStudioRepository,
  jobId: string,
  patch: Partial<
    Pick<
      AssetGenerationJob,
      'requestedVariants' | 'priority' | 'metadata' | 'referenceSetId' | 'promptTemplateId'
    >
  >,
): Promise<ServiceResult<AssetGenerationJob>> {
  const job = await repo.getJob(jobId);
  if (!job) return fail(`job ${jobId} não encontrado`);
  // Regra 3/4 do brief: só um job em `draft` pode ser editado; um job
  // `generating` não pode ser editado de um jeito que invalide o attempt
  // em andamento — a forma mais simples e segura de garantir isso é só
  // permitir edição em draft, ponto.
  if (job.status !== 'draft') {
    return fail(
      `job ${jobId} não pode ser editado — status atual é "${job.status}", só "draft" é editável`,
    );
  }
  const updated = await repo.updateJob(jobId, patch);
  return ok(updated);
}

export async function queueJob(
  repo: AssetStudioRepository,
  jobId: string,
): Promise<ServiceResult<AssetGenerationJob>> {
  return transitionJob(repo, jobId, 'queued');
}

export async function cancelJob(
  repo: AssetStudioRepository,
  jobId: string,
): Promise<ServiceResult<AssetGenerationJob>> {
  return transitionJob(repo, jobId, 'cancelled');
}

export async function markJobPublished(
  repo: AssetStudioRepository,
  jobId: string,
): Promise<ServiceResult<AssetGenerationJob>> {
  const job = await repo.getJob(jobId);
  if (!job) return fail(`job ${jobId} não encontrado`);
  // Regra 2 do brief: um job publicado precisa ter um candidate aprovado.
  if (!job.approvedCandidateId) {
    return fail(`job ${jobId} não tem approvedCandidateId — não pode ser publicado`);
  }
  return transitionJob(repo, jobId, 'published', { completedAt: new Date().toISOString() });
}

export async function listJobs(
  repo: AssetStudioRepository,
  filter?: { status?: JobStatus },
): Promise<AssetGenerationJob[]> {
  return repo.listJobs(filter);
}

export async function getJobDetails(repo: AssetStudioRepository, jobId: string) {
  const job = await repo.getJob(jobId);
  if (!job) return null;
  const [promptTemplate, referenceSet, attempts, candidates] = await Promise.all([
    job.promptTemplateId ? repo.getPromptTemplate(job.promptTemplateId) : Promise.resolve(null),
    job.referenceSetId ? repo.getReferenceSet(job.referenceSetId) : Promise.resolve(null),
    repo.listAttemptsForJob(jobId),
    repo.listCandidatesForJob(jobId),
  ]);
  const reviewsByCandidateId: Record<
    string,
    Awaited<ReturnType<typeof repo.listReviewsForCandidate>>
  > = {};
  for (const candidate of candidates) {
    reviewsByCandidateId[candidate.id] = await repo.listReviewsForCandidate(candidate.id);
  }
  return { job, promptTemplate, referenceSet, attempts, candidates, reviewsByCandidateId };
}

// ─── Attempts ───────────────────────────────────────────────────────────────

/**
 * Registra a INTENÇÃO de uma nova tentativa — snapshotta prompt/reference
 * NO MOMENTO da criação (nunca lê o template/reference set de novo depois
 * disso). Nenhuma chamada de provedor acontece aqui.
 */
export async function startAttempt(
  repo: AssetStudioRepository,
  jobId: string,
): Promise<ServiceResult<AssetGenerationAttempt>> {
  const job = await repo.getJob(jobId);
  if (!job) return fail(`job ${jobId} não encontrado`);
  const transition = assertJobStatusTransition(job.status, 'generating');
  if (!transition.ok) return fail(transition.error);

  const [promptTemplate, referenceSet, latestAttemptNumber] = await Promise.all([
    job.promptTemplateId ? repo.getPromptTemplate(job.promptTemplateId) : Promise.resolve(null),
    job.referenceSetId ? repo.getReferenceSet(job.referenceSetId) : Promise.resolve(null),
    repo.getLatestAttemptNumber(jobId),
  ]);

  const attempt = await repo.insertAttempt({
    jobId,
    attemptNumber: latestAttemptNumber + 1,
    provider: job.provider,
    model: job.model,
    requestSnapshot: { artworkPresetId: job.artworkPresetId, rarity: job.rarity },
    promptSnapshot: promptTemplate?.content ?? '',
    referenceSnapshot: referenceSet ? { id: referenceSet.id, files: referenceSet.files } : {},
    requestedVariants: job.requestedVariants,
    status: 'running',
    providerRequestId: null,
    providerBatchId: null,
    estimatedCost: null,
    actualCost: null,
    usageMetadata: {},
  });

  await repo.updateJob(jobId, { status: 'generating', startedAt: new Date().toISOString() });
  return ok(attempt);
}

export async function markAttemptFailed(
  repo: AssetStudioRepository,
  attemptId: string,
  errorCode: string,
  errorMessage: string,
): Promise<ServiceResult<AssetGenerationAttempt>> {
  const attempt = await findAttemptById(repo, attemptId);
  if (!attempt) return fail(`attempt ${attemptId} não encontrado`);

  const updated = await repo.updateAttempt(attemptId, {
    status: 'failed',
    failedAt: new Date().toISOString(),
    errorCode,
    errorMessage,
  });
  const jobTransition = await transitionJob(repo, attempt.jobId, 'failed', {
    failedAt: new Date().toISOString(),
    errorCode,
    errorMessage,
  });
  if (!jobTransition.ok) return fail(jobTransition.error);
  return ok(updated);
}

/** O port não expõe getAttempt por id diretamente (não precisa pra nenhum outro caller) — resolvido via listAttemptsForJob quando só o jobId não é conhecido de antemão. */
async function findAttemptById(
  repo: AssetStudioRepository,
  attemptId: string,
): Promise<AssetGenerationAttempt | null> {
  const jobs = await repo.listJobs();
  for (const job of jobs) {
    const attempts = await repo.listAttemptsForJob(job.id);
    const found = attempts.find((a) => a.id === attemptId);
    if (found) return found;
  }
  return null;
}

// ─── Candidates ─────────────────────────────────────────────────────────────

/**
 * Anexa um candidate gerado a um attempt. Como nenhuma validação técnica/
 * visual automática existe nesta sprint (não-objetivo explícito), o job
 * avança generating → generated → validating → needs_review em sequência
 * síncrona — cada transição ainda é checada contra o mapa, só não há
 * trabalho assíncrono real entre elas ainda.
 */
export async function attachCandidate(
  repo: AssetStudioRepository,
  attemptId: string,
  input: Omit<InsertCandidateInput, 'attemptId' | 'jobId'>,
): Promise<ServiceResult<AssetCandidate>> {
  const attempt = await findAttemptById(repo, attemptId);
  if (!attempt) return fail(`attempt ${attemptId} não encontrado`);

  const candidate = await repo.insertCandidate({ ...input, attemptId, jobId: attempt.jobId });
  await repo.updateAttempt(attemptId, {
    status: 'succeeded',
    completedAt: new Date().toISOString(),
  });

  for (const to of ['generated', 'validating', 'needs_review'] as const) {
    const result = await transitionJob(repo, attempt.jobId, to);
    if (!result.ok) return fail(result.error);
  }
  return ok(candidate);
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export async function submitReview(
  repo: AssetStudioRepository,
  candidateId: string,
  reviewerId: string | null,
  decision: 'approve' | 'reject' | 'request_revision',
  notes: string | null,
  issueCodes: string[] = [],
) {
  return repo.insertReview({ candidateId, reviewerId, decision, notes, issueCodes });
}

export async function approveCandidate(
  repo: AssetStudioRepository,
  jobId: string,
  candidateId: string,
  reviewerId: string | null,
  notes: string | null = null,
): Promise<ServiceResult<AssetGenerationJob>> {
  const candidate = await repo.getCandidate(candidateId);
  if (!candidate) return fail(`candidate ${candidateId} não encontrado`);
  // Regra 9 do brief: o candidate aprovado precisa pertencer ao mesmo job.
  if (candidate.jobId !== jobId) {
    return fail(`candidate ${candidateId} não pertence ao job ${jobId}`);
  }

  const transition = await transitionJob(repo, jobId, 'approved', {
    approvedCandidateId: candidateId,
  });
  if (!transition.ok) return transition;

  await repo.updateCandidate(candidateId, { reviewStatus: 'approved' });
  await submitReview(repo, candidateId, reviewerId, 'approve', notes);
  return transition;
}

export async function rejectCandidate(
  repo: AssetStudioRepository,
  jobId: string,
  candidateId: string,
  reviewerId: string | null,
  notes: string | null = null,
  issueCodes: string[] = [],
): Promise<ServiceResult<AssetGenerationJob>> {
  const candidate = await repo.getCandidate(candidateId);
  if (!candidate) return fail(`candidate ${candidateId} não encontrado`);
  if (candidate.jobId !== jobId) {
    return fail(`candidate ${candidateId} não pertence ao job ${jobId}`);
  }

  const transition = await transitionJob(repo, jobId, 'rejected');
  if (!transition.ok) return transition;

  await repo.updateCandidate(candidateId, { reviewStatus: 'rejected' });
  await submitReview(repo, candidateId, reviewerId, 'reject', notes, issueCodes);
  return transition;
}

export async function requestRevision(
  repo: AssetStudioRepository,
  jobId: string,
  candidateId: string,
  reviewerId: string | null,
  notes: string | null = null,
  issueCodes: string[] = [],
): Promise<ServiceResult<AssetGenerationJob>> {
  const candidate = await repo.getCandidate(candidateId);
  if (!candidate) return fail(`candidate ${candidateId} não encontrado`);
  if (candidate.jobId !== jobId) {
    return fail(`candidate ${candidateId} não pertence ao job ${jobId}`);
  }

  const transition = await transitionJob(repo, jobId, 'queued');
  if (!transition.ok) return transition;

  await repo.updateCandidate(candidateId, { reviewStatus: 'needs_revision' });
  await submitReview(repo, candidateId, reviewerId, 'request_revision', notes, issueCodes);
  return transition;
}
