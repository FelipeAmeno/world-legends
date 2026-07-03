/**
 * `fatigue` — cálculo de fadiga, recuperação (via dias de descanso) e
 * efeito no desempenho (subtração de atributo efetivo), fielmente a
 * `docs/09-match-engine-master.md` §7 (fórmulas), §3 (como a fadiga
 * entra na Força do Time — penalidade SUBTRATIVA, não percentual) e
 * §14 (custo de fadiga por tática).
 *
 * Funções de CÁLCULO puras, no mesmo espírito de `calculateOverall`/
 * `calculateChemistry`: confiam no contrato de entrada (atributos já em
 * [1,99], doc 17 Invariantes), sem revalidação em runtime — não são
 * Value Objects como `TraitMagnitude`/os eventos de `events`, então não
 * usam `Result`. "Sem Match Engine": nenhuma função aqui decide QUANDO
 * a fadiga deveria ser aplicada durante uma simulação — isso é `match`.
 */
import type { TacticalIntensity } from './types';

/**
 * "Custo de fadiga" por tática — doc 09 §14, última coluna da tabela.
 * Os outros modificadores da mesma tabela (ataque/meio/defesa) NÃO
 * pertencem a este módulo.
 */
const TACTICAL_FATIGUE_COST_MULTIPLIER: Readonly<Record<TacticalIntensity, number>> = {
  ultra_defensivo: 0.85,
  defensivo: 0.95,
  equilibrado: 1.0,
  ofensivo: 1.1,
  ultra_ofensivo: 1.25,
};

/**
 * Fadiga intra-partida (doc 09 §7, `fadigaIntraPartida`): zero até o
 * minuto 60; depois disso, cresce linearmente, atenuada pela `stamina`
 * do jogador e multiplicada pelo custo de fadiga da tática em uso.
 *
 * `staminaAttribute` espera-se em [1,99] (doc 17 Invariantes) — não
 * revalidado aqui, mesmo contrato de `calculateOverall`.
 */
export function calculateIntraMatchFatigue(input: {
  minute: number;
  staminaAttribute: number;
  tacticalIntensity: TacticalIntensity;
}): number {
  const decayBase = input.minute > 60 ? (input.minute - 60) * 0.15 : 0;
  const tacticalMultiplier = TACTICAL_FATIGUE_COST_MULTIPLIER[input.tacticalIntensity];
  const resistance = input.staminaAttribute / 99;
  return decayBase * tacticalMultiplier * (1 - resistance * 0.5);
}

/**
 * Fadiga de calendário (doc 09 §7, `fadigaDeCalendario`) — É a própria
 * mecânica de RECUPERAÇÃO documentada: mais dias de descanso reduzem (e,
 * a partir de 5 dias, zeram) a fadiga residual entre partidas. Não há,
 * em doc nenhum, uma fórmula de "recuperação" separada desta.
 *
 * `ironManFatigueRateReductionPercent` é a integração documentada com o
 * trait Iron Man (doc 11 §7: "−20% na taxa de fadiga DE CALENDÁRIO"
 * especificamente, não a intra-partida) — opcional, sem efeito (0) se
 * não fornecido. Espera-se o valor já validado de `IronManMagnitude`
 * (T006, teto 20) — não revalidado aqui.
 */
export function calculateCalendarFatigue(input: {
  restDays: number;
  minutesPlayedLastMatch: number;
  ironManFatigueRateReductionPercent?: number;
}): number {
  let baseFatigue: number;
  if (input.restDays >= 5) {
    baseFatigue = 0;
  } else if (input.restDays >= 3) {
    baseFatigue = input.minutesPlayedLastMatch * 0.02;
  } else {
    baseFatigue = input.minutesPlayedLastMatch * 0.05;
  }

  const reductionPercent = input.ironManFatigueRateReductionPercent ?? 0;
  return baseFatigue * (1 - reductionPercent / 100);
}

/**
 * Efeito no desempenho (doc 09 §3: `base -= penalidadeFadigaMedia(...)`)
 * — a fadiga é uma penalidade SUBTRATIVA direta sobre o atributo
 * efetivo, na mesma escala [1,99] do próprio atributo, não um
 * percentual. `totalFatiguePoints` é tipicamente a soma da fadiga de
 * calendário (constante durante toda a partida) com a fadiga
 * intra-partida do minuto atual — somar as duas é responsabilidade de
 * quem chama esta função, não dela.
 */
export function applyFatigueToAttribute(
  baseAttributeValue: number,
  totalFatiguePoints: number,
): number {
  return Math.min(99, Math.max(1, baseAttributeValue - totalFatiguePoints));
}
