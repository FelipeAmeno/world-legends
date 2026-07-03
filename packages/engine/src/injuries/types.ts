/**
 * Tipos de `injuries` — sétimo submódulo do Match Engine (doc 19 §10/§18;
 * nesta sessão, T009). Fonte: `docs/09-match-engine-master.md` §12.
 *
 * `InjurySeverity` foi DEFINIDO em `events/types.ts` na Tarefa T007
 * (porque `InjuryEvent` precisava dele e `injuries` ainda não existia).
 * Agora que `injuries` é o dono conceitual deste tipo, ele é promovido
 * para aqui — `events/types.ts` passa a IMPORTAR de `injuries` em vez de
 * redefinir (mesmo padrão usado para `Position` na Tarefa T005, quando
 * `chemistry` precisou do mesmo tipo que `overall` já tinha definido).
 */
export type InjurySeverity = 'leve' | 'moderada' | 'grave';

/** Ordem de gravidade — usada para "severidade igual ou maior" na recaída (doc 09 §12). */
export const INJURY_SEVERITY_ORDER: Readonly<Record<InjurySeverity, number>> = {
  leve: 0,
  moderada: 1,
  grave: 2,
};

/** doc 09 §12 — faixa de dias de recuperação por severidade, antes de qualquer fator de durabilidade/trait. */
export const INJURY_RECOVERY_DAYS_RANGE: Readonly<
  Record<InjurySeverity, readonly [number, number]>
> = {
  leve: [3, 7],
  moderada: [10, 21],
  grave: [28, 60],
};
