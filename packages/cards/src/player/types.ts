/**
 * Tipos do agregado `Player` — a entidade histórica real.
 *
 * Doc 17 §3: Player é um agregado simples (sem entidades internas com
 * identidade própria), composto de Value Objects: Nationality, EraRange,
 * PositionSet, BaseAttributeSet. Nunca é removido — apenas marcado inativo
 * (cartas históricas dependem de sua existência permanente).
 *
 * Doc 02 §3 (DDL `players`): os campos e restrições do banco espelham
 * estes tipos — mas `cards` não conhece o banco. Os invariantes são
 * garantidos aqui em memória, independente de qualquer persistência.
 *
 * Relação com `engine`: os 19 atributos de `AttributeSet` (doc 09 §1)
 * já foram definidos em `packages/engine/src/overall/types.ts`. Aqui
 * redefinimos o mesmo contrato (mesma forma, mesmo conjunto de chaves)
 * sem importar `engine` — doc 18 §3 é explícito: `cards` não depende de
 * `engine`. A duplicação é intencional e documentada: são dois contratos
 * paralelos no mesmo "atributo real", em bounded contexts separados
 * (Catálogo vs. Engine de simulação).
 */
import type { NationalityCode, Position, PreferredFoot } from '@world-legends/types';

// ─── PlayerId ─────────────────────────────────────────────────────────────────
/** Identificador opaco de Player — UUID no banco, mas `cards` não sabe disso. */
export type PlayerId = string & { readonly _brand: 'PlayerId' };

export function playerId(value: string): PlayerId {
  if (value.trim().length === 0) {
    throw new Error('PlayerId não pode ser vazio');
  }
  return value as PlayerId;
}

// ─── Value Objects ────────────────────────────────────────────────────────────

/**
 * EraRange (doc 17 §3): intervalo de relevância do jogador em Copas.
 * Invariante: era_start ≤ era_end.
 */
export type EraRange = Readonly<{
  readonly start: number;
  readonly end: number;
}>;

/**
 * PositionSet (doc 17 §3): posição primária + posições secundárias.
 * Invariante: primaryPosition ∈ enum Position; sem duplicatas entre
 * primária e secundárias.
 */
export type PositionSet = Readonly<{
  readonly primary: Position;
  readonly secondary: readonly Position[];
}>;

/**
 * BaseAttributeSet — os 19 atributos base de um jogador (doc 09 §1).
 * Valores em [1, 99]. Nomes em snake_case seguindo a convenção de doc 02
 * e `engine/overall/types.ts` (onde estes mesmos atributos são usados
 * para calcular Overall e Força de Time).
 *
 * NOTA: doc 08 §2.1 usa "shooting_power"/"mental" em lugar de
 * "shot_power"/"composure" — inconsistência entre rascunho (doc 08) e
 * canônico (doc 09 §1). Usamos os nomes de doc 09, que é o canônico.
 */
export type BaseAttributeSet = Readonly<{
  readonly pace: number;
  readonly stamina: number;
  readonly physical: number;
  readonly heading: number;
  readonly finishing: number;
  readonly shot_power: number;
  readonly passing: number;
  readonly vision: number;
  readonly dribbling: number;
  readonly penalty_kicks: number;
  readonly defending: number;
  readonly composure: number;
  readonly aggression: number;
  readonly leadership: number;
  readonly gk_reflexes: number;
  readonly gk_positioning: number;
  readonly gk_handling: number;
  readonly gk_kicking: number;
  readonly gk_penalty_save: number;
}>;

// ─── Player ───────────────────────────────────────────────────────────────────

/**
 * Aggregate Root do bounded context Catálogo (doc 17 §3).
 * Representa um jogador histórico real — independente de quantas cartas
 * dele existam no catálogo.
 */
export type Player = Readonly<{
  readonly id: PlayerId;
  /** Nome completo para registros/auditoria (ex: "Edson Arantes do Nascimento"). */
  readonly fullName: string;
  /** Nome de exibição na carta (ex: "Pelé"). */
  readonly knownAs: string;
  readonly birthYear: number;
  readonly nationality: NationalityCode;
  readonly positions: PositionSet;
  readonly preferredFoot: PreferredFoot;
  readonly heightCm: number;
  readonly era: EraRange;
  readonly baseAttributes: BaseAttributeSet;
  readonly bioShort: string;
  /**
   * Proveniência dos atributos base (doc 08 §2.1 — exigido para
   * auditoria/conformidade legal antes de publicação comercial).
   */
  readonly sourceNotes: string;
  /** Doc 17 §3: nunca deletado, só inativado. */
  readonly isActive: boolean;
}>;
