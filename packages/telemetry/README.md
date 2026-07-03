# `@world-legends/telemetry`

**T023 concluída.** Observabilidade do jogo — baseado em doc 12.

## Estrutura

```
src/
  events/
    envelope.ts   TelemetryEnvelope (envelope comum, doc 12 §3) + 44 tipos de evento (doc 12 §2)
    factory.ts    Factory functions por categoria: sessionEvents, matchEvents, engineEvents,
                  packEvents, economyEvents, cardEvents, marketEvents
  bus/
    event-bus.ts  createTelemetryBus() — publish/subscribe em memória com filtros
  kpi/
    metrics.ts    goalsPerMatch, drawRate, walkoverRate (DD-01), seedTiebreakRate (DD-02),
                  inflationIndex, KPI targets e limiares de alerta
  alerts/
    alert-rules.ts  7 alertas automáticos (doc 12 §10): W.O., seed tiebreak, inflação,
                    drop rates, winrate, combo dominante, meta health
  guards/
    regression-guards.ts  7 Regression Guards permanentes (doc 12 §12): G1..G7
                          runAllGuards() — bloqueia patch se qualquer guard falhar
```

## Regression Guards (doc 12 §12) — obrigatórios por patch

| Guard | Cenário | Critério |
|---|---|---|
| G1 | 11 Ultras | WinrateDelta ≤ +6pp |
| G2 | 11 World Cup Hero | WinrateDelta ≤ +6pp |
| G3 | Química máxima | bônus ≤ +4 |
| G4 | Combo máximo | agregado ≤ +10 |
| G5a | Leader stack | ≤ 2× base |
| G5b | Capitão único | ≤ 1 Capitão simultâneo |
| G6 | Cartas Prime | 2ª fonte = 60% eficiência |
| G7 | Evento isolado | nenhuma interação cruzada |

## Dependências: shared, types. Domínio puro.

## 68 testes | 0 falhas
