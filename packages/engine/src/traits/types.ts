/**
 * TraitMagnitude — união discriminada com uma variante por trait
 * (docs/10-card-system-master.md, §5 lista os 13 traits;
 * docs/11-balance-competitive-validation-master.md, §7 dá o teto
 * numérico de cada um).
 *
 * Por que uma variante por trait, em vez de um único
 * `{ trait: string, value: number }` genérico: doc 19, linha 176, é
 * explícito — "TraitMagnitude não deveria expor um construtor que
 * aceite qualquer número; deveria expor apenas formas de criação que já
 * recebem o teto daquele trait como parte da própria definição do
 * tipo." Um tipo genérico com teto validado em runtime por um
 * dicionário externo ainda permitiria, em tese, passar o teto errado
 * para o trait errado. Com 13 fábricas distintas (`traits.ts`), cada uma
 * com seu teto como uma constante hardcoded dentro de SI MESMA, esse
 * erro é estruturalmente impossível — não há nenhum caminho de código
 * que action permita validar "Matador" contra o teto de "Dead Ball
 * Specialist".
 *
 * Dois traits (Capitão, Iron Man) têm efeito mecânico COMPOSTO (dois
 * números documentados, não um) — refletido fielmente em dois campos,
 * não forçado a um único número.
 */

export type MatadorMagnitude = Readonly<{
  trait: 'Matador';
  /** Bônus de conversão (xG) em chances claras dentro da área — teto 12 (doc 11 §7). */
  areaConversionBonusPercent: number;
}>;

export type MaestroMagnitude = Readonly<{
  trait: 'Maestro';
  /** Bônus na chance de assistência em jogada com link de química — teto 10. */
  assistChanceBonusPercent: number;
}>;

export type CapitaoMagnitude = Readonly<{
  trait: 'Capitão';
  /** Pontos de moral inicial do time — teto 6. */
  initialMoralBonus: number;
  /** Redução percentual na queda de moral intra-partida — teto 30. */
  moralDecayReductionPercent: number;
}>;

export type MuralhaMagnitude = Readonly<{
  trait: 'Muralha';
  /** Redução no xG do adversário nas jogadas em que participa — teto 10. */
  opponentXgReductionPercent: number;
}>;

export type ClutchPlayerMagnitude = Readonly<{
  trait: 'Clutch Player';
  /** Bônus de desempenho efetivo após o minuto 76 — teto 8. */
  lateGamePerformanceBonusPercent: number;
}>;

export type BigGamePlayerMagnitude = Readonly<{
  trait: 'Big Game Player';
  /** Bônus de desempenho efetivo em partidas de alta importância — teto 8. */
  highImportancePerformanceBonusPercent: number;
}>;

export type IronManMagnitude = Readonly<{
  trait: 'Iron Man';
  /** Redução no risco-base de lesão — teto 25. */
  injuryRiskReductionPercent: number;
  /** Redução na taxa de fadiga de calendário — teto 20. */
  fatigueRateReductionPercent: number;
}>;

export type FastRecoveryMagnitude = Readonly<{
  trait: 'Fast Recovery';
  /** Redução na duração de qualquer lesão sofrida — teto 30. */
  injuryDurationReductionPercent: number;
}>;

export type SuperSubMagnitude = Readonly<{
  trait: 'Super Sub';
  /** Bônus de atributos efetivos nos primeiros 15 minutos após entrar — teto 10. */
  firstMinutesAttributeBonusPercent: number;
}>;

export type DeadBallSpecialistMagnitude = Readonly<{
  trait: 'Dead Ball Specialist';
  /** Bônus em cobranças de falta direta, escanteio e pênalti — teto 15. */
  setPieceBonusPercent: number;
}>;

export type HeroMomentMagnitude = Readonly<{
  trait: 'Hero Moment';
  /** Chance ADICIONAL (em pontos percentuais) de "momento heroico" sob pressão — teto 0.5pp. */
  rareEventChanceBonusPercentagePoints: number;
}>;

export type GeloNasVeiasMagnitude = Readonly<{
  trait: 'Gelo nas Veias';
  /**
   * Bônus de conversão em disputas de pênalti — teto 10 (doc 11 §7).
   * O doc também descreve qualitativamente "reduz a variância negativa
   * sob pressão" para este trait, mas SEM nenhum número associado em
   * doc nenhum — deliberadamente não representado aqui (ver nota em
   * `traits.ts`, não inventei esse valor).
   */
  penaltyConversionBonusPercent: number;
}>;

export type LeaderMagnitude = Readonly<{
  trait: 'Leader';
  /**
   * Bônus de UMA carta Leader, antes de qualquer empilhamento.
   * Doc 11 §7 dá a FÓRMULA de empilhamento (`calculateLeaderStackedBonus`,
   * em `traits.ts`) mas nunca um teto numérico absoluto para este valor
   * individual — por isso, ao contrário dos outros 12 traits, este
   * campo só é validado como "não-negativo", sem teto percentual
   * específico (lacuna real de documentação, não omissão minha).
   */
  basePerCardBonus: number;
}>;

export type TraitMagnitude =
  | MatadorMagnitude
  | MaestroMagnitude
  | CapitaoMagnitude
  | MuralhaMagnitude
  | ClutchPlayerMagnitude
  | BigGamePlayerMagnitude
  | IronManMagnitude
  | FastRecoveryMagnitude
  | SuperSubMagnitude
  | DeadBallSpecialistMagnitude
  | HeroMomentMagnitude
  | GeloNasVeiasMagnitude
  | LeaderMagnitude;
