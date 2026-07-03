# `@world-legends/types`

DTOs, enums e tipos compartilhados — **sem lógica**, por definição (`docs/18-monorepo-architecture-master.md`, §16). É a "linguagem comum" entre `packages/db` (futuro) e os packages de domínio, sem acoplar persistência a regra de negócio.

## Status

**Vazio (Tarefa T001 — bootstrap).** Nenhum DTO ou enum foi definido ainda.

## Próximos passos

Tarefas T008 a T011 (`docs/19-implementation-strategy-master.md`, §18): enums centrais (`Position`, `RarityCode`, `EditionCode`), DTOs de Catálogo, DTOs de Partida (incluindo os campos de `DD-01`/`DD-02` — `walkover`, `rodadasTotais`, `desempatePorSeed`, ver `docs/15.1-sync-report-dd01-dd02.md`) e DTOs de Elenco/Liga.

## Dependências

`@world-legends/shared` — apenas para os Value Objects de base (`Result`, `Option`) que alguns DTOs eventualmente envolvem. Nenhuma outra dependência (`docs/18-monorepo-architecture-master.md`, §3).
