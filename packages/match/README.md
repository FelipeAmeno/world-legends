# `@world-legends/match`

**T017 concluída.** Camada de orquestração entre Collection/Cards e Engine.

## Interpretação arquitetural (doc 18 §18.2)

`packages/match` não existe no doc 18 como package autônomo. Implementado como
a camada que une `collection` (UserCards) ↔ `engine` (simulação). Não reimplementa
a simulação — delega para `@world-legends/engine` (T010, 389 testes).

## Estrutura

```
src/
  lineups/
    validate-lineup.ts      validateLineup — 11 titulares, 1 GK, posições, banco mínimo
    build-team-snapshot.ts  buildTeamSnapshot — converte UserCards em TeamSnapshot (engine)
  events/match-events.ts    Filtros tipados sobre MatchEvent[] (goals, cards, injuries...)
  result/match-result.ts    buildMatchSummary — MatchResult + profileIds + MatchOutcomeLabel
  timeline/timeline.ts      buildTimeline (fases), replayUpToMinute, buildScoreboard
  simulation/
    simulate-match.ts       simulateMatch — orquestrador completo (valida → engine → summary → evento)
    simulate-half.ts        Acesso por fase (1T/2T/ET/pênaltis)
  testing/fixtures.ts       Helpers de teste (makeValidLineup, makeSimpleResolver)
```

## 60 testes

- Reprodutibilidade: 50 runs com mesma seed = resultado idêntico (doc 09 §21)
- W.O.: shouldDeclareWalkover unitário + propagação para MatchSummary
- Pênaltis: requiresWinner=true força disputa (encontrado em 200 seeds)
- 20 rodadas máximas: totalRounds ≤ 25 verificado
- Seed tiebreak: resolvedBySeedTiebreak propagado corretamente

## Dependências

`engine`, `cards`, `collection`, `shared`, `types`.
