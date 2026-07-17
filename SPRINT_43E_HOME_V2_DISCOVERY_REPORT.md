# Sprint 43E — Home V2 Discovery and Information Architecture

Discovery and specification sprint. The live Home is untouched — this sprint produces the audit and the Home V2 information-architecture spec, plus one small, well-tested, unused-in-production pure helper (the top-3-card selector). No gameplay, economy, catalog, routes, or the live Home UI were modified.

## 1. Discovery — real route/component tree

The live Home is `/` (`apps/web/app/page.tsx`), not `/dashboard` (that route is a dev-only debug panel, `notFound()` in production). `AppShell` treats `/` as a fullscreen route, so `Sidebar`/`MobileHeader`/`GameTopBar` never render on Home — it has **no desktop variant** today, a real gap worth addressing explicitly in Sprint 43F rather than inheriting silently.

Full component tree, per-widget data-source audit, navigation map, and orphan list are in `docs/design/09-home-v2-information-architecture.md` §1-2 — derived from two research passes (Explore agent discovery + my own targeted follow-up on card-ranking fields, favorites, marketplace, and pack-inventory state).

**Key finding**: `apps/web/src/app/**` is a complete second, fully dead route tree (confirmed absent from `.next/app-path-routes-manifest.json`) — flagged so it's never mistaken for part of the live Home in future work.

## 2. Live/mock/dead classification

- **Mock data presented as real, on the live Home today**: the "Eventos" tile's active-event count (`lib/events/mock-events.ts` — the file's own header comment says to replace `getEvents()` with a real fetch) and the entire `EventBanner` carousel (3 fully hardcoded slides, a second independent mock dataset with its own fake "AO VIVO"/"LIMITADO" badges).
- **Hardcoded/decorative, not data-backed**: the "ABRIR PACK" tile's subtitle string, and `RetentionPanel`'s missions progress bar (permanently `width: 0`, never reflects real mission progress).
- **Client-only, not Supabase-backed** (real user data, but not synced/authoritative): `DreamTeamWidget` (`localStorage`) and `ProgressTracker` (`localStorage`).
- **Heavy destination duplication**: `/collection` reachable 3 ways, `/match` 4 ways, `/missions` and `/squad` 2 ways each, all from the same screen.
- **Dead/orphaned components**: `HomeHero.tsx`, `NewUserWelcome.tsx` (still wired to a real, otherwise-unused server action, `claimStarterPack`), `NextBestAction.tsx` (survives only as a stale reference in the loading skeleton, which itself no longer matches the real `GameGrid` layout).
- **No dead links found** — every visible `href` resolves to a real route folder.

Full table in doc 09 §2.

## 3. Proposed five-area navigation

**Jogar · Meu Squad · Coleção · Mercado · Packs.** Discovery found **no evidence** that Liga WL / Copa do Mundo need to be separate top-level actions — neither has a route today (`apps/web/app/` has no `league`/`world-cup` folder), so per the brief's own rule ("do not keep them separate unless discovery proves it's clearly better"), they're specified as future cards *inside* the single "Jogar" entry, not as new top-level buttons. Full reasoning in doc 09 §3.

## 4. Top-three-card selection rules

Specified exactly per the brief's preferred ordering (favorite → overall desc → rarity desc → edition priority → stable id), **and implemented** as a small, pure, fully tested helper — `apps/web/lib/home-v2/select-top-cards.ts`, 10 tests, never called by the live Home. This was judged low-risk per the brief's own allowance ("implement only if a pure domain helper is low-risk and well-tested") — it touches no route, no UI, no existing file.

- Favorites come from the real, Supabase-backed `getFavoriteCardIds()` (`lib/actions/favorites.ts`) — never mock cards.
- Rarity order: `common < rare < elite < legendary < ultra < world_cup_hero` (existing `ALL_RARITY_CODES`).
- Edition priority (`goat > prime > event > base`) follows the exact prestige ordering already documented in `packages/types/src/index.ts`'s own comments — honestly noted that this has zero practical effect today since every seeded card is currently `editionCode: 'base'`.
- Tie-breaker uses `userCardId` (the owned instance) when present, never `cardId` alone and never display name.
- Rendering (central = rank 0, flanked by ranks 1-2; full-artwork vs procedural decided by reusing `resolvePlayerCardRendererForDensity` via `ResolvedWorldLegendsCard`; no showcase-density preload; click opens the real card detail) is specified in doc 09 §4 but **not implemented** — that's UI work, out of scope this sprint.

## 5. Real route mapping

