/**
 * Regression Guards permanentes (doc 12 §12).
 *
 * "Nenhum patch é aprovado sem que todos os sete cenários abaixo sejam
 * reexecutados e aprovados — independentemente de o patch parecer, a
 * princípio, não relacionado a nenhum deles." (doc 12 §12)
 *
 * Implementados como funções puras de validação. Em produção, são
 * executados no gate de aprovação de patch (doc 11 §25) via simulações
 * Monte Carlo (doc 11 §15). Aqui, são os critérios de aceitação
 * aplicados sobre métricas pré-computadas.
 *
 * Os 7 cenários do doc 12 §12:
 *   G1 — 11 Ultras: WinrateDelta competitivo ≤ +6pp
 *   G2 — 11 World Cup Hero: mesmo critério de G1
 *   G3 — Química máxima: bônus medido = +4, nunca mais
 *   G4 — Combo máximo (Onze Completo + química perfeita): agregado ≤ +10
 *   G5 — Stack de traits (Leader/Capitão): nunca excede 2×base nem 2 Capitães
 *   G6 — Cartas Prime: segunda fonte de bônus = 60% de eficiência
 *   G7 — Eventos ativos: nenhuma interação cruzada bônus-ocasião × trait
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type GuardResult = Readonly<{
  readonly guardId: string;
  readonly scenario: string;
  readonly passed: boolean;
  readonly criterion: string;
  readonly measuredValue: number;
  readonly acceptanceThreshold: number;
  readonly message: string;
}>;

// ─── Critérios do doc 12 §12 ─────────────────────────────────────────────────

/** G1 — 11 Ultras: WinrateDelta competitivo ≤ +6pp (doc 12 §12). */
export function guardElevenUltras(winrateDelta: number): GuardResult {
  const threshold = 0.06;
  const passed = winrateDelta <= threshold;
  return Object.freeze({
    guardId: 'G1-eleven-ultras',
    scenario: '11 Ultras vs squad de referência',
    passed,
    criterion: 'WinrateDelta competitivo ≤ +6pp (doc 11 §1)',
    measuredValue: winrateDelta,
    acceptanceThreshold: threshold,
    message: passed
      ? `✓ G1: WinrateDelta(11 Ultras)=${(winrateDelta * 100).toFixed(2)}pp ≤ 6pp. APROVADO.`
      : `✗ G1: WinrateDelta(11 Ultras)=${(winrateDelta * 100).toFixed(2)}pp > 6pp. REPROVADO — patch bloqueado.`,
  });
}

/** G2 — 11 World Cup Hero: mesmo critério de G1 (doc 12 §12, §11b Caso 2). */
export function guardElevenWCH(winrateDelta: number): GuardResult {
  const threshold = 0.06;
  const passed = winrateDelta <= threshold;
  return Object.freeze({
    guardId: 'G2-eleven-wch',
    scenario: '11 World Cup Hero vs squad de referência',
    passed,
    criterion: 'WinrateDelta competitivo ≤ +6pp (doc 11b, Caso 2)',
    measuredValue: winrateDelta,
    acceptanceThreshold: threshold,
    message: passed
      ? `✓ G2: WinrateDelta(11 WCH)=${(winrateDelta * 100).toFixed(2)}pp ≤ 6pp. APROVADO.`
      : `✗ G2: WinrateDelta(11 WCH)=${(winrateDelta * 100).toFixed(2)}pp > 6pp. REPROVADO — patch bloqueado.`,
  });
}

/** G3 — Química máxima: bônus medido = +4, nunca mais (doc 12 §12). */
export function guardMaxChemistry(measuredBonus: number): GuardResult {
  const threshold = 4;
  const passed = measuredBonus <= threshold;
  return Object.freeze({
    guardId: 'G3-max-chemistry',
    scenario: 'Química máxima (todos os links ativos)',
    passed,
    criterion: 'Bônus medido = +4, nunca mais (doc 11, §5)',
    measuredValue: measuredBonus,
    acceptanceThreshold: threshold,
    message: passed
      ? `✓ G3: Bônus de química=${measuredBonus} ≤ +4. APROVADO.`
      : `✗ G3: Bônus de química=${measuredBonus} > +4. REPROVADO — teto de química violado.`,
  });
}

/**
 * G4 — Combo máximo (Onze Completo + química perfeita): agregado ≤ +10
 * (doc 12 §12, Orçamento Global de Sinergia do doc 11 §8).
 */
export function guardMaxCombo(measuredAggregateBonus: number): GuardResult {
  const threshold = 10;
  const passed = measuredAggregateBonus <= threshold;
  return Object.freeze({
    guardId: 'G4-max-combo',
    scenario: 'Combo máximo: Onze Completo + química perfeita',
    passed,
    criterion: 'Bônus agregado medido ≤ +10, nunca mais (doc 11 §8)',
    measuredValue: measuredAggregateBonus,
    acceptanceThreshold: threshold,
    message: passed
      ? `✓ G4: Bônus agregado=${measuredAggregateBonus} ≤ +10. APROVADO.`
      : `✗ G4: Bônus agregado=${measuredAggregateBonus} > +10. REPROVADO — Orçamento Global violado.`,
  });
}

/**
 * G5a — Stack de Leader: bônus nunca excede 2× base (doc 12 §12).
 * G5b — Stack de Capitão: nunca 2 Capitães simultâneos (exclusividade de slot).
 */
