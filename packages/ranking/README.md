# `@world-legends/ranking`

**T019 concluída.** Elo/MMR, divisões, Season, PlayerRanking, leaderboard.

## Estrutura

```
src/
  elo/calculate-rating.ts    calculateNewRating() — fórmula exata doc 06 §3.1 (K=24)
                             expectedScore(), isMatchmakingCompatible()
  tiers/tier.ts              6 divisões: Bronze/Prata/Ouro/Elite/Lenda/World Legend
                             tierFromRating(), calculateTierMovements()
  season/season-reset.ts     Season, PlayerRanking, seasonReset() (regressão 20%)
                             createSeason(), openSeason(), closeSeason()
  leaderboards/leaderboard.ts buildLeaderboard(), getPlayerRank(), getTopN()
```

## Valores documentados vs calibrados

| Valor | Fonte | Status |
|---|---|---|
| K_FACTOR = 24 | doc 06 §3.1 (código explícito) | ✅ Documentado |
| Fórmula Elo | doc 06 §3.1 (código explícito) | ✅ Documentado |
| Restrição: só public_ranked | doc 06 §3.1, doc 17 §14 | ✅ Documentado |
| ELO_INITIAL = 1000 | Não documentado | D-RANK-01 (calibrado) |
| ELO_FLOOR = 100 | Não documentado | D-RANK-01 (calibrado) |
| Faixas de tier | Não documentadas | D-RANK-01 (calibrado) |
| REGRESSION_FACTOR = 20% | "leve regressão" (doc 06 §3.2) | D-RANK-02 (calibrado) |
| PROMOTION/RELEGATION = 20% | "Top X%/Bottom Y%" (doc 06 §3.2) | D-RANK-02 (calibrado) |

## Dependências: shared, types. Sem banco, sem endpoints.

## 78 testes | 0 falhas
