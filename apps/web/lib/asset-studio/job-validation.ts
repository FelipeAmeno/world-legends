/**
 * lib/asset-studio/job-validation.ts — Sprint 43A (Asset Studio Foundation)
 *
 * Validação pura (sem I/O) do input de criação de draft job — mesmo
 * estilo de `lib/card-static/artwork-schema-v2.ts` (retorna
 * `{ errors, warnings }`/discriminated union, nunca lança exceção pra
 * fluxo de validação esperado).
 */

import type { ArtworkSchemaVersion, AssetPromptTemplate, AssetReferenceSet } from './domain-types';

export const MIN_REQUESTED_VARIANTS = 1;
export const MAX_REQUESTED_VARIANTS = 4;

export type CreateDraftJobInput = {
  artworkPresetId: string;
  playerId: string;
  rarity: string;
  artworkSchemaVersion?: ArtworkSchemaVersion;
  generationMode?: 'new' | 'revision' | 'variant';
  promptTemplateId: string;
  referenceSetId: string;
  requestedVariants: number;
  priority?: 'low' | 'normal' | 'high';
  identityNotes?: string;
};

export type JobValidationResult =
  | {
      ok: true;
      input: Required<Pick<CreateDraftJobInput, 'artworkSchemaVersion'>> & CreateDraftJobInput;
    }
  | { ok: false; errors: string[] };

function validateRequiredStrings(input: CreateDraftJobInput): string[] {
  const errors: string[] = [];
  if (!input.artworkPresetId?.trim()) errors.push('artworkPresetId é obrigatório');
  if (!input.playerId?.trim()) errors.push('playerId é obrigatório');
  if (!input.rarity?.trim()) errors.push('rarity é obrigatório');
  return errors;
}

function validateVariantBounds(requestedVariants: number): string[] {
  if (
    !Number.isInteger(requestedVariants) ||
    requestedVariants < MIN_REQUESTED_VARIANTS ||
    requestedVariants > MAX_REQUESTED_VARIANTS
  ) {
    return [
      `requestedVariants deve estar entre ${MIN_REQUESTED_VARIANTS} e ${MAX_REQUESTED_VARIANTS} (recebido: ${requestedVariants})`,
    ];
  }
  return [];
}

// Regra 3: template ativo e compatível obrigatório.
function validatePromptTemplate(
  promptTemplateId: string,
  promptTemplate: AssetPromptTemplate | null,
  schemaVersion: ArtworkSchemaVersion,
): string[] {
  if (!promptTemplate) return [`promptTemplateId "${promptTemplateId}" não encontrado`];
  if (!promptTemplate.active) return [`prompt template "${promptTemplate.name}" não está ativo`];
  if (promptTemplate.schemaVersion !== schemaVersion) {
    return [
      `prompt template "${promptTemplate.name}" é da versão de schema ${promptTemplate.schemaVersion}, job pede ${schemaVersion}`,
    ];
  }
  return [];
}

// Regra 4: reference set ativo e compatível (schema version + raridade) obrigatório.
function validateReferenceSet(
  referenceSetId: string,
  referenceSet: AssetReferenceSet | null,
  schemaVersion: ArtworkSchemaVersion,
  rarity: string,
): string[] {
  if (!referenceSet) return [`referenceSetId "${referenceSetId}" não encontrado`];
  if (!referenceSet.active) return [`reference set "${referenceSet.name}" não está ativo`];
  if (referenceSet.schemaVersion !== schemaVersion) {
    return [
      `reference set "${referenceSet.name}" é da versão de schema ${referenceSet.schemaVersion}, job pede ${schemaVersion}`,
    ];
  }
  if (referenceSet.rarity !== rarity) {
    return [
      `reference set "${referenceSet.name}" é da raridade "${referenceSet.rarity}", job pede "${rarity}"`,
    ];
  }
  return [];
}

/**
 * Valida o input de criação de draft job. `promptTemplate`/`referenceSet`
 * já resolvidos (buscados pelo caller via repositório) — esta função não
 * faz I/O, só decide se o que foi encontrado satisfaz o contrato.
 */
export function validateCreateDraftJob(
  input: CreateDraftJobInput,
  promptTemplate: AssetPromptTemplate | null,
  referenceSet: AssetReferenceSet | null,
): JobValidationResult {
  // Regra 1: artworkSchemaVersion 2 por padrão pra jobs novos do Asset Studio.
  const schemaVersion = input.artworkSchemaVersion ?? 2;
  const schemaVersionErrors =
    schemaVersion !== 1 && schemaVersion !== 2
      ? [`artworkSchemaVersion desconhecido: ${JSON.stringify(input.artworkSchemaVersion)}`]
      : [];

  const errors = [
    ...validateRequiredStrings(input),
    ...schemaVersionErrors,
    ...validateVariantBounds(input.requestedVariants),
    ...validatePromptTemplate(input.promptTemplateId, promptTemplate, schemaVersion),
    ...validateReferenceSet(input.referenceSetId, referenceSet, schemaVersion, input.rarity),
  ];

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, input: { ...input, artworkSchemaVersion: schemaVersion } };
}