export function guardTraitStack(
  leaderBonusMultiple: number,
  captainCount: number,
): { g5a: GuardResult; g5b: GuardResult } {
  const g5a = Object.freeze({
    guardId: 'G5a-leader-stack',
    scenario: 'Stack de trait Leader (múltiplas cópias)',
    passed: leaderBonusMultiple <= 2,
    criterion: 'Bônus de Leader nunca excede 2× base (convergência geométrica, doc 11 §7)',
    measuredValue: leaderBonusMultiple,
    acceptanceThreshold: 2,
    message:
      leaderBonusMultiple <= 2
        ? `✓ G5a: Leader bonus múltiplo=${leaderBonusMultiple}× ≤ 2×. APROVADO.`
        : `✗ G5a: Leader bonus múltiplo=${leaderBonusMultiple}× > 2×. REPROVADO.`,
  });
  const g5b = Object.freeze({
    guardId: 'G5b-captain-uniqueness',
    scenario: 'Exclusividade de slot do Capitão',
    passed: captainCount <= 1,
    criterion: 'Nunca mais de 1 Capitão simultâneo (slot exclusivo, doc 11 §7)',
    measuredValue: captainCount,
    acceptanceThreshold: 1,
    message:
      captainCount <= 1
        ? `✓ G5b: Capitão count=${captainCount} ≤ 1. APROVADO.`
        : `✗ G5b: Capitão count=${captainCount} > 1. REPROVADO — mais de um Capitão em campo.`,
  });
  return { g5a, g5b };
}

/**
 * G6 — Cartas Prime: segunda fonte de bônus sobre o mesmo atributo = 60%
 * de eficiência, nunca 100% (doc 12 §12, doc 11b §4).
 */
export function guardPrimeCardBonus(secondSourceEfficiency: number): GuardResult {
  // Deve ser ≈ 0.60 ± tolerância; acima de 0.80 é sinal de violação
  const minThreshold = 0.55;
  const maxThreshold = 0.8;
  const passed = secondSourceEfficiency >= minThreshold && secondSourceEfficiency <= maxThreshold;
  return Object.freeze({
    guardId: 'G6-prime-card-bonus',
    scenario: 'Cartas Prime + trait do mesmo atributo',
    passed,
    criterion: 'Segunda fonte de bônus = 60% de eficiência, nunca 100% (doc 11b §4)',
    measuredValue: secondSourceEfficiency,
    acceptanceThreshold: maxThreshold,
    message: passed
      ? `✓ G6: Eficiência da 2ª fonte=${(secondSourceEfficiency * 100).toFixed(1)}% ≈ 60%. APROVADO.`
      : `✗ G6: Eficiência da 2ª fonte=${(secondSourceEfficiency * 100).toFixed(1)}% fora de [55%,80%]. REPROVADO.`,
  });
}

/**
 * G7 — Eventos ativos: nenhuma interação cruzada entre bônus de ocasião
 * e modificadores percentuais de trait (doc 12 §12, doc 11b §4).
 * `crossInteractionDetected`: true se a simulação detectou interação cruzada.
 */
export function guardEventIsolation(crossInteractionDetected: boolean): GuardResult {
  return Object.freeze({
    guardId: 'G7-event-isolation',
    scenario: 'Eventos ativos: separação bônus-ocasião × trait',
    passed: !crossInteractionDetected,
    criterion: 'Nenhuma interação cruzada detectada nos logs de simulação (doc 11b §4)',
    measuredValue: crossInteractionDetected ? 1 : 0,
    acceptanceThreshold: 0,
    message: !crossInteractionDetected
      ? '✓ G7: Nenhuma interação cruzada detectada. APROVADO.'
      : '✗ G7: Interação cruzada detectada entre bônus de ocasião e trait. REPROVADO.',
  });
}

// ─── runAllGuards ─────────────────────────────────────────────────────────────

export type RegressionGuardInput = Readonly<{
  readonly g1_winrateDeltaUltras: number;
  readonly g2_winrateDeltaWCH: number;
  readonly g3_maxChemistryBonus: number;
  readonly g4_maxComboBonus: number;
  readonly g5_leaderBonusMultiple: number;
  readonly g5_captainCount: number;
  readonly g6_primeEfficiency: number;
  readonly g7_crossInteraction: boolean;
}>;

export type RegressionGuardReport = Readonly<{
  readonly allPassed: boolean;
  readonly passCount: number;
  readonly failCount: number;
  readonly results: readonly GuardResult[];
  readonly summary: string;
}>;

/**
 * Executa todos os 7 Regression Guards e retorna o relatório completo.
 * `allPassed = false` → patch bloqueado (doc 12 §12).
 */
export function runAllGuards(input: RegressionGuardInput): RegressionGuardReport {
  const { g5a, g5b } = guardTraitStack(input.g5_leaderBonusMultiple, input.g5_captainCount);

  const results: GuardResult[] = [
    guardElevenUltras(input.g1_winrateDeltaUltras),
    guardElevenWCH(input.g2_winrateDeltaWCH),
    guardMaxChemistry(input.g3_maxChemistryBonus),
    guardMaxCombo(input.g4_maxComboBonus),
    g5a,
    g5b,
    guardPrimeCardBonus(input.g6_primeEfficiency),
    guardEventIsolation(input.g7_crossInteraction),
  ];

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.length - passCount;
  const allPassed = failCount === 0;

  return Object.freeze({
    allPassed,
    passCount,
    failCount,
    results: Object.freeze(results),
    summary: allPassed
      ? `✓ Todos os ${passCount} Regression Guards aprovados. Patch pode ser liberado.`
      : `✗ ${failCount} Regression Guard(s) reprovado(s) de ${results.length}. Patch BLOQUEADO.`,
  });
}
