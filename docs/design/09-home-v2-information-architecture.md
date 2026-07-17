# WORLD LEGENDS — HOME V2 INFORMATION ARCHITECTURE

**Version:** 1.0 (Sprint 43E — discovery and specification only)
**Status:** Specification. The live Home (`apps/web/app/page.tsx` → `PremiumHome`) is unchanged.
**Owner:** Product / Game Design
**Project Owner:** Felipe Ameno
**Language:** Portuguese
**Last updated:** 2026-07-16

---

## 0. Escopo

Esta sprint é de **discovery e especificação**, não de implementação de UI. Nenhuma rota, componente de produção, gameplay, economia ou catálogo foi alterado. A única peça de código real desta sprint é um seletor puro (`lib/home-v2/select-top-cards.ts`, §4) — testado, nunca chamado pela Home ao vivo.

## 1. Home ao vivo hoje — árvore real

```
apps/web/middleware.ts → "/" não é pública → redirect /login se deslogado
apps/web/app/page.tsx (HomePage, server) — a Home real é "/", nunca "/dashboard"
  (apps/web/app/dashboard/page.tsx é um painel de debug, notFound() em produção)
 └─ AppShell (FULLSCREEN_ROUTES inclui "/") → Sidebar/MobileHeader/GameTopBar são PULADOS
    └─ components/home/PremiumHome.tsx
        ├─ PlayerHeader.tsx      — avatar/nome/nível/XP/créditos/gems, link → /settings
        ├─ DreamTeamWidget.tsx   — link → /collection
        ├─ GameGrid.tsx          — JOGAR→/match, ABRIR PACK→/packs, MONTAR TIME→/squad,
        │                          Eventos→/events, Coleção→/collection
        ├─ QuickStats.tsx        — OVR/Química/Vitórias/Taxa Win
        ├─ RetentionPanel.tsx    — daily login (modal) + missões→/missions
        ├─ ProgressTracker.tsx   — checklist "hoje você fez"
        ├─ EventBanner.tsx       — carrossel, CTAs → /match, /packs
        └─ PremiumBottomNav.tsx  — Home/Coleção/Squad/Partida/Missões
```

**Achado crítico de arquitetura**: `apps/web/src/app/**` é uma segunda árvore de rotas completa (`home`, `dashboard`, `craft`, `hall-of-fame`, `team`, `register`, `login`) **totalmente morta** — confirmado ausente do manifest de build (`.next/app-path-routes-manifest.json`). Não existe/não deve ser documentada como parte da Home real.

**Home não tem variante desktop.** `AppShell` pula Sidebar/chrome desktop pra rotas fullscreen (inclusive `/`), e nenhum componente de `components/home/*` tem breakpoint `lg:`. Numa tela larga, a Home renderiza como uma coluna estreita de celular sem navegação lateral. Isso é uma lacuna real que a Home V2 precisa resolver deliberadamente (não é escopo desta sprint decidir como, mas precisa estar no radar do Sprint 43F).

## 2. Classificação de cada elemento visível

