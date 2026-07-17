# Sprint 43F.2 — Home V2 Final Polish and Owner QA

Follow-up to Sprint 43F.1, triggered by owner QA against the deployed `/dev/home-v2` prototype. Verdict: architecture approved, desktop visual direction approved, **not yet approved for production migration** — only targeted polish and the missing responsive/interaction QA remained. This sprint addresses the 7 targeted owner-feedback items and completes that QA pass. No redesign, no Sprint 43G work, no change to `/`, gameplay, economy, card ranking, data contracts, Asset Studio, or Gemini.

## 1. Owner-feedback changes (1:1 against the 7 numbered items)

| # | Feedback | Change made | Where |
|---|---|---|---|
| 1 | Reduce hero height ~10–15%, preserve central-card impact, keep side cards readable, expose more of the contextual panel in the initial viewport, don't regress to Sprint 43F's undersized layout, no mobile overflow | `HERO_SCALE.center`: mobile `0.85→0.78`, desktop `1.55→1.4`; hero padding: `py-8/lg:py-10 → py-6/lg:py-7`. Combined ≈12–14% less section height. `side` stays `center * 0.78` unconditionally, so the 72–82% ratio requirement is preserved by construction, not by re-tuning two numbers independently. Mobile-overflow arithmetic re-verified against the new smaller value (test 196, still well under the 358px budget). | `HomeV2Experience.tsx` — `HERO_SCALE`, `HeroSection` |
| 2 | Reduce header height slightly, more subtle border/separation, preserve identity/level/XP/currencies/settings, readable touch targets | Header padding `py-3/lg:py-3.5 → py-2.5`; wordmark `text-xl/2xl → text-lg/xl`; dividers `bg-white/10`/`bg-white/15 → bg-white/[0.06]`/`bg-white/[0.08]`. All 5 pieces of information (identity, level, XP, currencies, settings) still render, none removed. Settings button: visual box compacted to `w-10 h-10` (40px) but `min-w-11 min-h-11` forces the actual rendered/hit target to 44px — caught and fixed a self-introduced regression where an earlier draft shrank it to 36px before any test ran. | `HomeV2Experience.tsx` — `HomeV2Header` |
| 3 | Replace "TAXA WIN" with "APROVEITAMENTO" | Label changed in `StatChipRow`'s stat list; no other mixed-language string found in the panel. | `HomeV2ContextPanel.tsx` — `JogarPanel` |
| 4 | Replace ⚽ emoji with an existing icon from the same system used by Home navigation | Exported `NavIcon` (was module-private) and a new `PLAY_ICON_PATH` constant (the identical path already used for the "Jogar" nav icon) from `HomeV2Experience.tsx`; imported both into `HomeV2ContextPanel.tsx` and rendered `<NavIcon d={PLAY_ICON_PATH} size={16} />` inside the "Jogar agora" button instead of the emoji. No new icon dependency. | `HomeV2Experience.tsx`, `HomeV2ContextPanel.tsx` |
| 5 | Improve legibility of level, XP values, unavailable-mode explanation, secondary contextual text — without over-brightening ALL secondary text | Level badge `text-[10px] → text-[11px]`; XP value `text-white/40 → text-white/55 font-semibold`; Jogar panel's "Liga WL/Copa do Mundo ainda não têm rota própria" explanation `text-white/30 → text-white/45 leading-relaxed`. Deliberately left untouched: "Nenhuma partida jogada ainda" (`white/40`), Market's unavailable description (`white/45`), Packs' inventory note (`white/35`) — selective, not blanket. | `HomeV2Experience.tsx`, `HomeV2ContextPanel.tsx` |
| 6 | Review excessive empty space in the Jogar contextual panel using only existing real data | The previously-empty support zone now shows a "Modo disponível: Partida Rápida" info chip above the CTA — a true statement about the app's current routing (Quick Match is the only implemented mode), not an invented metric. No new data source was added. | `HomeV2ContextPanel.tsx` — `JogarPanel` support zone |
| 7 | Normalize border-radius and surface treatment across header, hero, primary nav, contextual panel | Hero moved off its custom inline `background`/`border` and onto the same `glass-surface` token already used by header and contextual panel; the hero's distinctive radial glow was preserved by moving it into a separate absolutely-positioned overlay `<div>` layered on top of the shared surface rather than baked into the surface's own background. All four surfaces now share `rounded-2xl`; interactive elements nested inside (nav buttons, action links) consistently use the smaller `rounded-xl`. | `HomeV2Experience.tsx` — `HeroSection` |

## 2. Responsive QA matrix

No authenticated browser session is available in this environment (same honest limitation as Sprints 43F/43F.1). The following was verified by layout-math inspection and source-level tests, not by rendering pixels — the user should visually confirm each row before sign-off.

