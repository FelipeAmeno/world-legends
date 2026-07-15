import { MAX_CANDIDATE_BYTES, validateAndDeriveImageMetadata } from '@/lib/asset-studio/image-validation';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

async function tinyPng(): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width: 4, height: 6, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
  return new Uint8Array(buf);
}

describe('Sprint 43B — image-validation (bytes reais, nunca metadata que o provedor afirma)', () => {
  it('26. rejeita payload vazio', async () => {
    const result = await validateAndDeriveImageMetadata(new Uint8Array(), 'image/png');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('vazio');
  });

  it('27. rejeita payload acima do limite máximo', async () => {
    const oversized = new Uint8Array(MAX_CANDIDATE_BYTES + 1);
    const result = await validateAndDeriveImageMetadata(oversized, 'image/png');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe('provider-invalid-response');
  });

  it('28. rejeita MIME type diferente de image/png', async () => {
    const bytes = await tinyPng();
    const result = await validateAndDeriveImageMetadata(bytes, 'image/jpeg');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('MIME');
  });

  it('29. rejeita assinatura de arquivo PNG ausente/inválida mesmo com MIME correto', async () => {
    const fakeBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const result = await validateAndDeriveImageMetadata(fakeBytes, 'image/png');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('assinatura');
  });

  it('30. rejeita PNG malformado (assinatura correta, resto do arquivo corrompido)', async () => {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const corrupted = new Uint8Array([...pngSignature, 0, 0, 0, 0, 0, 0, 0, 0]);
    const result = await validateAndDeriveImageMetadata(corrupted, 'image/png');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCode).toBe('provider-invalid-response');
  });

  it('31. aceita PNG válido e deriva width/height/checksum dos bytes reais (nunca confia em metadata alheia)', async () => {
    const bytes = await tinyPng();
    const result = await validateAndDeriveImageMetadata(bytes, 'image/png');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.width).toBe(4);
      expect(result.height).toBe(6);
      expect(result.mimeType).toBe('image/png');
      expect(result.fileSize).toBe(bytes.length);
      expect(result.checksum).toMatch(/^[0-9a-f]{64}$/);
    }
  });
});
