/**
 * lib/asset-studio/repository.ts — Sprint 43A (Asset Studio Foundation)
 *
 * Porta (interface) do repositório de Asset Studio — mesmo padrão de
 * "Ports & Adapters" já estabelecido em `packages/db/src/repositories/**`
 * (interface + implementação Supabase real + fake in-memory pra teste).
 * O service layer (`service.ts`) depende só desta interface, nunca de um
 * client Supabase concreto — isso é o que permite testar toda a lógica
 * de negócio (transições de status, aprovação, etc.) sem tocar banco
 * nenhum, igual `packages/db/tests/repositories/contract.test.ts` faz
 * pros repositórios de perfil/ranking.
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

export type InsertJobInput = Omit<
  AssetGenerationJob,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'startedAt'
  | 'completedAt'
  | 'failedAt'
  | 'errorCode'
  | 'errorMessage'
  | 'approvedCandidateId'
  | 'status'
> & { status?: AssetGenerationJob['status'] };

export type InsertAttemptInput = Omit<
  AssetGenerationAttempt,
  'id' | 'createdAt' | 'startedAt' | 'completedAt' | 'failedAt' | 'errorCode' | 'errorMessage'
>;

export type InsertCandidateInput = Omit<AssetCandidate, 'id' | 'createdAt'>;

export type InsertReviewInput = Omit<AssetReview, 'id' | 'createdAt'>;

export interface AssetStudioRepository {
  // Jobs
  insertJob(input: InsertJobInput): Promise<AssetGenerationJob>;
  getJob(id: string): Promise<AssetGenerationJob | null>;
  updateJob(id: string, patch: Partial<AssetGenerationJob>): Promise<AssetGenerationJob>;
  listJobs(filter?: { status?: AssetGenerationJob['status'] }): Promise<AssetGenerationJob[]>;

  // Attempts
  insertAttempt(input: InsertAttemptInput): Promise<AssetGenerationAttempt>;
  updateAttempt(
    id: string,
    patch: Partial<AssetGenerationAttempt>,
  ): Promise<AssetGenerationAttempt>;
  listAttemptsForJob(jobId: string): Promise<AssetGenerationAttempt[]>;
  getLatestAttemptNumber(jobId: string): Promise<number>;

  // Candidates
  insertCandidate(input: InsertCandidateInput): Promise<AssetCandidate>;
  getCandidate(id: string): Promise<AssetCandidate | null>;
  updateCandidate(id: string, patch: Partial<AssetCandidate>): Promise<AssetCandidate>;
  listCandidatesForJob(jobId: string): Promise<AssetCandidate[]>;

  // Reviews
  insertReview(input: InsertReviewInput): Promise<AssetReview>;
  listReviewsForCandidate(candidateId: string): Promise<AssetReview[]>;

  // Reference sets / prompt templates (read-only from the service layer's perspective in this sprint)
  getReferenceSet(id: string): Promise<AssetReferenceSet | null>;
  getActiveReferenceSet(
    rarity: string,
    schemaVersion: ArtworkSchemaVersion,
  ): Promise<AssetReferenceSet | null>;
  listReferenceSets(): Promise<AssetReferenceSet[]>;

  getPromptTemplate(id: string): Promise<AssetPromptTemplate | null>;
  listPromptTemplates(): Promise<AssetPromptTemplate[]>;
}
