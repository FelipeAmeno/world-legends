import type {
  GenerateArtworkRequest,
  GeneratedArtworkCandidate,
  ImageGenerationProvider,
} from '@/lib/asset-studio/image-provider';
import { ProviderError } from '@/lib/asset-studio/image-provider';
import { generateJobAttempt } from '@/lib/asset-studio/generation-orchestrator';
import { InMemoryAssetStudioRepository } from '@/lib/asset-studio/in-memory-repository';
import { FakeImageProvider } from '@/lib/asset-studio/providers/fake-image-provider';
import * as service from '@/lib/asset-studio/service';
import { InMemoryAssetStudioStorage } from '@/lib/asset-studio/storage';
import { beforeEach, describe, expect, it } from 'vitest';

function seedFixtures(
  repo: InMemoryAssetStudioRepository,
  overrides: { templateRequiredPlaceholders?: string[]; templateActive?: boolean } = {},
) {
  repo.seedPromptTemplate({
    id: 'tpl-1',
    name: 'base-v2',
    schemaVersion: 2,
    templateVersion: 1,
    content: 'Player {{DISPLAY_NAME}} — {{RARITY}} — {{ARTWORK_PRESET_ID}} — {{IDENTITY_NOTES}} — {{REFERENCE_SET}}',
    requiredPlaceholders: overrides.templateRequiredPlaceholders ?? [],
    active: overrides.templateActive ?? true,
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
    files: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  });
}

async function createQueuedFixtureJob(
  repo: InMemoryAssetStudioRepository,
  overrides: { requestedVariants?: number; identityNotes?: string } = {},
) {
  const result = await service.createJob(
    repo,
    {
      artworkPresetId: 'wl-fixture-001',
      playerId: 'fixture-player',
      rarity: 'legendary',
      promptTemplateId: 'tpl-1',
      referenceSetId: 'ref-1',
      requestedVariants: overrides.requestedVariants ?? 2,
      identityNotes: overrides.identityNotes,
    },
    'user-1',
  );
  if (!result.ok) throw new Error(`fixture setup falhou: ${result.error}`);
  await service.queueJob(repo, result.data.id);
  const job = await repo.getJob(result.data.id);
  if (!job) throw new Error('setup');
  return job;
}

class ThrowingProvider implements ImageGenerationProvider {
  readonly name = 'throwing-fixture';
  async generate(): Promise<GeneratedArtworkCandidate[]> {
    throw new ProviderError('provider-invalid-response', 'fixture provider failure', false);
  }
}

class PartiallyInvalidProvider implements ImageGenerationProvider {
  readonly name = 'partial-fixture';
  async generate(request: GenerateArtworkRequest): Promise<GeneratedArtworkCandidate[]> {
    const good = await new FakeImageProvider().generate(request);
    return [
      good[0] as GeneratedArtworkCandidate,
      { variantIndex: 1, bytes: new Uint8Array([1, 2, 3]), mimeType: 'image/png', providerMetadata: {} },
    ];
  }
}

