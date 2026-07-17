# Sprint 43F — Home V2 Prototype Behind an Internal Route

Builds a functional Home V2 prototype at `/dev/home-v2`, isolated from the live `/` route. Real data only, five-area navigation, one contextual panel at a time, honest unavailable-feature states. The live Home, gameplay, economy, Asset Studio, and Gemini configuration are all untouched.

## 1. Discovery validation

Re-confirmed every API from `docs/design/09-home-v2-information-architecture.md` against current code before writing anything (full detail in `docs/design/10-home-v2-prototype.md` §1). No mismatch found — `getUserProfile`/`getUserCollection`/`getUserActiveSquad`/`getUserMatchStats`, `selectTopCards()`, `getFavoriteCardIds()`, `calcSnapshot()`, and every target route (`/match`, `/squad`, `/collection`, `/collection/[cardId]`, `/market`, `/packs`) all matched the Sprint 43E documentation exactly. One new decision made during implementation (not fully closed in doc 09): the Marketplace panel shows **no listing data at all**, not even labeled read-only — the only listing source (`lib/marketplace/mock-listings.ts`) is entirely fabricated (fake sellers, fake prices), and labeling fake activity "read-only" would still be showing fake activity to an authenticated user.

## 2. Route and authorization

`/dev/home-v2` follows the same convention as every other `/dev/*` route (confirmed against `/dev/card-assets`: no bespoke auth check, just the generic middleware gate) — not the Asset Studio's stricter allowlist, which is a documented one-off exception, not the project-wide convention. Fails closed: `getCurrentUser()` null → `redirect('/login?redirect=/dev/home-v2')`, checked before any data fetch (verified by test). `AppShell.tsx` received one additive line — `/dev/home-v2` added to the existing `FULLSCREEN_ROUTES` array (already containing `/`, `/match`, `/packs`, etc.) — so the prototype gets its own shell instead of double chrome; no existing route was touched.

## 3. Component tree and data-source map

Full tree and per-field data-source table in doc 10 §3-4. Summary: `HomeV2Experience` (shell: header, highlighted cards, 5-button nav) → `HomeV2ContextPanel` (one of `JogarPanel`/`SquadPanel`/`CollectionPanel`/`MarketPanel`/`PacksPanel` at a time). Every field in the view model traces to an already-existing real query — no new data source, no duplicate source of truth.

## 4. HomeV2ViewModel — implemented

`lib/home-v2/view-model.ts` — `buildHomeV2ViewModel()`, a pure function (no I/O), matching the doc 09 §8 proposal closely, with the Marketplace decision from §1 baked in as a permanent `{ readOnly: true }` with zero listing fields, and `packSummary.ownedUnopenedCount` typed as a literal `null` (not `number | null`) so a future implementer can't accidentally start returning `0` and imply a tracked-but-empty inventory that doesn't actually exist.

## 5. Real/unavailable feature behavior