| Elemento | Classificação | Nota |
|---|---|---|
| `PlayerHeader` (nível/XP/créditos/gems) | **Core status** | Real, mas nível/XP são *derivados* a cada render (`deriveAccountXp()`), nunca uma coluna persistida — ver §6 |
| `DreamTeamWidget` | **Redundante + dado não sincronizado** | Aponta pra `/collection`, mesmo destino de 2 outros elementos; estado só em `localStorage`, nunca Supabase |
| `GameGrid` — JOGAR | **Core action** | Real |
| `GameGrid` — ABRIR PACK | **Core action, com decoração mock** | Rota real; subtítulo "Classic · Elite · Legend" é string fixa, nunca uma contagem real de packs possuídos (não existe esse conceito hoje, §7) |
| `GameGrid` — MONTAR TIME | **Core action** | Real |
| `GameGrid` — Eventos | **Rota real, contador mock** | Badge "N ativo(s) agora" vem de `mock-events.ts` (`MOCK_EVENTS`, comentário do próprio arquivo já diz "substituir por fetch real") |
| `GameGrid` — Coleção | **Redundante** | 3º caminho pra `/collection` nesta tela |
| `QuickStats` | **Útil status** | Real |
| `RetentionPanel` — daily login | **Core action** | Real |
| `RetentionPanel` — missões | **Redundante + decorativo quebrado** | 2º caminho pra `/missions`; barra de progresso fixa em `width: 0` sempre, nunca reflete progresso real |
| `ProgressTracker` | **Útil status, dado não-autoritativo** | `localStorage`, nunca Supabase — pode divergir entre dispositivos |
| `EventBanner` | **Decorativo + mock apresentado como real** | Array de 3 slides 100% hardcoded ("Copa das Lendas", "Pack Ouro da Semana"), CTAs duplicam destinos já existentes em `GameGrid` |
| `PremiumBottomNav` | **Navegação core, com duplicação** | Home/Coleção/Squad/Partida/Missões — 4 dos 5 destinos já são alcançáveis por outro elemento na mesma tela |
| `HomeHero.tsx` | **Morto/órfão** | Zero imports reais, superado por `PlayerHeader` |
| `NewUserWelcome.tsx` | **Morto/órfão** | Chama uma server action real (`claimStarterPack`) mas não é renderizado em lugar nenhum — só citado num comentário desatualizado |
| `NextBestAction.tsx` | **Morto/órfão** | Não importado; só sobrevive numa referência de comentário no *loading skeleton*, que ainda mimetiza uma estrutura antiga (6 tiles) que não bate com o `GameGrid` real (3 tiles) |

**Não-funcional em produção**: nenhum link quebrado foi encontrado — toda `href` visível na Home resolve pra uma pasta de rota real. O problema não é "link morto", é (a) duplicação pesada de destino e (b) selo/subtítulo/contador mock em cima de um botão que em si é real.

## 3. As cinco áreas propostas — Home V2

**Jogar · Meu Squad · Coleção · Mercado · Packs.**

- **Jogar** deve ser o hub de modos, não um botão único pra `/match`. Hoje `/match` já é o único modo real disponível — não existe ainda uma rota "Liga WL" nem "Copa do Mundo" separada (`apps/web/app/` não tem essas pastas). **Recomendação**: manter "Jogar" como UMA entrada primária que leva a `/match` hoje, com a MESMA tela já preparada pra listar Liga WL/Copa do Mundo como cards internos quando esses modos existirem — nunca dois botões top-level permanentes pra modos que ainda não têm rota própria. Isso responde diretamente à pergunta do brief: **não**, discovery não encontrou nenhuma evidência de que Liga/Copa precisem ser ações top-level separadas — elas nem existem como rotas ainda.
- **Meu Squad** → `/squad` (real, já existe).
- **Coleção** → `/collection` (real, já existe; hoje alcançável de 3 formas diferentes na mesma Home — Home V2 deve ter só uma).
- **Mercado** → `/market` (rota existe, mas é **só navegação/leitura** — mock listings, "Em breve" no header, nenhuma action de compra/venda real, §7). Home V2 precisa rotular isso honestamente, nunca insinuar que comprar funciona.
- **Packs** → `/packs` (real, já existe; não existe hoje um conceito de "packs possuídos não abertos" — packs são comprados e abertos atomicamente na mesma ação, §7).

## 4. Seletor das 3 cartas em destaque

Implementado nesta sprint como função pura e testada (`apps/web/lib/home-v2/select-top-cards.ts`, 10 testes, nunca chamada pela Home ao vivo ainda):

```ts
selectTopCards({ collection, favoriteCardIds, limit = 3 }): CollectionCard[]
```

Ordem de desempate, exatamente como pedido no brief:

1. **Favoritado primeiro** — grupo inteiro de cartas com `cardId` em `favoriteCardIds` (de `getFavoriteCardIds()`, `lib/actions/favorites.ts` — real, Supabase-backed) vem antes de qualquer carta não-favoritada.
2. **`overall` descendente.**
3. **Raridade descendente** — `common < rare < elite < legendary < ultra < world_cup_hero` (`ALL_RARITY_CODES`, `@world-legends/types`).
4. **Prioridade de edição** — `goat > prime > event > base`, na mesma ordem de prestígio documentada em `packages/types/src/index.ts` (comentários "topo absoluto de prestígio" / "auge verificável da carreira"). **Nota honesta**: hoje, em produção, todo card seedado tem `editionCode: 'base'` — este critério é preparado pro domínio, mas não tem efeito prático até existirem cards `prime`/`event`/`goat` reais no catálogo.
5. **Desempate estável** — `userCardId` (instância possuída) quando existe, senão `cardId`, ordem alfabética — nunca nome de exibição (pode colidir/mudar).

