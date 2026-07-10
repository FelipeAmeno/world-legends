/**
 * lib/procedural-scene/seed.ts — Sprint 27 (Procedural Scene Engine)
 *
 * Toda a Scene procedural (e o Pose Engine da Sprint 28, que consome o
 * mesmo seed) precisa ser DETERMINÍSTICA: a mesma carta sempre gera a
 * mesma cena, nunca `Math.random()`. Fonte do seed, por especificação
 * explícita do brief: `playerId + country + rarity + position`.
 *
 * Implementação própria (não reaproveita `@world-legends/engine`'s RNG)
 * — de propósito: aquele RNG pertence ao domínio de simulação de
 * partida (bounded context separado, streams nomeados por partida). A
 * apresentação visual da carta é um contexto diferente, sem nenhuma
 * relação com uma partida — um hash+PRNG local, pequeno e auto-contido,
 * evita acoplar dois domínios que não têm nada a ver um com o outro.
 *
 * Algoritmo: FNV-1a (hash da string → uint32) + mulberry32 (PRNG a
 * partir do uint32) — mesma dupla de algoritmos já usada em
 * `packages/shared`/`packages/engine`, por serem simples, sem
 * dependência externa, e com qualidade estatística mais que suficiente
 * pra variar cor/ângulo/posição — não é criptografia.
 */

import type { RarityCode } from '@world-legends/types';

export type ProceduralSeedInput = Readonly<{
  playerId: string;
  nationality: string;
  rarityCode: RarityCode;
  position: string;
}>;

/** FNV-1a de 32 bits — determinístico, mesma string sempre produz o mesmo hash. */
function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Seed numérico único pra uma carta — combina os 4 campos exigidos pelo
 * brief num único string antes de fazer o hash, na ordem
 * `playerId:nationality:rarityCode:position` (ordem fixa, nunca muda —
 * mudar a ordem mudaria todos os seeds já "vistos" pelos jogadores).
 */
export function computeProceduralSeed(input: ProceduralSeedInput): number {
  return fnv1aHash(`${input.playerId}:${input.nationality}:${input.rarityCode}:${input.position}`);
}

/** Deriva um sub-seed independente pra um "canal" nomeado (background, lighting, ...) — evita que todos os geradores fiquem correlacionados por consumirem o mesmo número em sequência. */
export function deriveChannelSeed(seed: number, channel: string): number {
  return fnv1aHash(`${seed}:${channel}`);
}

export type Rng = () => number;

/** mulberry32 — gerador determinístico de floats em [0, 1). */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Float determinístico em [min, max) — arredondado pra 2 casas decimais.
 * Sem o arredondamento, a maioria dos valores desta função acaba direto
 * em atributos JSX (`%`, `deg`, `s`) renderizados no SSR — e a
 * serialização de um float "cru" pode divergir por 1 dígito entre o
 * Node (SSR) e o navegador (hidratação), disparando um hydration
 * mismatch real do React (achado testando ao vivo — ver `rig.ts`'s
 * `round2` pro mesmo problema no Pose Engine). 2 casas decimais bastam
 * pra qualquer cor/ângulo/posição visual.
 */
export function rngRange(rng: Rng, min: number, max: number): number {
  return Math.round((min + rng() * (max - min)) * 100) / 100;
}

/** Inteiro determinístico em [min, max], ambos inclusive. */
export function rngInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rngRange(rng, min, max + 1));
}

/** Escolhe um elemento de uma lista não vazia, distribuição uniforme. */
export function rngChoice<T>(rng: Rng, items: readonly T[]): T {
  // biome-ignore lint/style/noNonNullAssertion: caller guarantees items is non-empty
  return items[rngInt(rng, 0, items.length - 1)]!;
}
