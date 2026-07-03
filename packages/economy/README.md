# `@world-legends/economy`

**T014 + T015 concluídas.** Domínio de economia puro em memória.

## Estrutura

```
src/
  wallet/         CreditBalance, FragmentBalance, PremiumBalance, Wallet (T014)
  ledger/         LedgerEntry, InMemoryLedger, audit trail append-only (T014)
  use-cases/      depositCredits, spendCredits, depositFragments, spendFragments,
                  depositPremium, spendPremium (T014)
  events/         EconomyDomainEvent × 6, fábricas (T014)
  rewards/        calculateMatchRewards, calculateObjectiveReward,         (T015)
                  calculateMaxWeeklyObjectiveCredits
  spending/       calculateCraftCost, canAffordCraft,                      (T015)
                  calculatePackCost, canAffordPack
```

## Referências documentais

| Módulo | Fonte |
|--------|-------|
| Craft costs | doc 10 §17 — tabela exata |
| Pack costs | doc 07 §1 — tabela exata |
| Match rewards | calibrado em relação a Pack Bronze=300 (doc 07 §1) e saldo inicial=500 (doc 02 §2) |
| Daily/weekly rewards | calibrado: jogador diligente ≈ 1 Pack Prata/semana |

## 126 testes | 0 falhas | TC-ECO-01/02/03/04/05/07 cobertos
