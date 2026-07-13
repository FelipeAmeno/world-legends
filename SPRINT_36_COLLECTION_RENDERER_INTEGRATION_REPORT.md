# Sprint 36 — Collection Renderer Integration

## Descoberta crítica antes de implementar

O brief assumia que `CollectionCardTile.tsx` (dentro de `components/collection/`) era a grade real da Collection. **Não é.** Rastreando os imports a partir de `app/collection/page.tsx`:

```
app/collection/page.tsx → HallOfLegendsExperience (components/hall-of-legends/)
```

`CollectionCardTile.tsx`, `CardGrid.tsx`, `VirtualCardGrid.tsx`, `CollectionExperience.tsx` e `CollectionClient.tsx` formam uma sub-árvore inteira **órfã** — nenhuma rota os importa (confirmado com grep exaustivo). A grade real que o usuário vê em `/collection` (aba "MUSEU") é o componente `MuseumCard` dentro de `HallOfLegendsExperience.tsx`.

Implementei nos dois lugares: no componente REAL (obrigatório) e mantive a integração no código órfão (inofensivo, já que não é roteado — caso seja reativado no futuro, já vem correto).

## Arquitetura — antes e depois

**Antes:**
```
Collection (HallOfLegendsExperience) → PlayerCard (procedural puro, 9 camadas)
Dev tool (/dev/full-artwork-card) → FullArtworkWorldLegendsCard (components/dev/)
```
Nenhum caminho de produção usava `resolvePlayerCardRenderer`. `PlayerCard.tsx` importava um componente de `components/dev/` (dependência dev-only num componente de produção).

**Depois:**
```
Collection (HallOfLegendsExperience, MuseumCard)  →  ResolvedWorldLegendsCard ─┐
Squad/Compare/Pack Reveal/Perfil/Match/Hall of Fame (PlayerCard, fachada)     →┤→ resolvePlayerCardRenderer → FullArtworkWorldLegendsCard (full-artwork)
                                                                                │                            ↘ composição procedural de 9 camadas (fallback)
Dev tool (/dev/full-artwork-card)                                             ┘
```

`FullArtworkWorldLegendsCard` mudou de `components/dev/` para `components/cards/` (agora é um renderer de produção, não mais experimental). `PlayerCard.tsx` virou uma fachada de compatibilidade de ~30 linhas que só delega pra `ResolvedWorldLegendsCard` — nenhuma tela legada perdeu a arte exclusiva que já estava no ar.

## Arquivos alterados/criados

**Criados:**
- `components/cards/ResolvedWorldLegendsCard.tsx` — único lugar de produção que chama `resolvePlayerCardRenderer`. Contém o resolver (extraído de `PlayerCard.tsx`) + a composição procedural de 9 camadas inteira (movida, não duplicada) + o branch full-artwork. Aceita `density?` opcional (default: `SIZE_TO_MODE[size]`) — Collection passa `density="compact"` explicitamente, independente do `size` visual.
- `components/cards/FullArtworkWorldLegendsCard.tsx` — movido de `components/dev/`. `shouldShowZone` agora exportado (testável sem duplicar a lógica).
- `lib/card-static/manifest-index.ts` — índice O(1) (`Map` cacheado por `WeakMap`, por referência de array) substituindo os `.find()` lineares em `resolve-player-card-renderer.ts` e `resolve-artwork.ts`. Nunca é uma segunda fonte de verdade — deriva do mesmo manifesto, se reconstrói sozinho se a referência do array mudar.
- `tests/lib/collection-renderer-integration.test.ts` — 12 testes (ver seção Testes).

**Modificados:**
- `components/cards/PlayerCard.tsx` — de ~200 linhas pra fachada de ~30 linhas, delega 100% pra `ResolvedWorldLegendsCard`. Marcado `@deprecated` com instrução clara pra código novo.
- `components/collection/CollectionCardTile.tsx` — grade órfã, atualizada por segurança (`ResolvedWorldLegendsCard` + `density="compact"`).
- `components/hall-of-legends/HallOfLegendsExperience.tsx` — **a mudança que importa**: `MuseumCard` troca `<PlayerCard card={card} size="sm" glow />` por `<ResolvedWorldLegendsCard card={card} size="sm" density="compact" glow />`. Só esse call site — Hall of Fame, Dream Team e outros usos de `PlayerCard` no mesmo arquivo continuam como fachada, sem regressão.
- `components/dev/FullArtworkCardPage.tsx` — import path atualizado (`../cards/FullArtworkWorldLegendsCard`).
- `components/cards/card-types.ts` — import de `FullArtworkStats` atualizado.
- `lib/card-static/resolve-artwork.ts`, `lib/card-static/resolve-player-card-renderer.ts` — usam `findPresetById` (índice O(1)) em vez de `.find()`.

## Gap real encontrado e corrigido: densidade específica

`resolvePlayerCardRenderer` confirma que **alguma** densidade foi gerada (`hasAnyGeneratedOutput`), mas Collection força `density="compact"` especificamente. Se um preset tivesse só standard/showcase gerados (sem compact), o resolver diria "full-artwork" mas `FullArtworkWorldLegendsCard` cairia no placeholder interno "artwork não gerado" em vez do fallback procedural real. `ResolvedWorldLegendsCard` fecha essa lacuna com uma segunda checagem (`resolveGeneratedArtwork` pra densidade exata) sem duplicar nenhum critério do resolver — se a densidade pedida não existe, trata como procedural (`artwork-output-not-found`). Coberto pelo teste #4.

## Fluxo do resolver

