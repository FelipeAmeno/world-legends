# `@world-legends/craft`

**T016 concluída.** Bounded context de Craft — elegibilidade, custos e serviço de criação de carta.

## Estrutura

```
src/
  catalog/craftable.ts   checkCraftEligibility — TC-CRAFT-06 (WCH) e TC-CRAFT-07 (GOAT)
  costs/craft-cost.ts    resolveCraftCost — fachada sobre economy, tabela doc 10 §17
  service/craft-card.ts  craftCard() — orquestrador com 8 passos (doc 18 §18.3)
  types/types.ts         CraftRequest, CraftError, CraftCardInput
```

## Dependências

`shared`, `types`, `cards`, `collection`, `economy`. Ports & Adapters (doc 18 §3.2).

## 48 testes — TC-CRAFT-01 a TC-CRAFT-10 e TC-SEC-01 cobertos.
