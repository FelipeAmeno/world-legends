import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AssetReferenceSet } from '@/lib/asset-studio/domain-types';
import {
  MAX_REFERENCE_IMAGES,
  resolveReferenceImages,
} from '@/lib/asset-studio/reference-resolution';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const FIXTURE_DIR = join(
  process.cwd(),
  'lib',
  'asset-studio',
  'reference-sets',
  '__test_fixture_43b__',
);

function baseSet(overrides: Partial<AssetReferenceSet> = {}): AssetReferenceSet {
  return {
    id: '__test_fixture_43b__',
    rarity: 'legendary',
    schemaVersion: 2,
    name: 'fixture-set',
    description: null,
    version: 1,
    active: true,
    files: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('Sprint 43B — reference-resolution (só disco aprovado do repositório, nunca URL externa)', () => {
  beforeAll(async () => {
    await mkdir(FIXTURE_DIR, { recursive: true });
    const bytes = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 5, g: 5, b: 5 } },
    })
      .png()
      .toBuffer();
    await writeFile(join(FIXTURE_DIR, 'ref-a.png'), bytes);
  });

  afterAll(async () => {
    await rm(FIXTURE_DIR, { recursive: true, force: true });
  });

  it('38. reference set sem arquivos resolve ok trivialmente, sem tocar disco', async () => {
    const result = await resolveReferenceImages(baseSet({ files: [] }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.images).toEqual([]);
  });

  it('39. excede o número máximo de referências falha ANTES de qualquer leitura de disco', async () => {
    const tooMany = Array.from({ length: MAX_REFERENCE_IMAGES + 1 }, (_, i) => `f${i}.png`);
    const result = await resolveReferenceImages(baseSet({ files: tooMany }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe('configuration-error');
  });

  it('40. nome de arquivo inseguro (path traversal) é rejeitado antes de tentar ler', async () => {
    const result = await resolveReferenceImages(baseSet({ files: ['../../etc/passwd'] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('inseguro');
  });

  it('41. arquivo de referência obrigatório ausente falha ANTES de qualquer chamada de provedor', async () => {
    const result = await resolveReferenceImages(baseSet({ files: ['does-not-exist.png'] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorCode).toBe('configuration-error');
      expect(result.reason).toContain('não encontrado');
    }
  });

  it('42. arquivo real aprovado no repositório é lido com bytes/mimeType/label corretos', async () => {
    const result = await resolveReferenceImages(baseSet({ files: ['ref-a.png'] }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.images).toHaveLength(1);
      expect(result.images[0]?.label).toBe('ref-a.png');
      expect(result.images[0]?.mimeType).toBe('image/png');
      expect(result.images[0]?.bytes.length).toBeGreaterThan(0);
    }
  });
});
