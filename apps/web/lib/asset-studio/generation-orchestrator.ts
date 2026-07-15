/**
 * lib/asset-studio/generation-orchestrator.ts — Sprint 43B (Gemini Nano
 * Banana Image Provider)
 *
 * Server-only. Único lugar que conecta repositório + storage + provedor
 * de imagem numa geração real. Nunca chamado pela UI diretamente — só
 * por `lib/actions/asset-studio.ts` (`generateAttemptAction`), depois de
 * autorização já confirmada pelo caller.
 *
 * Fluxo (regra da sprint):
 *   autorizar (feito pelo caller) → carregar job queued → validar
 *   template ativo/compatível → validar reference set ativo/compatível →
 *   resolver imagens de referência (disco, nunca URL externa) → resolver
 *   prompt final → reivindicar o job atomicamente (nunca duas gerações
 *   concorrentes) → criar attempt (snapshot de prompt/reference já
 *   resolvidos) → invocar provedor → validar bytes retornados → salvar
 *   em staging → persistir candidates → transicionar o job.
 *
 * Qualquer falha DEPOIS da reivindicação sempre marca o attempt como
 * failed e transiciona o job pra failed — nunca deixa o job preso em
 * "generating".
 */

import type {
  AssetCandidate,
  AssetGenerationAttempt,
  AssetGenerationJob,
  AssetReferenceSet,
} from './domain-types';
import {
  type ImageGenerationProvider,
  ProviderError,
  type ProviderReferenceImage,
} from './image-provider';
import { validateAndDeriveImageMetadata } from './image-validation';
import { resolvePromptTemplateContent } from './prompt-template';
import { resolveReferenceImages } from './reference-resolution';
import type { AssetStudioRepository } from './repository';
import { withTimeoutAndRetry } from './retry';
import * as service from './service';
import type { AssetStudioStorage } from './storage';
import { buildCandidateStoragePath } from './storage-paths';

const PROVIDER_TIMEOUT_MS = 45_000;

export type GenerateJobAttemptResult =
  | { ok: true; attemptId: string; candidateIds: string[] }
  | { ok: false; error: string; errorCode?: string };

function fail(error: string, errorCode?: string): GenerateJobAttemptResult {
  return errorCode === undefined ? { ok: false, error } : { ok: false, error, errorCode };
}

type PrepareResult =
  | {
      ok: true;
      referenceSet: AssetReferenceSet;
      referenceImages: ProviderReferenceImage[];
      promptText: string;
    }
  | { ok: false; error: string; errorCode?: string };

/**
 * Regras 7-9 da sprint + resolução de prompt — extraído do fluxo
 * principal só pra manter `generateJobAttempt` abaixo do limite de
 * complexidade do linter. Nenhuma mutação acontece aqui (nem attempt,
 * nem status do job) — é tudo pré-checagem, "fail before provider call".
 */
async function prepareGenerationInputs(
  repo: AssetStudioRepository,
  job: AssetGenerationJob,
): Promise<PrepareResult> {
  // Regra 7: template inativo não pode gerar (re-validado aqui porque
  // pode ter sido criado ativo e ficado inativo depois).
  const promptTemplate = job.promptTemplateId
    ? await repo.getPromptTemplate(job.promptTemplateId)
    : null;
  if (!promptTemplate)
    return { ok: false, error: 'prompt template não encontrado', errorCode: 'configuration-error' };
  if (!promptTemplate.active) {
    return { ok: false, error: 'prompt template não está ativo', errorCode: 'configuration-error' };
  }
  if (promptTemplate.schemaVersion !== job.artworkSchemaVersion) {
    return {
      ok: false,
      error: 'prompt template incompatível com artworkSchemaVersion do job',
      errorCode: 'configuration-error',
    };
  }

  // Regra 8: reference set inativo/incompatível não pode gerar.
  const referenceSet = job.referenceSetId ? await repo.getReferenceSet(job.referenceSetId) : null;
  if (!referenceSet)
    return { ok: false, error: 'reference set não encontrado', errorCode: 'configuration-error' };
  if (!referenceSet.active) {
    return { ok: false, error: 'reference set não está ativo', errorCode: 'configuration-error' };
  }
  if (
    referenceSet.schemaVersion !== job.artworkSchemaVersion ||
    referenceSet.rarity !== job.rarity
  ) {
    return {
      ok: false,
      error: 'reference set incompatível com o job (raridade ou versão de schema)',
      errorCode: 'configuration-error',
    };
  }

  // Regra 9: arquivo de referência ausente falha ANTES de qualquer chamada de provedor.
  const referencesResult = await resolveReferenceImages(referenceSet);
  if (!referencesResult.ok) {
    return { ok: false, error: referencesResult.reason, errorCode: referencesResult.errorCode };
  }

  // Prompt final — nunca um texto bruto vindo do cliente (regra 4).
  const identityNotes =
    typeof job.metadata.identityNotes === 'string' ? job.metadata.identityNotes : '';
  const promptResult = resolvePromptTemplateContent(
    promptTemplate.content,
    promptTemplate.requiredPlaceholders,
    {
      DISPLAY_NAME: job.playerId,
      RARITY: job.rarity,
      ARTWORK_PRESET_ID: job.artworkPresetId,
      IDENTITY_NOTES: identityNotes,
      REFERENCE_SET: referenceSet.name,
    },
  );
  if (!promptResult.ok)
    return { ok: false, error: promptResult.error, errorCode: 'configuration-error' };

  return {
    ok: true,
    referenceSet,
    referenceImages: referencesResult.images,
    promptText: promptResult.text,
  };
}

