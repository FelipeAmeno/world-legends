/**
 * lib/asset-studio/storage-paths.ts — Sprint 43A (Asset Studio Foundation)
 *
 * Convenção de storage EM STAGING (bucket Supabase Storage `asset-studio`,
 * nunca criado/usado de verdade nesta sprint — nenhuma imagem é gerada).
 * Caminho determinístico por job/attempt/variant — NUNCA por nome de
 * exibição de jogador (evita colisão e mantém a chave estável mesmo se o
 * nome do jogador mudar).
 *
 *   asset-studio/pending/<jobId>/<attemptId>/<variantIndex>.<ext>     (aguardando review)
 *   asset-studio/candidates/<jobId>/<attemptId>/<variantIndex>.<ext>  (gerado, com metadata técnica)
 *   asset-studio/approved/<jobId>/<candidateId>.<ext>                (aprovado, ainda não publicado)
 *   asset-studio/rejected/<jobId>/<attemptId>/<variantIndex>.<ext>   (rejeitado, mantido pra auditoria)
 *   asset-studio/published/<artworkPresetId>.<ext>                   (promovido — passo humano separado,
 *                                                                      nunca escreve em
 *                                                                      public/assets/cards/source/artworks
 *                                                                      automaticamente)
 *
 * Fallback local-dev: se `SUPABASE_SERVICE_ROLE_KEY`/Storage não estiver
 * configurado, o service layer nunca tenta upload nesta sprint (nenhum
 * candidate real é criado fora de fixture de teste) — `buildCandidateStoragePath`
 * é uma função pura, sem I/O, então funciona idêntico com ou sem Supabase
 * configurado.
 */

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]+$/;
const SAFE_EXTENSION = /^[a-zA-Z0-9]+$/;

export type StorageStage = 'pending' | 'candidates' | 'approved' | 'rejected' | 'published';

export class UnsafeStoragePathError extends Error {}

/** Só aceita segmentos alfanuméricos (+ `_`/`-`) — bloqueia `../`, `/`, `\0`, espaços, etc. Nunca usa nome de exibição como chave. */
function assertSafeSegment(label: string, value: string): void {
  if (!SAFE_SEGMENT.test(value)) {
    throw new UnsafeStoragePathError(
      `segmento de storage inseguro em "${label}": ${JSON.stringify(value)} (só alfanumérico, "_" e "-" são aceitos)`,
    );
  }
}

function assertSafeExtension(extension: string): void {
  if (!SAFE_EXTENSION.test(extension)) {
    throw new UnsafeStoragePathError(
      `extensão de arquivo insegura: ${JSON.stringify(extension)} (só alfanumérico)`,
    );
  }
}

/** Caminho determinístico de um candidate em staging — job/attempt/variant, nunca nome de jogador. */
export function buildCandidateStoragePath(
  stage: Extract<StorageStage, 'pending' | 'candidates' | 'rejected'>,
  jobId: string,
  attemptId: string,
  variantIndex: number,
  extension = 'png',
): string {
  assertSafeSegment('jobId', jobId);
  assertSafeSegment('attemptId', attemptId);
  assertSafeExtension(extension);
  if (!Number.isInteger(variantIndex) || variantIndex < 0) {
    throw new UnsafeStoragePathError(`variantIndex inválido: ${variantIndex}`);
  }
  return `asset-studio/${stage}/${jobId}/${attemptId}/${variantIndex}.${extension}`;
}

export function buildApprovedStoragePath(
  jobId: string,
  candidateId: string,
  extension = 'png',
): string {
  assertSafeSegment('jobId', jobId);
  assertSafeSegment('candidateId', candidateId);
  assertSafeExtension(extension);
  return `asset-studio/approved/${jobId}/${candidateId}.${extension}`;
}

/** Passo de PUBLICAÇÃO — explícito, humano, nunca automático (ver docs/design/06). Não escreve em disco nesta sprint. */
export function buildPublishedStoragePath(artworkPresetId: string, extension = 'png'): string {
  assertSafeSegment('artworkPresetId', artworkPresetId);
  assertSafeExtension(extension);
  return `asset-studio/published/${artworkPresetId}.${extension}`;
}
