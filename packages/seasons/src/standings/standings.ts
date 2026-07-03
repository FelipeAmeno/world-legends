/**
 * Cálculo da tabela de classificação (T040).
 *
 * Ordem de desempate:
 *   1. Pontos (desc)
 *   2. Saldo de gols (desc)
 *   3. Gols marcados (desc)
 *   4. Nome do time (asc, alfabético)
 */
import type { Season, SeasonTeam, StandingsEntry } from '../types/types';
import { POINTS_DRAW, POINTS_LOSS, POINTS_WIN } from '../types/types';

// ─── calculateStandings ───────────────────────────────────────────────────────

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: standings calculation requires iterating matches and goals
export function calculateStandings(season: Season): readonly StandingsEntry[] {
  // Inicializar acumuladores
  const stats = new Map<
    string,
    {
      won: 0;
      drawn: 0;
      lost: 0;
      gf: 0;
      ga: 0;
      pts: 0;
    }
  >(season.teams.map((t) => [t.teamId, { won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, pts: 0 }]));

  // Acumular resultados de todas as rodadas
  for (const round of season.rounds) {
    for (const match of round.matches) {
      if (match.status !== 'played' || match.homeScore === null || match.awayScore === null)
        continue;

      const h = stats.get(match.homeTeamId);
      const a = stats.get(match.awayTeamId);
      if (!h || !a) continue;

      h.gf += match.homeScore;
      h.ga += match.awayScore;
      a.gf += match.awayScore;
      a.ga += match.homeScore;

      if (match.homeScore > match.awayScore) {
        h.won++;
        h.pts += POINTS_WIN;
        a.lost++;
        a.pts += POINTS_LOSS;
      } else if (match.homeScore < match.awayScore) {
        a.won++;
        a.pts += POINTS_WIN;
        h.lost++;
        h.pts += POINTS_LOSS;
      } else {
        h.drawn++;
        h.pts += POINTS_DRAW;
        a.drawn++;
        a.pts += POINTS_DRAW;
      }
    }
  }

  // Construir entries não ordenadas
  const teamMap = new Map<string, SeasonTeam>(season.teams.map((t) => [t.teamId, t]));
  const entries: StandingsEntry[] = [];

  for (const [teamId, s] of stats) {
    // biome-ignore lint/style/noNonNullAssertion: stats keys come from season.teams so teamMap always has the entry
    const team = teamMap.get(teamId)!;
    const played = s.won + s.drawn + s.lost;
    entries.push(
      Object.freeze({
        position: 0, // calculado após sort
        teamId,
        teamName: team.teamName,
        isUser: team.isUser,
        played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.gf,
        goalsAgainst: s.ga,
        goalDiff: s.gf - s.ga,
        points: s.pts,
      }),
    );
  }

  // Ordenar: pontos → saldo → gols pró → nome
  entries.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName),
  );

  // Atribuir posições
  return Object.freeze(entries.map((e, i) => Object.freeze({ ...e, position: i + 1 })));
}

// ─── getChampion ─────────────────────────────────────────────────────────────

export function getChampion(season: Season): SeasonTeam | null {
  if (season.status !== 'completed') return null;
  const standings = calculateStandings(season);
  if (standings.length === 0) return null;
  // biome-ignore lint/style/noNonNullAssertion: standings.length > 0 guarantees index 0 exists
  const leader = standings[0]!;
  return season.teams.find((t) => t.teamId === leader.teamId) ?? null;
}

// ─── getUserStanding ─────────────────────────────────────────────────────────

export function getUserStanding(season: Season): StandingsEntry | null {
  const standings = calculateStandings(season);
  return standings.find((e) => e.teamId === season.userTeamId) ?? null;
}
