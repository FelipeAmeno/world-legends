/**
 * Sistema de Raridades (doc 10 §4).
 *
 * Raridade é um Value Object de referência — dado fixo do catálogo, sem
 * invariante transacional própria (doc 17 §3). A tabela completa está
 * aqui, com multiplicadores de atributo (doc 10 §6), faixas de Overall
 * (floor/ceiling) e pesos de drop em pack.
 *
 * | Raridade      | Overall  | Mult  | Drop  |
 * |---------------|----------|-------|-------|
 * | Common        | 55–72    | 1.00x | 58%   |
 * | Rare          | 73–81    | 1.06x | 25%   |
 * | Elite         | 82–87    | 1.12x | 11%   |
 * | Legendary     | 88–92    | 1.18x | 4.5%  |
 * | Ultra         | 93–96    | 1.25x | 1.3%  |
 * | World Cup Hero| 95–99    | 1.30x | 0.2%  |
 *
 * World Cup Hero usa mult 1.30x só nos atributos centrais do momento
 * heroico (doc 10 §6 — fórmula de recorte tratada em card.ts).
 */
import type { RarityCode } from '@world-legends/types';

export type Rarity = Readonly<{
  readonly code: RarityCode;
  readonly label: string;
  readonly overallFloor: number;
  readonly overallCeiling: number;
  /** Multiplicador aplicado aos atributos-base na fórmula de carta (doc 10 §6). */
  readonly attributeMultiplier: number;
  /** Peso relativo em packs — não normalizado (soma > 100% por design, normalizado na hora do sorteio). */
  readonly dropWeight: number;
}>;

const RARITIES: Readonly<Record<RarityCode, Rarity>> = Object.freeze({
  common: Object.freeze({
    code: 'common',
    label: 'Common',
    overallFloor: 55,
    overallCeiling: 72,
    attributeMultiplier: 1.0,
    dropWeight: 58,
  }),
  rare: Object.freeze({
    code: 'rare',
    label: 'Rare',
    overallFloor: 73,
    overallCeiling: 81,
    attributeMultiplier: 1.06,
    dropWeight: 25,
  }),
  elite: Object.freeze({
    code: 'elite',
    label: 'Elite',
    overallFloor: 82,
    overallCeiling: 87,
    attributeMultiplier: 1.12,
    dropWeight: 11,
  }),
  legendary: Object.freeze({
    code: 'legendary',
    label: 'Legendary',
    overallFloor: 88,
    overallCeiling: 92,
    attributeMultiplier: 1.18,
    dropWeight: 4.5,
  }),
  ultra: Object.freeze({
    code: 'ultra',
    label: 'Ultra',
    overallFloor: 93,
    overallCeiling: 96,
    attributeMultiplier: 1.25,
    dropWeight: 1.3,
  }),
  world_cup_hero: Object.freeze({
    code: 'world_cup_hero',
    label: 'World Cup Hero',
    overallFloor: 95,
    overallCeiling: 99,
    // Aplicado apenas aos atributos centrais do momento heroico — ver card.ts
    attributeMultiplier: 1.3,
    dropWeight: 0.2,
  }),
});

export function getRarity(code: RarityCode): Rarity {
  const r = RARITIES[code];
  if (r === undefined) throw new Error(`Raridade inválida: ${code}`);
  return r;
}

export function getAllRarities(): readonly Rarity[] {
  return Object.values(RARITIES);
}

/**
 * Verifica se um Overall está dentro da faixa permitida de uma raridade.
 * Invariante central de `Card` (doc 17 §5, doc 18 §6).
 */
export function isOverallInRange(overall: number, rarity: Rarity): boolean {
  return overall >= rarity.overallFloor && overall <= rarity.overallCeiling;
}

export type { RarityCode };
