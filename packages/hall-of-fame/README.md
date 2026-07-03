# `@world-legends/hall-of-fame`

**T021 concluída.** Rankings de prestígio, score composto e vitrine pessoal.

## Rankings implementados (doc 10 §21)

| Função | Categoria | Critério principal | Desempate |
|---|---|---|---|
| `rankTopCollectors` | top-collectors | albumsCompleted DESC | bestAlbumCompletion → legendaryPlusCount → displayName |
| `rankTopWins` | top-wins | bestWinStreak DESC | totalRankedWins → totalRankedMatches → displayName |
| `rankTopSeasons` | top-seasons | seasonsAsWorldLegend DESC | seasonsPlayed → bestGlobalRank ASC → displayName |
| `rankTopGoats` | top-goats | goatCount DESC | displayName ASC |
| `rankTopAlbum` | top-album | albumsCompleted DESC | bestAlbumCompletion → displayName |

## Prestige Score (D-HOF-01)

`score = goat×100 + album×50 + winStreak×30 + season×20 + collection×10`

Hierarquia GOAT > álbum > vitórias > temporadas > coleção geral.

`rankByPrestige`: totalScore DESC → goatPoints DESC → displayName ASC.

`getPrestigeTitle`: 7 títulos (Iniciante → Imortal), puramente cosméticos (doc 10 §21).

## Showcase — TC-HOF-06

`addToShowcase` rejeita a 6ª carta (`SlotLimitExceeded`) e duplicatas (`DuplicateCard`).
`removeFromShowcase` reordena as posições automaticamente.

## Funções puras — sem banco, sem efeito colateral.

## Dependências: shared, types. 70 testes | 0 falhas
