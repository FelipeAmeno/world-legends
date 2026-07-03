// packages/engine — Tarefas T003 (rng), T004 (overall), T005 (chemistry),
// T006 (traits), T007 (events), T008 (fatigue), T009 (injuries) e T010
// (match) concluídas.
//
// Oito dos dez submódulos do Match Engine implementados. Ordem fixada
// em docs/19-implementation-strategy-master.md, §10:
// rng → overall → chemistry → traits → fatigue → injuries → events →
// match → penalties → replay. Faltam dois.

export * from './rng';
export * from './overall';
export * from './chemistry';
export * from './traits';
export * from './events';
export * from './fatigue';
export * from './injuries';
export * from './match';
