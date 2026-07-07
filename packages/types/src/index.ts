/**
 * packages/types — DTOs, enums e tipos compartilhados sem lógica.
 * (docs/18-monorepo-architecture-master.md §16)
 *
 * Populado na T011 (cards domain) com os primeiros enums reais.
 * Por definição, este package nunca contém lógica — só forma de dado.
 */

// ─── Posições (doc 09 §1, doc 02 DDL players) ────────────────────────────────
export type Position =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'LWB'
  | 'RWB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'CF'
  | 'ST';

export const ALL_POSITIONS: readonly Position[] = [
  'GK',
  'CB',
  'LB',
  'RB',
  'LWB',
  'RWB',
  'CDM',
  'CM',
  'CAM',
  'LM',
  'RM',
  'LW',
  'RW',
  'CF',
  'ST',
];

// ─── Raridades (doc 10 §4) ────────────────────────────────────────────────────
export type RarityCode = 'common' | 'rare' | 'elite' | 'legendary' | 'ultra' | 'world_cup_hero';

export const ALL_RARITY_CODES: readonly RarityCode[] = [
  'common',
  'rare',
  'elite',
  'legendary',
  'ultra',
  'world_cup_hero',
];

// ─── Edições (doc 10 §2, §9, §10; doc 17 §5) ─────────────────────────────────
// 'base'   = versão padrão de carreira (Common/Rare/Elite/Legendary/Ultra)
// 'prime'  = auge verificável da carreira (eixo de edição, não 7ª raridade — doc 10 §9)
// 'event'  = sazonal/live-op (doc 10 §10)
// 'goat'   = topo absoluto de prestígio, não tradeable (doc 10 §11)
export type EditionCode = 'base' | 'prime' | 'event' | 'goat';

// ─── Pé preferido (doc 02 DDL players) ───────────────────────────────────────
export type PreferredFoot = 'left' | 'right' | 'both';

// ─── Código ISO 3166-1 alpha-2 de nacionalidade ───────────────────────────────
export type NationalityCode = string; // ex: 'BR', 'AR', 'DE', 'FR'

// ─── Trait names (doc 10 §5) ──────────────────────────────────────────────────
export type TraitName =
  | 'Matador'
  | 'Maestro'
  | 'Capitão'
  | 'Muralha'
  | 'Clutch Player'
  | 'Big Game Player'
  | 'Iron Man'
  | 'Fast Recovery'
  | 'Super Sub'
  | 'Dead Ball Specialist'
  | 'Hero Moment'
  | 'Gelo nas Veias'
  | 'Leader';
