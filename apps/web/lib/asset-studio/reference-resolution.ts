/**
 * lib/asset-studio/reference-resolution.ts — Sprint 43B (Gemini Nano
 * Banana Image Provider)
 *
 * Resolve os arquivos de um `AssetReferenceSet` em bytes reais,
 * SEMPRE lidos server-side de `lib/asset-studio/reference-sets/<id>/`
 * (repositório-aprovado, nunca uma URL pública arbitrária vinda de
 * input do cliente — exatamente a regra "accept repository-approved
 * local references... do not accept arbitrary public URLs"). Nenhum
 * arquivo de referência real existe ainda neste sprint (todos os 6
 * reference sets continuam `active: false` desde a Sprint 42B) — esta
 * função funciona de qualquer forma pra fixtures de teste que apontam
 * pra arquivos reais em disco.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AssetReferenceSet } from './domain-types';
import type { ProviderReferenceImage } from './image-provider';

export const MAX_REFERENCE_IMAGES = 6;
export const MAX_REFERENCE_FILE_BYTES = 8 * 1024 * 1024; // 8MB por arquivo
export const MAX_TOTAL_REFERENCE_BYTES = 32 * 1024 * 1024; // 32MB no total

const REFERENCE_SETS_DIR = join(process.cwd(), 'lib', 'asset-studio', 'reference-sets');
const SAFE_FILENAME = /^[a-zA-Z0-9_.-]+$/;

export type ResolveReferencesResult =
  | { ok: true; images: ProviderReferenceImage[] }
  | { ok: false; errorCode: 'configuration-error'; reason: string };

function extensionToMime(filename: string): string {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.webp')) return 'image/webp';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

/**
 * Lê os arquivos de `referenceSet.files` do disco. Falha ANTES de
 * qualquer chamada de provedor se: excede o número máximo de
 * referências, excede o tamanho máximo (por arquivo ou total), o nome
 * do arquivo tem um caractere fora da allowlist (bloqueia path
 * traversal, mesma regra de `storage-paths.ts`), ou o arquivo não
 * existe/não pode ser lido.
 */
export async function resolveReferenceImages(
  referenceSet: AssetReferenceSet,
): Promise<ResolveReferencesResult> {
  if (referenceSet.files.length === 0) {
    return { ok: true, images: [] };
  }
  if (referenceSet.files.length > MAX_REFERENCE_IMAGES) {
    return {
      ok: false,
      errorCode: 'configuration-error',
      reason: `reference set "${referenceSet.name}" tem ${referenceSet.files.length} arquivos, acima do máximo de ${MAX_REFERENCE_IMAGES}`,
    };
  }

  const images: ProviderReferenceImage[] = [];
  let totalBytes = 0;

  for (const filename of referenceSet.files) {
    if (!SAFE_FILENAME.test(filename)) {
      return {
        ok: false,
        errorCode: 'configuration-error',
        reason: `nome de arquivo de referência inseguro: ${JSON.stringify(filename)}`,
      };
    }
    const path = join(REFERENCE_SETS_DIR, referenceSet.id, filename);
    let bytes: Buffer;
    try {
      bytes = await readFile(path);
    } catch {
      return {
        ok: false,
        errorCode: 'configuration-error',
        reason: `arquivo de referência obrigatório não encontrado/legível: ${referenceSet.id}/${filename}`,
      };
    }
    if (bytes.length > MAX_REFERENCE_FILE_BYTES) {
      return {
        ok: false,
        errorCode: 'configuration-error',
        reason: `arquivo de referência ${filename} excede o tamanho máximo por arquivo (${MAX_REFERENCE_FILE_BYTES} bytes)`,
      };
    }
    totalBytes += bytes.length;
    if (totalBytes > MAX_TOTAL_REFERENCE_BYTES) {
      return {
        ok: false,
        errorCode: 'configuration-error',
        reason: `payload total de referências excede o máximo (${MAX_TOTAL_REFERENCE_BYTES} bytes)`,
      };
    }
    images.push({
      label: filename,
      bytes: new Uint8Array(bytes),
      mimeType: extensionToMime(filename),
    });
  }

  return { ok: true, images };
}
