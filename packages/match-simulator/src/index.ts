/**
 * @world-legends/match-simulator — T028 Match Simulator MVP.
 *
 * API pública: um único ponto de entrada `simulateSquadMatch()` que
 * aceita dois squads montados pelo usuário, uma semente e resolvers
 * de dados de jogador, e retorna o MatchResult completo do engine.
 */

export { simulateSquadMatch } from './simulate/simulate';
export type { SquadMatchOutput } from './simulate/simulate';

export type {
  PlayerMatchData,
  PlayerMatchResolver,
  SquadMatchInput,
  MatchResult,
  MatchWinner,
} from './types/types';
export { determineWinner } from './types/types';

export { makeAttributesFromOverall } from './attributes/attributes';
export { buildAdjacentPairs } from './adjacency/adjacency';
export { squadToTeamSnapshot, chemistryToTacticalIntensity } from './adapter/adapter';
