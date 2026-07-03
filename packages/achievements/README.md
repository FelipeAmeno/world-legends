# `@world-legends/achievements`

**T020 concluída.** Hall da Fama: catálogo de conquistas, progresso e desbloqueio.

## As 7 conquistas (doc 10 §22, T020)

| Conquista | Critério | Categoria |
|---|---|---|
| Hat-Trick Lendário | 1 hat-trick em partida | performance |
| Dez Vitórias | 10 vitórias ranqueadas | performance |
| Veterano de Campo | 100 partidas jogadas | veteran |
| Ícone Obtido | Primeira carta Legendary | collection |
| Além da Lenda | Primeira carta Ultra | collection |
| Colecionador Completo | Completar qualquer álbum | collection |
| O Maior de Todos (GOAT) | Primeiro GOAT | hall_of_fame |

## Invariantes documentados

**TC-HOF-01:** `unlockedAt` preenchido exatamente uma vez — `applyDelta` após desbloqueio retorna `Err(AlreadyUnlocked)`. `unlockAchievement` retorna o progresso existente sem re-processar, garantindo que o evento `achievement_unlocked` seja publicado no máximo 1 vez.

**TC-HOF-03:** GOAT é a única conquista com `grantsGoatCard=true` e `isSecret=true`. O package sinaliza via payload do evento; a criação real do `UserCard` com `source='achievement'` é responsabilidade da camada de aplicação (Ports & Adapters — este package nunca importa `collection`).

## Dependências: shared, types. Sem banco, sem endpoints.

## 68 testes | 0 falhas