**Renderização** (especificada, não implementada): a carta central é o resultado `[0]`; a 2ª e 3ª flanqueiam. Full-artwork vs procedural deve reusar `resolvePlayerCardRendererForDensity` via `ResolvedWorldLegendsCard` (`components/cards/`) — **nunca reimplementar essa decisão**; é a fonte única de verdade já testada. Nenhum preload do modo `showcase` (mesma regra já documentada em `CardSpotlightModal.tsx`). Clique abre o detalhe real do card (`/collection/[cardId]` ou equivalente já existente). O componente `CardSpotlightModal`/`BestCardShowcase` já existem e podem ser reaproveitados como base visual — nenhum widget novo de spotlight precisa ser inventado do zero.

**Estado vazio**: usuário sem cartas (`collection.length === 0`) → `selectTopCards` retorna `[]` — a Home V2 precisa de um estado vazio intencional (ex.: CTA pra abrir o primeiro pack), a ser desenhado no Sprint 43F, não nesta sprint.

## 5. Header restrito

| Campo | Real hoje? |
|---|---|
| Logo World Legends | Estático, sempre real |
| Nível do jogador | **Derivado**, não uma coluna persistida (`deriveAccountXp()` a partir de wins/draws/collectionCount reais — ver `rewards-data.ts:81-106`) |
| XP/progresso | Mesmo — derivado, não persistido |
| Moeda primária ("Créditos") | Real — `profile.softCurrency` |
| "Gems" | Real, mas é um **nome de UI incorreto** — o campo de banco é `fragment_balance`/fragmentos, não uma moeda separada de gems. Home V2 precisa decidir: renomear a label pra "Fragmentos" ou tratar como uma segunda moeda real e documentar a diferença — não inventar uma terceira moeda nova. |
| Notificações | **Não existe hoje** nenhum sistema de notificação real na Home — se a Home V2 incluir um ícone de notificação, só deve aparecer quando funcional (regra explícita do brief) |
| Acesso a perfil/configurações | Real — `/settings` |

Nenhuma moeda nova deve ser inventada.

## 6. Painel contextual (um por área, nunca vários dashboards simultâneos)

| Área | Conteúdo proposto | Fonte real |
|---|---|---|
| Jogar | Próximo modo disponível, progresso de competição, resultado recente, ação "continuar" | `getUserMatchStats()` (real) — "progresso de competição" não existe ainda como conceito (não há Liga/Copa reais), documentar como pendente |
| Meu Squad | Formação, OVR, química, editar squad | `squad?.formation` + `calcSnapshot()` (real, já usado por `QuickStats`) |
| Coleção | Contagem possuída, % de conclusão (se real), aquisição recente, abrir coleção | `collection.length` real; % de conclusão precisa de um denominador real do catálogo (checar se existe antes de prometer); "aquisição recente" não tem timestamp exposto hoje — verificar `user_cards.created_at` antes de implementar |
| Mercado | Listagens em destaque, **status somente-leitura explícito** | `/market` já é mock/leitura — Home V2 nunca deve dar a impressão de que comprar funciona; rotular como "Em breve" (mesmo padrão já usado na própria página `/market`) |
| Packs | Packs disponíveis (comprar), packs possuídos, última abertura, ação abrir | Comprar packs é real (`lib/actions/packs.ts`); "packs possuídos não abertos" **não existe como conceito hoje** — Home V2 não pode mostrar essa contagem até essa feature existir (ou omitir, ou implementar antes) |

## 7. Mapeamento de rota × capacidade real

