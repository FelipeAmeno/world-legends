/**
 * Geração de calendário de 20 rodadas para 8 times (T040).
 *
 * Algoritmo "circle method":
 *   - Fixa o time 0 e rotaciona os outros 7 para gerar 7 rodadas únicas.
 *   - Repete 3 vezes (inversão home/away na 2ª) para 21 rodadas.
 *   - Usa apenas as primeiras 20.
 *
 * Invariantes:
 *   - Cada time joga exatamente 1 partida por rodada.
 *   - 4 partidas por rodada.
 *   - matchId é único e determinístico.
 */
import type { Round, SeasonMatch, SeasonTeam } from '../types/types';
import { MATCHES_PER_ROUND, TOTAL_ROUNDS } from '../types/types';

// ─── generateFixtures ─────────────────────────────────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: round-robin algorithm requires nested loops
export function generateFixtures(teams: readonly SeasonTeam[]): readonly Round[] {
  const n = teams.length; // 8
  const half = n / 2; // 4
  const ids = teams.map((t) => t.teamId);

  // Circle method: posição 0 fixa, rotaciona os demais
  const rotate = (arr: string[], step: number): string[] => {
    // biome-ignore lint/style/noNonNullAssertion: arr always has at least 1 element (circle method)
    const fixed = arr[0]!;
    const rest = arr.slice(1);
    const shifted = [
      ...rest.slice(-step % rest.length),
      ...rest.slice(0, rest.length - (step % rest.length)),
    ];
    return [fixed, ...shifted];
  };

  const rounds: Round[] = [];
  let matchCounter = 0;

  for (let rotation = 0; rotation < 3 && rounds.length < TOTAL_ROUNDS; rotation++) {
    const isReverse = rotation === 1; // 2ª rotação inverte home/away

    for (let r = 0; r < n - 1 && rounds.length < TOTAL_ROUNDS; r++) {
      const current = rotate(ids, r + rotation * (n - 1));
      const matches: SeasonMatch[] = [];

      for (let i = 0; i < half; i++) {
        // biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee i and n-1-i are valid indices
        const a = current[i]!;
        // biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee i and n-1-i are valid indices
        const b = current[n - 1 - i]!;
        const home = isReverse ? b : a;
        const away = isReverse ? a : b;

        matches.push(
          Object.freeze({
            matchId: `m-${++matchCounter}`,
            homeTeamId: home,
            awayTeamId: away,
            homeScore: null,
            awayScore: null,
            status: 'scheduled',
          }),
        );
      }

      rounds.push(
        Object.freeze({
          roundNumber: rounds.length + 1,
          matches: Object.freeze(matches),
          completed: false,
        }),
      );
    }
  }

  return Object.freeze(rounds.slice(0, TOTAL_ROUNDS));
}
