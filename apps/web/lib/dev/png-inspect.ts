/**
 * lib/dev/png-inspect.ts — Sprint 18.6.5 (Asset Production Pipeline)
 *
 * Leitor mínimo de cabeçalho PNG — sem dependência externa. Um PNG sempre
 * começa com a assinatura de 8 bytes seguida do chunk IHDR (13 bytes fixos:
 * width, height, bit depth, color type, ...) nos primeiros 33 bytes do
 * arquivo — não precisa carregar/decodificar a imagem inteira pra saber
 * resolução e se tem canal alpha.
 *
 * Server-only (usa `node:fs`) — chamado a partir de app/dev/card-assets
 * (Server Component), nunca de um componente client.
 */
import { readFileSync, statSync } from 'node:fs';

export type ImageInspection = {
  width: number;
  height: number;
  hasAlpha: boolean;
  sizeBytes: number;
  format: 'png' | 'unknown';
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Color types PNG que incluem canal alpha: 4 (grayscale+alpha), 6 (RGBA). */
const ALPHA_COLOR_TYPES = new Set([4, 6]);

export function inspectImageFile(absolutePath: string): ImageInspection | null {
  let buf: Buffer;
  let sizeBytes: number;
  try {
    const stat = statSync(absolutePath);
    sizeBytes = stat.size;
    buf = readFileSync(absolutePath);
  } catch {
    return null;
  }

  if (buf.length >= 33 && buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const colorType = buf.readUInt8(25);
    return { width, height, hasAlpha: ALPHA_COLOR_TYPES.has(colorType), sizeBytes, format: 'png' };
  }

  return { width: 0, height: 0, hasAlpha: false, sizeBytes, format: 'unknown' };
}

export function bytesToKb(bytes: number): number {
  return Math.round((bytes / 1024) * 10) / 10;
}