| Ação proposta | Rota | Existe? | Funciona? | Mock-backed? | Observação |
|---|---|---|---|---|---|
| Jogar | `/match` | Sim | Sim | Não | — |
| Meu Squad | `/squad` | Sim | Sim | Não | — |
| Coleção | `/collection` | Sim | Sim | Não | — |
| Mercado (navegar) | `/market` | Sim | Parcial | **Sim** | Listings de `mock-listings.ts`; header já diz "Em breve" |
| Mercado (comprar/vender) | — | **Não** | — | — | Nenhuma server action existe (`lib/actions/marketplace.ts` não existe) |
| Packs (comprar/abrir) | `/packs` | Sim | Sim | Não | — |
| Packs possuídos (contagem) | — | **Não** | — | — | Conceito não existe no domínio hoje |
| Eventos/contador de eventos ativos | `/events` | Sim | Parcial | **Sim** | Rota real; contador vem de `MOCK_EVENTS` |
| Liga WL (top-level) | — | **Não** | — | — | Nenhuma rota `/league` ou similar existe |
| Copa do Mundo (top-level) | — | **Não** | — | — | Nenhuma rota `/world-cup` ou similar existe |

**Regra pro Sprint 43F**: nenhum botão novo pode apontar pra "Mercado (comprar/vender)", "Packs possuídos", "Liga WL" ou "Copa do Mundo" como ações reais — ou omitir, ou rotular honestamente como indisponível, seguindo o mesmo padrão "Em breve" que `/market` já usa.

## 8. Contrato de dados — `HomeV2ViewModel` (proposto, não implementado)

```ts
type HomeV2ViewModel = {
  userSummary: { username: string; avatarUrl: string | null };       // profile (real)
  currencies: { softCurrency: number; fragmentBalance: number };     // profile (real)
  progression: { level: number; xp: number; xpToNextLevel: number }; // derivado (real, não persistido)
  highlightedCards: CollectionCard[];                                // selectTopCards() sobre getUserCollection() (real)
  squadSummary: { formation: string | null; ovr: number; chemistry: number } | null; // getUserActiveSquad + calcSnapshot (real)
  playSummary: { wins: number; draws: number; losses: number; winRate: number };     // getUserMatchStats (real)
  collectionSummary: { ownedCount: number; completionPercent: number | null };       // collection.length real; completionPercent só se um denominador real existir
  marketplaceSummary: { readOnly: true; featuredListingIds: string[] } | null;       // mock hoje — nunca prometer transação
  packSummary: { canPurchase: true; ownedUnopenedCount: null };                      // ownedUnopenedCount não existe — sempre null até implementado
  featureAvailability: { marketplaceTransactions: false; packInventory: false; leagueMode: false; worldCupMode: false };
};
```

Nenhuma fonte de verdade duplicada — todo campo mapeia pra uma query/action já existente (`getUserProfile`, `getUserCollection`, `getUserActiveSquad`, `getUserMatchStats`, `getFavoriteCardIds`, `calcSnapshot`), com a única peça nova sendo `selectTopCards()` (puro, sobre dado já buscado).

## 9. Performance

- Shell inicial server-rendered (igual hoje) — `page.tsx` já busca tudo em paralelo (`Promise.all`); Home V2 deve manter isso, não regressar pra fetches sequenciais.
- **Corrigir a ineficiência já encontrada**: `RootLayout` recalcula `getUserProfile`/`getUserCollection`/`getUserMatchStats` pra `headerSummary`, mas esse resultado nunca é usado na Home (que é fullscreen e pula `MobileHeader`/`GameTopBar`) — Home V2 deve ou reusar esse fetch ou confirmar que o layout pula o cálculo pra rotas fullscreen.
- Tamanhos de imagem explícitos; densidade `compact`/`standard` conforme o layout (nunca `showcase` fora do detalhe de card).
- Nenhum preload do modo `showcase` (mesma regra já em `CardSpotlightModal`).
- Painel contextual carrega só o necessário pra área ativa — nunca os 5 dashboards de uma vez.

## 10. Acessibilidade

- Hierarquia de headings lógica (h1 único por tela, sem pular níveis).
- Navegação por teclado completa nos 5 destinos primários + no seletor de card em destaque.
- Ordem de foco previsível (header → destaque de cartas → ações primárias → painel contextual → nav inferior).
- Cada card em destaque com `alt`/label acessível (nome + raridade, nunca só a imagem).
- Estado de navegação selecionado (aria-current ou equivalente) no item ativo da nav inferior.
- `prefers-reduced-motion` respeitado em qualquer carrossel/transição (o `EventBanner` atual não checa isso — corrigir se o carrossel for mantido).
- Alvos de toque grandes o bastante pra mobile (mínimo 44×44px).
- Estados vazios (sem cartas, sem squad) com texto claro, nunca uma tela em branco.
- Contraste legível nas superfícies escuras propostas (§11).

