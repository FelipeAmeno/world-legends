import type { ValidationError } from '@world-legends/shared';
/**
 * Tipos centrais do bounded context Squad (doc 17 §11, doc 18 §3).
 *
 * `Squad`         — Aggregate Root: id, userId, formation, starters, bench.
 * `SquadSlot`     — Value Object: um slot de formação (pode estar vazio ou ocupado).
 * `SquadError`    — union discriminada de todos os motivos de falha.
 * `ChemistryScore`— resultado do cálculo de química (doc 11 §4.2).
 *
 * Doc 18 §3: este package não importa packages de domínio concretos
 * (cards, collection, economy). Toda dependência externa é expressa
 * como Port (interface injetada).
 */
import type { Position } from '@world-legends/types';

// ─── Branded IDs ─────────────────────────────────────────────────────────────

export type SquadId = string & { readonly _brand: 'SquadId' };

export function squadId(v: string): SquadId {
  if (!v.trim()) throw new Error('SquadId não pode ser vazio');
  return v as SquadId;
}

// ─── Formações válidas (doc 09 §1, doc 17 §11) ───────────────────────────────

export type Formation =
  | '4-3-3'
  | '4-4-2'
  | '4-2-3-1'
  | '3-5-2'
  | '5-3-2'
  | '4-5-1'
  | '4-1-4-1'
  | '3-4-3';

export const ALL_FORMATIONS: readonly Formation[] = [
  '4-3-3',
  '4-4-2',
  '4-2-3-1',
  '3-5-2',
  '5-3-2',
  '4-5-1',
  '4-1-4-1',
  '3-4-3',
];

// ─── SquadSlot — Value Object ─────────────────────────────────────────────────

/**
 * Um slot de formação.
 * `slotId` é único dentro do squad (ex: "CB-1", "CB-2", "ST-1").
 * `userCardId` é null enquanto o slot está vazio.
 */
export type SquadSlot = Readonly<{
  readonly slotId: string;
  readonly requiredPosition: Position;
  readonly userCardId: string | null;
}>;

// ─── Squad — Aggregate Root ───────────────────────────────────────────────────

export type Squad = Readonly<{
  readonly id: SquadId;
  readonly userId: string;
  readonly formation: Formation;
  /** Exatamente 11 slots (doc 09 §1). */
  readonly starters: readonly SquadSlot[];
  /** Máximo 7 (doc 09 §12.2). UserCardIds diretos. */
  readonly bench: readonly string[];
  readonly name: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}>;

// ─── PlayerInfo — Port (injetada pelos testes/adaptadores) ───────────────────

/**
 * Informações mínimas de um UserCard necessárias para o squad domain.
 * Não importa UserCard diretamente — usa esta interface (Ports & Adapters).
 */
export type PlayerInfo = Readonly<{
  readonly userCardId: string;
  readonly userId: string;
  readonly naturalPosition: Position;
  readonly nationality: string;
  readonly overall: number;
  readonly isInjured: boolean;
  readonly suspendedMatches: number;
}>;

// ─── ChemistryScore — Value Object ───────────────────────────────────────────

/**
 * Resultado do cálculo de química de um squad completo (doc 11 §4.2).
 *
 * Fórmula por jogador (0–10):
 *   positionFit (0–4):
 *     4 = posição natural, 2 = posição compatível, 0 = fora de posição
 *   nationalityCluster (0–4):
 *     +1 por cada 3 companheiros de mesma nação (max 4)
 *   formationBonus (0–2):
 *     +2 se o squad tem ≥10 titulares preenchidos
 *
 * Score total do squad = average dos 11 jogadores × 10 (normalizado para 0–100).
 */
export type ChemistryScore = Readonly<{
  /** 0–100 (total normalizado). */
  readonly total: number;
  /** 0–10 (média por jogador). */
  readonly average: number;
  /** userCardId → score individual (0–10). */
  readonly perPlayer: Readonly<Record<string, number>>;
  readonly breakdown: Readonly<{
    readonly positionFit: number; // soma de todos (0–44)
    readonly nationalityBonus: number; // soma de todos (0–44)
    readonly formationBonus: number; // soma de todos (0–22)
  }>;
}>;

// ─── SquadError — union discriminada ─────────────────────────────────────────

export type SquadError =
  /** Formação não reconhecida. */
  | Readonly<{ kind: 'InvalidFormation'; formation: string }>
  /** Squad já tem 11 titulares. */
  | Readonly<{ kind: 'SquadFull' }>
  /** Banco já tem 7 jogadores. */
  | Readonly<{ kind: 'BenchFull' }>
  /** slotId não existe na formação. */
  | Readonly<{ kind: 'SlotNotFound'; slotId: string }>
  /** Slot já está ocupado por outro jogador. */
  | Readonly<{ kind: 'SlotOccupied'; slotId: string }>
  /** Posição do jogador incompatível com o slot. */
  | Readonly<{ kind: 'IncompatiblePosition'; playerPos: Position; slotPos: Position }>
  /** Jogador já está no squad (titulares ou banco). */
  | Readonly<{ kind: 'PlayerAlreadyInSquad'; userCardId: string }>
  /** Jogador lesionado — não pode ser titular (pode ser banco). */
  | Readonly<{ kind: 'PlayerInjured'; userCardId: string }>
  /** Jogador suspenso — não pode ser titular. */
  | Readonly<{ kind: 'PlayerSuspended'; userCardId: string; matches: number }>
  /** Jogador não encontrado nas cartas do usuário. */
  | Readonly<{ kind: 'PlayerNotFound'; userCardId: string }>
  /** Jogador não pertence ao userId do squad. */
  | Readonly<{ kind: 'PlayerOwnershipMismatch'; userCardId: string }>
  /** Squad incompleto para validação (não tem 11 titulares). */
  | Readonly<{ kind: 'IncompleteSquad'; filledSlots: number }>
  /** ValidationError de inputs básicos (string vazia, etc.). */
  | ValidationError;
