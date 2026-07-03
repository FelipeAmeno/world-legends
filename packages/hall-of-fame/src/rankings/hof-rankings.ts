/**
 * Rankings de prestígio do Hall da Fama (doc 10 §21, TC-HOF-05).
 *
 * "Ordenação correta por categoria de prestígio, com critério de
 * desempate definido e consistente." (TC-HOF-05)
 *
 * Cinco funções puras — sem efeito colateral, sem banco.
 * Cada função recebe um array de snapshots e retorna o ranking ordenado.
 *
 * CRITÉRIOS DE DESEMPATE (um por categoria, definidos e consistentes):
 *   top-collectors  → totalCards (2°) → legendaryPlusCount (3°) → displayName A-Z
 *   top-wins        → bestWinStreak (2°) → totalRankedMatches (3°) → displayName A-Z
 *   top-seasons     → seasonsAsWorldLegend (2°) → bestGlobalRank (3°, menor = melhor) → displayName A-Z
 *   top-goats       → displayName A-Z (tiebreaker final)
 *   top-album       → albumsCompleted (2°) → displayName A-Z
 */
import type {
  CollectorSnapshot, WinsSnapshot, SeasonSnapshot, GoatSnapshot,
} from '../categories/types';

// ─── Tipos de entrada/saída ───────────────────────────────────────────────────

export type HofEntry<T> = Readonly<{
  readonly rank: number;
  readonly profileId: string;
  readonly displayName: string;
  readonly snapshot: T;
}>;

export type HofRanking<T> = Readonly<{
  readonly category: string;
  readonly description: string;
  readonly entries: readonly HofEntry<T>[];
  readonly totalCount: number;
}>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function assignRanks<T>(
  sorted: Array<{ profileId: string; displayName: string; snapshot: T }>,
  category: string,
  description: string,
): HofRanking<T> {
  const entries: HofEntry<T>[] = sorted.map((item, idx) =>
    Object.freeze({
      rank: idx + 1,
      profileId: item.profileId,
      displayName: item.displayName,
      snapshot: item.snapshot,
    }),
  );

  return Object.freeze({
    category,
    description,
    entries: Object.freeze(entries),
    totalCount: entries.length,
  });
}

// ─── TOP COLECIONADORES (doc 10 §21: "Coleção Mais Completa") ────────────────

/**
 * Critério principal: albumsCompleted DESC.
 * Desempates: bestAlbumCompletion DESC → legendaryPlusCount DESC → displayName ASC.
 *
 * Decisão de interpretação: "Coleção Mais Completa" = maior número de
 * álbuns completos primeiro, depois a profundidade da coleção.
 */
export function rankTopCollectors(
  snapshots: readonly CollectorSnapshot[],
): HofRanking<CollectorSnapshot> {
  const sorted = [...snapshots].sort((a, b) => {
    if (b.albumsCompleted   !== a.albumsCompleted)   return b.albumsCompleted   - a.albumsCompleted;
    if (b.bestAlbumCompletion !== a.bestAlbumCompletion) return b.bestAlbumCompletion - a.bestAlbumCompletion;
    if (b.legendaryPlusCount !== a.legendaryPlusCount) return b.legendaryPlusCount - a.legendaryPlusCount;
    if (b.totalCards         !== a.totalCards)         return b.totalCards         - a.totalCards;
    return a.displayName.localeCompare(b.displayName);
  });

  return assignRanks(
    sorted.map((s) => ({ profileId: s.profileId, displayName: s.displayName, snapshot: s })),
    'top-collectors',
    'Coleção Mais Completa — jogadores com mais álbuns completados.',
  );
}

// ─── TOP VITÓRIAS (doc 10 §21: "Maior Sequência de Vitórias Ranqueadas") ─────

/**
 * Critério principal: bestWinStreak DESC (sequência histórica, não atual).
 * Desempates: totalRankedWins DESC → totalRankedMatches DESC → displayName ASC.
 */
