/**
 * RNG — gerador de números pseudoaleatórios determinístico.
 *
 * Primeiro submódulo de `packages/engine` (docs/19-implementation-strategy-master.md,
 * §10 e §18, Tarefa T012 no roteiro mestre — chamada aqui de T003): tudo o
 * que vier depois (overall, chemistry, traits, fatigue, injuries, events,
 * match, penalties, replay) consome aleatoriedade através deste módulo, e
 * nunca diretamente de `Math.random()`.
 *
 * Algoritmo: mulberry32. Escolhido por ser de domínio público, com uma
 * única palavra de estado de 32 bits, sem nenhuma dependência externa, e
 * com qualidade estatística e período (2^32) mais que suficientes para
 * simulação de partidas — não é adequado a uso criptográfico, e não
 * precisa ser (docs/09-match-engine-master.md, §21 já trata determinismo
 * como requisito de reprodutibilidade, não de segurança).
 *
 * Nota sobre "stateless" (docs/17-domain-model-master.md, §13): o Match
 * Engine como pacote/serviço de domínio não tem identidade nem é
 * persistido — essa caracterização é sobre a ARQUITETURA, não sobre cada
 * função individual internamente. Um gerador de números pseudoaleatórios
 * É estado mutável por natureza (cada chamada precisa avançar a semente
 * interna); o que importa é que esse estado fica inteiramente encapsulado
 * dentro do closure de uma única instância de `RNG`, nunca é lido nem
 * escrito de fora, e desaparece quando a instância deixa de ser
 * referenciada — exatamente como uma variável local dentro de uma função
 * pura comum. Nenhum outro módulo do monorepo enxerga esse estado.
 */
import { type Seed, deriveStream, toUint32 } from '@world-legends/shared';

/** Um item participante de um sorteio com peso relativo. */
export type WeightedItem<T> = Readonly<{ readonly value: T; readonly weight: number }>;

/** Superfície pública de uma instância de RNG — todos os métodos consomem o mesmo stream interno. */
export type RNGInstance = Readonly<{
  /** Próximo float pseudoaleatório no intervalo [0, 1). */
  nextFloat: () => number;
  /** Próximo inteiro pseudoaleatório no intervalo [min, max], ambos inclusive. */
  nextInt: (min: number, max: number) => number;
  /** Deriva uma nova instância de RNG, independente e determinística, para um stream nomeado. */
  derive: (streamLabel: string) => RNGInstance;
  /** Retorna uma NOVA lista embaralhada (Fisher-Yates) — nunca modifica a lista de entrada. */
  shuffle: <T>(items: readonly T[]) => T[];
  /** Escolhe um elemento da lista com distribuição uniforme. */
  choice: <T>(items: readonly T[]) => T;
  /** Escolhe um elemento da lista com distribuição proporcional ao peso de cada item. */
  weightedChoice: <T>(items: readonly WeightedItem<T>[]) => T;
  /**
   * Estado interno bruto (uint32) NESTE ponto do stream — Sprint 26
   * (Gameplay Foundation). Existe só para permitir serializar uma
   * simulação em andamento (ex: intervalo de uma partida) através de um
   * round-trip stateless (server action → cliente → server action),
   * reconstruindo o mesmo stream exato via `restoreRNG` sem repetir
   * nenhum sorteio já consumido. Não expõe o Seed original nem quebra o
   * encapsulamento documentado acima — é só o ponteiro de progresso.
   */
  getState: () => number;
}>;

/**
 * Cria uma instância de RNG a partir de um Seed (`@world-legends/shared`).
 * O mesmo Seed produz sempre, e exatamente, a mesma sequência de
 * resultados em qualquer máquina, em qualquer execução.
 */
export function RNG(seed: Seed): RNGInstance {
  return createFromState(toUint32(seed), seed);
}

/**
 * Reconstrói uma instância de RNG a partir de um estado bruto capturado
 * via `getState()` — Sprint 26 (Gameplay Foundation). Continua o MESMO
 * stream exatamente de onde parou (nenhum sorteio pulado ou repetido),
 * diferente de `RNG(seed).derive(label)`, que sempre reinicia a partir
 * do Seed original. `derive()` não é suportado numa instância restaurada
 * (não há Seed original disponível) — nenhum consumidor atual do engine
 * precisa derivar sub-streams no meio de uma partida, só os 6 streams
 * nomeados de nível superior (`initializeMatchRngStreams`).
 */
export function restoreRNG(state: number): RNGInstance {
  return createFromState(state >>> 0);
}

function createFromState(initialState: number, seed?: Seed): RNGInstance {
  let state = initialState;

  function nextFloat(): number {
    // Passo do mulberry32: avança `state` e deriva um float em [0, 1)
    // a partir dele. As constantes são as do algoritmo original.
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function nextInt(min: number, max: number): number {
    if (max < min) {
      throw new Error(`nextInt(): max (${max}) não pode ser menor que min (${min}).`);
    }
    return min + Math.floor(nextFloat() * (max - min + 1));
  }

  function derive(streamLabel: string): RNGInstance {
    // Independente do quanto esta instância já foi consumida — deriva
    // sempre a partir do Seed original, nunca do estado numérico atual
    // (docs/09-match-engine-master.md, §21: streams nomeados precisam
    // ser reproduzíveis isoladamente, sem depender de ordem de consumo).
    if (seed === undefined) {
      throw new Error('derive() não é suportado numa instância restaurada via restoreRNG().');
    }
    return RNG(deriveStream(seed, streamLabel));
  }

  function shuffle<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = nextInt(0, i);
      // Non-null assertion justificada pelo invariante do laço: tanto `i`
      // quanto `j` estão sempre dentro de [0, result.length - 1].
      // biome-ignore lint/style/noNonNullAssertion: i is within [0, result.length-1] loop invariant
      const temp = result[i]!;
      // biome-ignore lint/style/noNonNullAssertion: j is within [0, i] <= result.length-1
      result[i] = result[j]!;
      result[j] = temp;
    }
    return result;
  }

  function choice<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('choice() não pode ser chamado com uma lista vazia.');
    }
    const index = nextInt(0, items.length - 1);
    // biome-ignore lint/style/noNonNullAssertion: index is within [0, items.length-1]
    return items[index]!;
  }

  function weightedChoice<T>(items: readonly WeightedItem<T>[]): T {
    if (items.length === 0) {
      throw new Error('weightedChoice() não pode ser chamado com uma lista vazia.');
    }
    let totalWeight = 0;
    for (const item of items) {
      if (item.weight < 0) {
        throw new Error(`weightedChoice() recebeu um peso negativo: ${item.weight}.`);
      }
      totalWeight += item.weight;
    }
    if (totalWeight <= 0) {
      throw new Error('weightedChoice() requer ao menos um peso positivo na lista.');
    }

    const draw = nextFloat() * totalWeight;
    let cumulative = 0;
    for (const item of items) {
      cumulative += item.weight;
      if (draw < cumulative) {
        return item.value;
      }
    }
    // Rede de segurança para erro de arredondamento de ponto flutuante:
    // matematicamente `draw` é sempre < totalWeight, mas a soma
    // acumulada de pontos flutuantes pode divergir por epsilon.
    // biome-ignore lint/style/noNonNullAssertion: items is non-empty (checked above)
    return items[items.length - 1]!.value;
  }

  function getState(): number {
    return state;
  }

  return Object.freeze({ nextFloat, nextInt, derive, shuffle, choice, weightedChoice, getState });
}
