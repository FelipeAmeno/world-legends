import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateJobAttempt } from '@/lib/asset-studio/generation-orchestrator';
import { InMemoryAssetStudioRepository } from '@/lib/asset-studio/in-memory-repository';
import { FakeImageProvider } from '@/lib/asset-studio/providers/fake-image-provider';
import * as service from '@/lib/asset-studio/service';
import { InMemoryAssetStudioStorage } from '@/lib/asset-studio/storage';
import { beforeEach, describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

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
    files: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  });
}

async function createNeedsReviewJobWithCandidate(
  repo: InMemoryAssetStudioRepository,
  storage: InMemoryAssetStudioStorage,
) {
  const created = await service.createJob(
    repo,
    {
      artworkPresetId: 'wl-fixture-001',
      playerId: 'fixture-player',
      rarity: 'legendary',
      promptTemplateId: 'tpl-1',
      referenceSetId: 'ref-1',
      requestedVariants: 1,
    },
    'user-1',
  );
  if (!created.ok) throw new Error('setup');
  await service.queueJob(repo, created.data.id);
  const generated = await generateJobAttempt(
    repo,
    storage,
    new FakeImageProvider(),
    created.data.id,
  );
  if (!generated.ok) throw new Error(`setup: ${generated.error}`);
  const candidateId = generated.candidateIds[0] as string;
  return { jobId: created.data.id, candidateId };
}

