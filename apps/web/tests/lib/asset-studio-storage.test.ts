import { InMemoryAssetStudioStorage } from '@/lib/asset-studio/storage';
import { describe, expect, it } from 'vitest';

describe('Sprint 43B — InMemoryAssetStudioStorage (dev local + todo teste, nunca produção)', () => {
  it('56. rejeita caminhos fora da convenção "asset-studio/"', async () => {
    const storage = new InMemoryAssetStudioStorage();
    await expect(
      storage.putObject(
        'public/assets/cards/source/artworks/x.png',
        new Uint8Array([1]),
        'image/png',
      ),
    ).rejects.toThrow();
  });

  it('57. putObject/getObject faz round-trip preservando bytes e mimeType', async () => {
    const storage = new InMemoryAssetStudioStorage();
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const result = await storage.putObject('asset-studio/candidates/j/a/0.png', bytes, 'image/png');
    expect(result.size).toBe(4);
    const stored = await storage.getObject('asset-studio/candidates/j/a/0.png');
    expect(stored?.bytes).toEqual(bytes);
    expect(stored?.mimeType).toBe('image/png');
  });

  it('58. getObject de um caminho desconhecido retorna null, nunca lança', async () => {
    const storage = new InMemoryAssetStudioStorage();
    const result = await storage.getObject('asset-studio/candidates/nope/nope/0.png');
    expect(result).toBeNull();
  });
});
