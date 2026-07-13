# Sprint 37 — Player Details Standard/Showcase Integration

## Descoberta (obrigatória antes de codificar)

Rastreei a rota real, do clique ao componente:

```
Coleção (HallOfLegendsExperience, MuseumCard)
  → handleSelectCard → router.push(`/collection/${card.cardId}`)
  → app/collection/[cardId]/page.tsx (CardDetailPage)
  → components/collection/CardFullPage.tsx
```

**Achado 1 — CardFullPage não renderizava NENHUMA carta.** Apesar do nome ("página cheia do card"), essa página é 100% texto/stats (OVR e nome como tipografia gigante, badges de raridade, atributos, bio, história) — nunca importou `PlayerCard` nem qualquer variante. Confirmei isso lendo o arquivo inteiro antes de escrever qualquer código.

**Achado 2 — o único card visual grande já em produção era o Spotlight.** `CardSpotlightModal.tsx` (aberto por toque longo de 450ms num card da grade do Museu) já renderizava `<PlayerCard card={card} size="lg" glow />` — `size="lg"` mapeia pra `showcase` via `SIZE_TO_MODE`. Esse é o momento "hero" real do app hoje.

**Decisão do usuário**: como não existia nenhum lugar real usando densidade Standard, adicionar o card resolvido (Standard) ao hero do `CardFullPage` — a página de detalhe real e roteada — em vez de só criar um harness de dev. Ver a pergunta feita antes de implementar.

**Achado 3 (durante o QA, não antes) — bug pré-existente real.** Ao testar o piloto real (Pelé) na rota `/collection/pelé-world_cup_hero`, a página SEMPRE caía em `notFound()`, mesmo a carta existindo no catálogo. Causa: o param de rota chega ainda percent-encoded (`"pel%C3%A9-world_cup_hero"`, não decodificado) pra qualquer `cardId` com caractere não-ASCII — o Next não decodifica esse dynamic segment automaticamente nesta configuração. Isso significa que **todo jogador com acento no nome (Pelé) nunca abria a própria página de detalhe**, num bug que já existia antes desta sprint e não tinha relação com o resolver. Corrigido com `decodeURIComponent(rawCardId).normalize('NFC')` no ponto exato do lookup — não é redesenho, é o roteamento básico funcionando pela primeira vez pra esses jogadores.

## Arquitetura — antes e depois

**Antes:**
```
CardFullPage         → nenhum card visual, só texto
CardSpotlightModal   → PlayerCard (fachada) size="lg" (mode="showcase" implícito via SIZE_TO_MODE)
```

**Depois:**
```
CardFullPage (hero)  → ResolvedWorldLegendsCard size="lg" density="standard" explícito
CardSpotlightModal   → ResolvedWorldLegendsCard size="lg" density="showcase" explícito
                            ↓
                     resolvePlayerCardRendererForDensity (lib/card-static/, NOVA função)
                            ↓
              FullArtworkWorldLegendsCard (full-artwork)  OU  composição procedural (fallback)
```

`density` é desacoplada de `size` — mesmo padrão já usado pela Collection (Sprint 36: `size="md"` + `density="compact"`). Aqui: `size="lg"` (caixa visual grande, apropriada pra hero) + `density` explícita conforme o contexto (`"standard"` no hero da página, `"showcase"` no Spotlight) — nenhum dos dois lugares deixa a densidade implícita no `size`.

## Nova função: `resolvePlayerCardRendererForDensity`

Antes desta sprint, a checagem "a densidade específica pedida tem asset gerado" vivia **inline dentro de `ResolvedWorldLegendsCard.tsx`** (adicionada na Sprint 36 pra Collection). Isso já seria uma segunda cópia do critério se eu tivesse copiado a mesma lógica de novo pro hero de detalhe. Em vez disso, extraí pra `lib/card-static/resolve-player-card-renderer.ts`:

```ts
export function resolvePlayerCardRendererForDensity(input, manifest, density): PlayerCardRendererResult
```

`ResolvedWorldLegendsCard` agora só chama essa função — **zero lógica de resolver duplicada**, confirmado por teste (`tests/lib/player-details-standard-showcase.test.ts`, último caso: o código-fonte do componente não contém mais `hasAnyGeneratedOutput` nem `resolveGeneratedArtwork(`).

