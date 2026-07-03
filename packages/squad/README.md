# @world-legends/squad — Squad Builder Domain

Bounded context de montagem de time (doc 17 §11).

## Responsabilidade

Gerenciar a composição de squads: seleção de jogadores, validação de
formação, compatibilidade de posições e cálculo de química. Puro domínio
em memória — sem banco, sem API, sem dependências externas além de
`@world-legends/shared` e `@world-legends/types`.

## Use-cases

| Função | Descrição |
|--------|-----------|
| `createSquad(input)` | Cria squad vazio com formação escolhida |
| `addPlayer(input)` | Adiciona jogador a slot de titular ou banco |
| `removePlayer(input)` | Remove jogador de slot ou banco |
| `validateSquad(input)` | Valida squad completo para partida |
| `calculateChemistryUseCase(input)` | Calcula química 0–100 |

## Formações suportadas

`4-3-3` · `4-4-2` · `4-2-3-1` · `3-5-2` · `5-3-2` · `4-5-1` · `4-1-4-1` · `3-4-3`

## Regras de negócio

- Squad tem exatamente **11 titulares** e até **7 no banco**
- Nenhum `userCardId` pode aparecer duas vezes (titulares + banco)
- Posição incompatível bloqueia `addPlayer` (GK não joga como ST, etc.)
- Lesionado e suspenso → apenas banco, nunca titular
- Cada `UserCard` deve pertencer ao `userId` do squad

## Compatibilidade de posições

```
NATURAL   (fit 4): posição exata ou equivalente direta
COMPATIBLE (fit 2): posição adjacente/relacionada
INCOMPATIBLE (fit 0): bloqueado
```

Exemplos: CM aceita em CDM (compatible); CF aceita em ST (natural); GK **não** aceita em nenhuma posição de campo.

## Química (0–100)

Por jogador (0–10):

| Componente | Pontos |
|-----------|--------|
| Posição natural no slot | 4 |
| Posição compatível no slot | 2 |
| Fora de posição | 0 |
| 3–4 companheiros mesma nação | +1 |
| 5–6 companheiros mesma nação | +2 |
| 7–8 companheiros mesma nação | +3 |
| 9–10 companheiros mesma nação | +4 |
| Squad com 11 titulares (formationBonus) | +2 |

Score total = `round(average(11 jogadores) × 10)` → 0–100.

## Ports & Adapters

O package não importa `@world-legends/collection` nem `@world-legends/cards`
diretamente. Usa a interface `PlayerInfo` como Port:

```typescript
type PlayerInfo = {
  userCardId: string;
  userId: string;
  naturalPosition: Position;
  nationality: string;
  overall: number;
  isInjured: boolean;
  suspendedMatches: number;
};
```

## Testes

```
41 testes · TC-SQUAD-01..38
├── createSquad.test.ts   (TC-01..02 + buildSquadSlots)
├── addRemovePlayer.test.ts (TC-03..16)
├── validateSquad.test.ts  (TC-20..27)
├── chemistry.test.ts      (TC-30..38)
└── positions.test.ts      (matriz completa de compatibilidade)
```
