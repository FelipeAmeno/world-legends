/**
 * lib/dev/png-inspect.ts — Sprint 18.6.5 (Asset Production Pipeline) +
 * Sprint 18.8 (suporte a WEBP, pros backgrounds)
 *
 * Leitor mínimo de cabeçalho PNG/WEBP — sem dependência externa. Um PNG
 * sempre começa com a assinatura de 8 bytes seguida do chunk IHDR (13 bytes
 * fixos: width, height, bit depth, color type, ...) nos primeiros 33 bytes
 * do arquivo. Um WEBP começa com um container RIFF ("RIFF" + tamanho +
 * "WEBP") seguido de um chunk — os 3 formatos (VP8 simples/lossy, VP8L
 * lossless, VP8X extended) guardam a resolução de formas diferentes.
 * Nenhum caso precisa decodificar a imagem inteira pra saber resolução e
 * canal alpha.
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
  format: 'png' | 'webp' | 'unknown';
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Color types PNG que incluem canal alpha: 4 (grayscale+alpha), 6 (RGBA). */
const ALPHA_COLOR_TYPES = new Set([4, 6]);

function inspectPng(buf: Buffer): ImageInspection | null {
  if (buf.length < 33 || !buf.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const colorType = buf.readUInt8(25);
  return {
    width,
    height,
    hasAlpha: ALPHA_COLOR_TYPES.has(colorType),
    sizeBytes: buf.length,
    format: 'png',
  };
}

/** Dimensões do sub-formato WEBP simples/lossy ("VP8 ") — o mais comum. */
function inspectWebpLossy(buf: Buffer): { width: number; height: number } | null {
  // 20: frame tag (3 bytes) · 23: start code 9d 01 2a (3 bytes) · 26/28: width/height (uint16 LE, 14 bits)
  if (buf.length < 30 || buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null;
  const width = buf.readUInt16LE(26) & 0x3fff;
  const height = buf.readUInt16LE(28) & 0x3fff;
  return { width, height };
}

/** Dimensões do sub-formato WEBP estendido ("VP8X") — canvas width/height-1, 24 bits LE. */
function inspectWebpExtended(
  buf: Buffer,
): { width: number; height: number; hasAlpha: boolean } | null {
  if (buf.length < 30) return null;
  const flags = buf.readUInt8(20);
  const hasAlpha = (flags & 0x10) !== 0;
  const width = buf.readUIntLE(24, 3) + 1;
  const height = buf.readUIntLE(27, 3) + 1;
  return { width, height, hasAlpha };
}

function inspectWebp(buf: Buffer): ImageInspection | null {
  if (
    buf.length < 16 ||
    buf.toString('ascii', 0, 4) !== 'RIFF' ||
    buf.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    return null;
  }
  const fourCc = buf.toString('ascii', 12, 16);

  if (fourCc === 'VP8X') {
    const dims = inspectWebpExtended(buf);
    if (!dims) return null;
    return { ...dims, sizeBytes: buf.length, format: 'webp' };
  }

  if (fourCc === 'VP8 ') {
    const dims = inspectWebpLossy(buf);
    if (!dims) return null;
    // WEBP lossy simples (VP8) não tem canal alpha por definição do formato.
    return { ...dims, hasAlpha: false, sizeBytes: buf.length, format: 'webp' };
  }

  // VP8L (lossless) usa dimensões bit-packed — fora do escopo deste leitor mínimo.
  return { width: 0, height: 0, hasAlpha: false, sizeBytes: buf.length, format: 'webp' };
}

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

  return (
    inspectPng(buf) ??
    inspectWebp(buf) ?? { width: 0, height: 0, hasAlpha: false, sizeBytes, format: 'unknown' }
  );
}

export function bytesToKb(bytes: number): number {
  return Math.round((bytes / 1024) * 10) / 10;
}
