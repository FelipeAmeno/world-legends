import type { AssetPromptTemplate, AssetReferenceSet } from '@/lib/asset-studio/domain-types';
import {
  type CreateDraftJobInput,
  validateCreateDraftJob,
} from '@/lib/asset-studio/job-validation';
import {
  JOB_STATUS_TRANSITIONS,
  assertJobStatusTransition,
  canTransitionJobStatus,
  isTerminalJobStatus,
} from '@/lib/asset-studio/status-transitions';
import {
  UnsafeStoragePathError,
  buildApprovedStoragePath,
  buildCandidateStoragePath,
  buildPublishedStoragePath,
} from '@/lib/asset-studio/storage-paths';
import { describe, expect, it } from 'vitest';

const ACTIVE_TEMPLATE: AssetPromptTemplate = {
  id: 'tpl-1',
  name: 'base-v2',
  schemaVersion: 2,
  templateVersion: 1,
  content: 'template content',
  requiredPlaceholders: [],
  active: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const ACTIVE_REFERENCE_SET: AssetReferenceSet = {
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
};

function baseInput(overrides: Partial<CreateDraftJobInput> = {}): CreateDraftJobInput {
  return {
    artworkPresetId: 'wl-fixture-001',
    playerId: 'fixture-player',
    rarity: 'legendary',
    promptTemplateId: 'tpl-1',
    referenceSetId: 'ref-1',
    requestedVariants: 2,
    ...overrides,
  };
}

describe('Sprint 43A — job-validation (draft job creation contract)', () => {
  it('1. criação de draft job válida passa', () => {
    const result = validateCreateDraftJob(baseInput(), ACTIVE_TEMPLATE, ACTIVE_REFERENCE_SET);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.artworkSchemaVersion).toBe(2);
  });

  it('2. artworkSchemaVersion desconhecido é rejeitado', () => {
    const result = validateCreateDraftJob(
      baseInput({ artworkSchemaVersion: 3 as never }),
      ACTIVE_TEMPLATE,
      ACTIVE_REFERENCE_SET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('desconhecido'))).toBe(true);
  });

  it('3. template inativo é rejeitado', () => {
    const result = validateCreateDraftJob(
      baseInput(),
      { ...ACTIVE_TEMPLATE, active: false },
      ACTIVE_REFERENCE_SET,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('não está ativo'))).toBe(true);
  });

  it('4. reference set incompatível (raridade diferente) é rejeitado', () => {
    const result = validateCreateDraftJob(baseInput(), ACTIVE_TEMPLATE, {
      ...ACTIVE_REFERENCE_SET,
      rarity: 'common',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('raridade'))).toBe(true);
  });

  it('4b. reference set de schema version incompatível é rejeitado', () => {
    const result = validateCreateDraftJob(baseInput(), ACTIVE_TEMPLATE, {
      ...ACTIVE_REFERENCE_SET,
      schemaVersion: 1,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((e) => e.includes('versão de schema'))).toBe(true);
  });

  it('5. requestedVariants fora do range seguro é rejeitado', () => {
    const tooMany = validateCreateDraftJob(
      baseInput({ requestedVariants: 5 }),
      ACTIVE_TEMPLATE,
      ACTIVE_REFERENCE_SET,
    );
    const tooFew = validateCreateDraftJob(
      baseInput({ requestedVariants: 0 }),
      ACTIVE_TEMPLATE,
      ACTIVE_REFERENCE_SET,
    );
    expect(tooMany.ok).toBe(false);
    expect(tooFew.ok).toBe(false);
  });

  it('promptTemplateId/referenceSetId não encontrados são rejeitados', () => {
    const result = validateCreateDraftJob(baseInput(), null, null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('promptTemplateId'))).toBe(true);
      expect(result.errors.some((e) => e.includes('referenceSetId'))).toBe(true);
    }
  });
});