export function rankTopWins(
  snapshots: readonly WinsSnapshot[],
): HofRanking<WinsSnapshot> {
  const sorted = [...snapshots].sort((a, b) => {
    if (b.bestWinStreak      !== a.bestWinStreak)      return b.bestWinStreak      - a.bestWinStreak;
    if (b.totalRankedWins    !== a.totalRankedWins)    return b.totalRankedWins    - a.totalRankedWins;
    if (b.totalRankedMatches !== a.totalRankedMatches) return b.totalRankedMatches - a.totalRankedMatches;
    return a.displayName.localeCompare(b.displayName);
  });

  return assignRanks(
    sorted.map((s) => ({ profileId: s.profileId, displayName: s.displayName, snapshot: s })),
    'top-wins',
    'Maior Sequência de Vitórias Ranqueadas — mestres da consistência.',
  );
}

// ─── TOP TEMPORADAS (doc 06 §3.2) ─────────────────────────────────────────────

/**
 * Critério principal: seasonsAsWorldLegend DESC (quantas vezes chegou ao topo).
 * Desempates: seasonsPlayed DESC → bestGlobalRank ASC (menor rank = melhor) → displayName ASC.
 */
export function rankTopSeasons(
  snapshots: readonly SeasonSnapshot[],
): HofRanking<SeasonSnapshot> {
  const sorted = [...snapshots].sort((a, b) => {
    if (b.seasonsAsWorldLegend !== a.seasonsAsWorldLegend)
      return b.seasonsAsWorldLegend - a.seasonsAsWorldLegend;
    if (b.seasonsPlayed !== a.seasonsPlayed) return b.seasonsPlayed - a.seasonsPlayed;
    // bestGlobalRank: menor é melhor (rank 1 > rank 100)
    if (a.bestGlobalRank !== b.bestGlobalRank) return a.bestGlobalRank - b.bestGlobalRank;
    return a.displayName.localeCompare(b.displayName);
  });

  return assignRanks(
    sorted.map((s) => ({ profileId: s.profileId, displayName: s.displayName, snapshot: s })),
    'top-seasons',
    'Top Temporadas — jogadores com mais temporadas como World Legend.',
  );
}

// ─── TOP GOATs (doc 10 §21: "Mais GOATs Desbloqueados") ──────────────────────

/**
 * Critério principal: goatCount DESC.
 * Desempate: displayName ASC (consistente e determinístico — TC-HOF-05).
 *
 * GOAT é o topo da pirâmide de prestígio (doc 10 §11).
 */
export function rankTopGoats(
  snapshots: readonly GoatSnapshot[],
): HofRanking<GoatSnapshot> {
  const sorted = [...snapshots].sort((a, b) => {
    if (b.goatCount !== a.goatCount) return b.goatCount - a.goatCount;
    return a.displayName.localeCompare(b.displayName);
  });

  return assignRanks(
    sorted.map((s) => ({ profileId: s.profileId, displayName: s.displayName, snapshot: s })),
    'top-goats',
    'Mais GOATs Desbloqueados — o mais exclusivo dos ranking de prestígio.',
  );
}

// ─── TOP COLEÇÃO / ÁLBUM (doc 10 §21: "Primeiro a Completar o Álbum") ───────

/**
 * Critério principal: albumsCompleted DESC.
 * Desempates: bestAlbumCompletion DESC → displayName ASC.
 *
 * Diferente de rankTopCollectors: este ranking foca exclusivamente em
 * conclusão de álbuns, sem considerar totalCards ou raridades.
 */
export function rankTopAlbum(
  snapshots: readonly CollectorSnapshot[],
): HofRanking<CollectorSnapshot> {
  const sorted = [...snapshots].sort((a, b) => {
    if (b.albumsCompleted     !== a.albumsCompleted)     return b.albumsCompleted     - a.albumsCompleted;
    if (b.bestAlbumCompletion !== a.bestAlbumCompletion) return b.bestAlbumCompletion - a.bestAlbumCompletion;
    return a.displayName.localeCompare(b.displayName);
  });

  return assignRanks(
    sorted.map((s) => ({ profileId: s.profileId, displayName: s.displayName, snapshot: s })),
    'top-album',
    'Primeiro a Completar o Álbum — colecionadores que foram até o fim.',
  );
}
