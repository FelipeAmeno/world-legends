# `apps/admin`

Ferramenta interna de Balanceamento, Catálogo e LiveOps (`docs/18-monorepo-architecture-master.md`, §4). Único lugar autorizado a expor os Contratos Internos do `docs/16-api-contracts-master.md`, §14 (`aplicarCompetitiveModifier`, `executarSimulacaoEmMassa`, `executarRegressionGuards`, `publicarBalancePatch`, `gerenciarCatalogoDeCartas`) — nunca exposto à sessão de um jogador comum.

## Status

**Placeholder shell (Tarefa T001 — bootstrap).** Nenhuma tela ou contrato interno foi implementado ainda.

## Próximos passos

Fase 6 do roadmap (`docs/19-implementation-strategy-master.md`, §2), após `engine`, `cards` e `telemetry` existirem.

## Dependências

Nenhuma ainda. No futuro: `engine`, `cards`, `telemetry`, `db` (com papel de serviço).
