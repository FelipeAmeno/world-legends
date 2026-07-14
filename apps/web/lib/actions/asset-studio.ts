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
 * Nenhuma ação aqui chama um provedor de geração de imagem.
 */

import { checkAssetStudioAuthorization } from '@/lib/asset-studio/authorization';
import type { JobStatus } from '@/lib/asset-studio/domain-types';
import type { CreateDraftJobInput } from '@/lib/asset-studio/job-validation';
import * as service from '@/lib/asset-studio/service';
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