describe('Sprint 43B — generation-orchestrator (orquestração real via repositório/storage/provedor in-memory)', () => {
  let repo: InMemoryAssetStudioRepository;
  let storage: InMemoryAssetStudioStorage;

  beforeEach(() => {
    repo = new InMemoryAssetStudioRepository();
    storage = new InMemoryAssetStudioStorage();
    seedFixtures(repo);
  });

  it('67. geração bem-sucedida cria attempt + N candidates, transiciona o job pra needs_review, nunca aprova/publica automaticamente', async () => {
    const job = await createQueuedFixtureJob(repo, { requestedVariants: 2 });
    const result = await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidateIds).toHaveLength(2);

    const updatedJob = await repo.getJob(job.id);
    expect(updatedJob?.status).toBe('needs_review');
    expect(updatedJob?.approvedCandidateId).toBeNull();

    const candidates = await repo.listCandidatesForJob(job.id);
    expect(candidates).toHaveLength(2);
    for (const candidate of candidates) {
      expect(candidate.reviewStatus).toBe('pending');
      expect(candidate.storagePath).toMatch(
        new RegExp(`^asset-studio/candidates/${job.id}/${result.attemptId}/\\d+\\.png$`),
      );
      const stored = await storage.getObject(candidate.storagePath);
      expect(stored).not.toBeNull();
    }
  });

  it('68. job fora de "queued" (ex.: draft) falha fechado — nenhum attempt é criado', async () => {
    const created = await service.createJob(
      repo,
      {
        artworkPresetId: 'wl-fixture-002',
        playerId: 'fixture-player-2',
        rarity: 'legendary',
        promptTemplateId: 'tpl-1',
        referenceSetId: 'ref-1',
        requestedVariants: 1,
      },
      'user-1',
    );
    if (!created.ok) throw new Error('setup');
    const result = await generateJobAttempt(repo, storage, new FakeImageProvider(), created.data.id);
    expect(result.ok).toBe(false);
    expect(await repo.listAttemptsForJob(created.data.id)).toHaveLength(0);
    expect((await repo.getJob(created.data.id))?.status).toBe('draft');
  });

  it('69. prompt template inativo (desativado depois de criado) falha fechado ANTES de reivindicar o job — job continua queued', async () => {
    const job = await createQueuedFixtureJob(repo);
    repo.seedPromptTemplate({
      id: 'tpl-1',
      name: 'base-v2',
      schemaVersion: 2,
      templateVersion: 2,
      content: 'x {{DISPLAY_NAME}}',
      requiredPlaceholders: [],
      active: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    });
    const result = await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe('configuration-error');
    expect((await repo.getJob(job.id))?.status).toBe('queued');
    expect(await repo.listAttemptsForJob(job.id)).toHaveLength(0);
  });

  it('70. reference set incompatível (raridade mudou) falha fechado ANTES de reivindicar o job', async () => {
    const job = await createQueuedFixtureJob(repo);
    repo.seedReferenceSet({
      id: 'ref-1',
      rarity: 'common',
      schemaVersion: 2,
      name: 'legendary-v2',
      description: null,
      version: 2,
      active: true,
      files: [],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
    });
    const result = await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    expect(result.ok).toBe(false);
    expect((await repo.getJob(job.id))?.status).toBe('queued');
    expect(await repo.listAttemptsForJob(job.id)).toHaveLength(0);
  });

  it('71. arquivo de referência obrigatório ausente falha fechado ANTES de reivindicar o job', async () => {
    repo.seedReferenceSet({
      id: 'ref-1',
      rarity: 'legendary',
      schemaVersion: 2,
      name: 'legendary-v2',
      description: null,
      version: 1,
      active: true,
      files: ['does-not-exist.png'],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    const job = await createQueuedFixtureJob(repo);
    const result = await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    expect(result.ok).toBe(false);
    expect((await repo.getJob(job.id))?.status).toBe('queued');
  });

  it('72. placeholder obrigatório do template sem valor no job falha fechado ANTES de reivindicar o job', async () => {
    seedFixtures(repo, { templateRequiredPlaceholders: ['IDENTITY_NOTES'] });
    const job = await createQueuedFixtureJob(repo); // sem identityNotes
    const result = await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('IDENTITY_NOTES');
    expect((await repo.getJob(job.id))?.status).toBe('queued');
  });

  it('73. placeholder obrigatório satisfeito permite geração e o prompt final fica snapshotado no attempt', async () => {
    seedFixtures(repo, { templateRequiredPlaceholders: ['IDENTITY_NOTES'] });
    const job = await createQueuedFixtureJob(repo, { identityNotes: 'cabelo cacheado, uniforme azul' });
    const result = await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const attempts = await repo.listAttemptsForJob(job.id);
    expect(attempts[0]?.promptSnapshot).toContain('cabelo cacheado, uniforme azul');
  });

  it('74. duas gerações concorrentes pro mesmo job — só uma reivindica o job, a outra falha, nunca duplica attempt/candidates', async () => {
    const job = await createQueuedFixtureJob(repo);
    const [r1, r2] = await Promise.all([
      generateJobAttempt(repo, storage, new FakeImageProvider(), job.id),
      generateJobAttempt(repo, storage, new FakeImageProvider(), job.id),
    ]);
    const results = [r1, r2];
    const succeeded = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);
    expect(succeeded).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const attempts = await repo.listAttemptsForJob(job.id);
    expect(attempts).toHaveLength(1);
    const candidates = await repo.listCandidatesForJob(job.id);
    expect(candidates).toHaveLength(2); // requestedVariants padrão do fixture
  });

  it('75. falha DEPOIS de reivindicar o job marca o attempt failed e transiciona o job pra failed — nunca fica preso em generating', async () => {
    const job = await createQueuedFixtureJob(repo);
    const result = await generateJobAttempt(repo, storage, new ThrowingProvider(), job.id);
    expect(result.ok).toBe(false);

    const updatedJob = await repo.getJob(job.id);
    expect(updatedJob?.status).toBe('failed');
    expect(updatedJob?.status).not.toBe('generating');

    const attempts = await repo.listAttemptsForJob(job.id);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]?.status).toBe('failed');
    expect(attempts[0]?.errorCode).toBe('provider-invalid-response');
  });

  it('76. retry depois de uma falha cria um NOVO attempt (número incrementado), preservando o attempt falho no histórico', async () => {
    const job = await createQueuedFixtureJob(repo);
    await generateJobAttempt(repo, storage, new ThrowingProvider(), job.id);
    await service.queueJob(repo, job.id);

    const retryResult = await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    expect(retryResult.ok).toBe(true);

    const attempts = await repo.listAttemptsForJob(job.id);
    expect(attempts).toHaveLength(2);
    expect(attempts[0]?.status).toBe('failed');
    expect(attempts[0]?.attemptNumber).toBe(1);
    expect(attempts[1]?.status).toBe('succeeded');
    expect(attempts[1]?.attemptNumber).toBe(2);
  });

  it('77. se QUALQUER variante retornada pelo provedor for inválida, o attempt inteiro falha — nenhum candidate parcial é persistido', async () => {
    const job = await createQueuedFixtureJob(repo, { requestedVariants: 2 });
    const result = await generateJobAttempt(repo, storage, new PartiallyInvalidProvider(), job.id);
    expect(result.ok).toBe(false);

    const candidates = await repo.listCandidatesForJob(job.id);
    expect(candidates).toHaveLength(0);
    expect((await repo.getJob(job.id))?.status).toBe('failed');
  });

  it('78. metadata do provedor é preservada no attempt sem nenhum campo de segredo/chave', async () => {
    const job = await createQueuedFixtureJob(repo, { requestedVariants: 1 });
    const result = await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    expect(result.ok).toBe(true);
    const attempts = await repo.listAttemptsForJob(job.id);
    const usage = JSON.stringify(attempts[0]?.usageMetadata ?? {});
    expect(usage).not.toMatch(/apiKey|api_key|authorization|x-goog-api-key/i);
    expect(usage).toContain('durationMs');
  });

  it('79. nenhum caminho de candidate gerado escreve fora de "asset-studio/candidates/" (nunca em source/artworks)', async () => {
    const job = await createQueuedFixtureJob(repo, { requestedVariants: 1 });
    await generateJobAttempt(repo, storage, new FakeImageProvider(), job.id);
    const candidates = await repo.listCandidatesForJob(job.id);
    for (const candidate of candidates) {
      expect(candidate.storagePath).toMatch(/^asset-studio\/candidates\//);
      expect(candidate.storagePath).not.toContain('source/artworks');
    }
  });
});
