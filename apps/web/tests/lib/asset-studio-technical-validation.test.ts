import { runTechnicalValidation } from '@/lib/asset-studio/technical-validation';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

async function verticalPng(width: number, height: number): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width, height, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .png()
    .toBuffer();
  return new Uint8Array(buf);
}

function baseOptions(overrides: Partial<Parameters<typeof runTechnicalValidation>[1]> = {}) {
  return {
    claimedMimeType: 'image/png',
    storagePath: 'asset-studio/candidates/job-1/attempt-1/0.png',
    artworkSchemaVersion: 2,
    promptSnapshot: null,
    isDuplicateChecksum: async () => false,
    ...overrides,
  };
}

describe('Sprint 43C — technical-validation (determinístico, sem IA, re-executável)', () => {
  it('109. PNG fake válido (400x600, mesma proporção do fixture) passa na validação técnica', async () => {
    const bytes = await verticalPng(400, 600);
    const outcome = await runTechnicalValidation(bytes, baseOptions());
    expect(outcome.result.passed).toBe(true);
    expect(outcome.result.errors).toEqual([]);
    expect(outcome.width).toBe(400);
    expect(outcome.height).toBe(600);
    expect(outcome.checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(outcome.perceptualHash).toMatch(/^[0-9a-f]+$/);
  });

  it('110. assinatura de arquivo inválida falha (erro, não passa)', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const outcome = await runTechnicalValidation(bytes, baseOptions());
    expect(outcome.result.passed).toBe(false);
    expect(outcome.result.errors.some((e) => e.includes('image-bytes-invalid'))).toBe(true);
  });

  it('111. MIME type não suportado falha', async () => {
    const bytes = await verticalPng(400, 600);
    const outcome = await runTechnicalValidation(
      bytes,
      baseOptions({ claimedMimeType: 'image/jpeg' }),
    );
    expect(outcome.result.passed).toBe(false);
  });

  it('112. proporção errada (quadrado) gera aviso, não necessariamente erro — mas orientação não-vertical é erro', async () => {
    const square = await verticalPng(500, 500);
    const outcome = await runTechnicalValidation(square, baseOptions());
    expect(outcome.result.passed).toBe(false);
    expect(outcome.result.errors.some((e) => e.includes('not-vertical'))).toBe(true);
  });

  it('112b. proporção fora de 2:3 mas ainda vertical gera só aviso, continua passando', async () => {
    const offRatio = await verticalPng(600, 750); // 0.8 vs alvo 0.667 — bem fora da tolerância de 0.05
    const outcome = await runTechnicalValidation(offRatio, baseOptions());
    expect(outcome.result.passed).toBe(true);
    expect(outcome.result.warnings.some((w) => w.includes('aspect-ratio-off'))).toBe(true);
  });

  it('113. resolução abaixo do recomendado (fixture fake 400x600) gera aviso, não erro — fake provider continua funcionando fim-a-fim', async () => {
    const bytes = await verticalPng(400, 600);
    const outcome = await runTechnicalValidation(bytes, baseOptions());
    expect(outcome.result.warnings.some((w) => w.includes('resolution-below-recommended'))).toBe(
      true,
    );
    expect(outcome.result.passed).toBe(true);
  });

  it('113b. resolução abaixo do mínimo absoluto é erro', async () => {
    const tiny = await verticalPng(50, 80);
    const outcome = await runTechnicalValidation(tiny, baseOptions());
    expect(outcome.result.passed).toBe(false);
    expect(outcome.result.errors.some((e) => e.includes('resolution-too-low'))).toBe(true);
  });

  it('114. arquivo acima do tamanho máximo falha', async () => {
    const oversized = new Uint8Array(16 * 1024 * 1024);
    const outcome = await runTechnicalValidation(oversized, baseOptions());
    expect(outcome.result.passed).toBe(false);
  });

  it('115. caminho de produção (fora de asset-studio/) é rejeitado — nunca lê/decodifica os bytes', async () => {
    const bytes = await verticalPng(400, 600);
    const outcome = await runTechnicalValidation(
      bytes,
      baseOptions({ storagePath: 'public/assets/cards/source/artworks/x.png' }),
    );
    expect(outcome.result.passed).toBe(false);
    expect(outcome.result.errors.some((e) => e.includes('storage-path-not-staging'))).toBe(true);
  });

  it('116. checksum duplicado gera aviso (não erro) via callback de detecção injetado', async () => {
    const bytes = await verticalPng(400, 600);
    const outcome = await runTechnicalValidation(
      bytes,
      baseOptions({ isDuplicateChecksum: async () => true }),
    );
    expect(outcome.result.passed).toBe(true);
    expect(outcome.result.warnings.some((w) => w.includes('duplicate-checksum'))).toBe(true);
  });

  it('versão de schema diferente de 2 falha', async () => {
    const bytes = await verticalPng(400, 600);
    const outcome = await runTechnicalValidation(bytes, baseOptions({ artworkSchemaVersion: 1 }));
    expect(outcome.result.passed).toBe(false);
    expect(outcome.result.errors.some((e) => e.includes('schema-version-unsupported'))).toBe(true);
  });

  it('prompt sem menção de safe zone gera aviso; vocabulário legado de stat box também gera aviso', async () => {
    const bytes = await verticalPng(400, 600);
    const noSafeZone = await runTechnicalValidation(
      bytes,
      baseOptions({ promptSnapshot: 'a generic prompt with no relevant mentions' }),
    );
    expect(
      noSafeZone.result.warnings.some((w) => w.includes('prompt-missing-safe-zone-mention')),
    ).toBe(true);

    const legacy = await runTechnicalValidation(
      bytes,
      baseOptions({ promptSnapshot: 'include the six attribute boxes and safe zone' }),
    );
    expect(legacy.result.warnings.some((w) => w.includes('prompt-legacy-stat-region'))).toBe(true);
  });

  it('validatedAt/validatorVersion sempre presentes no resultado, mesmo em falha', async () => {
    const outcome = await runTechnicalValidation(new Uint8Array(), baseOptions());
    expect(outcome.result.validatedAt).toBeTruthy();
    expect(outcome.result.validatorVersion).toBeTruthy();
  });
});
