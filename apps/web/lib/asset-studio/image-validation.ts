/**
 * lib/asset-studio/image-validation.ts — Sprint 43B (Gemini Nano Banana
 * Image Provider)
 *
 * Validação e derivação de metadata de bytes de imagem, SEMPRE
 * server-side, SEMPRE derivado dos bytes reais — nunca confia em
 * metadata que o provedor afirma (`providerMetadata` é preservado à
 * parte, nunca usado como fonte de width/height/mimeType/tamanho).
 * Usa `sharp` — mesma lib já usada por `scripts/cards/*.mts`, não uma
 * dependência nova.
 */

import { createHash } from 'node:crypto';
import sharp from 'sharp';

export const MAX_CANDIDATE_BYTES = 15 * 1024 * 1024; // 15MB
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export type ImageValidationResult =
  | {
      ok: true;
      width: number;
      height: number;
      mimeType: 'image/png';
      fileSize: number;
      checksum: string;
    }
  | { ok: false; errorCode: 'provider-invalid-response'; reason: string };

function hasPngSignature(bytes: Uint8Array): boolean {
  if (bytes.length < PNG_SIGNATURE.length) return false;
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) return false;
  }
  return true;
}

/**
 * Valida bytes de candidate ANTES de salvar em staging. Rejeita: payload
 * vazio, assinatura PNG ausente/incorreta, tamanho acima do limite, ou
 * imagem malformada (sharp falha ao ler metadata real).
 */
export async function validateAndDeriveImageMetadata(
  bytes: Uint8Array,
  claimedMimeType: string,
): Promise<ImageValidationResult> {
  if (bytes.length === 0) {
    return { ok: false, errorCode: 'provider-invalid-response', reason: 'payload de imagem vazio' };
  }
  if (bytes.length > MAX_CANDIDATE_BYTES) {
    return {
      ok: false,
      errorCode: 'provider-invalid-response',
      reason: `imagem acima do limite (${bytes.length} bytes > ${MAX_CANDIDATE_BYTES} bytes)`,
    };
  }
  if (claimedMimeType !== 'image/png') {
    return {
      ok: false,
      errorCode: 'provider-invalid-response',
      reason: `MIME type não suportado: ${claimedMimeType} (só image/png é aceito no Artwork Schema V2)`,
    };
  }
  if (!hasPngSignature(bytes)) {
    return {
      ok: false,
      errorCode: 'provider-invalid-response',
      reason: 'assinatura de arquivo PNG ausente ou inválida',
    };
  }

  try {
    const buffer = Buffer.from(bytes);
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) {
      return {
        ok: false,
        errorCode: 'provider-invalid-response',
        reason: 'imagem malformada — sharp não conseguiu ler dimensões',
      };
    }
    const checksum = createHash('sha256').update(buffer).digest('hex');
    return {
      ok: true,
      width: meta.width,
      height: meta.height,
      mimeType: 'image/png',
      fileSize: bytes.length,
      checksum,
    };
  } catch (err) {
    return {
      ok: false,
      errorCode: 'provider-invalid-response',
      reason: `imagem malformada — falha ao decodificar: ${(err as Error).message}`,
    };
  }
}