describe('Sprint 43A — status-transitions (contrato único de transição de job)', () => {
  it('6. transições válidas são aceitas', () => {
    expect(canTransitionJobStatus('draft', 'queued')).toBe(true);
    expect(canTransitionJobStatus('queued', 'generating')).toBe(true);
    expect(canTransitionJobStatus('needs_review', 'approved')).toBe(true);
    expect(canTransitionJobStatus('approved', 'published')).toBe(true);
    expect(assertJobStatusTransition('draft', 'queued')).toEqual({ ok: true });
  });

  it('7. transições inválidas falham', () => {
    expect(canTransitionJobStatus('draft', 'published')).toBe(false);
    expect(canTransitionJobStatus('published', 'draft')).toBe(false);
    expect(canTransitionJobStatus('generating', 'cancelled')).toBe(false);
    const result = assertJobStatusTransition('draft', 'published');
    expect(result.ok).toBe(false);
  });

  it('status terminais (published/cancelled) não têm nenhuma transição de saída', () => {
    expect(JOB_STATUS_TRANSITIONS.published).toEqual([]);
    expect(JOB_STATUS_TRANSITIONS.cancelled).toEqual([]);
    expect(isTerminalJobStatus('published')).toBe(true);
    expect(isTerminalJobStatus('cancelled')).toBe(true);
    expect(isTerminalJobStatus('draft')).toBe(false);
  });

  it('transição pro mesmo status é sempre inválida', () => {
    expect(assertJobStatusTransition('draft', 'draft').ok).toBe(false);
  });
});

describe('Sprint 43A — storage-paths (staging, nunca em source/artworks; sem path traversal)', () => {
  it('15. caminho com segmento de path traversal é rejeitado', () => {
    expect(() => buildCandidateStoragePath('pending', '../../etc', 'attempt-1', 0)).toThrow(
      UnsafeStoragePathError,
    );
    expect(() => buildCandidateStoragePath('pending', 'job-1', '../secrets', 0)).toThrow(
      UnsafeStoragePathError,
    );
    expect(() => buildCandidateStoragePath('pending', 'job/1', 'attempt-1', 0)).toThrow(
      UnsafeStoragePathError,
    );
    expect(() => buildCandidateStoragePath('pending', 'job-1', 'attempt-1', 0, '../png')).toThrow(
      UnsafeStoragePathError,
    );
  });

  it('16. caminho válido é determinístico por job/attempt/variant (nunca nome de exibição)', () => {
    const path1 = buildCandidateStoragePath('candidates', 'job-1', 'attempt-1', 0);
    const path2 = buildCandidateStoragePath('candidates', 'job-1', 'attempt-1', 0);
    expect(path1).toBe(path2);
    expect(path1).toBe('asset-studio/candidates/job-1/attempt-1/0.png');
    expect(path1).not.toContain('Pelé');
  });

  it('nunca escreve em public/assets/cards/source/artworks — o prefixo é sempre "asset-studio/"', () => {
    expect(buildCandidateStoragePath('pending', 'j', 'a', 0)).toMatch(/^asset-studio\//);
    expect(buildApprovedStoragePath('j', 'c')).toMatch(/^asset-studio\/approved\//);
    expect(buildPublishedStoragePath('preset-1')).toMatch(/^asset-studio\/published\//);
    for (const path of [
      buildCandidateStoragePath('pending', 'j', 'a', 0),
      buildApprovedStoragePath('j', 'c'),
      buildPublishedStoragePath('preset-1'),
    ]) {
      expect(path).not.toContain('source/artworks');
    }
  });

  it('variantIndex negativo/não-inteiro é rejeitado', () => {
    expect(() => buildCandidateStoragePath('pending', 'j', 'a', -1)).toThrow(
      UnsafeStoragePathError,
    );
    expect(() => buildCandidateStoragePath('pending', 'j', 'a', 1.5)).toThrow(
      UnsafeStoragePathError,
    );
  });
});
