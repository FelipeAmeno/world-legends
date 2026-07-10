# Sprint 26 — Card Engine 2.0 (Legacy Removal)

**Nota de numeração:** esta sprint reutiliza o número "26" com um tema
diferente do `SPRINT_26_GAMEPLAY_FOUNDATION.md` já entregue nesta mesma
sessão (modo Partida). São sprints distintas — nomeei este arquivo com o
sufixo `_CARD_ENGINE_2_` pra não colidir.

**Objetivo:** eliminar definitivamente o sistema legado de Jersey/Kit do
Card Engine — sem nenhuma feature nova, só remoção do que ainda existia
como fallback.

---

## O problema, confirmado por leitura de código

Apesar da Sprint 24 (Card Composition Refactor) já ter consolidado Scene
+ Kit + Pattern + Player Art + Pose de 5 camadas separadas pra 1 camada
única (`CardSceneLayer.tsx`), o ÚLTIMO ELO da cadeia de fallback dessa
camada ainda era, literalmente, a camisa: Kit (imagem da camisa) +
Pattern (textura por cima) + `JerseyArt` (SVG procedural da camisa como
fallback do fallback). Como nenhum asset real de Kit/Pattern jamais foi
produzido, **toda carta do catálogo sem Scene real (571 de 574
jogadores) mostrava essa camisa genérica** — exatamente o "dois estilos
coexistindo" que o brief descreve.

## O que foi removido

| Item | Onde vivia | Situação antes |
|---|---|---|
| `JerseyArt` (componente) | `components/cards/JerseyArt.tsx` | SVG procedural de camisa+número+nome — fallback de fallback do Kit |
| `resolveKit()` | `lib/card-asset-loader.ts` | Resolvia `kit-{nacionalidade}-{raridade}.png` — nunca teve asset real |
| `resolvePlayerArt()` | `lib/card-asset-loader.ts` | Resolvia retrato do jogador — nunca teve asset real |
| `resolvePattern()` | `lib/card-asset-loader.ts` | Resolvia textura da seleção — nunca teve asset real |
| `getShirtNumber()`/`getJerseySurname()` | `lib/kit-data.ts` | Só usados por `JerseyArt` — mortos junto com ele |
| `jersey`/`jerseyScale` | `components/cards/card-tokens.ts` (`SIZES`) | Dimensões só usadas pelo bloco de camisa removido |
| Categorias `kits`/`patterns`/`player-art` | `scripts/generate-card-asset-manifest.mts` | Scan de 3 pastas que nunca continham nada |
| `expectedKits`/`expectedPatterns`/`expectedPlayerArt` | `lib/dev/card-asset-expectations.ts` | Checklist de cobertura do Dev Tool pras 3 categorias mortas |
| 3 entradas em `buildAllCardAssetDiagnostics` | `lib/dev/card-asset-diagnostics.ts` | Diagnóstico de cobertura pras 3 categorias mortas |
| `public/assets/cards/{kits,patterns,player-art}/` | Sistema de arquivos | 3 pastas vazias (só `.gitkeep`) |

## O que substitui o fallback removido

`CardSceneLayer.tsx` (cadeia de prioridade, nunca mais de uma renderiza):

1. Scene real (`scene-{playerId}.webp`) — 3 já entregues (Pelé, Messi,
   Cristiano Ronaldo, Sprint 21/24).
2. Pose real (asset fotográfico opcional, se algum dia existir).
3. **Scene Procedural** (Sprint 27, `lib/procedural-scene/`) — nunca
   retorna nulo. Ver `SPRINT_27_PROCEDURAL_SCENE_ENGINE.md`.

Nenhuma camisa em lugar nenhum da cadeia.

## O que NÃO foi removido (e por quê)

- **`lib/kit-data.ts`** (o arquivo inteiro) — `getKitColors()`/
  `getStadiumBg()`/`getAllKitNationalities()` continuam existindo e são
  genuinamente reutilizados: `getKitColors` já alimentava o gradiente de
  `CardBackgroundLayer.tsx` (`kit.primary`/`kit.secondary`) desde antes
  desta sprint, e agora TAMBÉM alimenta a Scene Procedural (Country
  Pattern real a partir de `KitColors.pattern`/`patternColor`, cores de
  rim-light da Pose). `getStadiumBg` estava definido mas nunca consumido
  em lugar nenhum antes desta sprint — a Scene Procedural é o primeiro
  uso real. Continuar chamando esse arquivo `kit-data.ts` é só um nome
  histórico — o conteúdo é "paleta de cores por seleção", não mais
  especificamente sobre camisas.
- **`resolvePose()`** (`lib/card-asset-loader.ts`) — continua existindo
  como prioridade 2 da cadeia, pra um asset FOTOGRÁFICO real (se algum
  dia alguém produzir um), distinto do Pose Engine procedural (Sprint
  28) que resolve o caso comum sem asset nenhum.
- **Categoria `poses/` do manifesto** — continua sendo escaneada (é o
  caminho pro asset fotográfico opcional acima).
- **Dev Tool: `allKitNationalities()`/`allPlayers()`** (`lib/dev/
  card-asset-expectations.ts`) — usadas pra popular os seletores de
  país/jogador do `/dev/card-assets`, não têm relação com o sistema de
  Kit-como-asset removido; renomear teria sido cosmético e fora de
  escopo desta sprint (só remoção, sem feature nova).

## Assets que deixaram de ser utilizados

Nenhum — as 3 pastas removidas (`kits/`, `patterns/`, `player-art/`)
continham exclusivamente `.gitkeep`, zero arquivo de imagem real. Não
houve nenhum asset produzido/entregue que precisou ser descartado.

## Arquivos que ficaram mortos (confirmados órfãos antes da remoção)

Todos os itens da tabela acima foram confirmados sem nenhuma referência
restante (`grep -rln` em todo `apps/web`) antes de serem removidos —
nenhum ficou "morto mas esquecido"; foram todos deletados/editados nesta
sprint.

## QA

```
pnpm exec tsc --noEmit -p .   → 0 erros
pnpm exec biome check .       → 457 warnings, 0 erros (era 460 antes)
pnpm test                     → 210/210 (inalterado)
pnpm build                    → sucesso, 24/24 páginas
```

Testado ao vivo (Chrome real): `/collection`, `/squad`, `/profile`,
`/dev/card-assets` — zero erro de console, zero regressão visual em
cartas que já tinham Scene real (Pelé/Lúcio) ou Frame/Background reais.

Nenhuma mudança em economia, packs, Supabase, ou gameplay/match engine.
