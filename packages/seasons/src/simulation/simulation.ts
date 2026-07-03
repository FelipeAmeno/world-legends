/**
 * Simulação de partidas de IA (T040).
 *
 * Usado para calcular os resultados das partidas em que o usuário
 * não participa diretamente. Determinístico por seed.
 *
 * Probabilidade de gol baseada na força relativa dos times:
 *   P(home_goal) = strength_home / (strength_home + strength_away) × home_adv
 *   P(away_goal) = 1 - P(home_goal)
 *
 * Total de gols: 2–5 (distribuição uniforme seeded).
 */
import type { SeasonMatch, SeasonTeam } from '../types/types';

// ─── RNG ──────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ─── HOME_ADVANTAGE ──────────────────────────────────────────────────────────

const HOME_ADVANTAGE = 1.15;

// ─── simulateAIMatch ─────────────────────────────────────────────────────────

export type SimulatedScore = Readonly<{ homeScore: number; awayScore: number }>;

/**
 * Simula uma partida entre dois times de IA.
 *
 * @param homeStrength  Força do time da casa (60–99).
 * @param awayStrength  Força do visitante.
 * @param seed          Semente para determinismo.
 */
export function simulateAIMatch(
  homeStrength: number,
  awayStrength: number,
  seed: number,
): SimulatedScore {
  const rng = mulberry32(seed);
  const homeAdj = homeStrength * HOME_ADVANTAGE;
  const pHome = homeAdj / (homeAdj + awayStrength);
  const totalGoals = 2 + Math.floor(rng() * 4); // 2–5 gols

  let homeScore = 0;
  let awayScore = 0;
  for (let i = 0; i < totalGoals; i++) {
    if (rng() < pHome) homeScore++;
    else awayScore++;
  }

  return Object.freeze({ homeScore, awayScore });
}

// ─── simulateRoundAI ─────────────────────────────────────────────────────────

/**
 * Simula todas as partidas IA de uma rodada (exceto a do usuário).
 *
 * @param matches      Partidas da rodada.
 * @param teams        Mapa de teamId → força.
 * @param userTeamId   ID do time do usuário (não simular).
 * @param roundSeed    Seed da rodada.
 */
export function simulateRoundAI(
  matches: readonly SeasonMatch[],
  teamMap: ReadonlyMap<string, number>, // teamId → strength
  userTeamId: string,
  roundSeed: number,
): readonly SeasonMatch[] {
  return Object.freeze(
    matches.map((match, idx) => {
      // Não simular a partida do usuário
      if (match.homeTeamId === userTeamId || match.awayTeamId === userTeamId) {
        return match;
      }

      const homeStr = teamMap.get(match.homeTeamId) ?? 75;
      const awayStr = teamMap.get(match.awayTeamId) ?? 75;
      const matchSeed = roundSeed ^ hashStr(`${match.matchId}`) ^ (idx * 0x9e3779b9);
      const { homeScore, awayScore } = simulateAIMatch(homeStr, awayStr, matchSeed);

      return Object.freeze({
        ...match,
        homeScore,
        awayScore,
        status: 'played' as const,
      });
    }),
  );
}