| Action | Route exists | Works | Mock-backed |
|---|---|---|---|
| Jogar → `/match` | ✅ | ✅ | No |
| Meu Squad → `/squad` | ✅ | ✅ | No |
| Coleção → `/collection` | ✅ | ✅ | No |
| Mercado (browse) → `/market` | ✅ | Partial | **Yes** (mock listings; page already self-labels "Em breve") |
| Mercado (buy/sell) | ❌ no route/action | — | — |
| Packs (buy/open) → `/packs` | ✅ | ✅ | No |
| Packs owned/unopened count | ❌ concept doesn't exist in the domain | — | — |
| Eventos → `/events` | ✅ | Partial | **Yes** (active-count badge) |
| Liga WL (top-level) | ❌ | — | — |
| Copa do Mundo (top-level) | ❌ | — | — |

Full table with file references in doc 09 §7.

## 6. Real/mock/missing data matrix

Covered per-widget in doc 09 §2 and per-view-model-field in doc 09 §8. Headline: currency and progression data in the header/QuickStats area is **entirely real** (level/XP are derived from real signals, not mock, just not a persisted column); the mock data on Home is concentrated specifically in the Events/EventBanner widgets.

## 7. Home V2 view-model proposal

`HomeV2ViewModel` (doc 09 §8) — every field maps to an already-existing query/action (`getUserProfile`, `getUserCollection`, `getUserActiveSquad`, `getUserMatchStats`, `getFavoriteCardIds`, `calcSnapshot`), with `selectTopCards()` as the one new (already-built) pure transform. No duplicate source of truth introduced. `marketplaceSummary`/`packSummary` are explicitly typed to make their current unavailability structural (`readOnly: true`, `ownedUnopenedCount: null`) rather than something a future implementer could accidentally fake.

## 8. Performance plan

Doc 09 §9 — keep the existing parallel server-side fetch pattern; fix the newly-discovered inefficiency where `RootLayout` redundantly recomputes `getUserProfile`/`getUserCollection`/`getUserMatchStats` for header components that Home never renders; explicit image sizes; `compact`/`standard` density only (never `showcase` outside a card's own detail view, matching the existing no-preload convention in `CardSpotlightModal`); contextual panel loads only its active area's data.

## 9. Accessibility plan

Doc 09 §10 — logical heading hierarchy, full keyboard reachability of the 5 primary areas + the highlighted-card selector, predictable focus order, accessible card labels (name + rarity, not just image), `aria-current`-style selected nav state, `prefers-reduced-motion` support (the current `EventBanner` carousel doesn't check this — flagged for correction if a carousel survives into V2), 44×44px minimum touch targets, intentional empty states, readable contrast on the proposed dark surfaces.

## 10. Implementation risks

Ranked in doc 09 §13: (1) destination-duplication reduction changes established navigation habits — needs an explicit product decision, not just code; (2) any Marketplace/pack-inventory card must never imply a transaction/count that doesn't exist; (3) inheriting the fullscreen mobile-only layout without addressing desktop leaves the "visually overloaded" problem in a different form; (4) `localStorage`-backed widgets (Dream Team, ProgressTracker) will diverge across devices unless migrated or explicitly scoped as device-local; (5) `NewUserWelcome.tsx`'s still-live `claimStarterPack` action needs a real home (likely the new empty state) before any dead-code cleanup touches it.

## 11. Exact recommendation for Sprint 43F

1. Build the Home V2 shell behind a preview route/flag — never replace `/` directly; allow side-by-side comparison before cutover.
2. Fix destination duplication first (one path per route), before any visual work.
3. Wire `selectTopCards()` (already built and tested) into a highlight component that reuses `ResolvedWorldLegendsCard` and the existing full-artwork eligibility resolver — no new card-rendering logic.
4. Build the five contextual panels in order of real-data readiness: Meu Squad → Coleção → Packs → Jogar → Mercado.
5. Defer transactional Marketplace and pack-inventory counting to their own future sprints — Home V2 should not block on them, only label them honestly.
6. Specify the desktop variant as part of the same implementation sprint, not a follow-up.
7. Explicitly decide the fate of `HomeHero.tsx`/`NewUserWelcome.tsx`/`NextBestAction.tsx` before writing any new similarly-named component.

## 12. Tests, gates, and deployment

New code this sprint is limited to `apps/web/lib/home-v2/select-top-cards.ts` + `apps/web/tests/lib/home-v2-select-top-cards.test.ts` (10 tests). Full suite: 636/636 passing (626 prior + 10 new). `pnpm lint`: 0 errors, 462 pre-existing warnings (unchanged baseline). `pnpm typecheck`: clean. `pnpm build`: green, run only after stopping `next dev`. No Gemini request occurred. No production UI, route, or navigation was replaced or modified.

## 13. Files changed

- `apps/web/lib/home-v2/select-top-cards.ts` — new
- `apps/web/tests/lib/home-v2-select-top-cards.test.ts` — new, 10 tests
- `docs/design/09-home-v2-information-architecture.md` — new
- `SPRINT_43E_HOME_V2_DISCOVERY_REPORT.md` — new

## 14. Production deployment

_Pending — filled in after push/deploy/confirm._
