import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf-8');
}

const NON_GEMINI_ASSET_STUDIO_FILES = [
  'lib/asset-studio/image-provider.ts',
  'lib/asset-studio/retry.ts',
  'lib/asset-studio/image-validation.ts',
  'lib/asset-studio/storage.ts',
  'lib/asset-studio/reference-resolution.ts',
  'lib/asset-studio/providers/fake-image-provider.ts',
  'lib/asset-studio/generation-orchestrator.ts',
  'lib/actions/asset-studio.ts',
  'lib/asset-studio/service.ts',
  'lib/asset-studio/repository.ts',
  'lib/asset-studio/in-memory-repository.ts',
  'lib/asset-studio/supabase-repository.ts',
];

const CLIENT_COMPONENT_FILES = [
  'components/dev/asset-studio/AssetStudioExperience.tsx',
  'components/dev/asset-studio/JobDetailView.tsx',
];

describe('Sprint 43B — fronteiras de segurança do provedor Gemini (server-only, sem vazamento de segredo)', () => {
  it('80. nenhum tipo/formato específico do Gemini escapa do adapter — só gemini-image-provider.ts referencia a API do Gemini', () => {
    for (const file of NON_GEMINI_ASSET_STUDIO_FILES) {
      const src = readSource(file);
      expect(src).not.toMatch(
        /generativelanguage\.googleapis\.com|GeminiGenerateContentResponse|responseModalities|inlineData/i,
      );
    }
  });

  it('81. GEMINI_API_KEY/GEMINI_IMAGE_MODEL/ASSET_STUDIO_GEMINI_ENABLED só são lidas em provider-config.ts — nenhum outro arquivo lê a env var diretamente', () => {
    const configSrc = readSource('lib/asset-studio/provider-config.ts');
    expect(configSrc).toContain('GEMINI_API_KEY');
    expect(configSrc).toContain('GEMINI_IMAGE_MODEL');
    expect(configSrc).toContain('ASSET_STUDIO_GEMINI_ENABLED');

    const geminiAdapterSrc = readSource('lib/asset-studio/providers/gemini-image-provider.ts');
    // O adapter recebe a chave via constructor (injeção), nunca lê process.env sozinho.
    expect(geminiAdapterSrc).not.toContain('process.env.GEMINI_API_KEY');

    for (const file of NON_GEMINI_ASSET_STUDIO_FILES) {
      if (file === 'lib/asset-studio/providers/fake-image-provider.ts') continue;
      const src = readSource(file);
      expect(src).not.toContain('process.env.GEMINI_API_KEY');
      expect(src).not.toContain('process.env.GEMINI_IMAGE_MODEL');
    }
  });

  it('82. nenhuma variável de ambiente do provedor de imagem é prefixada NEXT_PUBLIC_ em lugar nenhum do Asset Studio', () => {
    const allFiles = [
      ...NON_GEMINI_ASSET_STUDIO_FILES,
      'lib/asset-studio/provider-config.ts',
      'lib/asset-studio/providers/gemini-image-provider.ts',
      ...CLIENT_COMPONENT_FILES,
    ];
    for (const file of allFiles) {
      const src = readSource(file);
      expect(src).not.toMatch(/NEXT_PUBLIC_GEMINI|NEXT_PUBLIC_ASSET_STUDIO/);
    }
  });

  it('83. Client Components do Asset Studio nunca importam RUNTIME do orquestrador, do adapter Gemini, de provider-config, do service, ou do repositório Supabase (só tipos, apagados no build) — e nunca citam a env var da chave', () => {
    for (const file of CLIENT_COMPONENT_FILES) {
      const src = readSource(file);
      expect(src).toContain("'use client'");
      expect(src).not.toContain("from '@/lib/asset-studio/generation-orchestrator'");
      expect(src).not.toContain("from '@/lib/asset-studio/providers/gemini-image-provider'");
      // `import type { ProviderStatusInfo } from '.../provider-config'` é aceitável — é
      // apagado no build, nunca inclui código/segredo. Só um import RUNTIME seria um problema.
      expect(src).not.toMatch(
        /^import\s+\{[^}]*\}\s+from ['"]@\/lib\/asset-studio\/provider-config['"]/m,
      );
      expect(src).not.toContain("from '@/lib/asset-studio/service'");
      expect(src).not.toContain("from '@/lib/asset-studio/supabase-repository'");
      expect(src).not.toContain('GEMINI_API_KEY');
      expect(src).not.toContain('apiKey');
    }
  });

  it('84. generateAttemptAction e getCandidateImageDataUrlAction exigem autorização (authorizeOrFail) antes de qualquer efeito colateral', () => {
    const src = readSource('lib/actions/asset-studio.ts');
    const generateFn = src.slice(src.indexOf('export async function generateAttemptAction'));
    const thumbnailFn = src.slice(
      src.indexOf('export async function getCandidateImageDataUrlAction'),
    );
    expect(generateFn.indexOf('authorizeOrFail()')).toBeLessThan(
      generateFn.indexOf('generateJobAttempt('),
    );
    expect(thumbnailFn.indexOf('authorizeOrFail()')).toBeLessThan(
      thumbnailFn.indexOf('.getCandidate('),
    );
  });

  it('85. o provedor fake nunca faz chamada de rede — nenhum uso de fetch/http/https no arquivo', () => {
    const src = readSource('lib/asset-studio/providers/fake-image-provider.ts');
    expect(src).not.toMatch(/fetch\(|require\(['"]https?['"]\)|from ['"]node:https?['"]/);
  });

  it('86. a UI de status do provedor (/dev/asset-studio) nunca exibe o valor de uma chave — só rótulos seguros (nome do provedor/modelo, nunca a env var da chave)', () => {
    for (const file of CLIENT_COMPONENT_FILES) {
      const src = readSource(file);
      expect(src).not.toMatch(/providerStatus\.(apiKey|key|secret)/i);
    }
  });

  it('108. o diagnóstico de falha na UI (SafeAttemptDiagnostics) nunca faz dump bruto de usageMetadata — só lê campos individuais allowlisted por nome', () => {
    const src = readSource('components/dev/asset-studio/JobDetailView.tsx');
    expect(src).not.toMatch(/JSON\.stringify\(\s*usageMetadata/);
    expect(src).not.toMatch(/\{\.\.\.\s*usageMetadata/);
    // Confirma que os campos são lidos nomeadamente (allowlist), não iterados genericamente.
    for (const field of [
      'httpStatus',
      'googleErrorStatus',
      'rateLimitCategory',
      'retryAfterSeconds',
      'model',
    ]) {
      expect(src).toContain(`usageMetadata.${field}`);
    }
    expect(src).not.toMatch(/Object\.(keys|entries|values)\(usageMetadata\)/);
  });
});
