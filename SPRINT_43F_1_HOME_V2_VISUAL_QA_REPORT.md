# Sprint 43F.1 — Home V2 Visual Hierarchy and Game Identity

Follow-up to Sprint 43F, triggered by owner visual QA against the deployed `/dev/home-v2` prototype: the information architecture was confirmed correct, but the prototype read as an internal dashboard rather than part of World Legends. This sprint improves visual hierarchy, hero-card presentation, and game identity — without touching the approved five-area architecture, the live `/` route, or introducing any fake data.

## 1. Owner QA findings (verbatim triage)

**Blockers**: highlighted cards too small to function as a hero; center card lacked dominance; side cards disproportionately small; procedural placeholder cards visually competed with the full-artwork Pelé card; excessive empty space; contextual panel read as a text report; overall visual disconnect from Packs/Match screens.

**Important**: header text too small/loose; XP/currencies/settings not clearly grouped; nav looked like generic corporate tabs; panels underused their space; weak secondary-text contrast; desktop composition didn't use the viewport.

All items addressed below, cross-referenced to the specific fix.

## 2. Before/after comparison

| Area | Sprint 43F | Sprint 43F.1 |
|---|---|---|
| Hero cards | Fixed `size="sm"`/`"lg"` (max 148×199px), flat `flex` row, no background treatment | Scaled wrapper around unchanged `ResolvedWorldLegendsCard` — center ≈1.55× (desktop) with radial spotlight + floor glow + drop-shadow depth; side cards fixed at 78% of center |
| Center card selection | Always domain rank[0] | New presentation-layer rule: first full-artwork-eligible card among the top-3 becomes center (§4) |
| Header | Plain text row, ⚙ unicode gear | `glass-surface` panel, grouped user/level/XP-bar block, `glass-gold` currency capsule, real settings icon |
| Navigation | Flat gold-fill selected state, no icons | Real SVG icons (reused, not new), per-area accent-colored glow on selection |
| Contextual panels | Single paragraph of text per area | Two-zone layout (stat chips + primary action), reusing `QuickStats.tsx`'s visual pattern |
| Container width | `max-w-6xl` | `max-w-5xl` (less dead space at wide viewports) |
| Unavailable states (Market, empty Packs) | One floating sentence | Icon + title + description composition |

## 3. Hero-card sizing decisions

Native card sizes are discrete (`xs`/`sm`/`md`/`lg`, max 148×199px) — `ResolvedWorldLegendsCard` was never modified or forked (explicit requirement). Instead, each card renders at `size="lg"` inside a container that applies `transform: scale()`, with the outer wrapper sized to the exact scaled dimensions (`transform-origin: top left`) so layout flow accounts for the visual size correctly. Two responsive tiers, switched via a `matchMedia('(min-width: 1024px)')` hook:

| Tier | Center scale | Side scale | Ratio |
|---|---|---|---|
| Mobile | 0.85× (126×169px) | 0.663× (98×132px) | 78.0% |
| Desktop | 1.55× (229×308px) | 1.209× (179×241px) | 78.0% |

Both tiers land inside the brief's required 72–82% range (verified by test, reading the literal constants out of the source file rather than re-asserting numbers in the test). A real bug was caught before any human saw it: the first version used only the desktop scale, which would have overflowed a 390px mobile viewport by roughly 250px. Caught via arithmetic while implementing responsiveness, fixed with the two-tier system, and now covered by a test that computes the exact mobile total width against the available viewport width.

## 4. Central-card presentation rule

New `lib/home-v2/select-hero-presentation.ts` — deliberately separate from `selectTopCards()` (Sprint 43E domain ranking, **untouched**). Rule chosen (per the brief's own suggested fallback, since changing the domain selector would have broken its existing Sprint 43E contract and tests): among the three domain-ranked cards, the first one (in domain order) that's full-artwork-eligible becomes the visual center; if none are eligible, the center stays at domain rank 0 — identical to Sprint 43F's original behavior. Eligibility is decided exclusively via the existing `resolvePlayerCardRendererForDensity` (imported, never reimplemented). The function never adds, removes, or reorders the underlying 3-card set — only which of those three occupies the center slot. Injectable eligibility predicate for pure/deterministic testing (9 new tests) without depending on the real generated card manifest.

## 5. Header changes

Wrapped in a `glass-surface` panel. Left block: larger glowing "World Legends" wordmark, a vertical divider, then username + level badge on one line and an XP progress bar (not just a number) on the next. Right block: a `glass-gold` pill grouping both currencies together (soft currency and fragments, divided by a thin separator) plus a real settings icon button (reused from `Sidebar.tsx`, replacing the unicode ⚙ character). No notification count anywhere — none exists in the real system, and none was added (verified by test).

## 6. Navigation changes

Same five areas, same routes. Visual change only: real SVG icons per area (match/squad/collection/market/packs paths, all reused verbatim from `Sidebar.tsx` and `PremiumBottomNav.tsx` — no new icon library), and the selected state now uses a colored glow + tinted border matching each area's existing accent color (the same colors `Sidebar.tsx` already assigns per route) instead of a flat gold fill that looked identical regardless of which area was active.

## 7. Contextual panel composition

Introduced a reusable `TwoZonePanel` (primary info/stats left, primary action right on desktop, stacked on mobile) and a `StatChipRow` component copying `QuickStats.tsx`'s exact visual language (icon-less colored number + label columns in a glass strip) — not duplicating that component, since each panel needs different real fields. Jogar shows win/draw/loss/win-rate as chips instead of a sentence; Meu Squad shows OVR/chemistry as chips; Coleção gained an actual progress bar for completion percentage. Market and empty-Packs states now use a shared `UnavailableState` composition (icon + title + description) instead of one floating line of text in an otherwise-empty panel.

## 8. Responsive decisions

Mobile: two-tier hero scale prevents overflow (§3); nav can scroll horizontally if needed (`overflow-x-auto` with `shrink-0` buttons) rather than wrapping awkwardly; panels stack vertically. Desktop: `max-w-5xl` container (down from `6xl`) directly addresses the "oversized void" finding; hero and nav use `lg:grid`/larger gaps intentionally rather than just stretching the same mobile layout. Tested via layout inspection at 390×844, 430×932, 1280×720, 1440×900, 1920×1080 — real browser QA still pending an authenticated session (§10).

## 9. Accessibility behavior (carried over + reconfirmed)

`aria-current` on selected nav item, native `<button>`/`<Link>` elements throughout, `focus-visible:outline` on hero card links, accessible labels naming each highlighted card's position and player, `disabled`+`aria-disabled`+`title` on the unavailable Marketplace action, 44px minimum touch targets maintained through the visual rework. New in this sprint: the ambient hero glow only animates under `motion-safe:` (Tailwind's `prefers-reduced-motion` variant) — the first animation this prototype has ever shipped, and the first place in this codebase's Home-adjacent code to respect reduced-motion at all (verified by test).

