# `@world-legends/db`

**T024 concluída.** Camada de persistência Supabase — Ports & Adapters.

## Regra inviolável (doc 18 §3)

> Nenhum package de domínio (`engine` → `telemetry`) importa `@world-legends/db`.
> Supabase é um detalhe de infraestrutura invisível ao domínio.

## Estrutura

```
src/
  schema/
    migrations.sql        DDL completo — 17 tabelas (doc 02)
  rls/
    policies.sql          Row Level Security — 20 tabelas com RLS (doc 02 §8)
  adapters/
    database.types.ts     Tipos TypeScript do schema (gerados/manuais)
    supabase-client.ts    createDbClient(), createServiceClient()
  repositories/
    profiles/             IProfileRepository + SupabaseProfileRepository
    cards/                IUserCardRepository + SupabaseUserCardRepository
    matches/              IMatchRepository + SupabaseMatchRepository
    ranking/              ISeasonRepository + IRankingRepository + adapters
    packs/                IPackRepository + pity counters
    economy/              ICraftRepository (idempotência, doc 17 §10)
```

## Invariantes do schema (doc 02)

| Campo | Valor | Fonte |
|---|---|---|
| `profiles.soft_currency` default | 500 | doc 02 §2 |
| `profiles.elo_rating` default | 1000 (Prata) | doc 06 §3.1 |
| `user_cards.form` | check entre [-2, +2] | doc 09 §6 |
| `user_cards.acquired_via` | inclui 'craft' e 'achievement' | doc 17 §4 |
| Catálogo (players/cards/rarities) | somente leitura para client | doc 02 §8 |
| matches/match_events | somente service_role escreve | doc 02 §8 |

## Testes de contrato (22 testes)

Adapters em memória que satisfazem as mesmas Portas que os Supabase adapters.
Proves que o domínio é completamente testável sem Supabase (doc 18 §17).
Testes de contrato reais (com Supabase) → Fase 6 do roadmap (doc 18 §17).
