/**
 * packages/telemetry — T023 concluída.
 *
 * Observabilidade do jogo (doc 12):
 *   events/   — envelope comum + factory functions (§2/§3)
 *   bus/      — publish/subscribe em memória (§1)
 *   kpi/      — métricas documentadas (§4/§7/§14)
 *   alerts/   — regras de alerta automático (§10)
 *   guards/   — 7 Regression Guards permanentes (§12)
 *
 * Sem banco, sem endpoints, domínio puro.
 * Dependências: shared, types.
 */
export * from './events';
export * from './bus';
export * from './kpi';
export * from './alerts';
export * from './guards';
