/**
 * `PrestigeScore` — pontuação de prestígio composta do Hall da Fama.
 *
 * Doc 10 §21: "rankings de prestígio (não de poder) — função puramente
 * social/status, sem recompensa de poder adicional."
 *
 * O `PrestigeScore` agrega as posições de um jogador em TODAS as
 * categorias em um único número para o ranking geral de prestígio.
 * Jogadores que se destacam em múltiplas categorias têm score mais alto.
 *
 * FÓRMULA (decisão própria — doc 10 §21 não define um número):
 *   score = (goatPoints × 100) + (albumPoints × 50) +
 *           (winStreakPoints × 30) + (seasonPoints × 20) + (collectionPoints × 10)
 *
 * Pesos refletem a hierarquia de prestígio implícita do doc 10:
 * GOAT > álbum completo > sequência de vitórias > temporadas > coleção geral.
 *
 * Funções puras — sem efeito colateral.
 */
import type {
  CollectorSnapshot, WinsSnapshot, SeasonSnapshot, GoatSnapshot,
} from '../categories/types';
import type { HofEntry } from '../rankings/hof-rankings';

// ─── PrestigeScore ────────────────────────────────────────────────────────────

export type PrestigeScore = Readonly<{
  readonly profileId: string;
  readonly displayName: string;
  /** Score total composto. */
  readonly totalScore: number;
  /** Breakdown por categoria. */
  readonly breakdown: Readonly<{
    readonly goatPoints:       number;
    readonly albumPoints:      number;
    readonly winStreakPoints:   number;
    readonly seasonPoints:     number;
    readonly collectionPoints: number;
  }>;
}>;

// ─── Pesos documentados (D-HOF-01) ───────────────────────────────────────────

export const PRESTIGE_WEIGHTS = Object.freeze({
  goat:       100,
  album:       50,
  winStreak:   30,
  season:      20,
  collection:  10,
} as const);

// ─── calculatePrestigeScore ───────────────────────────────────────────────────

/**
 * Calcula o score de prestígio de um jogador a partir dos seus snapshots.
 * Entradas ausentes (null) contribuem com 0 pontos.
 */
export function calculatePrestigeScore(input: {
  profileId: string;
  displayName: string;
  goat?:       GoatSnapshot;
  collector?:  CollectorSnapshot;
  wins?:       WinsSnapshot;
  season?:     SeasonSnapshot;
}): PrestigeScore {
  const goatPoints       = (input.goat?.goatCount        ?? 0) * PRESTIGE_WEIGHTS.goat;
  const albumPoints      = (input.collector?.albumsCompleted ?? 0) * PRESTIGE_WEIGHTS.album;
  const winStreakPoints  = (input.wins?.bestWinStreak    ?? 0) * PRESTIGE_WEIGHTS.winStreak;
  const seasonPoints     = (input.season?.seasonsAsWorldLegend ?? 0) * PRESTIGE_WEIGHTS.season;
  const collectionPoints = Math.floor(
    ((input.collector?.totalCards ?? 0) / 10) * PRESTIGE_WEIGHTS.collection,
  );

  const breakdown = Object.freeze({
    goatPoints,
    albumPoints,
    winStreakPoints,
    seasonPoints,
    collectionPoints,
  });

  return Object.freeze({
    profileId:  input.profileId,
    displayName: input.displayName,
    totalScore: goatPoints + albumPoints + winStreakPoints + seasonPoints + collectionPoints,
    breakdown,
  });
}

// ─── rankByPrestige ───────────────────────────────────────────────────────────

/**
 * Ranking geral de prestígio.
 * Critério: totalScore DESC → goatPoints DESC (GOAT é o mais nobre) → displayName ASC.
 */
export type PrestigeRankingEntry = Readonly<{
  readonly rank: number;
  readonly prestige: PrestigeScore;
}>;

export function rankByPrestige(
  scores: readonly PrestigeScore[],
): readonly PrestigeRankingEntry[] {
  const sorted = [...scores].sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.breakdown.goatPoints !== a.breakdown.goatPoints)
      return b.breakdown.goatPoints - a.breakdown.goatPoints;
    return a.displayName.localeCompare(b.displayName);
  });

  return Object.freeze(
    sorted.map((prestige, idx) =>
      Object.freeze({ rank: idx + 1, prestige }),
    ),
  );
}

// ─── getPrestigeTitle ─────────────────────────────────────────────────────────

/**
 * Título honorífico baseado no score total.
 * Puramente cosmético (doc 10 §21: "função puramente social/status").
 */
export type PrestigeTitle =
  | 'Iniciante'
  | 'Colecionador'
  | 'Veterano'
  | 'Especialista'
  | 'Mestre'
  | 'Lenda da Coleção'
  | 'Imortal';

export function getPrestigeTitle(totalScore: number): PrestigeTitle {
  if (totalScore >= 5000) return 'Imortal';
  if (totalScore >= 2000) return 'Lenda da Coleção';
  if (totalScore >= 1000) return 'Mestre';
  if (totalScore >= 500)  return 'Especialista';
  if (totalScore >= 200)  return 'Veterano';
  if (totalScore >= 50)   return 'Colecionador';
  return 'Iniciante';
}
