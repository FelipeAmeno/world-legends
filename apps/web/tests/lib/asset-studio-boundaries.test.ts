import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkAssetStudioAuthorization } from '@/lib/asset-studio/authorization';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

describe('Sprint 43A — authorization (allowlist, fail-closed)', () => {
  const originalEnv = process.env.ASSET_STUDIO_ALLOWED_EMAILS;

  beforeEach(() => {
    process.env.ASSET_STUDIO_ALLOWED_EMAILS = 'ops@worldlegends.test, artist@worldlegends.test';
  });

  afterEach(() => {
    // `= undefined` coagiria pra string "undefined" em process.env — delete é o correto aqui.
    // biome-ignore lint/performance/noDelete: process.env, não um objeto hot-path
    if (originalEnv === undefined) delete process.env.ASSET_STUDIO_ALLOWED_EMAILS;
    else process.env.ASSET_STUDIO_ALLOWED_EMAILS = originalEnv;
  });

  it('18. usuário deslogado (null) não pode acessar', () => {
    const result = checkAssetStudioAuthorization(null);
    expect(result.authorized).toBe(false);
  });

  it('19. usuário autenticado mas fora da allowlist não pode mutar/acessar', () => {
    const result = checkAssetStudioAuthorization({ email: 'random-player@worldlegends.test' });
    expect(result.authorized).toBe(false);
  });

  it('20. usuário interno autorizado (na allowlist) pode acessar', () => {
    const result = checkAssetStudioAuthorization({ email: 'ops@worldlegends.test' });
    expect(result.authorized).toBe(true);
  });

  it('allowlist é case-insensitive e tolera espaços na env var', () => {
    const result = checkAssetStudioAuthorization({ email: 'ARTIST@worldlegends.test' });
    expect(result.authorized).toBe(true);
  });

  it('fail-closed: ASSET_STUDIO_ALLOWED_EMAILS ausente/vazio nega todo mundo, mesmo autenticado', () => {
    process.env.ASSET_STUDIO_ALLOWED_EMAILS = '';
    const result = checkAssetStudioAuthorization({ email: 'ops@worldlegends.test' });
    expect(result.authorized).toBe(false);
  });
});

describe('Sprint 43A — fronteiras de arquitetura (client/server, segredos, pipeline de cards)', () => {
  it('21. Client Components não importam o service layer nem o repositório Supabase diretamente', () => {
    const clientFiles = [
      'components/dev/asset-studio/AssetStudioExperience.tsx',
      'components/dev/asset-studio/JobDetailView.tsx',
    ];
    for (const file of clientFiles) {
      const src = readSource(file);
      expect(src).toContain("'use client'");
      expect(src).not.toContain("from '@/lib/asset-studio/service'");
      expect(src).not.toContain("from '@/lib/asset-studio/supabase-repository'");
      expect(src).not.toContain('getServiceDb');
    }
  });

  it('server actions são a única porta de mutação — nenhum Client Component chama o repositório direto', () => {
    const src = readSource('lib/actions/asset-studio.ts');
    expect(src).toContain("'use server'");
    expect(src).toContain('checkAssetStudioAuthorization');
  });

  it('22. nenhuma chamada de API Gemini existe em todo o módulo lib/asset-studio', () => {
    const files = [
      'lib/asset-studio/domain-types.ts',
      'lib/asset-studio/status-transitions.ts',
      'lib/asset-studio/storage-paths.ts',
      'lib/asset-studio/job-validation.ts',
      'lib/asset-studio/repository.ts',
      'lib/asset-studio/in-memory-repository.ts',
      'lib/asset-studio/supabase-repository.ts',
      'lib/asset-studio/service.ts',
      'lib/asset-studio/authorization.ts',
      'lib/actions/asset-studio.ts',
    ];
    for (const file of files) {
      const src = readSource(file);
      // Checa uso REAL (import/chamada), não a palavra em comentário de
      // documentação (vários arquivos dizem "nunca chama Gemini" de propósito).
      expect(src).not.toMatch(
        /@google\/generative-ai|GoogleGenerativeAI|generativelanguage\.googleapis\.com|\.generateContent\(/i,
      );
      expect(src).not.toMatch(/fetch\(['"]https?:\/\//);
    }
  });

  it('23. nenhum segredo/chave de API é lido fora do server (nenhum uso de ASSET_STUDIO_ALLOWED_EMAILS em arquivo Client Component; nunca NEXT_PUBLIC_)', () => {
    const src = readSource('lib/asset-studio/authorization.ts');
    expect(src).not.toContain('NEXT_PUBLIC_ASSET_STUDIO');
    const clientFiles = [
      'components/dev/asset-studio/AssetStudioExperience.tsx',
      'components/dev/asset-studio/JobDetailView.tsx',
    ];
    for (const file of clientFiles) {
      expect(readSource(file)).not.toContain('ASSET_STUDIO_ALLOWED_EMAILS');
    }
  });

  it('24. nenhum caminho de storage do Asset Studio escreve em public/assets/cards/source/artworks', () => {
    // A convenção comportamental (build*StoragePath() sempre retorna
    // "asset-studio/...", nunca "source/artworks") já é provada em
    // asset-studio-domain.test.ts — aqui confirmamos que não há NENHUMA
    // operação de I/O de arquivo neste módulo (só monta strings de caminho).
    const src = readSource('lib/asset-studio/storage-paths.ts');
    expect(src).not.toMatch(/writeFileSync|createWriteStream|\.upload\(/);
  });

  it('25. o pipeline de cards existente (scripts/cards) não foi alterado por esta sprint', () => {
    for (const file of [
      'scripts/cards/build-card-artworks.mts',
      'scripts/cards/validate-card-assets.mts',
      'scripts/cards/generate-card-manifest.mts',
    ]) {
      const src = readSource(file);
      expect(src).not.toContain('asset_generation_jobs');
      expect(src).not.toContain('AssetStudioRepository');
    }
  });

  it('a migração do Asset Studio habilita RLS em todas as 6 tabelas, sem policy pra authenticated/anon (só service_role escreve/lê)', () => {
    const migrationFile = 'supabase/migrations/20260714065108_asset_studio_foundation.sql';
    const src = readFileSync(join(process.cwd(), '..', '..', migrationFile), 'utf-8');
    for (const table of [
      'asset_generation_jobs',
      'asset_generation_attempts',
      'asset_candidates',
      'asset_reviews',
      'asset_reference_sets',
      'asset_prompt_templates',
    ]) {
      expect(src).toContain(`alter table ${table} enable row level security`);
    }
    expect(src).not.toMatch(/create policy/);
  });
});
