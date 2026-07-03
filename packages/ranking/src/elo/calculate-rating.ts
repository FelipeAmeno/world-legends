/**
 * `calculateNewRating` — fórmula Elo documentada em doc 06 §3.1.
 *
 * FONTE PRIMÁRIA (código exato do doc 06 §3.1):
 * ```ts
 * const K_FACTOR = 24;
 * function updateElo(ratingA, ratingB, result) {
 *   const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
 *   const scoreA = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
 *   const newA = Math.round(ratingA + K_FACTOR * (scoreA - expectedA));
 *   const newB = Math.round(ratingB + K_FACTOR * ((1 - scoreA) - (1 - expectedA)));
 *   return [newA, newB];
 * }
 * ```
 *
 * RESTRIÇÃO DOCUMENTADA (doc 06 §3.1, doc 17 §14):
 * "Aplicado apenas em partidas public_ranked; ligas privadas NUNCA afetam o Elo."
 * O parâmetro `matchType` é obrigatório e a função retorna erro se o tipo não
 * for `public_ranked` — não apenas documenta, mas ENFORCEMENT em runtime.
 *
 * CONSTANTES NÃO DOCUMENTADAS (decisão calibrada, marcada):
 * - `ELO_INITIAL = 1000`: ponto de partida de novos jogadores (padrão histórico
 *   de sistemas Elo, sem contraindição nos docs).
 * - `ELO_FLOOR = 100`: rating mínimo absoluto — nenhum jogador cai abaixo de 100,
 *   evitando que perdas seguidas tornem o matchmaking impossível.
 * Ambas decisões próprias, documentadas aqui.
 */
import { Err, Ok, type Result, type ValidationError, validationError } from '@world-legends/shared';

// ─── Constantes (doc 06 §3.1) ─────────────────────────────────────────────────

/** Fator K documentado exatamente no doc 06 §3.1. */
export const K_FACTOR = 24;

/**
 * Rating inicial para novos jogadores.
 * Não documentado com número preciso; escolhido como 1000 (padrão histórico).
 * Calibrado para que Bronze comece em 0–999 e Prata em 1000–1499.
 */
export const ELO_INITIAL = 1000;

/**
 * Floor absoluto de rating. Nunca negativo (doc 17 §14: EloRating é um VO positivo).
 * Decisão própria — não documentada com número preciso.
 */
export const ELO_FLOOR = 100;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type MatchResult = 'win' | 'draw' | 'loss';

/** Tipo de partida — só `public_ranked` atualiza Elo (doc 06 §3.1, doc 17 §14). */
export type MatchType = 'public_ranked' | 'private_league' | 'friendly';

export type EloRating = number & { readonly _brand: 'EloRating' };

export function eloRating(value: number): EloRating {
  return Math.max(ELO_FLOOR, Math.round(value)) as EloRating;
}

export type EloUpdateResult = Readonly<{
  readonly newRatingA: EloRating;
  readonly newRatingB: EloRating;
  readonly deltaA: number;
  readonly deltaB: number;
  readonly expectedA: number;
  readonly expectedB: number;
}>;

export type EloError = ValidationError | Readonly<{ kind: 'NotRankedMatch'; matchType: MatchType }>;

// ─── calculateNewRating ───────────────────────────────────────────────────────

/**
 * Calcula os novos ratings Elo de dois jogadores após uma partida ranqueada.
 *
 * @param ratingA   - Rating atual do jogador A
 * @param ratingB   - Rating atual do jogador B
 * @param result    - Resultado DO PONTO DE VISTA DE A ('win'=A venceu, 'loss'=A perdeu)
 * @param matchType - Tipo da partida; retorna Err se não for 'public_ranked'
 */
export function calculateNewRating(
  ratingA: number,
  ratingB: number,
  result: MatchResult,
  matchType: MatchType,
): Result<EloUpdateResult, EloError> {
  // Enforcement documentado: só partidas ranqueadas afetam o Elo (doc 06 §3.1)
  if (matchType !== 'public_ranked') {
    return Err(Object.freeze({ kind: 'NotRankedMatch' as const, matchType }));
  }

  if (!Number.isFinite(ratingA) || ratingA < 0) {
    return Err(validationError(`ratingA inválido: ${ratingA}`, 'ratingA'));
  }
  if (!Number.isFinite(ratingB) || ratingB < 0) {
    return Err(validationError(`ratingB inválido: ${ratingB}`, 'ratingB'));
  }

  // Fórmula exata do doc 06 §3.1
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const expectedB = 1 - expectedA;

  const scoreA = result === 'win' ? 1 : result === 'draw' ? 0.5 : 0;
  const scoreB = 1 - scoreA;

  const rawNewA = ratingA + K_FACTOR * (scoreA - expectedA);
  const rawNewB = ratingB + K_FACTOR * (scoreB - expectedB);

  const newRatingA = eloRating(Math.max(ELO_FLOOR, Math.round(rawNewA)));
  const newRatingB = eloRating(Math.max(ELO_FLOOR, Math.round(rawNewB)));

  return Ok(
    Object.freeze({
      newRatingA,
      newRatingB,
      deltaA: newRatingA - ratingA,
      deltaB: newRatingB - ratingB,
      expectedA: Math.round(expectedA * 1000) / 1000,
      expectedB: Math.round(expectedB * 1000) / 1000,
    }),
  );
}

/**
 * Calcula a probabilidade esperada de vitória de A contra B.
 * Útil para matchmaking (doc 06 §3.3: janela de 100 pontos).
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

/**
 * Verifica se dois ratings estão dentro da janela de matchmaking (doc 06 §3.3).
 * Janela inicial: ≤100 pontos de diferença, expande 100 a cada 10s de espera.
 */
export function isMatchmakingCompatible(
  ratingA: number,
  ratingB: number,
  windowExpansion = 0,
): boolean {
  const BASE_WINDOW = 100;
  return Math.abs(ratingA - ratingB) <= BASE_WINDOW + windowExpansion;
}