## 11. Princípios visuais (documentados, não implementados)

Superfícies escuras e neutras; uso restrito de cor de destaque; as cartas são a fonte principal de cor da tela; dourado reservado pra estados premium/destaque; verde pra sucesso/semântica de campo; vermelho só pra destrutivo/erro; menos bordas/gradientes/badges que o design atual (que hoje usa badges coloridos em quase todo widget); hierarquia clara; alvos de toque grandes; comportamento responsivo mobile-first — **e, pela primeira vez, uma variante desktop real** (lacuna documentada em §1). Nenhum prompt de geração de imagem foi criado nesta sprint.

## 12. Plano de teste (futuro, pra quando a Sprint 43F implementar)

1. Usuário com 3+ cartas possuídas.
2. Usuário com 1-2 cartas.
3. Usuário sem nenhuma carta (estado vazio intencional).
4. Mix de cartas full-artwork e procedural entre as 3 em destaque.
5. Usuário sem squad salvo.
6. Tentativa de transação no Mercado (deve falhar honestamente / estar desabilitada, nunca fingir sucesso).
7. Usuário sem packs disponíveis pra compra (saldo insuficiente).
8. Mobile (viewport estreito).
9. Desktop (viewport largo — variante que não existe hoje).
10. Navegação só por teclado.
11. Rede lenta (estado de carregamento do painel contextual).
12. Falha parcial de dados (ex.: `getUserActiveSquad` falha mas o resto da Home carrega).

## 13. Riscos de implementação

- **Duplicação de destino é o maior risco de regressão silenciosa**: reduzir de 3 caminhos pra `/collection` (e 4 pra `/match`) pra 1 cada muda hábitos de navegação já formados — precisa de decisão de produto explícita, não só de código.
- **Mercado/Packs-possuídos**: qualquer card na Home V2 pra essas áreas precisa ou omitir a promessa de transação/contagem, ou esperar a feature real existir — o maior risco de produto é a Home V2 parecer "mais honesta" mas ainda mostrar um card de Mercado que implica compra funcional.
- **Falta de variante desktop**: se a Home V2 herdar o padrão fullscreen atual sem endereçar isso, o problema visual/arquitetural apontado no brief ("visualmente sobrecarregada") persiste em telas largas por um motivo diferente (layout de celular esticado, não excesso de widgets).
- **`localStorage` como fonte "de verdade"** (Dream Team, ProgressTracker): qualquer resumo que dependa desses dados vai divergir entre dispositivos — Home V2 deve decidir migrar pra Supabase ou tratar explicitamente como "só neste dispositivo".
- **Componentes órfãos com server actions reais conectadas** (`NewUserWelcome.tsx` → `claimStarterPack`): antes de deletar código morto num sprint futuro, confirmar se `claimStarterPack` ainda precisa de uma UI de entrada em algum lugar (novo usuário sem cartas) — a Home V2's estado vazio (§4) é o lugar natural pra isso.

## 14. Recomendação exata para a Sprint 43F

1. Implementar o shell da Home V2 atrás de um feature flag/rota de preview (nunca substituir `/` diretamente) — permite comparação lado a lado antes do cutover.
2. Resolver a duplicação de destino primeiro (uma entrada por rota), antes de qualquer trabalho visual.
3. Integrar `selectTopCards()` (já pronto e testado) num componente de destaque reusando `ResolvedWorldLegendsCard` + a lógica de elegibilidade já existente — nenhum widget novo de renderização de carta.
4. Implementar o painel contextual das 5 áreas na ordem: Meu Squad → Coleção → Packs → Jogar → Mercado (das mais prontas com dado real às mais dependentes de feature ausente).
5. Adiar Mercado transacional e contagem de packs possuídos pra sprints de escopo próprio — Home V2 não deve bloquear nessas duas features ausentes, só rotulá-las honestamente.
6. Especificar a variante desktop como parte do MESMO sprint de implementação, não como um "depois" — é mais barato decidir agora do que retrofitar depois.
7. Decidir explicitamente o destino de `HomeHero.tsx`/`NewUserWelcome.tsx`/`NextBestAction.tsx` (deletar vs. reaproveitar o fluxo de novo-usuário) antes de escrever qualquer componente novo com nome parecido.
