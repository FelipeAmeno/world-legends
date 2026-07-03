import type { RNGInstance } from '../rng/rng';
/**
 * `injuries` — tipos de lesão, tempo de recuperação, efeitos (risco de
 * recaída) e integração com os traits Iron Man e Fast Recovery,
 * fielmente a `docs/09-match-engine-master.md` §12.
 *
 * Funções de cálculo/sorteio puras: recebem um `RNGInstance` (T003)
 * explicitamente como parâmetro — nenhum estado global, determinístico
 * dado o mesmo seed, mesmo espírito de `rng`/`chemistry`/`fatigue`.
 * "Sem partidas ainda": nenhuma função aqui decide QUANDO uma lesão
 * deveria ser sorteada durante uma simulação (ex: "jogador foi vítima
 * de falta, sortear lesão agora") — isso é `match`. Este módulo só
 * fornece os blocos: dado que uma lesão (ou seu risco) deveria ser
 * avaliada, qual o resultado.
 */
import type { FastRecoveryMagnitude, IronManMagnitude } from '../traits/types';
import { INJURY_RECOVERY_DAYS_RANGE, INJURY_SEVERITY_ORDER, type InjurySeverity } from './types';

/** doc 09 §12 — as duas chances-base documentadas de lesão (antes de qualquer redução de Iron Man). */
export const INJURY_CHANCE_FOUL_VICTIM = 0.04;
export const INJURY_CHANCE_PHYSICAL_DUEL = 0.015;

/** doc 09 §12 — "Risco de recaída": 15% por partida até completar 100% do tempo de recuperação. */
export const RELAPSE_RISK_PER_MATCH = 0.15;

/**
 * "Tipos de lesão": sorteia a severidade (doc 09 §12,
 * `severidade = SE roll<0.6: "leve" SENÃO SE roll<0.9: "moderada" SENÃO "grave"`).
 * Não decide SE uma lesão ocorre — ver `shouldInjuryOccur`.
 */
export function rollInjurySeverity(rng: RNGInstance): InjurySeverity {
  const roll = rng.nextFloat();
  if (roll < 0.6) return 'leve';
  if (roll < 0.9) return 'moderada';
  return 'grave';
}

/**
 * Decide SE uma lesão ocorre, dada uma chance-base (doc 09 §12:
 * `SE roll(rng) > probabilidadeBaseDoEvento: RETORNA nenhuma` — ou
 * seja, lesão ocorre quando o roll fica ABAIXO da chance, mesma
 * convenção de `<` usada no resto do código-base).
 */
export function shouldInjuryOccur(baseChance: number, rng: RNGInstance): boolean {
  return rng.nextFloat() < baseChance;
}

/**
 * Integração com o trait Iron Man (doc 11 §7: "−25% risco-base de
 * lesão"). Recebe a própria `IronManMagnitude` validada (T006), não um
 * número solto — impossível passar por engano o percentual de outro
 * trait aqui. Sem o trait (`undefined`), a chance não é alterada.
 */
export function applyIronManRiskReduction(baseChance: number, ironMan?: IronManMagnitude): number {
  const reductionPercent = ironMan?.injuryRiskReductionPercent ?? 0;
  return baseChance * (1 - reductionPercent / 100);
}

/** doc 09 §12: "físico alto reduz duração um pouco" — `1 - (physical/198)`. */
export function calculateInjuryDurabilityFactor(physicalAttribute: number): number {
  return 1 - physicalAttribute / 198;
}

/**
 * "Tempo de recuperação": sorteia um número de dias dentro da faixa
 * documentada da severidade (doc 09 §12, `INJURY_RECOVERY_DAYS`),
 * ajustado pelo fator de durabilidade física e, se aplicável, pela
 * integração com o trait Fast Recovery (doc 11 §7: "−30% duração de
 * lesão") — mesmo padrão de `IronManMagnitude` acima: recebe a
 * `FastRecoveryMagnitude` validada, não um número solto.
 */
export function sampleRecoveryDays(input: {
  severity: InjurySeverity;
  physicalAttribute: number;
  rng: RNGInstance;
  fastRecovery?: FastRecoveryMagnitude;
}): number {
  const [minDays, maxDays] = INJURY_RECOVERY_DAYS_RANGE[input.severity];
  const baseDays = input.rng.nextInt(minDays, maxDays);
  const durabilityFactor = calculateInjuryDurabilityFactor(input.physicalAttribute);
  const days = baseDays * durabilityFactor;
  const reductionPercent = input.fastRecovery?.injuryDurationReductionPercent ?? 0;
  return days * (1 - reductionPercent / 100);
}

/**
 * "Efeitos": o risco de recaída (doc 09 §12) — se o jogador retorna a
 * campo antes de cumprir 100% do tempo de recuperação previsto, há
 * 15% de chance por partida de uma nova lesão da mesma região.
 */
export function shouldRelapse(rng: RNGInstance): boolean {
  return rng.nextFloat() < RELAPSE_RISK_PER_MATCH;
}

/**
 * "Efeitos": severidade da lesão por recaída — doc 09 §12 exige
 * "severidade igual ou maior" à original, mas não documenta um
 * algoritmo exato de amostragem para essa restrição. Decisão minha,
 * explícita: sorteio normal de severidade (`rollInjurySeverity`) e, se
 * o resultado for MENOS grave que o original, eleva-o até o original —
 * nunca inventa uma distribuição nova, só respeita o piso documentado.
 */
export function determineRelapseSeverity(
  originalSeverity: InjurySeverity,
  rng: RNGInstance,
): InjurySeverity {
  const rolled = rollInjurySeverity(rng);
  return INJURY_SEVERITY_ORDER[rolled] >= INJURY_SEVERITY_ORDER[originalSeverity]
    ? rolled
    : originalSeverity;
}
