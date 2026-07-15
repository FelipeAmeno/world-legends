import {
  canPublishJob,
  canReviewCandidate,
  candidateSectionLabel,
} from '@/lib/asset-studio/ui-eligibility';
import { describe, expect, it } from 'vitest';

describe('Sprint 43B — ui-eligibility (regressão pós-smoke-test 2026-07-15: botões nunca incondicionais)', () => {
  it('87. canPublishJob só é true com status "approved" E approvedCandidateId presente', () => {
    expect(canPublishJob({ status: 'approved', approvedCandidateId: 'c1' })).toBe(true);
    expect(canPublishJob({ status: 'approved', approvedCandidateId: null })).toBe(false);
    expect(canPublishJob({ status: 'needs_review', approvedCandidateId: 'c1' })).toBe(false);
  });

  it('88. um job já publicado nunca mostra a ação de publicar de novo', () => {
    expect(canPublishJob({ status: 'published', approvedCandidateId: 'c1' })).toBe(false);
  });

  it('89. canReviewCandidate só é true com job "needs_review" E candidate "pending"', () => {
    expect(canReviewCandidate({ status: 'needs_review' }, { reviewStatus: 'pending' })).toBe(true);
    expect(canReviewCandidate({ status: 'needs_review' }, { reviewStatus: 'approved' })).toBe(
      false,
    );
    expect(canReviewCandidate({ status: 'generating' }, { reviewStatus: 'pending' })).toBe(false);
    expect(canReviewCandidate({ status: 'published' }, { reviewStatus: 'pending' })).toBe(false);
  });

  it('90. um candidate já aprovado/rejeitado nunca mostra os botões de review de novo', () => {
    expect(canReviewCandidate({ status: 'needs_review' }, { reviewStatus: 'approved' })).toBe(
      false,
    );
    expect(canReviewCandidate({ status: 'needs_review' }, { reviewStatus: 'rejected' })).toBe(
      false,
    );
  });

  it('91. candidateSectionLabel reflete o estado real, nunca um texto fixo', () => {
    expect(candidateSectionLabel({ status: 'needs_review', approvedCandidateId: null })).toBe(
      'staging, não aprovado',
    );
    expect(candidateSectionLabel({ status: 'approved', approvedCandidateId: 'c1' })).toBe(
      'aprovado, aguardando publicação',
    );
    expect(candidateSectionLabel({ status: 'published', approvedCandidateId: 'c1' })).toBe(
      'publicado',
    );
  });
});
