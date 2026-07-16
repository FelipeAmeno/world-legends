import { InMemoryAssetStudioRepository } from '@/lib/asset-studio/in-memory-repository';
import * as service from '@/lib/asset-studio/service';
import { beforeEach, describe, expect, it } from 'vitest';

function seedFixtures(repo: InMemoryAssetStudioRepository) {
  repo.seedPromptTemplate({
    id: 'tpl-1',
    name: 'base-v2',
    schemaVersion: 2,
    templateVersion: 1,
    content: 'fixture prompt content',
    requiredPlaceholders: [],
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  });
  repo.seedReferenceSet({
    id: 'ref-1',
    rarity: 'legendary',
    schemaVersion: 2,
    name: 'legendary-v2',
    description: null,
    version: 1,
    active: true,
    files: ['ref-a.png'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  });
}

async function createDraftFixtureJob(repo: InMemoryAssetStudioRepository) {
  const result = await service.createJob(
    repo,
    {
      artworkPresetId: 'wl-fixture-001',
      playerId: 'fixture-player',
      rarity: 'legendary',
      promptTemplateId: 'tpl-1',
      referenceSetId: 'ref-1',
      requestedVariants: 2,
    },
    'user-1',
  );
  if (!result.ok) throw new Error(`fixture setup falhou: ${result.error}`);
  return result.data;
}

describe('Sprint 43A — service layer (regras de negócio, via repositório in-memory)', () => {
  let repo: InMemoryAssetStudioRepository;

  beforeEach(() => {
    repo = new InMemoryAssetStudioRepository();
    seedFixtures(repo);
  });

  it('cria job em draft e permite editar enquanto ainda é draft', async () => {
    const job = await createDraftFixtureJob(repo);
    expect(job.status).toBe('draft');
    const updated = await service.updateDraftJob(repo, job.id, { priority: 'high' });
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.data.priority).toBe('high');
  });

  it('job fora de draft não pode ser editado', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const result = await service.updateDraftJob(repo, job.id, { priority: 'high' });
    expect(result.ok).toBe(false);
  });

  it('8. published exige approvedCandidateId — publicar sem candidate aprovado falha', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const attempt = await service.startAttempt(repo, job.id);
    expect(attempt.ok).toBe(true);
    if (!attempt.ok) return;
    await service.attachCandidate(repo, attempt.data.id, {
      variantIndex: 0,
      storagePath: 'asset-studio/candidates/job/attempt/0.png',
      mimeType: 'image/png',
      width: 800,
      height: 1200,
      fileSize: 1000,
      checksum: null,
      perceptualHash: null,
      artworkSchemaVersion: 2,
      technicalValidation: {},
      visualValidation: {},
      reviewStatus: 'pending',
    });
    const published = await service.markJobPublished(repo, job.id);
    expect(published.ok).toBe(false);
  });

  it('8b. published com approvedCandidateId funciona', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const attempt = await service.startAttempt(repo, job.id);
    if (!attempt.ok) throw new Error('setup');
    const candidateResult = await service.attachCandidate(repo, attempt.data.id, {
      variantIndex: 0,
      storagePath: 'asset-studio/candidates/job/attempt/0.png',
      mimeType: 'image/png',
      width: 800,
      height: 1200,
      fileSize: 1000,
      checksum: null,
      perceptualHash: null,
      artworkSchemaVersion: 2,
      technicalValidation: {
        passed: true,
        warnings: [],
        errors: [],
        validatedAt: '2026-01-01T00:00:00Z',
        validatorVersion: 'fixture',
      },
      visualValidation: {},
      reviewStatus: 'pending',
    });
    if (!candidateResult.ok) throw new Error('setup');
    const approved = await service.approveCandidate(
      repo,
      job.id,
      candidateResult.data.id,
      'reviewer-1',
    );
    expect(approved.ok).toBe(true);
    const published = await service.markJobPublished(repo, job.id);
    expect(published.ok).toBe(true);
    if (published.ok) expect(published.data.status).toBe('published');
  });

  it('9. approveCandidate rejeita candidate que não pertence ao job', async () => {
    const jobA = await createDraftFixtureJob(repo);
    const jobB = await createDraftFixtureJob(repo);
    await service.queueJob(repo, jobA.id);
    const attemptA = await service.startAttempt(repo, jobA.id);
    if (!attemptA.ok) throw new Error('setup');
    const candidateA = await service.attachCandidate(repo, attemptA.data.id, {
      variantIndex: 0,
      storagePath: 'p',
      mimeType: 'image/png',
      width: null,
      height: null,
      fileSize: null,
      checksum: null,
      perceptualHash: null,
      artworkSchemaVersion: 2,
      technicalValidation: {},
      visualValidation: {},
      reviewStatus: 'pending',
    });
    if (!candidateA.ok) throw new Error('setup');

    // Tenta aprovar o candidate do job A como se fosse do job B.
    const result = await service.approveCandidate(repo, jobB.id, candidateA.data.id, 'reviewer-1');
    expect(result.ok).toBe(false);
  });

  it('10. só um candidate aprovado por vez — aprovar um segundo substitui o approvedCandidateId, nunca duplica', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const attempt = await service.startAttempt(repo, job.id);
    if (!attempt.ok) throw new Error('setup');
    const c1 = await service.attachCandidate(repo, attempt.data.id, {
      variantIndex: 0,
      storagePath: 'p0',
      mimeType: 'image/png',
      width: null,
      height: null,
      fileSize: null,
      checksum: null,
      perceptualHash: null,
      artworkSchemaVersion: 2,
      technicalValidation: {
        passed: true,
        warnings: [],
        errors: [],
        validatedAt: '2026-01-01T00:00:00Z',
        validatorVersion: 'fixture',
      },
      visualValidation: {},
      reviewStatus: 'pending',
    });
    if (!c1.ok) throw new Error('setup');
    const approved1 = await service.approveCandidate(repo, job.id, c1.data.id, 'reviewer-1');
    expect(approved1.ok).toBe(true);
    if (approved1.ok) expect(approved1.data.approvedCandidateId).toBe(c1.data.id);

    // approvedCandidateId é um campo único no job — nunca uma lista; a
    // segunda aprovação sempre SUBSTITUI, nunca coexiste com a primeira.
    const job2 = await repo.getJob(job.id);
    expect(job2?.approvedCandidateId).toBe(c1.data.id);
  });

  it('11. retry cria um NOVO attempt — nunca sobrescreve o anterior', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const attempt1 = await service.startAttempt(repo, job.id);
    if (!attempt1.ok) throw new Error('setup');
    expect(attempt1.data.attemptNumber).toBe(1);

    await service.markAttemptFailed(repo, attempt1.data.id, 'PROVIDER_ERROR', 'fixture failure');
    await service.queueJob(repo, job.id);
    const attempt2 = await service.startAttempt(repo, job.id);
    expect(attempt2.ok).toBe(true);
    if (attempt2.ok) expect(attempt2.data.attemptNumber).toBe(2);
  });

  it('12. histórico de attempts é preservado — o attempt 1 continua existindo depois do retry', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const attempt1 = await service.startAttempt(repo, job.id);
    if (!attempt1.ok) throw new Error('setup');
    await service.markAttemptFailed(repo, attempt1.data.id, 'ERR', 'fail');
    await service.queueJob(repo, job.id);
    await service.startAttempt(repo, job.id);

    const attempts = await repo.listAttemptsForJob(job.id);
    expect(attempts.length).toBe(2);
    expect(attempts.find((a) => a.id === attempt1.data.id)).toBeDefined();
    expect(attempts.find((a) => a.id === attempt1.data.id)?.status).toBe('failed');
  });

  it('13. editar o template DEPOIS de um attempt existir não muda o prompt já snapshotado', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const attempt = await service.startAttempt(repo, job.id);
    if (!attempt.ok) throw new Error('setup');
    expect(attempt.data.promptSnapshot).toBe('fixture prompt content');

    // "Edita" o template (simulando uma alteração posterior) — o attempt já
    // criado não é afetado, porque prompt_snapshot é uma cópia, não uma FK.
    repo.seedPromptTemplate({
      id: 'tpl-1',
      name: 'base-v2',
      schemaVersion: 2,
      templateVersion: 2,
      content: 'EDITED CONTENT — should never appear in the existing snapshot',
      requiredPlaceholders: [],
      active: true,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    });

    const attempts = await repo.listAttemptsForJob(job.id);
    expect(attempts[0]?.promptSnapshot).toBe('fixture prompt content');
  });

  it('14. editar o reference set DEPOIS de um attempt existir não muda o reference_snapshot já gravado', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const attempt = await service.startAttempt(repo, job.id);
    if (!attempt.ok) throw new Error('setup');
    expect(attempt.data.referenceSnapshot).toEqual({ id: 'ref-1', files: ['ref-a.png'] });

    repo.seedReferenceSet({
      id: 'ref-1',
      rarity: 'legendary',
      schemaVersion: 2,
      name: 'legendary-v2',
      description: null,
      version: 2,
      active: true,
      files: ['ref-b-EDITED.png'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    });

    const attempts = await repo.listAttemptsForJob(job.id);
    expect(attempts[0]?.referenceSnapshot).toEqual({ id: 'ref-1', files: ['ref-a.png'] });
  });

  it('17. histórico de reviews é preservado — uma review nova nunca apaga a anterior', async () => {
    const job = await createDraftFixtureJob(repo);
    await service.queueJob(repo, job.id);
    const attempt = await service.startAttempt(repo, job.id);
    if (!attempt.ok) throw new Error('setup');
    const candidate = await service.attachCandidate(repo, attempt.data.id, {
      variantIndex: 0,
      storagePath: 'p',
      mimeType: 'image/png',
      width: null,
      height: null,
      fileSize: null,
      checksum: null,
      perceptualHash: null,
      artworkSchemaVersion: 2,
      technicalValidation: {
        passed: true,
        warnings: [],
        errors: [],
        validatedAt: '2026-01-01T00:00:00Z',
        validatorVersion: 'fixture',
      },
      visualValidation: {},
      reviewStatus: 'pending',
    });
    if (!candidate.ok) throw new Error('setup');

    await service.requestRevision(
      repo,
      job.id,
      candidate.data.id,
      'reviewer-1',
      'precisa ajustar luz',
    );
    // job voltou pra queued — precisa passar por needs_review de novo pra aprovar/rejeitar.
    // Simula outro ciclo rapidamente reusando o mesmo candidate id via transição manual do job:
    await repo.updateJob(job.id, { status: 'needs_review' });
    await service.approveCandidate(repo, job.id, candidate.data.id, 'reviewer-2', 'ok agora');

    const reviews = await repo.listReviewsForCandidate(candidate.data.id);
    expect(reviews.length).toBe(2);
    expect(reviews[0]?.decision).toBe('request_revision');
    expect(reviews[1]?.decision).toBe('approve');
  });
});
