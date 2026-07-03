/**
 * Tipos de entrada do Hall da Fama.
 *
 * `hall-of-fame` é um package de **leitura agregada** (doc 18 §13).
 * Não persiste nada — recebe snapshots de dados e produz rankings de prestígio.
 *
 * Em produção, esses snapshots são alimentados por Eventos de Domínio
 * acumulados ao longo do tempo. Aqui, são simples objetos imutáveis
 * passados como parâmetros — domínio puro (T021).
 *
 * CATEGORIAS DOCUMENTADAS (doc 10 §21):
 *   "Coleção Mais Completa"           → top-collectors
 *   "Mais GOATs Desbloqueados"        → top-goats
 *   "Maior Sequência de Vitórias"     → top-wins
 *   "Primeiro a Completar o Álbum"    → top-album (sub-categoria de collection)
 *   (Top temporadas, doc 06 §3.2)     → top-seasons
 *
 * Critério de desempate (TC-HOF-05): definido e consistente por categoria.
 */

// ─── ProfileId nominal ────────────────────────────────────────────────────────
export type HofProfileId = string & { readonly _brand: 'HofProfileId' };
export function hofProfileId(v: string): HofProfileId {
  if (!v.trim()) throw new Error('HofProfileId vazio');
  return v as HofProfileId;
}

// ─── Snapshot de dados por jogador ────────────────────────────────────────────

/**
 * Dados de coleção de um jogador — fonte: packages/collection + packages/cards.
 * Passado pela camada de aplicação; hall-of-fame não importa esses packages.
 */
export type CollectorSnapshot = Readonly<{
  readonly profileId: HofProfileId;
  readonly displayName: string;
  /** Total de cartas possuídas (UserCard count). */
  readonly totalCards: number;
  /** Quantidade de cartas únicas de raridade Legendary ou acima. */
  readonly legendaryPlusCount: number;
  /** Quantidade de cartas Ultra possuídas. */
  readonly ultraCount: number;
  /** Quantidade de álbuns completados. */
  readonly albumsCompleted: number;
  /** Percentual do álbum mais avançado [0, 1]. */
  readonly bestAlbumCompletion: number;
}>;

/**
 * Dados de vitórias de um jogador — fonte: packages/ranking + packages/match.
 */
export type WinsSnapshot = Readonly<{
  readonly profileId: HofProfileId;
  readonly displayName: string;
  /** Total de vitórias ranqueadas em todas as temporadas. */
  readonly totalRankedWins: number;
  /** Melhor sequência de vitórias consecutivas já alcançada. */
  readonly bestWinStreak: number;
  /** Sequência atual de vitórias (pode ser 0). */
  readonly currentWinStreak: number;
  /** Total de partidas ranqueadas jogadas. */
  readonly totalRankedMatches: number;
}>;

/**
 * Dados de temporada de um jogador — fonte: packages/ranking.
 */
export type SeasonSnapshot = Readonly<{
  readonly profileId: HofProfileId;
  readonly displayName: string;
  /** Número de temporadas jogadas (qualquer posição). */
  readonly seasonsPlayed: number;
  /** Número de temporadas em que terminou no tier máximo (World Legend). */
  readonly seasonsAsWorldLegend: number;
  /** Melhor posição já alcançada no leaderboard global. */
  readonly bestGlobalRank: number;
  /** Tier mais alto já alcançado (como string). */
  readonly highestTierReached: string;
}>;

/**
 * Dados de GOATs de um jogador — fonte: packages/achievements + packages/collection.
 */
export type GoatSnapshot = Readonly<{
  readonly profileId: HofProfileId;
  readonly displayName: string;
  /** Número de cartas GOAT desbloqueadas (cada GOAT é única por conquista). */
  readonly goatCount: number;
  /** IDs das cartas GOAT possuídas. */
  readonly goatCardIds: readonly string[];
}>;

// ─── Categoria de prestígio ───────────────────────────────────────────────────
export type PrestigeCategory =
  | 'top-collectors'  // Coleção Mais Completa (doc 10 §21)
  | 'top-wins'        // Maior Sequência de Vitórias Ranqueadas (doc 10 §21)
  | 'top-seasons'     // Top temporadas (doc 06 §3.2)
  | 'top-goats'       // Mais GOATs Desbloqueados (doc 10 §21)
  | 'top-album';      // Primeiro a Completar Álbum (doc 10 §21)