1. `MuseumCard`/`ResolvedWorldLegendsCard` recebe `card: PlayerCardData` (via `CollectionCard`, populado em `lib/collection-data.ts` desde a Sprint 35D.6).
2. `useMemo` chama `resolvePlayerCardRenderer({ artworkPresetId, cardId, playerId, rarity }, CARD_STATIC_MANIFEST)`.
3. Se `full-artwork` **e** o asset da densidade pedida existe **e** `card.stats` está presente → `FullArtworkWorldLegendsCard` (só o output Compact, nunca standard/showcase).
4. Caso contrário → composição procedural de 9 camadas de sempre, sem nenhuma mudança.

Zero jogador é citado por nome em `HallOfLegendsExperience.tsx`, `CollectionCardTile.tsx` ou `ResolvedWorldLegendsCard.tsx` — quem decide é só a presença de `artworkPresetId` no dado, vindo de `lib/collection-data.ts`.

## Interação e paginação preservadas

`onClick={handleClick}` continua no `motion.div` que ENVOLVE `<ResolvedWorldLegendsCard>` (não foi movido pra dentro) — long-press (spotlight), modo comparar e os botões de ação (Dream Team, favoritar) continuam funcionando idênticos. Filtros, busca e agrupamento por era/nação/raridade não foram tocados (nenhum arquivo de filtro/ordenação foi alterado).

## Performance

- **Índice O(1)**: `manifest-index.ts` elimina os `.find()` lineares repetidos por carta renderizada. Com ~11 presets hoje o ganho é marginal, mas remove a necessidade de re-escanear o manifesto a cada carta da grade conforme mais presets forem adicionados.
- **Resolver chamado uma vez por carta**: `useMemo` com deps estáveis (`artworkPresetId`, `cardId`, `playerId`, `rarityCode`, `effectiveDensity`) — confirmado pelo teste #10 (só um arquivo de produção chama `resolvePlayerCardRenderer`).
- **Zero import de PNG/JSON de metadata no client**: só `manifest.generated.ts` (paths `.webp` + layout) é importado — nenhum componente de produção importa `public/assets/cards/metadata/*.json` ou os PNGs fonte.
- **Só Compact é pedido pela grade**: `density="compact"` fixo no `MuseumCard`, `<Image>` do Next recebe só a URL Compact — standard/showcase nunca são requisitados pela grade (bundle `/collection` ficou no mesmo tamanho de antes: 18.2kB).
- **Lazy loading**: já existia antes desta sprint (`useInView`/`IntersectionObserver` em `CollectionCardTile`; animação `initial/animate` com delay escalonado em `MuseumCard`) — preservado, não duplicado. `next/image` usa `loading="lazy"` pra Compact/Standard e `loading="eager"` só pra Showcase (não usado na grade).
- **Sem layout shift**: `displayWidth` do `FullArtworkWorldLegendsCard` é forçado pra `SIZES[size].card.width` — o box ocupa exatamente o mesmo espaço que a carta procedural já ocupava.

## Testes

`tests/lib/collection-renderer-integration.test.ts` — 12 testes novos:
1. Jogador com preset válido resolve full-artwork.
2. Jogador sem preset resolve procedural.
3. `productionEligible: false` resolve procedural.
4. Preset sem nenhuma densidade gerada resolve procedural.
5. Compact nunca mostra nickname nos 10 pilotos (via `shouldShowZone`, a mesma função do componente real — não uma reimplementação).
6. Grade real (`HallOfLegendsExperience.tsx`) força `density="compact"` no código-fonte; nunca `standard`/`showcase`.
7. `onClick={handleClick}` continua envolvendo `<ResolvedWorldLegendsCard>` — interação preservada.
6b/7b. A grade órfã (`CollectionCardTile.tsx`) segue o mesmo padrão.
8. Os 10 pilotos resolvem pra 10 URLs de asset Compact únicas.
9. Nenhum componente de Collection (real ou órfão) contém nome de jogador ou preset ID hardcoded.
10. `resolvePlayerCardRenderer` só é chamado de `ResolvedWorldLegendsCard.tsx` — nenhuma lógica duplicada em `PlayerCard`, `CollectionCardTile`, `CardDetailModal`, `HallOfLegendsExperience` ou `CardSpotlightModal`.
- Bônus: `FullArtworkWorldLegendsCard` não vive mais em `components/dev/`.

Suite completa: **307/307 passando** (era 295).

## QA gate

- `pnpm lint` — 0 erros, 463 warnings (baseline).
- `pnpm typecheck` — limpo.
- `pnpm test` — 307/307.
- `pnpm build` — 34/34 tasks, `/collection` mantém 18.2kB (sem bloat de bundle).
- Verificação ao vivo (Playwright, conta QA): `/collection` (aba MUSEU) e `/dev/full-artwork-card` carregam sem erro de console além dos 404s pré-existentes do placeholder de chave do PostHog (não relacionados). A conta QA não possui nenhuma das 10 cartas piloto hoje, então a confirmação visual do full-artwork em produção depende dos 307 testes automatizados + da verificação visual já feita nas Sprints 35D.3–35D.5 (mesmo componente, mesmos presets, agora só chamado de um novo call site).

## Warnings conhecidos

Nenhum novo. Baseline de 463 warnings idêntico ao final da Sprint 35D.5 (categorias já aceitas: `noExcessiveCognitiveComplexity`, `noArrayIndexKey`, `useKeyWithClickEvents`, `noNonNullAssertion`).

## Não alterado

Catálogo real, economia, odds, regras de raridade, filtros/ordenação/paginação da Collection, direção visual, artworks (PNG/WebP não tocados), gameplay.

## URL de produção

**Status: Ready.** https://world-legends.vercel.app (deployment `world-legends-p855fy9na`, commit `64d84381`).
