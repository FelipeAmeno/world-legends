/**
 * Alertas automáticos (doc 12 §10).
 *
 * Cada alerta é uma função pura que recebe métricas e retorna um
 * `AlertResult` — sem pub/sub, sem side effects. A camada de aplicação
 * decide o que fazer (notificar, abrir ticket, etc.).
 *
 * "Qualquer linha desta tabela que ultrapasse seu sinal de 'quebrado'
 * por 2 ciclos de medição consecutivos dispara automaticamente um Alerta."
 * (doc 12 §5) — o rastreamento de "2 ciclos" é responsabilidade da
 * camada de aplicação; este package fornece as funções de avaliação.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export type AlertResult = Readonly<{
  readonly triggered: boolean;
  readonly alertId: string;
  readonly severity: AlertSeverity;
  readonly message: string;
  readonly value: number;
  readonly threshold: number;
  readonly action: string;
}>;

// ─── Alertas do doc 12 §10 ────────────────────────────────────────────────────

/**
 * Taxa de W.O. anormal (DD-01 — doc 12 §10).
 * Gatilho: > 0,05% sustentado por 2+ ciclos.
 */
export function alertWalkoverRate(currentRate: number): AlertResult {
  const threshold = 0.0005;
  const triggered = currentRate > threshold;
  return Object.freeze({
    triggered,
    alertId: 'walkover-rate-dd01',
    severity: 'medium' as const,
    message: triggered
      ? `Taxa de W.O. (${(currentRate * 100).toFixed(3)}%) excede o limiar de 0,05%. Revisar cartões (doc 09 §10) e lesões (doc 09 §12).`
      : `Taxa de W.O. normal (${(currentRate * 100).toFixed(3)}%).`,
    value: currentRate,
    threshold,
    action: 'Revisão das probabilidades de cartão (doc 09 §10) e lesão (doc 09 §12)',
  });
}

/**
 * Desempate por seed anormal em pênaltis (DD-02 — doc 12 §10).
 * Gatilho: ativação acima do esperado estatístico em amostra grande.
 * (Threshold: > 1% é sinal de conversão artificialmente próxima de 50/50.)
 */
export function alertSeedTiebreakRate(currentRate: number): AlertResult {
  const threshold = 0.01; // 1% — acima disso sugere problema de calibração
  const triggered = currentRate > threshold;
  return Object.freeze({
    triggered,
    alertId: 'seed-tiebreak-rate-dd02',
    severity: 'medium' as const,
    message: triggered
      ? `Taxa de desempate por seed (${(currentRate * 100).toFixed(2)}%) acima do esperado. Revisar taxas de conversão de pênalti (doc 09 §18).`
      : `Taxa de desempate por seed normal (${(currentRate * 100).toFixed(2)}%).`,
    value: currentRate,
    threshold,
    action: 'Revisão das taxas de conversão de pênalti (doc 09 §18)',
  });
}

/**
 * Economia inflacionada (doc 12 §10).
 * Gatilho: Índice de Inflação positivo sustentado por 4+ semanas.
 */
export function alertInflation(inflationIndex: number): AlertResult {
  const threshold = 0;
  const triggered = inflationIndex > threshold;
  return Object.freeze({
    triggered,
    alertId: 'economy-inflation',
    severity: 'high' as const,
    message: triggered
      ? `Índice de Inflação positivo (${inflationIndex.toFixed(4)}). Revisar sinks/sources.`
      : `Economia saudável (Índice: ${inflationIndex.toFixed(4)}).`,
    value: inflationIndex,
    threshold,
    action: 'Revisão de sinks/sources (doc 12 §7)',
  });
}

/**
 * Drop rates anormais (doc 12 §10).
 * Gatilho: desvio observado vs. declarado > 0,1pp em amostra de 1M+.
 * Severidade: crítica (requer suspensão preventiva do pacote suspeito).
 */
export function alertDropRateDeviation(
  observedRate: number,
  declaredRate: number,
  sampleSize: number,
): AlertResult {
  const MIN_SAMPLE = 1_000_000;
  const threshold = 0.001; // 0,1 pp
  const deviation = Math.abs(observedRate - declaredRate);
  const triggered = sampleSize >= MIN_SAMPLE && deviation > threshold;

  return Object.freeze({
    triggered,
    alertId: 'drop-rate-deviation',
    severity: 'critical' as const,
    message: triggered
      ? `Desvio de drop rate detectado: observado=${(observedRate * 100).toFixed(3)}% vs declarado=${(declaredRate * 100).toFixed(3)}%. Amostra: ${sampleSize.toLocaleString()}. Suspender pacote suspeito.`
      : `Drop rates dentro do esperado (desvio: ${(deviation * 100).toFixed(4)}pp).`,
    value: deviation,
    threshold,
    action: 'Suspensão preventiva do pacote suspeito, investigação imediata',
  });
}

/**
 * Winrate de carta/trait/combo acima de 60% (doc 12 §10).
 * Gatilho: winrate bruto > 60% em confronto equilibrado.
 */
export function alertHighWinRate(entityId: string, winRate: number): AlertResult {
  const threshold = 0.6;
  const triggered = winRate > threshold;
  return Object.freeze({
    triggered,
    alertId: `high-winrate-${entityId}`,
    severity: 'high' as const,
    message: triggered
      ? `Winrate de "${entityId}" (${(winRate * 100).toFixed(1)}%) excede 60%. Revisar balanceamento.`
      : `Winrate de "${entityId}" dentro do esperado (${(winRate * 100).toFixed(1)}%).`,
    value: winRate,
    threshold,
    action: 'Entra na fila de revisão de balanceamento',
  });
}

/**
 * Combo dominante (doc 12 §10).
 * Gatilho: InclusionRate > 20% e WinrateDelta > +5pp, 2+ ciclos.
 */
export function alertDominantCombo(
  comboId: string,
  inclusionRate: number,
  winrateDelta: number,
): AlertResult {
  const threshold = { inclusionRate: 0.2, winrateDelta: 0.05 };
  const triggered =
    inclusionRate > threshold.inclusionRate && winrateDelta > threshold.winrateDelta;
  return Object.freeze({
    triggered,
    alertId: `dominant-combo-${comboId}`,
    severity: 'high' as const,
    message: triggered
      ? `Combo "${comboId}" dominante: inclusão=${(inclusionRate * 100).toFixed(1)}% (>${threshold.inclusionRate * 100}%), WinrateDelta=+${(winrateDelta * 100).toFixed(1)}pp (>${threshold.winrateDelta * 100}pp).`
      : `Combo "${comboId}" dentro dos limites.`,
    value: inclusionRate,
    threshold: threshold.inclusionRate,
    action: 'Competitive Modifier obrigatório em até 14 dias (doc 11, seção 18)',
  });
}

/**
 * Meta tóxica — arquétipo fora da banda 10%–30% (doc 12 §6).
 */
export function alertMetaHealth(archetypeId: string, adoptionRate: number): AlertResult {
  const min = 0.1;
  const max = 0.3;
  const triggered = adoptionRate < min || adoptionRate > max;
  return Object.freeze({
    triggered,
    alertId: `meta-health-${archetypeId}`,
    severity: 'medium' as const,
    message: triggered
      ? `Arquétipo "${archetypeId}" fora da banda saudável (${(adoptionRate * 100).toFixed(1)}%). Banda: 10%–30%.`
      : `Arquétipo "${archetypeId}" saudável (${(adoptionRate * 100).toFixed(1)}%).`,
    value: adoptionRate,
    threshold: triggered && adoptionRate > max ? max : min,
    action: 'Repassado à análise de funil (doc 12 §9)',
  });
}
