/**
 * lib/asset-studio/in-memory-repository.ts — Sprint 43A (Asset Studio Foundation)
 *
 * Fake in-memory do `AssetStudioRepository` — mesmo padrão de
 * `InMemoryProfileRepository`/`InMemoryRankingRepository` em
 * `packages/db/tests/repositories/contract.test.ts`. Usado por TODOS os
 * testes do service layer; o adapter Supabase real
 * (`supabase-repository.ts`) nunca é exercitado em teste unitário —
 * mesma convenção "Fase 6" já documentada no repo pros outros domínios.
 */

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

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export class InMemoryAssetStudioRepository implements AssetStudioRepository {
  private jobs = new Map<string, AssetGenerationJob>();
  private attempts = new Map<string, AssetGenerationAttempt>();
  private candidates = new Map<string, AssetCandidate>();
  private reviews = new Map<string, AssetReview>();
  private referenceSets = new Map<string, AssetReferenceSet>();
  private promptTemplates = new Map<string, AssetPromptTemplate>();

  // ─── Seeding helpers (test-only) ─────────────────────────────────────────

  seedReferenceSet(set: AssetReferenceSet): void {
    this.referenceSets.set(set.id, set);
  }

  seedPromptTemplate(template: AssetPromptTemplate): void {
    this.promptTemplates.set(template.id, template);
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────────

  async insertJob(input: InsertJobInput): Promise<AssetGenerationJob> {
    const now = new Date().toISOString();
    const job: AssetGenerationJob = {
      ...input,
      id: nextId('job'),
      status: input.status ?? 'draft',
      approvedCandidateId: null,
      createdAt: now,
      updatedAt: now,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      errorCode: null,
      errorMessage: null,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  async getJob(id: string): Promise<AssetGenerationJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async updateJob(id: string, patch: Partial<AssetGenerationJob>): Promise<AssetGenerationJob> {
    const existing = this.jobs.get(id);
    if (!existing) throw new Error(`asset_generation_jobs: job ${id} não encontrado`);
    const updated: AssetGenerationJob = {
      ...existing,
      ...patch,
      id: existing.id,
      updatedAt: new Date().toISOString(),
    };
    this.jobs.set(id, updated);
    return updated;
  }

  async listJobs(filter?: { status?: AssetGenerationJob['status'] }): Promise<
    AssetGenerationJob[]
  > {
    const all = [...this.jobs.values()];
    const filtered = filter?.status ? all.filter((j) => j.status === filter.status) : all;
    return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async claimJobForGenerating(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'queued') return false;
    // JS é single-threaded — checar-e-escrever aqui é atômico o bastante
    // pra teste; o adapter Supabase real usa um UPDATE...WHERE condicional.
    this.jobs.set(jobId, {
      ...job,
      status: 'generating',
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return true;
  }

  // ─── Attempts ─────────────────────────────────────────────────────────────

  async insertAttempt(input: InsertAttemptInput): Promise<AssetGenerationAttempt> {
    const attempt: AssetGenerationAttempt = {
      ...input,
      id: nextId('attempt'),
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      errorCode: null,
      errorMessage: null,
    };
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  async updateAttempt(
    id: string,
    patch: Partial<AssetGenerationAttempt>,
  ): Promise<AssetGenerationAttempt> {
    const existing = this.attempts.get(id);
    if (!existing) throw new Error(`asset_generation_attempts: attempt ${id} não encontrado`);
    const updated = { ...existing, ...patch, id: existing.id };
    this.attempts.set(id, updated);
    return updated;
  }

  async listAttemptsForJob(jobId: string): Promise<AssetGenerationAttempt[]> {
    return [...this.attempts.values()]
      .filter((a) => a.jobId === jobId)
      .sort((a, b) => a.attemptNumber - b.attemptNumber);
  }

  async getLatestAttemptNumber(jobId: string): Promise<number> {
    const attempts = await this.listAttemptsForJob(jobId);
    return attempts.length === 0 ? 0 : Math.max(...attempts.map((a) => a.attemptNumber));
  }

  // ─── Candidates ───────────────────────────────────────────────────────────

  async insertCandidate(input: InsertCandidateInput): Promise<AssetCandidate> {
    const candidate: AssetCandidate = {
      ...input,
      id: nextId('candidate'),
      createdAt: new Date().toISOString(),
    };
    this.candidates.set(candidate.id, candidate);
    return candidate;
  }

  async getCandidate(id: string): Promise<AssetCandidate | null> {
    return this.candidates.get(id) ?? null;
  }

  async updateCandidate(id: string, patch: Partial<AssetCandidate>): Promise<AssetCandidate> {
    const existing = this.candidates.get(id);
    if (!existing) throw new Error(`asset_candidates: candidate ${id} não encontrado`);
    const updated = { ...existing, ...patch, id: existing.id };
    this.candidates.set(id, updated);
    return updated;
  }

  async listCandidatesForJob(jobId: string): Promise<AssetCandidate[]> {
    return [...this.candidates.values()].filter((c) => c.jobId === jobId);
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────

  async insertReview(input: InsertReviewInput): Promise<AssetReview> {
    const review: AssetReview = {
      ...input,
      id: nextId('review'),
      createdAt: new Date().toISOString(),
    };
    this.reviews.set(review.id, review);
    return review;
  }

  async listReviewsForCandidate(candidateId: string): Promise<AssetReview[]> {
    return [...this.reviews.values()]
      .filter((r) => r.candidateId === candidateId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  // ─── Reference sets / prompt templates ────────────────────────────────────

  async getReferenceSet(id: string): Promise<AssetReferenceSet | null> {
    return this.referenceSets.get(id) ?? null;
  }

  async getActiveReferenceSet(
    rarity: string,
    schemaVersion: ArtworkSchemaVersion,
  ): Promise<AssetReferenceSet | null> {
    return (
      [...this.referenceSets.values()].find(
        (s) => s.rarity === rarity && s.schemaVersion === schemaVersion && s.active,
      ) ?? null
    );
  }

  async listReferenceSets(): Promise<AssetReferenceSet[]> {
    return [...this.referenceSets.values()];
  }

  async getPromptTemplate(id: string): Promise<AssetPromptTemplate | null> {
    return this.promptTemplates.get(id) ?? null;
  }

  async listPromptTemplates(): Promise<AssetPromptTemplate[]> {
    return [...this.promptTemplates.values()];
  }
}
