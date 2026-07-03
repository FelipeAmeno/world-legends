/**
 * packages/packs — T013 concluída.
 *
 * Abertura de pacotes em memória com RNG determinístico, drop tables,
 * pity counter e PackResult. Sem moedas, sem banco.
 */
export * from './drop-table';
export * from './pack';
export * from './pity';
export * from './opening';

// ── T030: PackService + Fragments ──────────────────────────────────────────────
export * from './service/pack-service';
export * from './fragments/fragment-rewards';
