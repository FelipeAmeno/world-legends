# @world-legends/rewards — T029 Match Rewards

Sistema de recompensas por partida. Domínio puro — sem banco, sem API.

## API

```typescript
import { calculateRewards } from '@world-legends/rewards';

const result = calculateRewards({
  result,       // MatchResult do engine/match-simulator
  userSide,     // 'home' | 'away'
  userCardIds,  // IDs do squad do usuário (titulares + banco)
});

if (result.ok) {
  const { base, bonuses, total, progress } = result.value;
  // base.outcome: 'win' | 'draw' | 'loss'
  // total.credits, total.xp
  // progress: ProgressUpdate[]
}
```

## Tabela de recompensas

### Base

| Resultado | Créditos | XP |
|-----------|----------|-----|
| Vitória   | 200      | 150 |
| Empate    | 100      | 80  |
| Derrota   | 50       | 40  |

### Bônus

| Bônus | Créditos | XP | Regra |
|-------|----------|-----|-------|
| Clean sheet | +75 | +50 | Adversário não marcou |
| Hat trick | +100 | +75 | Jogador do squad marcou ≥ 3 gols |
| MVP | +150 | +100 | `mvpUserCardId` pertence ao squad |
| Por gol | +20 | +15 | Por gol legítimo marcado pelo squad |

Bônus empilham — uma partida pode acumular todos de uma vez.

## Regras especiais

- **Gol contra** não conta para hat trick nem para bônus por gol.
- **W.O.** não gera clean sheet (partida interrompida).
- **Pênaltis**: outcome usa o placar de pênaltis, não o placar regular.
- **Múltiplos hat tricks**: cada jogador com 3+ gols gera um bônus independente.

## Progress updates

O campo `progress` retorna atualizações que o chamador persiste:

```
matches_played  → sempre +1
wins / draws / losses → conforme resultado
goals_scored / goals_conceded → contagem de gols
clean_sheets → +1 se zero gols sofridos
hat_tricks → +N por hat tricks na partida
mvp_awards → +1 se MVP do squad
```

## Testes

```
31/31 · TC-REW-01..13
  Base: win/draw/loss + away
  Clean sheet: home, away, WO
  Hat trick: 3+, 4, dois HT, gol contra, adversário
  MVP: squad, adversário, null
  Goal bonus: contagem, gol contra excluído
  Total: soma exata
  Stack: todos os bônus simultâneos
  Progress: todas as categorias
  Especiais: pênaltis ganhos/perdidos, WO próprio/adversário
  Validação: input inválido
```
