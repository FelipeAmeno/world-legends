# `@world-legends/cards`

**T011 concluída.** Catálogo de jogadores históricos e cartas colecionáveis.

## O que há aqui

- `Player` — entidade histórica real (doc 17 §3). Invariantes: `era_start ≤ era_end`, posições válidas, 19 atributos em [1,99], imutável, nunca deletado.
- `Rarity` — tabela das 6 raridades com multiplicadores, faixas de Overall e drop weights (doc 10 §4/§6).
- `TraitAssignment` — 13 traits, tier 1/2/3, 1–3 por carta, sem duplicatas (doc 10 §5).
- `Card` — agregado com `TournamentContext`, `PrimeEdition`, `EventEdition`, fórmula de atributos (doc 10 §6), invariantes de doc 17 §5. Nunca editado após criação.
- `CardCatalog` / `PlayerCatalog` — registros em memória com unicidade `(playerId, rarityCode, editionCode)` e limite de 6 cartas-base por jogador (doc 10 §3).
- `fixtures/` — Pelé, Maradona, Ronaldo (Fenômeno), Zidane e Carlos Alberto com atributos calibrados (doc 08 §2.1).

## Dependências

`@world-legends/shared`, `@world-legends/types`. Sem banco, sem endpoints.

## 51 testes passando
