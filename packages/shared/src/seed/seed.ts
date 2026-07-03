import { type ValidationError, validationError } from '../errors/validation-error';
/**
 * Seed — base de toda reprodutibilidade do produto
 * (docs/19-implementation-strategy-master.md, §11). Mesmo valor de
 * entrada produz sempre a mesma sequência derivada.
 *
 * Importante: este módulo NÃO implementa o gerador de números
 * pseudoaleatórios (`mulberry32`, doc 09 §21) — essa é responsabilidade
 * de `packages/engine` (Tarefa T012), construída sobre os Seeds aqui
 * produzidos. Este módulo cobre apenas a parte de **Value Object**: o
 * Seed em si, sua validação, sua igualdade, e a derivação determinística
 * de streams independentes (`derivarSeedDeStream`, doc 09 §21) — que é
 * uma operação sobre o valor do Seed, não sobre geração de aleatoriedade.
 *
 * Value Object: imutável, sem identidade.
 */
import { Err, Ok, type Result } from '../result/result';

export type Seed = Readonly<{ readonly value: string }>;

/** Cria um Seed validado — falha se o valor for uma string vazia ou só espaços. */
export function createSeed(value: string): Result<Seed, ValidationError> {
  if (value.trim().length === 0) {
    return Err(validationError('Seed não pode ser uma string vazia.', 'value'));
  }
  return Ok(Object.freeze({ value }));
}

/** Igualdade por valor — dois Seeds com a mesma string são equivalentes. */
export function equalsSeed(a: Seed, b: Seed): boolean {
  return a.value === b.value;
}

/**
 * Hash determinístico FNV-1a de 32 bits. Escolhido por ser simples, sem
 * dependências externas, e suficiente para os requisitos de determinismo
 * do doc 09 §21 — este NÃO é um requisito de segurança criptográfica,
 * apenas de reprodutibilidade exata e independência estatística razoável
 * entre streams derivados.
 */
function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5; // offset basis de 32 bits do FNV-1a
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // prime de 32 bits do FNV-1a
  }
  return hash >>> 0; // força representação unsigned de 32 bits
}

/**
 * Converte um Seed em um inteiro de 32 bits sem sinal — a forma que um
 * gerador como `mulberry32` (a ser implementado em `packages/engine`,
 * Tarefa T012) consome como estado inicial.
 */
export function toUint32(seed: Seed): number {
  return fnv1aHash(seed.value);
}

/**
 * Deriva um novo Seed, determinístico e independente, a partir de um Seed
 * pai e de um rótulo de stream (doc 09 §21 — ex: "events", "weather",
 * "penalty_tiebreak", doc 15.1). A mesma combinação (pai, rótulo) produz
 * sempre o mesmo Seed derivado; rótulos diferentes produzem Seeds
 * diferentes a partir do mesmo pai.
 */
export function deriveStream(seed: Seed, streamLabel: string): Seed {
  const derivedHash = fnv1aHash(`${seed.value}:${streamLabel}`);
  return Object.freeze({ value: derivedHash.toString(16) });
}
