# `@world-legends/collection`

**T012 concluída.** Coleção do usuário — primeira coleção funcional.

## O que há aqui

- `UserCard` — instância possuída de uma carta. Form [-2,+2], lesão, suspensão, origem (doc 17 §6). Invariante: WCH/GOAT só via `achievement`.
- `UserCollection` — repositório por `profileId`. Duplicata → fragmentos automaticamente (doc 10 §16, doc 17 §6). Sem segundo `UserCard` para o mesmo `cardId`.
- `Showcase` — vitrine pública de até 5 cartas escolhidas (doc 17 §4). Imutável, reordenável.
- `AlbumProgress` / `CollectionSetDefinition` — progresso de álbum por set. `completedAt` como guard de idempotência de recompensa (doc 17 §7).
- `FragmentGeneration` — conversão de duplicatas em fragmentos por raridade, Craft com validação (WCH não craftável), `FragmentLedger` nunca negativo (doc 17 §9/§10).

## Dependências

`@world-legends/shared`, `@world-legends/types`, `@world-legends/cards`. Sem banco, sem endpoints.

## 55 testes passando
