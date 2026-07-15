import { validateAndDeriveImageMetadata } from '@/lib/asset-studio/image-validation';
import { FakeImageProvider } from '@/lib/asset-studio/providers/fake-image-provider';
import { describe, expect, it } from 'vitest';

function fixtureRequest(requestedVariants: number) {
  return {
    jobId: 'job-1',
    attemptId: 'attempt-1',
    prompt: 'fixture prompt',
    requestedVariants,
    referenceImages: [],
    artworkSchemaVersion: 2 as const,
    output: { aspectRatio: '2:3' as const, mimeType: 'image/png' as const },
  };
}

describe('Sprint 43B — FakeImageProvider (determinístico, sem custo, nunca chama rede)', () => {
  it('53. gera exatamente requestedVariants candidates, cada um um PNG real e válido', async () => {
    const provider = new FakeImageProvider();
    const candidates = await provider.generate(fixtureRequest(3));
    expect(candidates).toHaveLength(3);
    for (const candidate of candidates) {
      const meta = await validateAndDeriveImageMetadata(candidate.bytes, candidate.mimeType);
      expect(meta.ok).toBe(true);
    }
  });

  it('54. saída é determinística — a mesma variantIndex sempre produz a mesma cor entre chamadas', async () => {
    const provider = new FakeImageProvider();
    const run1 = await provider.generate(fixtureRequest(2));
    const run2 = await provider.generate(fixtureRequest(2));
    expect(run1[0]?.providerMetadata.color).toEqual(run2[0]?.providerMetadata.color);
    expect(run1[1]?.providerMetadata.color).toEqual(run2[1]?.providerMetadata.color);
  });

  it('55. providerMetadata sempre marca fixture:true — nunca confundível com arte real aprovada', async () => {
    const provider = new FakeImageProvider();
    const candidates = await provider.generate(fixtureRequest(1));
    expect(candidates[0]?.providerMetadata).toMatchObject({ fixture: true, provider: 'fake' });
    expect(provider.name).toBe('fake');
  });
});
