import { createImageProvider, getProviderStatus } from '@/lib/asset-studio/provider-config';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const ENV_KEYS = [
  'ASSET_STUDIO_IMAGE_PROVIDER',
  'ASSET_STUDIO_GEMINI_ENABLED',
  'GEMINI_API_KEY',
  'GEMINI_IMAGE_MODEL',
] as const;

describe('Sprint 43B — provider-config (única leitura de env do provedor; sempre falha fechado)', () => {
  const original: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      original[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (original[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = original[key];
      }
    }
  });

  it('46. sem ASSET_STUDIO_IMAGE_PROVIDER (padrão), usa fake independente das vars do Gemini', () => {
    const status = getProviderStatus();
    expect(status.status).toBe('configured');
    expect(status.providerName).toContain('fake');
    const created = createImageProvider();
    expect(created.ok).toBe(true);
    if (created.ok) expect(created.provider.name).toBe('fake');
  });

  it('47. modo gemini sem ASSET_STUDIO_GEMINI_ENABLED=true fica "disabled" e falha fechado (nunca cai pro fake)', () => {
    process.env.ASSET_STUDIO_IMAGE_PROVIDER = 'gemini';
    const status = getProviderStatus();
    expect(status.status).toBe('disabled');
    const created = createImageProvider();
    expect(created.ok).toBe(false);
  });

  it('48. modo gemini habilitado mas sem GEMINI_API_KEY fica "unavailable" e falha fechado', () => {
    process.env.ASSET_STUDIO_IMAGE_PROVIDER = 'gemini';
    process.env.ASSET_STUDIO_GEMINI_ENABLED = 'true';
    process.env.GEMINI_IMAGE_MODEL = 'gemini-fixture-model';
    const status = getProviderStatus();
    expect(status.status).toBe('unavailable');
    const created = createImageProvider();
    expect(created.ok).toBe(false);
    if (!created.ok) expect(created.error).toContain('GEMINI_API_KEY');
  });

  it('49. modo gemini habilitado mas sem GEMINI_IMAGE_MODEL fica "unavailable" e falha fechado', () => {
    process.env.ASSET_STUDIO_IMAGE_PROVIDER = 'gemini';
    process.env.ASSET_STUDIO_GEMINI_ENABLED = 'true';
    process.env.GEMINI_API_KEY = 'fixture-key-never-real';
    const status = getProviderStatus();
    expect(status.status).toBe('unavailable');
    const created = createImageProvider();
    expect(created.ok).toBe(false);
    if (!created.ok) expect(created.error).toContain('GEMINI_IMAGE_MODEL');
  });

  it('50. modo gemini totalmente configurado fica "configured" e cria o provedor real', () => {
    process.env.ASSET_STUDIO_IMAGE_PROVIDER = 'gemini';
    process.env.ASSET_STUDIO_GEMINI_ENABLED = 'true';
    process.env.GEMINI_API_KEY = 'fixture-key-never-real';
    process.env.GEMINI_IMAGE_MODEL = 'gemini-fixture-model';
    const status = getProviderStatus();
    expect(status.status).toBe('configured');
    expect(status.modelLabel).toBe('gemini-fixture-model');
    const created = createImageProvider();
    expect(created.ok).toBe(true);
    if (created.ok) expect(created.provider.name).toBe('gemini');
  });

  it('51. produção configurada pra gemini NUNCA cai silenciosamente pro fake, mesmo mal configurada', () => {
    process.env.ASSET_STUDIO_IMAGE_PROVIDER = 'gemini';
    process.env.ASSET_STUDIO_GEMINI_ENABLED = 'true';
    // API key e modelo ausentes de propósito.
    const status = getProviderStatus();
    expect(status.providerName).not.toBe('fake');
    expect(status.status).not.toBe('configured');
    const created = createImageProvider();
    expect(created.ok).toBe(false);
  });

  it('52. getProviderStatus nunca inclui o valor da chave de API em nenhum campo retornado', () => {
    process.env.ASSET_STUDIO_IMAGE_PROVIDER = 'gemini';
    process.env.ASSET_STUDIO_GEMINI_ENABLED = 'true';
    process.env.GEMINI_API_KEY = 'super-secret-fixture-value';
    process.env.GEMINI_IMAGE_MODEL = 'gemini-fixture-model';
    const status = getProviderStatus();
    expect(JSON.stringify(status)).not.toContain('super-secret-fixture-value');
  });
});