describe('Sprint 43C — review workflow (validação técnica obrigatória, revisão auditável, publicação nunca automática)', () => {
  let repo: InMemoryAssetStudioRepository;
  let storage: InMemoryAssetStudioStorage;

  beforeEach(() => {
    repo = new InMemoryAssetStudioRepository();
    storage = new InMemoryAssetStudioStorage();
    seedFixtures(repo);
  });

  it('120. aprovar um candidate SEM validação técnica rodada falha explicitamente', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    const result = await service.approveCandidate(repo, jobId, candidateId, 'reviewer-1');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('validação técnica');
  });

  it('121. rodar a validação técnica e depois aprovar funciona; a validação fica persistida no candidate', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    const validated = await service.runTechnicalValidation(repo, storage, candidateId);
    expect(validated.ok).toBe(true);
    if (validated.ok) expect(validated.data.technicalValidation.passed).toBe(true);

    const approved = await service.approveCandidate(repo, jobId, candidateId, 'reviewer-1');
    expect(approved.ok).toBe(true);
  });

  it('122. rejeitar preserva o candidate (nunca apaga a imagem) e o histórico de reviews', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    const candidateBefore = await repo.getCandidate(candidateId);
    const rejected = await service.rejectCandidate(repo, jobId, candidateId, 'reviewer-1', 'ruim', [
      'incomplete-frame',
    ]);
    expect(rejected.ok).toBe(true);

    const candidateAfter = await repo.getCandidate(candidateId);
    expect(candidateAfter).not.toBeNull();
    expect(candidateAfter?.storagePath).toBe(candidateBefore?.storagePath);
    const stored = await storage.getObject(candidateAfter?.storagePath ?? '');
    expect(stored).not.toBeNull();

    const reviews = await repo.listReviewsForCandidate(candidateId);
    expect(reviews).toHaveLength(1);
    expect(reviews[0]?.decision).toBe('reject');
    expect(reviews[0]?.issueCodes).toEqual(['incomplete-frame']);
  });

  it('123. pedir revisão SEM notas nem issue codes falha', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    const result = await service.requestRevision(repo, jobId, candidateId, 'reviewer-1', null, []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('notas ou pelo menos um issue code');
  });

  it('123b. pedir revisão com só issue codes (sem notas) é suficiente', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    const result = await service.requestRevision(repo, jobId, candidateId, 'reviewer-1', null, [
      'watermark',
    ]);
    expect(result.ok).toBe(true);
  });

  it('124. reviews são append-only — cada nova decisão soma ao histórico, nunca substitui', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    await service.requestRevision(repo, jobId, candidateId, 'reviewer-1', 'ajustar');
    await repo.updateJob(jobId, { status: 'needs_review' }); // simula novo ciclo
    await service.runTechnicalValidation(repo, storage, candidateId);
    await service.approveCandidate(repo, jobId, candidateId, 'reviewer-2', 'ok agora');

    const reviews = await repo.listReviewsForCandidate(candidateId);
    expect(reviews).toHaveLength(2);
    expect(reviews[0]?.decision).toBe('request_revision');
    expect(reviews[1]?.decision).toBe('approve');
  });

  it('125. um issue code fora do vocabulário fechado é rejeitado antes de qualquer mutação', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    const result = await service.rejectCandidate(repo, jobId, candidateId, 'reviewer-1', null, [
      'not-a-real-issue-code',
    ]);
    expect(result.ok).toBe(false);
    const reviews = await repo.listReviewsForCandidate(candidateId);
    expect(reviews).toHaveLength(0);
  });

  it('126. candidate já aprovado/rejeitado não pode ser revisado de novo (nem pelo servidor, não só escondido na UI)', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    await service.runTechnicalValidation(repo, storage, candidateId);
    await service.approveCandidate(repo, jobId, candidateId, 'reviewer-1');

    // job.status agora é "approved" (não mais "needs_review") — reprovar deveria falhar.
    const result = await service.rejectCandidate(repo, jobId, candidateId, 'reviewer-2');
    expect(result.ok).toBe(false);
  });

  it('127. aprovação nunca publica sozinha — job fica "approved", nunca "published"', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    await service.runTechnicalValidation(repo, storage, candidateId);
    const approved = await service.approveCandidate(repo, jobId, candidateId, 'reviewer-1');
    expect(approved.ok).toBe(true);
    if (approved.ok) {
      expect(approved.data.status).toBe('approved');
      expect(approved.data.completedAt).toBeNull();
    }
  });

  it('128. só um candidate aprovado por vez — trocar de candidate exige o fluxo explícito (pedir revisão -> nova geração -> aprovar de novo), nunca uma segunda aprovação direta', async () => {
    const { jobId, candidateId } = await createNeedsReviewJobWithCandidate(repo, storage);
    await service.runTechnicalValidation(repo, storage, candidateId);
    await service.approveCandidate(repo, jobId, candidateId, 'reviewer-1');

    // Job já está "approved" — approveCandidate de novo (mesmo candidate ou outro) falha
    // pela transição de status (approved -> approved é sempre inválida), provando que
    // a substituição de candidate aprovado exige um fluxo explícito, nunca uma chamada direta.
    const secondApproval = await service.approveCandidate(repo, jobId, candidateId, 'reviewer-2');
    expect(secondApproval.ok).toBe(false);
  });

  it('129. nenhuma ação de review (approve/reject/revision) existe fora de lib/actions/asset-studio.ts sem checar autorização primeiro', () => {
    const src = readSource('lib/actions/asset-studio.ts');
    for (const fnName of [
      'approveCandidateAction',
      'rejectCandidateAction',
      'requestRevisionAction',
    ]) {
      const body = src.slice(src.indexOf(`export async function ${fnName}`));
      const nextExportIndex = body.indexOf('export async function', 1);
      const fnBody = nextExportIndex === -1 ? body : body.slice(0, nextExportIndex);
      expect(fnBody.indexOf('authorizeOrFail()')).toBeGreaterThan(-1);
      expect(fnBody.indexOf('authorizeOrFail()')).toBeLessThan(fnBody.indexOf('service.'));
    }
  });

  it('130. aprovar/rejeitar/validar nunca chama cards:build, nunca escreve em source/artworks, nunca chama Gemini', () => {
    for (const file of [
      'lib/asset-studio/service.ts',
      'lib/asset-studio/technical-validation.ts',
    ]) {
      const src = readSource(file);
      expect(src).not.toMatch(/cards:build|cards\.build|execSync|child_process/);
      expect(src).not.toContain('source/artworks');
      expect(src).not.toMatch(/generativelanguage\.googleapis\.com/);
    }
  });

  it('131. markJobPublished continua só marcando status/timestamp — nunca escreve arquivo, nunca roda cards:build/git/deploy', () => {
    const src = readSource('lib/asset-studio/service.ts');
    const fnBody = src.slice(
      src.indexOf('export async function markJobPublished'),
      src.indexOf('export async function listJobs'),
    );
    expect(fnBody).not.toMatch(/writeFileSync|execSync|child_process|git |cards:build/);
  });
});
