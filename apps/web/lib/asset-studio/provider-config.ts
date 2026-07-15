/**
 * lib/asset-studio/provider-config.ts — Sprint 43B (Gemini Nano Banana
 * Image Provider)
 *
 * Único lugar que lê as variáveis de ambiente do provedor de imagem.
 * NENHUMA outra parte do Asset Studio lê `GEMINI_API_KEY`/
 * `GEMINI_IMAGE_MODEL`/`ASSET_STUDIO_GEMINI_ENABLED` diretamente — nem a
 * UI, nem o orquestrador, nem os testes. Falha fechado sempre: sem
 * ASSET_STUDIO_GEMINI_ENABLED=true explícito, sem API key, ou sem
 * modelo, o provedor real nunca é instanciado.
 */

import type { ImageGenerationProvider } from './image-provider';
import { FakeImageProvider } from './providers/fake-image-provider';
import { GeminiImageProvider } from './providers/gemini-image-provider';

export type ProviderStatus = 'configured' | 'disabled' | 'unavailable';

export type ProviderStatusInfo = {
  status: ProviderStatus;
  /** Nome seguro pra exibir na UI — NUNCA a chave. */
  providerName: string;
  modelLabel: string | null;
};

function isGeminiEnabled(): boolean {
  return process.env.ASSET_STUDIO_GEMINI_ENABLED === 'true';
}

function hasApiKey(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function hasModel(): boolean {
  return Boolean(process.env.GEMINI_IMAGE_MODEL?.trim());
}

function activeProviderMode(): 'fake' | 'gemini' {
  return process.env.ASSET_STUDIO_IMAGE_PROVIDER === 'gemini' ? 'gemini' : 'fake';
}

/**
 * Status seguro pra exibir em `/dev/asset-studio` — nunca inclui o
 * valor da chave, só se ela EXISTE. "unavailable" cobre tanto "modo
 * gemini pedido mas sem key/model" quanto qualquer configuração
 * inconsistente — a UI trata os dois igual (Generate desabilitado).
 */
export function getProviderStatus(): ProviderStatusInfo {
  const mode = activeProviderMode();

  if (mode === 'fake') {
    return { status: 'configured', providerName: 'fake (dev/test)', modelLabel: 'fixture' };
  }

  if (!isGeminiEnabled()) {
    return { status: 'disabled', providerName: 'gemini', modelLabel: null };
  }
  if (!hasApiKey() || !hasModel()) {
    return { status: 'unavailable', providerName: 'gemini', modelLabel: null };
  }
  return {
    status: 'configured',
    providerName: 'gemini',
    modelLabel: process.env.GEMINI_IMAGE_MODEL as string,
  };
}

export type CreateProviderResult =
  | { ok: true; provider: ImageGenerationProvider }
  | { ok: false; error: string };

/**
 * Fábrica do provedor real — chamada só pelo orquestrador, nunca pela
 * UI. Produção configurada pra "gemini" NUNCA cai silenciosamente pro
 * fake — se a config for inválida, falha com erro explícito.
 */
export function createImageProvider(): CreateProviderResult {
  const mode = activeProviderMode();

  if (mode === 'fake') {
    return { ok: true, provider: new FakeImageProvider() };
  }

  if (!isGeminiEnabled()) {
    return {
      ok: false,
      error: 'ASSET_STUDIO_GEMINI_ENABLED não está true — provedor desabilitado',
    };
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_IMAGE_MODEL?.trim();
  if (!apiKey) return { ok: false, error: 'GEMINI_API_KEY ausente' };
  if (!model) return { ok: false, error: 'GEMINI_IMAGE_MODEL ausente' };

  return { ok: true, provider: new GeminiImageProvider(apiKey, model) };
}