| Viewport | Hero fit | Header | Nav | Contextual panel | Notes |
|---|---|---|---|---|---|
| 390×844 | 3 cards fit, no horizontal overflow (test 196: total width ≈ 341px vs 358px budget) | Username truncates via `truncate` class if needed, level/XP always visible | Horizontal scroll (`overflow-x-auto`) if 5 buttons don't fit, `shrink-0` prevents squish | Below hero, full width | Smallest tier — most conservative scale (`center: 0.78`) |
| 430×932 | Same mobile scale tier as 390 (`matchMedia` breakpoint is 1024px), more slack than 390 | Same as above, more slack | Same as above | Same as above | No dedicated tier — verified the 390 budget is the binding constraint, so 430 always has strictly more room |
| 768×1024 | Mobile scale tier still applies (below 1024px breakpoint) | Same header layout as mobile | Grid layout not yet active (`lg:grid` starts at 1024px) — still horizontal-scroll nav | Same as mobile | Below the `lg:` breakpoint entirely — behaves identically to phone layout, just with more headroom |
| 1280×720 | Desktop scale tier (`center: 1.4`), `max-w-5xl` container | `lg:` header spacing active | `lg:grid lg:grid-cols-5`, no scroll | `lg:grid-cols-[1fr_auto]` two-zone layout active | First desktop tier — shortest viewport height in the matrix, most likely to show the contextual panel below the fold on a first paint; hero height reduction (item 1) directly targets this row |
| 1440×900 | Same desktop tier | Same | Same | Same | More vertical slack than 1280×720 |
| 1920×1080 | Same desktop tier, `max-w-5xl` caps content width (verified by test 182 — container never stretches to 100% of a wide viewport) | Same | Same | Same | Most vertical slack; horizontal centering via `mx-auto` confirmed in source |

**Not yet confirmed by a human**: actual rendered pixel positions, whether the contextual panel truly clears the fold at 1280×720 without scrolling, whether any text wraps unexpectedly at 768×1024's narrower width with a long username. These require the same manual pass requested in every prior sprint.

## 3. Interaction QA — all five areas

Verified by source inspection and the existing automated suite (`home-v2-prototype-boundaries.test.ts`, `home-v2-select-top-cards.test.ts`, `home-v2-select-hero-presentation.test.ts`, `home-v2-view-model.test.ts`, `home-v2-visual-hierarchy.test.ts`, `home-v2-final-polish.test.ts`):

| Area | Selected state | Keyboard nav | Contextual content | Real link | Disabled/unavailable | Dead action | Canonical route |
|---|---|---|---|---|---|---|---|
| Jogar | `aria-current="true"` + accent glow (test 188) | Native `<button>`, focusable by Tab | Win/draw/loss/Aproveitamento chips + recent result or honest empty state | `/match` (real route) | N/A (always available) | None — button always links out | N/A |
| Meu Squad | Same pattern | Same | OVR/chemistry chips, or empty-squad CTA if no squad | `/squad` | N/A when squad exists | None | N/A |
| Coleção | Same pattern | Same | Real owned/catalog count + completion bar | `/collection/${cardId}` for hero cards (test 190), `/collection` for the panel CTA | N/A | None | Single canonical `/collection` route, no duplicate destinations introduced this sprint |
| Mercado | Same pattern | Same | `UnavailableState` composition, honest read-only explanation | N/A — no real transaction path exists | `disabled` + `aria-disabled="true"` + `title` (unchanged from 43F.1) | Button is inert by design, never simulates a fake click | N/A |
| Packs | Same pattern | Same | Real pack names from `@world-legends/packs`, or `UnavailableState` if `canPurchase` is false | `/packs` | Conditional on `packSummary.canPurchase` | None | N/A |

Test 188 (aria-current + native buttons), test 189 (icon reuse), test 190 (card detail link), test 202 (live `/` unchanged) all re-ran green this sprint. No area's routing, disabled logic, or data source changed — only the visual presentation described in §1.

## 4. Data-state QA

Not re-derived from scratch — the underlying data-handling logic (`buildHomeV2ViewModel`, `selectTopCards`, `selectHeroPresentation`) was not touched this sprint, so the existing fixture-based suites remain the source of truth:

