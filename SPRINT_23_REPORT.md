# Sprint 23 — Museum Collection

**Objetivo:** transformar a coleção numa galeria premium. Nada muda na
economia — escopo exclusivo de UX na tela de Coleção.

---

## Descoberta antes de construir

Antes de escrever qualquer código, mapeei o que já existia — e a
descoberta mudou completamente o escopo do trabalho. Há **duas árvores de
componentes de Coleção no repositório**:

1. `components/collection/*` (`CollectionExperience.tsx`,
   `FilterPanel.tsx`, `CompareModal.tsx`, `VirtualCardGrid.tsx` etc.) —
   **órfã**. Não está montada em nenhuma rota real (só dois arquivos dessa
   pasta são usados: `CardFullPage.tsx` na rota `/collection/[cardId]` e
   `CardGrid.tsx` no Squad Builder). Já tem filtro de raridade, filtro de
   país e comparação de cartas **completos e funcionando** — só
   desconectados de qualquer tela real.
2. `components/hall-of-legends/HallOfLegendsExperience.tsx` — a tela real
   de `/collection` (5 abas: Museu, Álbum, Nações, Dream Team,
   Conquistas), 2500+ linhas, renderiza `<PlayerCard>` de verdade no
   Álbum.

Cruzando isso com os 11 itens do brief, a real situação era:

| Item do brief | Estado antes desta sprint |
|---|---|
| Tilt | **Já ativo** — `use-card-tilt.ts` embutido no `PlayerCard`, usado em toda carta do Álbum desde a Sprint 18.7 |
| Parallax | **Já ativo** — mesmo mecanismo, `--px`/`--py` movendo cada camada em velocidade diferente |
| Glass | **Já ativo** — `CardShineLayer` reagindo ao mouse desde a Sprint 18.7 |
| Favoritos | **Já ativo** — `lib/actions/favorites.ts`, persistido no Supabase (`card_favorites`), já conectado à tela real |
| Filtro por raridade | **Já ativo** — implementação própria em `HallOfLegendsExperience.tsx` (`rarityFilter`) |
| Filtro por país | Existia completo em `FilterPanel.tsx` (órfã) — **desconectado** da tela real |
| Comparação entre cartas | Existia completo em `CompareModal.tsx` (órfã) — **desconectado** da tela real |
| Tela cheia | Existia uma rota (`/collection/[cardId]`), mas **sem** `<PlayerCard>` — só texto/stats, sem tilt/parallax/glass |
| Zoom | **Não existia** |
| Modo Spotlight | **Não existia** |
| Rotação (deliberada, distinta do tilt passivo) | **Não existia** |

Isso definiu o trabalho real: **reconectar** o que já estava construído
(país, comparação), e **construir** só o que faltava de verdade (Zoom,
Spotlight, Rotação — unidos numa única experiência coerente).

---

## O que foi feito

### 1. Filtro por país — reconectado

`countryFilter` novo em `HallOfLegendsExperience.tsx`, seguindo exatamente
a mesma convenção do `rarityFilter` já existente (mesmo padrão de state +
aplicação em `filteredGroups`). UI: `<select>` listando as ~65 seleções
com contagem de posse (`🇧🇷 Brasil (2/70)`), na aba Álbum.

### 2. Comparação entre cartas — reconectada

`CompareModal.tsx` (já existia, completo, com diffs estatísticos e traits
em comum) agora é importado e usado de verdade. Novo: **Modo Selecionar**
(toggle na barra de filtros) — ativa uma marca de seleção (✓, anel âmbar)
em cada card do Álbum; toque num card em modo seleção adiciona/remove da
comparação (máx. 4, mesma convenção do comparador órfão) em vez de
navegar; barra flutuante "N/4 selecionadas · Comparar · Cancelar" aparece
quando há seleção.

**Bug real encontrado e corrigido durante o teste ao vivo**: o botão de
alternar o modo e o botão de abrir o comparador tinham o mesmo texto
("⚖️ Comparar") — meu próprio script de teste clicou no botão errado (o
toggle, desligando o modo, em vez do botão da barra flutuante que abre o
modal). Um usuário real distinguiria pelo contexto visual, mas ainda assim
é ambiguidade evitável — renomeei o toggle pra "⚖️ Selecionar".

### 3. Modo Spotlight + Tela cheia + Zoom + Rotação — construídos juntos

