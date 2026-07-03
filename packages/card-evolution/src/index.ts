/**
 * @world-legends/card-evolution — T039 Card Evolution.
 *
 * API pública:
 *   createCardEvolution(id, name, rarity, baseOvr)  Cria estado inicial.
 *   evolveCard(evolution)                            +1 nível.
 *   evolveCardN(evolution, n)                        +N níveis de uma vez.
 *   getCostForNextLevel(rarity, level, maxLevel)     Custo para próximo nível.
 *   getCumulativeCost(rarity, from, to, max)         Custo acumulado.
 *   getEvolutionTag(level)                           '' | '+1' | '+2' …
 *   getDisplayName(cardName, level)                  'Pelé' | 'Pelé +1' …
 */

export {
  createCardEvolution,
  evolveCard,
  evolveCardN,
  getEvolutionTag,
  getDisplayName,
} from './evolution/evolve';

export {
  getCostForNextLevel,
  getCumulativeCost,
  BASE_CREDIT_COST,
  BASE_FRAGMENT_COST,
  LEVEL_MULTIPLIER,
} from './costs/evolution-costs';

export type { CardEvolution, EvolutionCost, EvolutionError, EvolvableRarity } from './types/types';
export { MAX_EVOLUTION_LEVEL, OVR_BOOST_PER_LEVEL, MAX_CARD_OVERALL } from './types/types';
