# `@world-legends/events`

**T022 concluída.** LiveOps: 6 tipos de eventos sazonais (doc 10 §10/§23).

## Tipos implementados

| Tipo | Kind | Fonte | Regra central |
|---|---|---|---|
| `EventCard` | `event_card` | doc 10 §10/§23 | Não-tradeable durante janela ativa; tradeable após |
| `WeekendBoost` | `weekend_boost` | doc 10 §23 | Janela máx 72h; multiplier [1.0, 5.0] |
| `DoubleDrop` | `double_drop` | doc 10 §23 | Janela máx 72h; anunciado com antecedência |
| `CommunityGoal` | `community_goal` | doc 10 §23 | Progresso aggregado; reachedAt exatamente 1× |
| `LegendRescue` | `legend_rescue` | doc 10 §23 | GOAT proibido (TC-HOF-03); custo ≥ 2000 frags |
| `SeasonEvent` | `season_event` | doc 10 §23 | Missões com avanço idempotente; recompensas por rank |

## Dependências: shared, types. Sem banco, sem endpoints.

## 45 testes | 0 falhas