## Regras de densidade — comportamento real

- **CardFullPage (hero)**: `density="standard"` fixo, sempre. Nunca pede Compact nem Showcase — confirmado por rede (1 única requisição `.webp`, variante `standard`) e por teste de código-fonte.
- **CardSpotlightModal**: `density="showcase"` fixo. `CardSpotlightPresence` só monta `<CardSpotlightModal>` quando `card !== null` (`{card && <CardSpotlightModal .../>}`, dentro de `AnimatePresence`) — o asset Showcase nunca é pré-carregado antes do usuário abrir o Spotlight (toque longo).
- **Fallback por densidade é determinístico**: `resolvePlayerCardRendererForDensity` retorna procedural com `fallbackReason: 'artwork-output-not-found'` quando a densidade pedida especificamente está ausente, mesmo que outra densidade do MESMO preset exista — testado explicitamente (testes 4 e 9: Standard ausente cai em procedural mesmo com Showcase presente, e vice-versa; a MESMA carta pedindo a densidade que EXISTE resolve full-artwork normalmente).

## Preservado

- Back navigation (`router.back()`), favoritar (`toggleFav`/`toggleFavoriteCardAction`), Dream Team (`toggleDreamTeam`), badge de raridade, "Não possui", história/bio, atributos, traits, seção "Informações", CTA de packs — nenhuma dessas seções foi tocada, só o hero ganhou o card visual.
- Escape fecha o Spotlight (já existia, mantido). Arraste-pra-girar e zoom do Spotlight — mantidos, `ResolvedWorldLegendsCard` só substitui o `<PlayerCard>` interno, a interação em volta é a mesma.
- Squad (`PlayerSelectModal`, `CardPoolSheet`) e Perfil (`BestCardShowcase`, `FavoriteCards`) continuam importando `PlayerCard` (fachada) sem nenhuma mudança — confirmado por teste.

## Arquivos alterados/criados

**Modificados:**
- `app/collection/[cardId]/page.tsx` — fix do bug de decode (não relacionado ao resolver, achado durante QA).
- `components/collection/CardFullPage.tsx` — hero ganha `<ResolvedWorldLegendsCard card={card} size="lg" density="standard" glow />`.
- `components/hall-of-legends/CardSpotlightModal.tsx` — `PlayerCard` → `ResolvedWorldLegendsCard` com `density="showcase"` explícita.
- `components/cards/ResolvedWorldLegendsCard.tsx` — usa `resolvePlayerCardRendererForDensity` em vez da checagem inline (Sprint 36).
- `lib/card-static/resolve-player-card-renderer.ts` — nova função exportada `resolvePlayerCardRendererForDensity`.
- `tests/lib/collection-renderer-integration.test.ts` — teste #10 atualizado pro novo nome de função (mais `CardFullPage.tsx` na lista de arquivos vigiados).

**Criados:**
- `tests/lib/player-details-standard-showcase.test.ts` — 18 testes.

## Testes

18 testes novos, cobrindo os 16 pedidos + 2 extras (checagem de não-reimplementação + regressão do bug de decode):

1–3: preset válido com Standard resolve full-artwork; nickname visível em Standard; stats presentes nos 10 pilotos.
4, 9: Standard ausente cai em procedural (não usa Compact); Showcase ausente cai em procedural (não usa Standard) — mas a MESMA carta pedindo a densidade que existe resolve normalmente.
5–6: `productionEligible: false` e preset ausente caem em procedural em qualquer densidade.
7–8: `CardFullPage` só declara `density="standard"` no código-fonte (nunca showcase/compact); `CardSpotlightModal` só declara `density="showcase"`, montado condicionalmente.
10–11: ações de detalhe (favoritar, Dream Team) e `router.back()` continuam no código.
12: Squad/Perfil continuam importando a fachada `PlayerCard` sem alteração.
13–14: nenhum componente de detalhe importa `CARD_STATIC_MANIFEST` nem chama o resolver diretamente — só via `<ResolvedWorldLegendsCard>`.
15–16: os 10 pilotos resolvem pra 10 URLs Standard únicas e 10 URLs Showcase únicas.
Extra: `ResolvedWorldLegendsCard` não reimplementa o critério combinado (usa só `resolvePlayerCardRendererForDensity`).
Extra: regressão do bug de decode do `cardId` (Pelé).