Os quatro itens que faltavam formam uma única experiência coerente: um
visualizador de carta única, imersivo, tela cheia. Novo componente
`CardSpotlightModal.tsx`:

- **Modo Spotlight**: fundo `bg-black/90 backdrop-blur-md`, escurece/borra
  tudo em volta, só a carta em foco.
- **Tela cheia**: `fixed inset-0`, cobre o viewport inteiro.
- **Zoom**: botões +/− (120%–300%, padrão 180%) escalando o `PlayerCard`
  renderizado em `size="lg"` via `transform: scale()` — o motor de cartas
  não tem um tamanho fixo maior que `lg`, escalar via CSS é a técnica
  correta (mesma usada internamente pro `jerseyScale`).
- **Rotação deliberada**: arrastar horizontalmente gira a carta de
  verdade (`rotateY`, com `perspective: 1200px` no wrapper) — distinta do
  tilt passivo que reage ao mouse (±7°, Sprint 18.7); aqui é um gesto
  explícito do usuário, sem limite de ângulo, com botão "resetar giro".
- **Trigger**: toque longo (450ms) num card do Álbum — **não substitui**
  o toque curto normal (que continua selecionando pra comparar, se o
  modo estiver ativo, ou navegando pra `/collection/[cardId]`, como
  sempre foi). Fecha via ✕, clique no fundo, ou Esc.

Herda tilt/parallax/glass de graça, só por renderizar o `PlayerCard` real
— nenhum código extra precisou ser escrito pra isso.

---

## Validação ao vivo (Chrome real, conta de teste autenticada)

- **Filtro por país**: dropdown com 66 opções (Todos + 65 seleções),
  filtrar por "Brasil" mostra só o grupo do Brasil corretamente.
- **Modo Selecionar + Comparação**: selecionei Lúcio (87 OVR) e Elber (74
  OVR) — barra flutuante "2/4 selecionadas" apareceu, botão "Comparar"
  abriu o modal mostrando os stats lado a lado com indicadores ▲/▼
  corretos.
- **Modo Spotlight**: toque longo (simulado via CDP `Input.dispatchMouseEvent`
  segurando 600ms) abriu a visualização em tela cheia — carta grande,
  glow de raridade, controles de zoom "− 100% +" visíveis, fechamento
  funcionando.
- **Zero regressão no toque curto**: confirmado explicitamente — um
  clique normal (não modo-seleção) continua navegando pra
  `/collection/lucio-elite` exatamente como antes.
- Nenhum erro de console/página em nenhum dos testes.

## QA

```
pnpm exec biome check .   → 464 warnings, 0 erros (mesmo baseline de sempre)
pnpm exec tsc --noEmit    → 0 erros
pnpm test                 → 204/204 testes passando
pnpm build                → sucesso, 24/24 páginas; /collection 13.8→16.5kB (features novas), resto quase inalterado
```

**Nota sobre complexidade**: as novas `useState`/`useCallback`/JSX
empurraram a complexidade cognitiva do componente principal de 15 (limite)
pra 16 — corrigido extraindo lógica pura pra funções de módulo
(`toggleIdInSet`, `matchesCountryFilter`) e componentes próprios
(`CompareBar`, `CompareModalPresence`), mesmo padrão já usado na Sprint 22
(`PackContactShadow`). Confirmado via `git stash`/diff que a contagem de
warnings do arquivo voltou exatamente ao baseline (16, igual antes da
sprint).

```
git diff --stat -- packages/packs apps/web/lib/actions/packs.ts apps/web/lib/pack-logic.ts apps/web/lib/actions/favorites.ts
→ (vazio — nenhum arquivo de economia tocado)
```

## Arquivos criados/modificados

**Novos:** `components/hall-of-legends/CardSpotlightModal.tsx`,
`SPRINT_23_REPORT.md`.

**Modificados:** `components/hall-of-legends/HallOfLegendsExperience.tsx`
(filtro por país, modo comparar, integração do Spotlight, dois helpers
puros extraídos, dois componentes extraídos).

**Reconectados, não modificados:** `components/collection/CompareModal.tsx`
(só importado, zero linha alterada).

**Não modificado:** economia, favoritos (já funcionando, intocado),
Supabase, Card Engine (`PlayerCard`), Match Engine, Pack Engine.
