'use server';

/**
 * lib/actions/asset-studio.ts — Sprint 43A (Asset Studio Foundation)
 *
 * Server Actions do Asset Studio — a ÚNICA porta de entrada pra qualquer
 * mutação nas tabelas `asset_*` a partir da UI. Nenhum Client Component
 * importa `service.ts`/`supabase-repository.ts` diretamente (ver teste de
 * fronteira). Toda ação aqui:
 *   1. resolve o usuário atual (`getCurrentUser()`);
 *   2. checa `checkAssetStudioAuthorization` — falha fechado, sem exceção
 *      pro caller (retorna `{ ok: false }` tipado);
 *   3. só então instancia `SupabaseAssetStudioRepository` e chama o
 *      service layer correspondente.
 *
 * Sprint 43B (Gemini Nano Banana Image Provider) — adiciona
 * `generateAttemptAction`/`getProviderStatusAction`. Geração real segue a
 * MESMA autorização, nunca aprova/publica automaticamente.
 */

import { checkAssetStudioAuthorization } from '@/lib/asset-studio/authorization';
import type { JobStatus } from '@/lib/asset-studio/domain-types';
import { generateJobAttempt } from '@/lib/asset-studio/generation-orchestrator';
import type { CreateDraftJobInput } from '@/lib/asset-studio/job-validation';
import { createImageProvider, getProviderStatus } from '@/lib/asset-studio/provider-config';
import * as service from '@/lib/asset-studio/service';
import { SupabaseAssetStudioStorage, inMemoryAssetStudioStorage } from '@/lib/asset-studio/storage';
import { SupabaseAssetStudioRepository } from '@/lib/asset-studio/supabase-repository';
import { getCurrentUser } from '@/lib/supabase/server';

async function authorizeOrFail(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  const auth = checkAssetStudioAuthorization(user);
  if (!auth.authorized) return { ok: false, error: auth.reason };
  return { ok: true, userId: user?.id ?? '' };
}

function repo() {
  return new SupabaseAssetStudioRepository();
}

export async function createDraftJobAction(input: CreateDraftJobInput) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.createJob(repo(), input, auth.userId);
}

export async function updateDraftJobAction(
  jobId: string,
  patch: Parameters<typeof service.updateDraftJob>[2],
) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.updateDraftJob(repo(), jobId, patch);
}

export async function queueJobAction(jobId: string) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.queueJob(repo(), jobId);
}

export async function cancelJobAction(jobId: string) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.cancelJob(repo(), jobId);
}

export async function startAttemptAction(jobId: string) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.startAttempt(repo(), jobId);
}

export async function markAttemptFailedAction(
  attemptId: string,
  errorCode: string,
  errorMessage: string,
) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.markAttemptFailed(repo(), attemptId, errorCode, errorMessage);
}

export async function approveCandidateAction(
  jobId: string,
  candidateId: string,
  notes: string | null,
) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.approveCandidate(repo(), jobId, candidateId, auth.userId, notes);
}

export async function rejectCandidateAction(
  jobId: string,
  candidateId: string,
  notes: string | null,
  issueCodes: string[],
) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.rejectCandidate(repo(), jobId, candidateId, auth.userId, notes, issueCodes);
}

export async function requestRevisionAction(
  jobId: string,
  candidateId: string,
  notes: string | null,
  issueCodes: string[],
) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.requestRevision(repo(), jobId, candidateId, auth.userId, notes, issueCodes);
}

export async function markJobPublishedAction(jobId: string) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.markJobPublished(repo(), jobId);
}

export async function listJobsAction(filter?: { status?: JobStatus }) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error, data: [] };
  const data = await service.listJobs(repo(), filter);
  return { ok: true as const, data };
}

export async function getJobDetailsAction(jobId: string) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error, data: null };
  const data = await service.getJobDetails(repo(), jobId);
  return { ok: true as const, data };
}

// ─── Sprint 43B — Gemini Nano Banana Image Provider ────────────────────────

/**
 * Status seguro do provedor pra UI — nunca expõe a chave, só se ela
 * existe/é válida. Não exige autorização (é só um indicador informativo
 * sem efeito colateral), mas nunca é chamado fora de `/dev/asset-studio`.
 */
export async function getProviderStatusAction() {
  return getProviderStatus();
}

function storage() {
  // Mesmo fallback de dev local já documentado pra `getCurrentUser()`:
  // sem Supabase configurado, usa o singleton em memória (nunca falha o
  // fluxo de dev por falta de credenciais) — singleton porque uma
  // instância nova por chamada perderia tudo que foi salvo antes.
  return process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new SupabaseAssetStudioStorage()
    : inMemoryAssetStudioStorage;
}

/**
 * Dispara uma geração real (via fake provider em dev/test, Gemini em
 * produção configurada). Nunca aprova/publica automaticamente — só cria
 * attempt + candidates em staging, status `needs_review`.
 */
export async function generateAttemptAction(jobId: string) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const providerResult = createImageProvider();
  if (!providerResult.ok) return { ok: false as const, error: providerResult.error };

  const result = await generateJobAttempt(repo(), storage(), providerResult.provider, jobId);
  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const, attemptId: result.attemptId, candidateIds: result.candidateIds };
}

/**
 * Retorna um candidate gerado como data URL — pra `<img src>` na UI
 * inspecionar a miniatura sem expor um caminho de storage bruto/URL
 * pública. Nunca serve nada fora do bucket `asset-studio` (o caminho vem
 * sempre de `candidate.storagePath`, nunca de input do cliente).
 */
export async function getCandidateImageDataUrlAction(candidateId: string) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const candidate = await repo().getCandidate(candidateId);
  if (!candidate) return { ok: false as const, error: 'candidate não encontrado' };

  const object = await storage().getObject(candidate.storagePath);
  if (!object) return { ok: false as const, error: 'arquivo de staging não encontrado' };

  const base64 = Buffer.from(object.bytes).toString('base64');
  return { ok: true as const, dataUrl: `data:${object.mimeType};base64,${base64}` };
}

// ─── Sprint 43C — Asset Candidate Validation and Human Approval ────────────

/**
 * Roda a validação técnica de um candidate a qualquer momento — nunca
 * automático, sempre uma ação explícita. Aprovar exige que isso tenha
 * rodado com sucesso primeiro (`service.approveCandidate`).
 */
export async function runTechnicalValidationAction(candidateId: string) {
  const auth = await authorizeOrFail();
  if (!auth.ok) return { ok: false as const, error: auth.error };
  return service.runTechnicalValidation(repo(), storage(), candidateId);
}