Suite completa: **325/325 passando** (era 307).

## Performance

- **Rede confirmada ao vivo**: `/collection/pelé-world_cup_hero` faz exatamente **1 requisição `.webp`** — a variante `standard` (`wl-goat-brazil-001.webp`, via `next/image`) — zero Compact, zero Showcase carregados sem necessidade.
- **Sem scan linear reintroduzido**: `resolvePlayerCardRendererForDensity` usa `resolvePlayerCardRenderer` (já com índice O(1) da Sprint 36) + `resolveGeneratedArtwork` (idem) — nenhuma nova busca `.find()` linear.
- **Resolver chamado uma vez por render**: mesmo `useMemo` da Sprint 36, deps agora incluem a densidade efetiva.
- **Showcase nunca pré-carregado**: `CardSpotlightModal` só monta (e portanto só instancia `<Image>`) quando o usuário efetivamente abre o Spotlight — confirmado por `AnimatePresence` + render condicional no código.
- **Sem bundle novo relevante**: `/collection/[cardId]` foi de 5.76kB pra 5.83kB (+0.07kB) — a lógica inteira já existia em `ResolvedWorldLegendsCard`, só um novo call site.
- **Sem layout shift**: `displayWidth` força `SIZES['lg'].card.width` (148px) — mesma caixa que o card procedural já ocuparia nesse tamanho.

## QA

Verificado ao vivo (Playwright, conta QA, `/collection/[cardId]` direto — funciona pra qualquer card do catálogo independente de posse, já que `owned` só controla o dimming/ações, não o render):

- **Piloto full-artwork (Pelé, `wl-goat-brazil-001`)** — desktop e mobile: artwork exclusivo renderiza no hero em Standard, nome "PELÉ" abaixo, badge "World Cup Hero · Não possui", zero erro de console além dos 404s pré-existentes do placeholder do PostHog.
- **Fallback procedural (Zico, sem preset)** — desktop: silhueta procedural padrão, "ZICO" abaixo, nenhum placeholder quebrado, nenhum erro.
- **Card faltando a densidade ativa** — coberto por fixture determinística nos testes (não em produção, já que os 10 pilotos têm as 3 densidades geradas) — testes 4 e 9.
- **Mobile (390×844)**: layout do hero responsivo, card centrado, nenhuma quebra.

**Limitação honesta**: a conta QA não possui nenhum dos 10 jogadores piloto (confirmado via leitura direta do banco, sprint anterior). Não tentei conceder cartas à conta de novo (fora de escopo, já negado explicitamente numa sprint anterior). A verificação funcionou mesmo assim porque `/collection/[cardId]` renderiza pelo `cardId` do catálogo, não pela posse — dá pra ver o hero de QUALQUER carta navegando direto pra URL, possuída ou não.

## Warnings conhecidos

Nenhum novo. Baseline de 463 warnings idêntico à Sprint 36.

## Bug encontrado e corrigido (fora do escopo original, mas bloqueando o QA do piloto real)

`app/collection/[cardId]/page.tsx` nunca decodificava o param de rota — qualquer `cardId` com caractere não-ASCII (todo jogador com acento, começando por Pelé) sempre resultava em 404 ao clicar no card na Coleção, mesmo antes desta sprint. Corrigido com `decodeURIComponent(rawCardId).normalize('NFC')`. Não é uma mudança de arquitetura do resolver — é o roteamento básico da página funcionando pela primeira vez pra esses jogadores. Coberto por teste de regressão.

## Não alterado

Artwork, direção visual, economia, odds, regras de raridade, gameplay, catálogo, identidades de jogador, textos de nickname, filtros/ordenação/paginação da Coleção.

## URL de produção

**Status: Ready.** https://world-legends.vercel.app (deployment `world-legends-abig05h6b`, commit `d5de0880`).
