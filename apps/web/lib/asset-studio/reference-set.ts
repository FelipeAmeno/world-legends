/**
 * lib/asset-studio/reference-set.ts — Sprint 42B (Artwork Schema V2
 * Contract and Backward Compatibility)
 *
 * Convenção de "reference set" pra cada raridade do Artwork Schema V2 —
 * um conjunto de referências visuais aprovadas (estilo, estrutura,
 * máscara de safe zone, material de raridade, identidade opcional do
 * jogador) que a futura geração de arte deve seguir. Nenhuma imagem
 * real é exigida nesta sprint — os 6 conjuntos abaixo existem só como
 * CONTRATO (`active: false`), documentados em
 * `lib/asset-studio/reference-sets/README.md`. Nenhum deles pode virar
 * default de produção até `active` ser true por decisão humana.
 */

export type ReferenceSetRarity =
  | 'common'
  | 'rare'
  | 'elite'
  | 'legendary'
  | 'goat'
  | 'world-cup-hero';

export type ReferenceSet = {
  id: string;
  rarity: ReferenceSetRarity;
  schemaVersion: 2;
  description: string;
  /** Caminhos relativos esperados — podem não existir em disco ainda (só contrato). */
  files: string[];
  /** `false` até aprovação humana explícita — nunca selecionável como default de produção enquanto assim. */
  active: boolean;
  version: number;
};

export type ReferenceSetValidationResult = {
  errors: string[];
  warnings: string[];
};

const VALID_RARITIES: readonly ReferenceSetRarity[] = [
  'common',
  'rare',
  'elite',
  'legendary',
  'goat',
  'world-cup-hero',
];

export function validateReferenceSet(set: ReferenceSet): ReferenceSetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!set.id) errors.push('reference set sem "id"');
  if (!VALID_RARITIES.includes(set.rarity)) {
    errors.push(`rarity inválida: ${String(set.rarity)}`);
  }
  if (set.schemaVersion !== 2) {
    errors.push(`schemaVersion deve ser 2 (recebido: ${String(set.schemaVersion)})`);
  }
  if (!set.description || set.description.trim().length === 0) {
    errors.push(`[${set.id}] sem "description"`);
  }
  if (!Array.isArray(set.files)) {
    errors.push(`[${set.id}] "files" deve ser um array`);
  } else if (set.files.length === 0) {
    warnings.push(`[${set.id}] "files" vazio — nenhuma referência anexada ainda`);
  }
  if (typeof set.active !== 'boolean') {
    errors.push(`[${set.id}] "active" deve ser boolean`);
  }
  if (typeof set.version !== 'number' || !Number.isFinite(set.version)) {
    errors.push(`[${set.id}] "version" deve ser um número`);
  }

  return { errors, warnings };
}

/**
 * Registro dos 6 reference sets V2 — todos `active: false` hoje (nenhuma
 * imagem de referência final foi aprovada ainda). `files` fica vazio de
 * propósito: aponta pra pasta esperada em
 * `lib/asset-studio/reference-sets/<id>/`, populada só quando referências
 * reais forem aprovadas por decisão humana.
 */
export const REFERENCE_SETS: readonly ReferenceSet[] = [
  {
    id: 'common-v2',
    rarity: 'common',
    schemaVersion: 2,
    description: 'Referências de estilo/estrutura pra cartas Common no Artwork Schema V2.',
    files: [],
    active: false,
    version: 1,
  },
  {
    id: 'rare-v2',
    rarity: 'rare',
    schemaVersion: 2,
    description: 'Referências de estilo/estrutura pra cartas Rare no Artwork Schema V2.',
    files: [],
    active: false,
    version: 1,
  },
  {
    id: 'elite-v2',
    rarity: 'elite',
    schemaVersion: 2,
    description: 'Referências de estilo/estrutura pra cartas Elite no Artwork Schema V2.',
    files: [],
    active: false,
    version: 1,
  },
  {
    id: 'legendary-v2',
    rarity: 'legendary',
    schemaVersion: 2,
    description: 'Referências de estilo/estrutura pra cartas Legendary no Artwork Schema V2.',
    files: [],
    active: false,
    version: 1,
  },
  {
    id: 'goat-v2',
    rarity: 'goat',
    schemaVersion: 2,
    description: 'Referências de estilo/estrutura pra cartas GOAT no Artwork Schema V2.',
    files: [],
    active: false,
    version: 1,
  },
  {
    id: 'world-cup-hero-v2',
    rarity: 'world-cup-hero',
    schemaVersion: 2,
    description: 'Referências de estilo/estrutura pra cartas World Cup Hero no Artwork Schema V2.',
    files: [],
    active: false,
    version: 1,
  },
] as const;

/**
 * Retorna o reference set ATIVO pra uma raridade, ou `null` se nenhum
 * foi aprovado ainda (o caso de hoje, pra todas as 6 raridades) — nunca
 * retorna um conjunto `active: false`, mesmo que seja o único que exista
 * pra aquela raridade.
 */
export function getActiveReferenceSet(rarity: ReferenceSetRarity): ReferenceSet | null {
  return REFERENCE_SETS.find((set) => set.rarity === rarity && set.active) ?? null;
}
