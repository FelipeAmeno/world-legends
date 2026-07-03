# `@world-legends/shared`

Value Objects reutilizáveis sem nenhuma regra de negócio específica de domínio. Usados por todos os demais packages do monorepo (`docs/18-monorepo-architecture-master.md`, §3.1 e §15).

## Status

**Tarefa T002 concluída.** Quatro Value Objects implementados, na ordem fixada em `docs/19-implementation-strategy-master.md`, §9:

| VO | Construtores | Arquivo |
|---|---|---|
| `Result<T, E>` | `Ok`, `Err` | `src/result/result.ts` |
| `Option<T>` | `Some`, `None` | `src/option/option.ts` |
| `Percentage` | `createPercentage` (valida), `clampPercentage` (sempre sucede) | `src/percentage/percentage.ts` |
| `Seed` | `createSeed`, `deriveStream`, `toUint32` | `src/seed/seed.ts` |

`ValidationError` (`src/errors/validation-error.ts`) também foi criado — não pedido explicitamente, mas é o suporte mínimo necessário para que `createPercentage`/`createSeed` devolvam um erro estruturado via `Result`, em vez de um `string` solto. As outras três categorias de erro da mesma hierarquia (`DomainError`, `ApplicationError`, `InfraError`, doc 19 §17) ficam para quando o primeiro package que de fato precisar delas existir.

Todos os quatro objetos são imutáveis (`Object.freeze`) e sem identidade — duas instâncias com o mesmo conteúdo são equivalentes.

### Nota sobre `Seed`

Este módulo cobre apenas a parte de **Value Object**: o valor do Seed, sua validação, sua igualdade, e a derivação determinística de streams independentes (`deriveStream`, doc 09 §21). O gerador de números pseudoaleatórios em si (`mulberry32`) é responsabilidade de `packages/engine` (Tarefa T012), que vai consumir os Seeds produzidos aqui via `toUint32`.

## Cobertura

`vitest.config.ts` exige 100% de linhas/funções/branches/statements via `@vitest/coverage-v8`. 80 asserções em 6 arquivos de teste.

## Próximos passos

Tarefas T003 a T007 (`docs/19-implementation-strategy-master.md`, §18): `Money` e `DateRange`, ainda não implementados nesta tarefa (escopo de T002 era só Result/Option/Percentage/Seed).

## Dependências

Nenhuma. `shared` é a base da pirâmide de dependências de todo o monorepo (`docs/18-monorepo-architecture-master.md`, §3) — não importa nenhum outro package do projeto.
