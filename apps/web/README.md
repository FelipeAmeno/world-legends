# `@world-legends/web` — T026 concluída

**Frontend completo do MVP** — Next.js 15 App Router + TypeScript + TailwindCSS + shadcn/ui.

## Estrutura

```
src/
  app/
    layout.tsx                    Root layout (dark theme, providers)
    page.tsx                      Redirect → /dashboard
    dashboard/                    Início — hub central (doc 03 §2)
    collection/                   Coleção com grid + filtros
      [id]/                       Detalhe da carta (atributos, traits, química)
    team/                         Elenco + formação tática
    packs/                        Loja + animação de reveal
    craft/                        Craft de cartas com fragmentos
    album/                        Álbuns por nação com progresso
    ranking/                      Leaderboard + posição própria
    hall-of-fame/                 Conquistas + GOATs + vitrine (TC-HOF-06)
    events/                       Calendário LiveOps + missões
    profile/                      Estatísticas + carteira + conquistas
    login/ register/              Auth flows
    api/trpc/[trpc]/route.ts      Handler tRPC
  components/
    ui/index.tsx                  Design system: Button, Badge, Card, Progress, Tabs, etc.
    layout/shell.tsx              Sidebar responsiva + AppShell
    cards/card-tile.tsx           Tile de carta com glow de raridade
    cards/rarity-badge.tsx        Badge de raridade
    collection/                   CollectionPage, CardDetailPage, CraftPage, AlbumPage
    packs/packs-page.tsx          Loja + reveal overlay
    team/team-page.tsx            Campo interativo com picker
    ranking/                      RankingPage, HallOfFamePage
    layout/                       DashboardView, EventsPage, ProfilePage, Toast
    auth/                         LoginPage, RegisterPage
  lib/
    api/mock-client.ts            Mock API completo (todos os contratos do doc 16)
    utils.ts                      cn() helper
  stores/index.ts                 Zustand: authStore, uiStore, packStore
  hooks/use-query.ts              React Query hooks sobre o mock API
  styles/globals.css              CSS vars shadcn/ui + classes de raridade + animações

T025 (tRPC backend):
  server/trpc/init.ts             createContext() com repositórios injetados
  server/routers/                 collection, match, ranking, profile, packs, _app
  server/actions/index.ts         Server Actions: openPack, updateProfile, recordMatchResult
```

## Design System

Tema *Estadio de Noche* — navy profundo com floodlight amarelo-dourado como acento.

**Raridades** (doc 10 §2): cada raridade tem classe CSS própria + glow animado:
`card-rarity-{common,rare,elite,legendary,ultra,wch,goat}`

**Tiers** (doc 06 §3.2): badges com cores semânticas para Bronze → World Legend.

## Mock API

`src/lib/api/mock-client.ts` implementa todos os contratos do doc 16 com dados realistas:
12 cartas históricas, 8 jogadores no ranking, 4 packs disponíveis, 3 eventos ativos, 6 álbuns.

## 23 testes | 0 falhas
