/**
 * packages/db — T024 concluída.
 *
 * Camada de persistência Supabase (doc 02, doc 18 §3/§17).
 *
 * REGRA INVIOLÁVEL (doc 18 §3):
 * Nenhum package de domínio (engine → telemetry) importa este package.
 * Só apps/* e este próprio package conhecem Supabase.
 *
 * O que exporta:
 *   - Tipos do banco de dados (Database, TableRow etc.)
 *   - Factory de clientes Supabase (createDbClient, createServiceClient)
 *   - Portas (interfaces IXxxRepository) — podem ser implementadas por adapters falsos em testes
 *   - Adapters Supabase (SupabaseXxxRepository) — implementação real
 *
 * O que NÃO exporta:
 *   - Nenhuma lógica de domínio
 *   - Nenhum import de packages de domínio
 */

// Tipos do banco
export type { Database, Json } from './adapters/database.types';
export type { DbClient, TableRow, TableInsert, TableUpdate } from './adapters/supabase-client';
export { createDbClient, createServiceClient } from './adapters/supabase-client';

// Portas e Adapters — Profiles
export type {
  ProfileRow,
  CreateProfileInput,
  UpdateProfileInput,
  DbError,
  IProfileRepository,
} from './repositories/profiles/profile-repository';
export { SupabaseProfileRepository } from './repositories/profiles/profile-repository';

// Portas e Adapters — UserCards
export type {
  UserCardRow,
  CreateUserCardInput,
  IUserCardRepository,
} from './repositories/cards/user-card-repository';
export { SupabaseUserCardRepository } from './repositories/cards/user-card-repository';

// Portas e Adapters — Matches
export type {
  MatchRow,
  MatchEventRow,
  CreateMatchInput,
  SimulateMatchInput,
  IMatchRepository,
} from './repositories/matches/match-repository';
export { SupabaseMatchRepository } from './repositories/matches/match-repository';

// Portas e Adapters — Ranking
export type {
  SeasonRow,
  RankingRow,
  ISeasonRepository,
  IRankingRepository,
} from './repositories/ranking/ranking-repository';
export {
  SupabaseSeasonRepository,
  SupabaseRankingRepository,
} from './repositories/ranking/ranking-repository';

// Portas e Adapters — Packs
export type {
  PackRow,
  PackOpeningRow,
  PityCounterRow,
  IPackRepository,
} from './repositories/packs/pack-repository';
export { SupabasePackRepository } from './repositories/packs/pack-repository';

// Portas e Adapters — Missions + Achievements
export type {
  MissionProgressRow,
  AchievementProgressRow,
  IMissionRepository,
} from './repositories/missions/mission-repository';
export { SupabaseMissionRepository } from './repositories/missions/mission-repository';

// Portas e Adapters — Daily Login
export type {
  DailyLoginRow,
  UpsertDailyLoginInput,
  IDailyLoginRepository,
} from './repositories/daily-login/daily-login-repository';
export { SupabaseDailyLoginRepository } from './repositories/daily-login/daily-login-repository';

// Portas e Adapters — Collections + Album
export type {
  CollectionSetRow,
  CollectionProgressRow,
  ICollectionRepository,
} from './repositories/collection/collection-repository';
export { SupabaseCollectionRepository } from './repositories/collection/collection-repository';

// Portas e Adapters — Achievements (Xbox/Steam-style trophies)
export type {
  PlayerTrophyRow,
  InsertPlayerTrophyInput,
  IAchievementRepository,
} from './repositories/achievements/achievement-repository';
export { SupabaseAchievementRepository } from './repositories/achievements/achievement-repository';

// Portas e Adapters — Card Mastery
export type {
  CardMasteryRow,
  UpsertCardMasteryInput,
  ICardMasteryRepository,
} from './repositories/card-mastery/card-mastery-repository';
export { SupabaseCardMasteryRepository } from './repositories/card-mastery/card-mastery-repository';

// Portas e Adapters — Economy/Craft
export type {
  CraftRequestRow,
  ICraftRepository,
} from './repositories/economy/economy-repository';
export { SupabaseCraftRepository } from './repositories/economy/economy-repository';
