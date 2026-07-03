# @world-legends/match-simulator — T028 Match Simulator MVP

Camada de orquestração entre **packages/squad** e **packages/engine**.

## Responsabilidade

Converter dois `Squad` montados pelo usuário no formato que o engine espera,
executar a simulação e retornar o `MatchResult` completo. Puro domínio em
memória — sem banco, sem API, 100% determinístico por seed.

## API

```typescript
import { simulateSquadMatch } from '@world-legends/match-simulator';

const { result, winner, homeChemistry, awayChemistry } = simulateSquadMatch({
  homeSquad,
  awaySquad,
  seed: 42,
  resolveHome: (userCardId) => getPlayerData(userCardId),
  resolveAway: (userCardId) => getPlayerData(userCardId),
  context: { requiresWinner: false },
});

// result.homeScore, result.awayScore, result.events, result.stats
// winner: 'home' | 'away' | 'draw'
// homeChemistry / awayChemistry: 0–100
```

## Pipeline

```
Squad (T027)
  ↓
calculateChemistry()      — química 0–100 do packages/squad
  ↓
chemistryToTacticalIntensity()  — química → ultra_defensivo/defensivo/equilibrado/ofensivo
  ↓
makeAttributesFromOverall()     — sintetiza AttributeSet a partir de (position, OVR)
  ↓
buildAdjacentPairs()      — gera adjacentPairs para o engine de química
  ↓
squadToTeamSnapshot()     — monta TeamSnapshot para o engine
  ↓
engine.simulateMatch()    — simulação determinística (packages/engine, T010)
  ↓
MatchResult               — score, winner, events, stats, mvp
```

## Eventos gerados

| Tipo | Freq. (1000 partidas) |
|------|-----------------------|
| `goal` | 99.0% |
| `yellow_card` | 49.3% |
| `red_card` | 9.4% |
| `injury` | 25.7% |
| `kickoff` | 100% |
| `half_time` | 100% |
| `full_time` | 100% |

## Determinismo

`simulateSquadMatch` é pura. O mesmo `(homeSquad, awaySquad, seed)` produz
sempre, byte a byte, o mesmo `MatchResult`. Verificado em 1000 seeds com
double-run (cada seed rodado 2x e comparado).

## Distribuição (1000 partidas)

| Resultado | Frequência |
|-----------|-----------|
| Home win  | 44.5% |
| Away win  | 36.7% |
| Draw      | 18.8% |
| Média gols/partida | 4.40 |

## Química → Tática

| Química | TacticalIntensity |
|---------|-------------------|
| ≥ 75 | ofensivo |
| ≥ 60 | equilibrado |
| ≥ 45 | defensivo |
| < 45 | ultra_defensivo |

## Testes

```
11/11 testes unitários + 10/10 validações Monte Carlo
1000 partidas em 253ms
```
