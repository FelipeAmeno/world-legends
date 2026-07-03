/**
 * packages/ranking — T019 concluída.
 *
 * Elo/MMR, tiers (divisões), Season, PlayerRanking, leaderboard.
 * (doc 17 §14, doc 06 §3, doc 18 §11)
 *
 * Dependências: shared, types. Sem banco, sem endpoints, domínio puro.
 */
export * from './elo';
export * from './tiers';
export * from './season';
export * from './leaderboards';
