/**
 * lib/asset-studio/prompt-template.ts — Sprint 42B (Artwork Schema V2
 * Contract and Backward Compatibility)
 *
 * Fundação de prompt pra futura geração de arte V2 (Asset Studio real,
 * sprint futura) — este arquivo NÃO chama nenhum provedor de geração de
 * imagem, não gera nenhuma arte de jogador específico, e não é
 * executado por nenhum script de build. É só o CONTRATO determinístico
 * de como um prompt V2 deve ser montado a partir de um input tipado,
 * pra que a próxima sprint (Asset Studio de verdade) tenha uma função
 * pura e testada pra reaproveitar em vez de reinventar o texto do
 * prompt em algum componente de UI.
 */

export type ArtworkSchemaV2Rarity =
  | 'common'
  | 'rare'
  | 'elite'
  | 'legendary'
  | 'ultra'
  | 'world-cup-hero'
  | 'goat';

export type PromptTemplateInput = {
  displayName: string;
  country: string;
  era: string;
  position: string;
  archetype: string;
  rarity: ArtworkSchemaV2Rarity;
  identityNotes: string;
  referenceSet: string;
};

const REQUIRED_INPUT_FIELDS: Array<keyof PromptTemplateInput> = [
  'displayName',
  'country',
  'era',
  'position',
  'archetype',
  'rarity',
  'identityNotes',
  'referenceSet',
];

export type PromptTemplateResult =
  | { ok: true; prompt: string }
  | { ok: false; error: string; missingFields: string[] };

/**
 * As proibições do Artwork Schema V2 — sempre presentes no prompt
 * final, nunca condicionais. Espelha o contrato de `docs/design/05-artwork-schema-v2.md`
 * e o teste que confirma "Prompt output contains the V2 prohibitions".
 */
const V2_REQUIRED_ELEMENTS = [
  'complete card frame',
  'player illustration',
  'cinematic football environment',
  'rarity materials',
  'lighting',
  'static decorative effects',
  'clear upper-left HUD safe zone',
  'clean lower identity safe zone',
  'continuous decorative lower section',
  'full-card artwork composition',
] as const;

const V2_PROHIBITED_ELEMENTS = [
  'six attribute boxes',
  'attribute labels',
  'placeholder text',
  'player name',
  'nickname',
  'OVR',
  'position text',
  'country flag',
  'readable text',
  'logos',
  'sponsors',
  'watermarks',
  'dynamic gameplay data baked into the image',
] as const;

const V2_OUTPUT_REQUIREMENTS = [
  'vertical 2:3 aspect ratio',
  'high-resolution PNG',
  'full-card artwork only',
  'no mockup',
  'no external presentation background',
] as const;

function findMissingFields(input: Partial<PromptTemplateInput>): string[] {
  return REQUIRED_INPUT_FIELDS.filter((field) => {
    const value = input[field];
    return typeof value !== 'string' || value.trim().length === 0;
  });
}

/**
 * Monta o prompt-base V2 de forma determinística — mesmo input sempre
 * produz o mesmo texto (sem timestamp, sem random, sem chamada externa).
 * Retorna `{ ok: false }` em vez de lançar exceção quando falta campo
 * obrigatório, pra quem chamar (futura UI do Asset Studio) decidir como
 * mostrar o erro sem precisar de try/catch.
 */
export function buildV2ArtworkPrompt(input: Partial<PromptTemplateInput>): PromptTemplateResult {
  const missingFields = findMissingFields(input);
  if (missingFields.length > 0) {
    return {
      ok: false,
      error: `Campos obrigatórios ausentes pra montar o prompt V2: ${missingFields.join(', ')}`,
      missingFields,
    };
  }

  const complete = input as PromptTemplateInput;

  const prompt = [
    `WORLD LEGENDS — ${complete.rarity.toUpperCase()} ARTWORK SCHEMA V2`,
    '',
    'Create one complete vertical card artwork for World Legends.',
    '',
    'PLAYER:',
    complete.displayName,
    '',
    'PLAYER PROFILE:',
    `- country: ${complete.country}`,
    `- historical era: ${complete.era}`,
    `- primary position: ${complete.position}`,
    `- archetype: ${complete.archetype}`,
    `- generation identity notes: ${complete.identityNotes}`,
    '',
    'CARD CLASS:',
    complete.rarity,
    '',
    'Use the attached approved reference set:',
    complete.referenceSet,
    '',
    'Required (schema v2 — no six-attribute-box contract):',
    ...V2_REQUIRED_ELEMENTS.map((item) => `- ${item};`),
    '',
    'Do not include:',
    ...V2_PROHIBITED_ELEMENTS.map((item) => `- ${item};`),
    '',
    'Do not draw six attribute boxes.',
    '',
    'Output:',
    ...V2_OUTPUT_REQUIREMENTS.map((item) => `- ${item};`),
  ].join('\n');

  return { ok: true, prompt };
}

/** Reexportado só pra testes confirmarem a lista sem duplicar o array. */
export const V2_PROMPT_PROHIBITIONS = V2_PROHIBITED_ELEMENTS;
