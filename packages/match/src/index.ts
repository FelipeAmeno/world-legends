/**
 * packages/match — T017 concluída.
 *
 * Camada de orquestração entre Collection/Cards e Engine.
 * (doc 18 §18.2: fluxo de Partida Ranqueada)
 *
 * Não reimplementa simulação — delega para @world-legends/engine.
 * Adiciona: validação de lineup, construção de TeamSnapshot,
 * MatchSummary enriquecido, acesso à timeline por fase.
 */
export * from './lineups';
export * from './events';
export * from './result';
export * from './timeline';
export * from './simulation';
