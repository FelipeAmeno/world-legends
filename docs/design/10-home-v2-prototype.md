# WORLD LEGENDS — HOME V2 PROTOTYPE (INTERNAL ROUTE)

**Version:** 1.0 (Sprint 43F)
**Status:** Functional prototype at `/dev/home-v2`. The live Home (`/`) is unchanged.
**Owner:** Product / Game Design
**Project Owner:** Felipe Ameno
**Derived from:** `09-home-v2-information-architecture.md` (Sprint 43E discovery/spec)
**Language:** Portuguese
**Last updated:** 2026-07-16

---

## 0. Escopo

Protótipo funcional da Home V2, isolado em `/dev/home-v2`. `/` continua servindo `PremiumHome` sem nenhuma alteração. Nenhuma navegação de produção foi apontada pro protótipo; acesso é só por URL direta, atrás da mesma autenticação genérica que todo `/dev/*` já usa.

## 1. Validação do discovery da Sprint 43E antes de implementar

Reconferido contra o código atual antes de escrever qualquer linha nova:

- `getUserProfile`/`getUserCollection`/`getUserActiveSquad`/`getUserMatchStats` (`lib/server/game-data.ts`) — assinaturas idênticas ao documentado.
- `selectTopCards()` (Sprint 43E) — API confirmada, reusada sem alteração.
- `getFavoriteCardIds()` (`lib/actions/favorites.ts`) — confirmado real, Supabase-backed.
- `ProfileRow` tem `username`/`displayName`/`avatarUrl`/`softCurrency`/`fragmentBalance` — confirmado.
- `calcSnapshot(state).rating.overall` / `.chemistry.total` — confirmado (mesmos campos que a Home real já lê).
- `/match`, `/squad`, `/collection`, `/market`, `/packs` — todos existem; `/collection/[cardId]` confirmado como a rota real de detalhe de carta.
- **Nenhum mismatch encontrado** entre a documentação da Sprint 43E e o código atual — a única decisão nova tomada nesta sprint (não estava 100% fechada no doc 09) foi: o painel de Mercado nunca mostra nenhuma listagem, nem rotulada como "somente leitura" — porque a única fonte de listagem (`lib/marketplace/mock-listings.ts`) é inteiramente fabricada (vendedores/preços falsos), e rotular atividade falsa como "read-only" ainda seria mostrar atividade falsa pra um usuário autenticado. Ver §5.

## 2. Rota e autorização

`/dev/home-v2` (`app/dev/home-v2/page.tsx`) segue a mesma convenção de todo `/dev/*` existente (`/dev/card-assets` confirmado como referência: nenhuma checagem própria, só a auth genérica do middleware). A allowlist mais estrita do Asset Studio (`ASSET_STUDIO_ALLOWED_EMAILS`) é uma exceção documentada daquela sprint, não a convenção geral — não foi replicada aqui, conforme a própria instrução do brief.

Fail-closed: `getCurrentUser()` ausente → `redirect('/login?redirect=/dev/home-v2')`, checado ANTES de qualquer busca de dado (`page.tsx`, checado por teste de fronteira).

`AppShell.tsx` recebeu uma única linha aditiva — `/dev/home-v2` adicionada a `FULLSCREEN_ROUTES` (mesma lista que já inclui `/`, `/match`, `/packs`, etc.) — pra que o protótipo tenha sua própria shell (header + nav de 5 áreas) sem o chrome duplo do Sidebar/MobileHeader de produção. Nenhuma rota existente foi removida/alterada dessa lista.

## 3. Árvore de componentes

```
app/dev/home-v2/page.tsx (server)
 └─ components/dev/home-v2/HomeV2Experience.tsx (client, shell)
     ├─ HomeV2Header (interno) — logo, usuário, nível/XP, moedas, /settings
     ├─ HighlightedCards (interno) — top-3 via selectTopCards, ResolvedWorldLegendsCard
     ├─ <nav> 5 botões (Jogar/Meu Squad/Coleção/Mercado/Packs)
     └─ components/dev/home-v2/HomeV2ContextPanel.tsx (client)
         ├─ JogarPanel
         ├─ SquadPanel
         ├─ CollectionPanel
         ├─ MarketPanel
         └─ PacksPanel
```

## 4. Mapa de fonte de dados

| Campo do ViewModel | Fonte real |
|---|---|
| `userSummary` | `profile.displayName`/`profile.username` |
| `currencies` | `profile.softCurrency`/`profile.fragmentBalance` |
| `progression` | `deriveAccountProgress()` (mesma função que a Home real usa) |
| `highlightedCards` | `selectTopCards()` sobre `getUserCollection()` + `getFavoriteCardIds()` |
| `squadSummary` | `getUserActiveSquad()` + `calcSnapshot()` (mesmo cálculo da Home real) |
| `playSummary` | `getUserMatchStats()` |
| `collectionSummary` | `collection.length` + `getCollection().length` (tamanho real do catálogo) |
| `marketplaceSummary` | Sempre `{ readOnly: true }` — nunca uma listagem (§5) |
| `packSummary` | Nomes reais de `@world-legends/packs` (`STARTER_PACK.name` etc.); `ownedUnopenedCount` sempre `null` (conceito não existe) |
| `featureAvailability` | Sempre `false` pras 4 capacidades ausentes — nunca omitido, nunca `true` sem a capacidade existir |

## 5. Comportamento honesto por feature indisponível

