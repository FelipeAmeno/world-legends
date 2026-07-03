/**
 * packages/craft — T016 concluída.
 *
 * Bounded context de Craft: elegibilidade, custos, serviço craftCard().
 * (doc 17 §10, doc 18 §9/§18.3, doc 13 TC-CRAFT-01..10)
 *
 * Dependências: shared, types, cards, collection, economy.
 * Sem banco, sem endpoints, domínio puro em memória.
 */
export * from './types';
export * from './catalog';
export * from './costs';
export * from './service';