| Scenario | Covered by | Result |
|---|---|---|
| 3+ owned cards | `home-v2-select-top-cards.test.ts`, `home-v2-select-hero-presentation.test.ts` | Domain ranking + center-card selection unchanged, re-ran green |
| 2 owned cards | Same suites | Two-card fallback preserved (no fabricated 3rd card) |
| 1 owned card | Same suites | Single-card fallback preserved |
| 0 owned cards | `HeroSection`'s empty-state branch (untouched this sprint) + `home-v2-view-model.test.ts` | "Você ainda não tem cartas" + real `/packs` CTA, no cards rendered |
| Full-artwork / procedural mix | `home-v2-select-hero-presentation.test.ts` (injectable eligibility predicate) | First full-artwork-eligible card becomes center; a stronger card is never demoted for lacking full artwork — the function only chooses which of the pre-ranked 3 occupies the center slot, never reorders or drops cards |
| No squad | `HomeV2ContextPanel.tsx` — `SquadPanel`'s `!squadSummary` branch (untouched) | Empty-state CTA "Montar squad", no fabricated OVR/chemistry |
| Market unavailable | `MarketPanel` (untouched logic, `readOnly: true` always) | `UnavailableState` + disabled button, unchanged this sprint |
| No packs | `PacksPanel`'s `!canPurchase` branch (untouched) | `UnavailableState`, no fake pack names |
| Partial data failure | `home-v2-view-model.test.ts` (aggregation-level fixtures, untouched this sprint) | View-model aggregation behavior unchanged — no new failure path introduced by this sprint's presentation-only edits |

No mock data appears as authenticated real data anywhere touched this sprint (test 203 confirms no Gemini/Asset Studio references in the edited files; test 011/183/185 family from prior sprints confirm no fabricated fields).

## 5. Test suite

26 new/updated tests this sprint:
- `tests/lib/home-v2-final-polish.test.ts` — new, 12 tests (192–203): label rename, icon swap, hero height reduction, ratio preservation, mobile-fit re-verification, header touch target, header information completeness, surface-token sharing, Jogar panel empty-space fill, domain/presentation rules untouched, live `/` unchanged, no Gemini/Asset Studio references.
- `tests/lib/home-v2-visual-hierarchy.test.ts` — test 180 updated to the new `0.78`/`1.4` scale values; test 181 updated from the stale `0.85` mobile constant to the current `0.78` for accuracy (was not failing, but no longer reflected production code).

**Full suite: 698/698 passing** (686 prior + 12 new). `pnpm lint`: 0 errors, 462 pre-existing warnings (unchanged baseline — one self-introduced formatting error in the new test file was caught by `biome check` and auto-fixed before this run). `pnpm typecheck`: clean. `pnpm build`: green, `/dev/home-v2` compiles at 6.87 kB (up from 6.77 kB in Sprint 43F.1, expected given the added icon import and support-zone markup); run only after stopping `next dev`. Post-build `curl` smoke check: both `/` and `/dev/home-v2` return `307` for unauthenticated requests, no crash.

## 6. Remaining blockers

1. **No authenticated browser session available in this environment** — the responsive matrix (§2) and interaction QA (§3) are verified by arithmetic and source inspection, not by an actual rendered viewport. This has been the standing limitation since Sprint 43A and is not new to this sprint.
2. All gaps listed in Sprint 43F.1's report (§10 of `docs/design/10-home-v2-prototype.md`) remain open and unaddressed by this polish-only sprint: destination duplication on live `/`, orphaned Home components, `RootLayout`'s redundant fetch, Marketplace panel's stricter-than-spec behavior needing product sign-off.

## 7. Go/no-go recommendation for Sprint 43G

**Conditional go**, pending one human action: a manual click-through pass by the owner against the 6-viewport matrix (§2) and the 5-area interaction table (§3), specifically confirming the contextual panel clears the fold at 1280×720 and that no text wraps unexpectedly at 768×1024. All 7 targeted feedback items are implemented and covered by automated tests; the full suite, lint, typecheck, and build are green; no architectural, data-contract, or out-of-scope file was touched. If that manual pass confirms the arithmetic in §2 holds visually, Sprint 43G (production migration planning) can proceed without another polish cycle.

## 8. Files changed

- `apps/web/components/dev/home-v2/HomeV2Experience.tsx` — hero height/scale reduction, header refinement, surface normalization, exported `NavIcon`/`PLAY_ICON_PATH`
- `apps/web/components/dev/home-v2/HomeV2ContextPanel.tsx` — label rename, icon swap, Jogar panel support-zone fill
- `apps/web/tests/lib/home-v2-final-polish.test.ts` — new, 12 tests
- `apps/web/tests/lib/home-v2-visual-hierarchy.test.ts` — tests 180/181 updated for the new scale values
- `docs/design/10-home-v2-prototype.md` — version bump to 1.2, §6 updated, new §13
- `SPRINT_43F_2_HOME_V2_FINAL_QA_REPORT.md` — new

## 9. Production deployment

URL: https://world-legends.vercel.app (confirmed aliased to commit `0e77fa42`, deployment `world-legends-msoi9ylul`, id `dpl_DY93ePSTqeEerrh9Qq1NxPEDKR8z`, status ● Ready). The polished prototype is at https://world-legends.vercel.app/dev/home-v2 (login required).
