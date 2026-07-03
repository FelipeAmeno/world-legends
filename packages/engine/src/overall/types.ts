/**
 * AttributeKey/AttributeSet — definidos aqui, dentro de
 * `engine/src/overall`, como posicionamento DELIBERADAMENTE TEMPORÁRIO.
 *
 * O lugar arquiteturalmente correto para esses tipos é `packages/types`
 * (docs/18-monorepo-architecture-master.md, §2 — tipos cross-domain),
 * construído nas Tarefas T008–T011 do roteiro mestre
 * (docs/19-implementation-strategy-master.md, §18) — que, na ordem
 * documentada, viriam ANTES dos submódulos de `engine`. Esta sessão
 * pulou direto para `engine` (T003 rng, T004 overall, T005 chemistry, na
 * numeração desta conversa), então esses tipos não existem ainda em
 * `types`.
 *
 * `Position` foi promovido para `../position.ts` na Tarefa T005 (passou a
 * ser usado por `chemistry` também) — reexportado aqui por
 * compatibilidade, para não quebrar quem já importa `Position` a partir
 * deste arquivo.
 */
export type { Position } from '../position';

/** As 19 chaves de atributo — 14 de campo (doc 09 §1.1) + 5 de goleiro (doc 09 §1.2). */
export type AttributeKey =
  | 'pace'
  | 'stamina'
  | 'physical'
  | 'heading'
  | 'finishing'
  | 'shot_power'
  | 'passing'
  | 'vision'
  | 'dribbling'
  | 'penalty_kicks'
  | 'defending'
  | 'composure'
  | 'aggression'
  | 'leadership'
  | 'gk_reflexes'
  | 'gk_positioning'
  | 'gk_handling'
  | 'gk_kicking'
  | 'gk_penalty_save';

/**
 * O conjunto completo de atributos de um jogador. Por doc 17
 * (Invariantes), cada valor pertence a [1, 99] — essa validação de
 * faixa/completude pertence à futura Value Object que constrói
 * `AttributeSet` (fora do escopo desta tarefa); `calculateOverall` confia
 * no contrato e não revalida em runtime (ver justificativa de
 * performance em `overall.ts`).
 */
export type AttributeSet = Readonly<Record<AttributeKey, number>>;
