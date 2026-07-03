/**
 * `weather` — doc 09 §8. Sorteio determinístico + os efeitos numéricos
 * documentados que têm um lugar concreto para entrar nas fórmulas já
 * construídas (T004/T008/§17). Doc 09 não dá pesos de distribuição
 * entre as 5 condições — uso distribuição UNIFORME (decisão explícita,
 * não documentada, na ausência de qualquer peso dado).
 *
 * Efeitos da tabela de §8 que NÃO estão conectados nesta primeira
 * versão, por exigirem mecânicas que `match` ainda não modela:
 * "chance de evento bizarro +3pp" (escorregão/gol contra aleatório —
 * nenhum mecanismo de evento "bizarro" existe); "vento forte: variância
 * maior em cobranças de longa distância" (não distingo chute de longe
 * vs. de dentro da área no modelo de xG desta versão).
 */
import type { RNGInstance } from '../rng/rng';
import type { Weather } from './types';

const ALL_WEATHERS: readonly Weather[] = [
  'ensolarado',
  'chuva',
  'calor_extremo',
  'frio_intenso',
  'vento_forte',
];

export function rollWeather(rng: RNGInstance): Weather {
  return rng.choice(ALL_WEATHERS);
}

/**
 * doc 09 §8, chuva: "passing e dribbling efetivos -8%". Mapeado para o
 * eixo "precisão" do multiplicador de clima dentro da fórmula de xG
 * (doc 09 §17: `modificadorClima(contexto, eixo="precisao")`) — é o
 * único dos 5 efeitos de clima que a própria fórmula de xG já reserva
 * um lugar explícito para receber.
 */
export function calculateWeatherPrecisionModifier(weather: Weather): number {
  return weather === 'chuva' ? 0.92 : 1.0;
}

/**
 * doc 09 §8, frio intenso: "shot_power e dribbling -5%". Aplicado
 * diretamente aos dois atributos que entram na "qualidade de
 * finalização" do xG (doc 09 §17), não a um multiplicador externo à
 * fórmula.
 */
export function applyColdWeatherToFinishingAttributes(
  shotPower: number,
  dribbling: number,
  weather: Weather,
): { shotPower: number; dribbling: number } {
  if (weather !== 'frio_intenso') {
    return { shotPower, dribbling };
  }
  return { shotPower: shotPower * 0.95, dribbling: dribbling * 0.95 };
}

/**
 * doc 09 §8, calor extremo: "acúmulo de fadiga +25% a partir do minuto
 * 45". Multiplicador aplicado por cima do resultado de
 * `calculateIntraMatchFatigue` (T008) — não altera o módulo `fatigue`
 * em si, a composição acontece aqui, mesmo padrão usado para a
 * integração de Iron Man/Fast Recovery em `injuries`/`fatigue`.
 */
export function calculateWeatherFatigueMultiplier(weather: Weather, minute: number): number {
  return weather === 'calor_extremo' && minute >= 45 ? 1.25 : 1.0;
}

/** doc 09 §8, chuva: "leve aumento de chance de lesão (+0.5pp)". */
export function calculateWeatherInjuryChanceBonus(weather: Weather): number {
  return weather === 'chuva' ? 0.005 : 0;
}