- **Jogar**: real win/draw/loss/win-rate, real most-recent-match result (or an honest "no matches yet"), explicit note that Liga WL/Copa do Mundo have no route yet. The mock `EventBanner` carousel and its fake event count are not present anywhere in the prototype (verified by test).
- **Meu Squad**: real formation/OVR/chemistry when a squad exists; a real empty state ("você ainda não montou um squad") with a link to `/squad` otherwise — never a fabricated squad.
- **Coleção**: real owned count, real catalog size (`getCollection().length`), a real completion percentage — one single canonical link to `/collection` (verified by test to appear exactly once, unlike the live Home's three paths).
- **Mercado**: always a disabled button with an explanatory `title`, zero listings/prices/activity shown (§1).
- **Packs**: real pack names from `@world-legends/packs`, a note explaining packs are opened immediately on purchase (no inventory concept exists), a real link to `/packs`.
- **Top 3 cards**: `selectTopCards()` (Sprint 43E) integrated directly — verified against 0/1/2/3+-card collections; central card is rank 0, flanks are ranks 1-2; renders through `ResolvedWorldLegendsCard` (so full-artwork/procedural eligibility is decided by the existing, unmodified resolver — never reimplemented); `density="standard"` always (never `showcase`, verified by test); clicking links to the real `/collection/[cardId]` detail route (verified by test); zero-card state shows one real CTA to `/packs`, never a placeholder card.

## 6. Responsive and accessibility

Doc 10 §6-7. Fixed 5-column nav grid (never stacks vertically), contextual panel always below the highlighted cards regardless of width, `max-w-6xl` centered container. Accessibility: `aria-current` on the selected nav item (never color-only), native `<button>`/`<Link>` elements throughout (keyboard-reachable without extra JS), accessible labels on highlighted-card links, `disabled`+`aria-disabled`+`title` on the unavailable Marketplace action, `focus-visible:outline` on card links, 44px minimum touch targets. No carousel/animation exists in the prototype (EventBanner was removed, not replaced), so `prefers-reduced-motion` has nothing to guard against beyond a plain color transition on nav buttons.

## 7. Performance

Single parallel server-side fetch (same pattern as the live Home); switching contextual panels is a client-side state change against the already-fetched view model — zero additional network requests per panel switch; each highlighted card mounts once (no duplicate image download); `density="standard"` only, never `showcase`.

## 8. Tests — 38 new, 664/664 total

- `tests/lib/home-v2-select-top-cards.test.ts` (10, from Sprint 43E, unchanged this sprint).
- `tests/lib/home-v2-view-model.test.ts` (15 — 12 covering the core view-model contract + 3 added this sprint for the exact-2-cards/exact-1-card/empty-pack-list scenarios the brief numbers separately): highlighted cards from the real selector, empty-collection handling, username fallback logic, null-profile resilience, real win-rate derivation (including divide-by-zero safety), squad-summary passthrough (present and null), real completion-percentage derivation (including divide-by-zero safety), marketplace always exactly `{ readOnly: true }` with no other keys, `ownedUnopenedCount` always `null` (never a fabricated `0`), `featureAvailability` always explicit `false`, recent-result passthrough.
- `tests/lib/home-v2-prototype-boundaries.test.ts` (13, source-level): route auth-before-fetch ordering, live `/` still imports `PremiumHome` and never references the prototype, no mock-data imports anywhere in the prototype, no `EventBanner`/event-count code (not just comment text — fixed two self-matching-regex false failures during writing, same recurring pitfall as prior sprints, corrected to check actual import/JSX syntax), `aria-current` present, native focusable elements, real detail-route href, single canonical `/collection` link, Marketplace action always disabled with no price/listing text, no `showcase` density anywhere, no Gemini/Asset-Studio/`cards:build` references, the `AppShell.tsx` change is purely additive, and no production nav component references the prototype.

**Full suite: 664/664 passing** (626 prior + 38 new). `pnpm lint`: 0 errors, 462 pre-existing warnings (unchanged baseline). `pnpm typecheck`: clean. `pnpm build`: green, `/dev/home-v2` compiles (4.06 kB), run only after stopping `next dev`.

## 9. QA

Confirmed via production build that the route compiles, and via `curl` that both `/dev/home-v2` and `/` return `307` (correct login redirect) for unauthenticated requests — no crash on either. **Honest limitation**: no authenticated browser session is available in this environment — real click-through QA (3+/2/1/0 owned cards, empty squad, real mobile/desktop rendering, keyboard-only navigation) needs the same manual verification this project has asked for since Sprint 43A. Doc 10 §9 has the full breakdown of what's automated-tested vs. what still needs human eyes.

## 10. Gaps before production migration

1. Destination duplication (`/collection` reachable 3 ways on the live Home) is unresolved in production — only avoided inside this isolated prototype.
2. Desktop layout is intentional but browser-unverified.
3. The three orphaned components (`HomeHero`, `NewUserWelcome`, `NextBestAction`) are untouched — their fate is still an open decision from Sprint 43E.
4. `RootLayout`'s redundant profile/collection/match-stats fetch (documented in Sprint 43E) is not fixed.
5. The Marketplace panel ended up stricter than doc 09 originally sketched (§1) — worth a product sign-off before it's treated as final.

## 11. Recommendation for Sprint 43G

1. Full manual QA with a real authenticated user across all card-count/squad/viewport/keyboard scenarios before any cutover decision.
2. Fix live-Home destination duplication as its own, separate change — don't bundle it with a Home V2 cutover.
3. Decide and implement the fate of the three orphaned components.
4. Fix the `RootLayout` redundant-fetch inefficiency.
5. Only then evaluate a real `/` cutover — behind a flag, never a direct swap.

## 12. Files changed

- `apps/web/app/dev/home-v2/page.tsx` — new
- `apps/web/components/dev/home-v2/HomeV2Experience.tsx` — new
- `apps/web/components/dev/home-v2/HomeV2ContextPanel.tsx` — new
- `apps/web/lib/home-v2/view-model.ts` — new
- `apps/web/components/nav/AppShell.tsx` — one additive line (`/dev/home-v2` added to `FULLSCREEN_ROUTES`)
- `apps/web/tests/lib/home-v2-view-model.test.ts` — new, 15 tests (includes 3 added for the exact-2/exact-1-card and empty-pack-list scenarios)
- `apps/web/tests/lib/home-v2-prototype-boundaries.test.ts` — new, 13 tests
- `docs/design/10-home-v2-prototype.md` — new
- `SPRINT_43F_HOME_V2_PROTOTYPE_REPORT.md` — new

## 13. Production deployment

URL: https://world-legends.vercel.app (confirmed aliased to commit `61e24b3b`, deployment `world-legends-k8l9dqlsf`, status ● Ready). The prototype itself is at https://world-legends.vercel.app/dev/home-v2 (login required, same as every other `/dev/*` route).