export async function generateJobAttempt(
  repo: AssetStudioRepository,
  storage: AssetStudioStorage,
  provider: ImageGenerationProvider,
  jobId: string,
): Promise<GenerateJobAttemptResult> {
  const job = await repo.getJob(jobId);
  if (!job) return fail(`job ${jobId} não encontrado`);
  if (job.status !== 'queued') {
    return fail(
      `job ${jobId} não está "queued" (status atual: "${job.status}") — geração já em andamento ou job em outro estado`,
    );
  }

  const prepared = await prepareGenerationInputs(repo, job);
  if (!prepared.ok) return fail(prepared.error, prepared.errorCode);
  const { referenceSet, referenceImages, promptText } = prepared;

  // A partir daqui, qualquer falha precisa de attempt+markAttemptFailed —
  // reivindica o job atomicamente (nunca duas gerações concorrentes).
  const claimed = await repo.claimJobForGenerating(jobId);
  if (!claimed) {
    return fail(`job ${jobId} já foi reivindicado por outra geração em andamento`);
  }

  const attemptNumber = (await repo.getLatestAttemptNumber(jobId)) + 1;
  const attempt = await repo.insertAttempt({
    jobId,
    attemptNumber,
    provider: provider.name,
    // Sprint 43B.1: resolvido do provedor NO MOMENTO da geração — nunca
    // `job.model` (sempre null, nunca confiado de input do cliente).
    // Attempts já existentes (ex.: o smoke test que falhou com 429)
    // continuam com `model: null` pra sempre — snapshot histórico, nunca
    // reescrito retroativamente.
    model: provider.model,
    requestSnapshot: { artworkPresetId: job.artworkPresetId, rarity: job.rarity },
    promptSnapshot: promptText,
    referenceSnapshot: {
      id: referenceSet.id,
      version: referenceSet.version,
      files: referenceImages.map((img) => ({ label: img.label, mimeType: img.mimeType })),
      resolvedOrder: referenceImages.map((img) => img.label),
    },
    requestedVariants: job.requestedVariants,
    status: 'running',
    providerRequestId: null,
    providerBatchId: null,
    estimatedCost: null,
    actualCost: null,
    usageMetadata: {},
  });

  try {
    return await runGeneration(
      repo,
      storage,
      provider,
      job.id,
      attempt,
      promptText,
      referenceImages,
    );
  } catch (err) {
    const providerError =
      err instanceof ProviderError ? err : new ProviderError('internal-error', String(err), false);
    await service.markAttemptFailed(
      repo,
      attempt.id,
      providerError.code,
      providerError.message,
      providerError.safeDetails,
    );
    return fail(providerError.message, providerError.code);
  }
}

async function runGeneration(
  repo: AssetStudioRepository,
  storage: AssetStudioStorage,
  provider: ImageGenerationProvider,
  jobId: string,
  attempt: AssetGenerationAttempt,
  prompt: string,
  referenceImages: Array<{ label: string; bytes: Uint8Array; mimeType: string }>,
): Promise<GenerateJobAttemptResult> {
  const startedAt = Date.now();

  const candidates = await withTimeoutAndRetry(
    (signal) =>
      provider.generate(
        {
          jobId,
          attemptId: attempt.id,
          prompt,
          requestedVariants: attempt.requestedVariants,
          referenceImages,
          artworkSchemaVersion: 2,
          output: { aspectRatio: '2:3', mimeType: 'image/png' },
        },
        signal,
      ),
    { timeoutMs: PROVIDER_TIMEOUT_MS },
  );

  if (candidates.length === 0) {
    throw new ProviderError(
      'provider-invalid-response',
      'provedor não retornou nenhuma imagem',
      false,
      provider.model ? { model: provider.model } : undefined,
    );
  }

  // Se QUALQUER variante vier inválida, trata o attempt inteiro como
  // falho — mais simples e seguro que aprovação parcial nesta sprint.
  const validated: Array<{
    candidate: (typeof candidates)[number];
    meta: Awaited<ReturnType<typeof validateAndDeriveImageMetadata>>;
  }> = [];
  for (const candidate of candidates) {
    const meta = await validateAndDeriveImageMetadata(candidate.bytes, candidate.mimeType);
    if (!meta.ok) {
      throw new ProviderError(
        'provider-invalid-response',
        `variante ${candidate.variantIndex}: ${meta.reason}`,
        false,
      );
    }
    validated.push({ candidate, meta });
  }

  const storedInputs: Array<Parameters<typeof service.attachCandidates>[2][number]> = [];
  for (const { candidate, meta } of validated) {
    if (!meta.ok) continue;
    const path = buildCandidateStoragePath('candidates', jobId, attempt.id, candidate.variantIndex);
    await storage.putObject(path, candidate.bytes, meta.mimeType);
    storedInputs.push({
      variantIndex: candidate.variantIndex,
      storagePath: path,
      mimeType: meta.mimeType,
      width: meta.width,
      height: meta.height,
      fileSize: meta.fileSize,
      checksum: meta.checksum,
      perceptualHash: null,
      artworkSchemaVersion: 2,
      technicalValidation: { width: meta.width, height: meta.height, fileSize: meta.fileSize },
      visualValidation: {},
      reviewStatus: 'pending',
    });
  }

  await repo.updateAttempt(attempt.id, {
    usageMetadata: {
      candidates: candidates.map((c) => ({
        variantIndex: c.variantIndex,
        providerMetadata: c.providerMetadata,
      })),
      durationMs: Date.now() - startedAt,
    },
  });

  const attached = await service.attachCandidates(repo, attempt.id, storedInputs);
  if (!attached.ok) return { ok: false, error: attached.error };

  return {
    ok: true,
    attemptId: attempt.id,
    candidateIds: (attached.data as AssetCandidate[]).map((c) => c.id),
  };
}