- **Mercado**: painel mostra só "Mercado em modo somente-leitura — compra e venda ainda não estão disponíveis" + um botão `disabled` com `title` explicando por quê. Nenhuma listagem/preço/vendedor é buscado ou renderizado — decisão mais estrita que o doc 09 original cogitava, tomada nesta sprint porque a única fonte de listagem é inteiramente mock.
- **Packs possuídos**: nunca mostrado (nem como "0") — só os nomes reais dos packs comprávels + link real pra `/packs`, com uma nota explicando que packs são abertos na hora da compra.
- **Liga WL / Copa do Mundo**: painel Jogar declara explicitamente que essas rotas não existem ainda, sem esconder ou fingir.
- **Estado vazio de 0 cartas**: CTA único e real — "Abrir pacotes" → `/packs`. Nenhuma carta de exemplo é mostrada.

## 6. Comportamento responsivo

`max-w-6xl` centralizado; nav de 5 botões em grid fixo (nunca empilha verticalmente, cabe em telas estreitas); cartas em destaque em `flex` horizontal com `gap` menor em mobile (`gap-2`) e maior em desktop (`gap-4` a partir de `lg:`); painel contextual sempre abaixo das cartas em destaque, nunca ao lado (mesma ordem em qualquer largura, evita reflow chocante). Testado nas larguras representativas 375px (mobile) e 1440px (desktop) via inspeção de layout — QA visual completa depende de sessão autenticada real (§8).

## 7. Acessibilidade implementada

- Heading único por painel contextual (`<h2>` dentro de cada painel, nunca pulando nível).
- Nav primária como `<nav aria-label="Navegação primária">` com 5 `<button>` nativos — focáveis por Tab sem JS extra, `aria-current="true"` no item selecionado (nunca só cor).
- Cartas em destaque como `<Link aria-label="...">` com nome + posição de destaque no label (nunca só a imagem).
- Ação de Mercado indisponível usa `disabled` + `aria-disabled="true"` + `title` — nunca simula clique funcional.
- `focus-visible:outline` explícito nas cartas em destaque (foco de teclado visível).
- Alvos de toque: todos os botões/links interativos com `min-h-11` (44px).
- Sem animação/carrossel no protótipo (o `EventBanner` foi deliberadamente removido, não substituído por outra animação) — `prefers-reduced-motion` é consequentemente não-aplicável; nenhuma transição além de `transition-colors` nos botões de nav (cor, não movimento).

## 8. Performance

- Uma única busca paralela server-side (`Promise.all`, mesmo padrão de `app/page.tsx`).
- Painel contextual troca via estado client (`useState`), sem nova requisição de rede — os 5 painéis já vêm no mesmo payload inicial (view-model já montado), nenhum fetch adicional ao trocar de área.
- Cada carta em destaque (no máximo 3) é montada uma única vez — sem duplicar download de imagem.
- `density="standard"` fixo (nunca `showcase`) — confirmado por teste de fronteira.
- Nenhuma chamada de rede acontece ao trocar de painel contextual (dado já em memória) — evita o "waterfall" que o brief pediu pra evitar.

## 9. QA visual e testes

**Testes automatizados**: 38 novos testes (`home-v2-select-top-cards.test.ts` do Sprint 43E + `home-v2-view-model.test.ts` + `home-v2-prototype-boundaries.test.ts`, ambos novos nesta sprint) — cobrindo seleção determinística de cartas (0/1/2/3+ cartas), agregação do view-model sem dado mock, autorização fail-closed, ausência de EventBanner/contagem de evento mock, rota canônica única de Coleção, Mercado sempre desabilitado, nunca `showcase`, nenhuma referência a Gemini/Asset Studio/cards:build, e a mudança aditiva em `AppShell.tsx`. Suite completa: 664/664.

**QA manual**: confirmado via build de produção que a rota compila (`/dev/home-v2`, 4.06 kB) e via curl que tanto `/dev/home-v2` quanto `/` retornam `307` pra requisição não-autenticada (redirect correto pro login, nenhum crash). **Limitação honesta**: não tenho um mecanismo de navegador autenticado nesta sessão — o clique-a-clique real (3+/2/1/0 cartas, squad vazio, mobile vs desktop reais, teclado) precisa da mesma verificação manual que toda sprint anterior deste projeto já pediu ao usuário (mesmo padrão estabelecido desde a Sprint 43A).

## 10. Gaps antes de uma migração pra produção

1. **Duplicação de destino não foi resolvida em produção** — só neste protótipo isolado; `/` continua com os 3 caminhos pra `/collection` e 4 pra `/match` documentados na Sprint 43E.
2. **Variante desktop é intencional mas não testada em navegador real** — precisa de QA visual humana antes de qualquer cutover.
3. **Componentes órfãos (`HomeHero`, `NewUserWelcome`, `NextBestAction`) continuam intocados** — a decisão de deletar/reaproveitar (Sprint 43E §13) não foi tomada nesta sprint.
4. **`RootLayout`'s fetch redundante não foi corrigido** — continua rodando em paralelo com o fetch do protótipo quando `/dev/home-v2` é acessado (mesma ineficiência documentada pra `/`).
5. **Painel de Mercado ficou mais restrito que o doc 09 original cogitava** — decisão tomada durante a implementação (§5); precisa de validação de produto antes de virar o padrão final.

## 11. Recomendação exata para a Sprint 43G

1. QA manual completo com um usuário real autenticado (3+/2/1/0 cartas, squad vazio, mobile e desktop reais, navegação só por teclado) antes de qualquer decisão de cutover.
2. Resolver a duplicação de destino em produção primeiro, separadamente do cutover da Home V2 — não empacotar as duas mudanças juntas.
3. Decidir e implementar o destino dos 3 componentes órfãos.
4. Corrigir o fetch redundante do `RootLayout`.
5. Só depois disso, avaliar um cutover real de `/` — atrás de flag, nunca uma troca direta.