## 10. Visual QA notes

Confirmed via production build that `/dev/home-v2` still compiles (6.77 kB, up from 4.06 kB — expected given the added markup/logic) and via `curl` that both `/dev/home-v2` and `/` still return `307` for unauthenticated requests, no crash. **Honest limitation, unchanged from Sprint 43F**: no authenticated browser session is available in this environment, so the owner's requested side-by-side visual comparison against the real Packs and Match screens at all five viewport widths still needs human eyes — I verified the underlying arithmetic (scale ratios, mobile total width vs. viewport) and the icon/token reuse via source-level tests instead of screenshots.

## 11. Tests — 22 new, 686/686 total

- `tests/lib/home-v2-select-hero-presentation.test.ts` (9): no-eligible-card falls back to domain rank 0, first-eligible-card-in-domain-order becomes center (even when not rank 0), remaining two preserve domain order across the two flank slots, the 3-card set is never altered, empty/1-card/2-card inputs handled without fabricating a card, deterministic across repeated calls, and a source check confirming the real eligibility path uses `resolvePlayerCardRendererForDensity` and never reimplements the `productionEligible` check.
- `tests/lib/home-v2-visual-hierarchy.test.ts` (13): side/center scale ratio within 72–82% at both responsive tiers (read from the literal source constants, not re-asserted), center is always larger than side at both tiers, the exact mobile-viewport width arithmetic proves no horizontal overflow, the container has a defined max-width, no notification concept anywhere in the header or view model, the header only interpolates real view-model fields, the Packs panel never references `ownedUnopenedCount`, no panel uses `showcase` density, the ambient glow only animates via `motion-safe:`, nav keeps `aria-current` and native buttons, nav icons are proven to be copied verbatim from existing project files (not a new dependency), highlighted-card links still target the real detail route, and the live `/` route is reconfirmed untouched.

**Full suite: 686/686 passing** (664 prior + 22 new). `pnpm lint`: 0 errors, 462 pre-existing warnings (unchanged baseline — one real formatting error was caught and auto-fixed during this sprint's own work). `pnpm typecheck`: clean (one self-inflicted bug caught and fixed: a JSDoc comment containing a literal `*/` sequence broke the file's parsing entirely — fixed by rewording, same category of mistake as prior sprints' self-matching-regex issues, just in comment syntax this time instead of test assertions). `pnpm build`: green, run only after stopping `next dev`.

## 12. Remaining gaps before Sprint 43G

Same list as Sprint 43F's report, updated: destination duplication on live `/` is still unresolved (out of scope for an isolated prototype); the desktop layout is now intentionally composed but still not verified in a real browser; the three orphaned Home components are still untouched; `RootLayout`'s redundant fetch is still unfixed; the Marketplace panel's stricter-than-originally-specified behavior (§5 of the Sprint 43F report) still needs product sign-off; and now additionally — the hero presentation rule has never been observed running against the real full-artwork catalog in a browser (only against injected test predicates).

## 13. Files changed

- `apps/web/lib/home-v2/select-hero-presentation.ts` — new
- `apps/web/components/dev/home-v2/HomeV2Experience.tsx` — hero rework, header rework, nav rework
- `apps/web/components/dev/home-v2/HomeV2ContextPanel.tsx` — two-zone panel composition, stat chips, unavailable-state composition
- `apps/web/tests/lib/home-v2-select-hero-presentation.test.ts` — new, 9 tests
- `apps/web/tests/lib/home-v2-visual-hierarchy.test.ts` — new, 13 tests
- `docs/design/10-home-v2-prototype.md` — updated (§6, §10, §11, new §12)
- `SPRINT_43F_1_HOME_V2_VISUAL_QA_REPORT.md` — new

## 14. Production deployment

URL: https://world-legends.vercel.app (confirmed aliased to commit `296bd272`, deployment `world-legends-jqof2ix9i`, status ● Ready). The refreshed prototype is at https://world-legends.vercel.app/dev/home-v2 (login required).
