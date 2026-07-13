# Sprint 41 — Migrate Remaining Live PlayerCard Call Sites

Discovery, migration and regression sprint. Finds and migrates every remaining live production consumer of the `PlayerCard` compatibility façade onto `ResolvedWorldLegendsCard`, following the pattern established across Sprints 36–40. `PlayerCard.tsx` itself is not removed.

## 1. Discovery — complete PlayerCard reference inventory

Full-repo search for imports of the façade (`from '@/components/cards/PlayerCard'` and the relative-path variant `from '../cards/PlayerCard'`) plus JSX usage, cross-checked against route reachability:

| File | Classification | Live/Dead | Migration status |
|---|---|---|---|
| `components/collection/CardDetailModal.tsx` | Live production | **Live** — sole real consumer is `components/squad/premium/PitchBuilder.tsx` (Squad's card quick-look). *Not* reachable from the real `/collection` route (see §1a). | **Migrated** — `density="showcase"` |
| `components/collection/CompareModal.tsx` | Live production | **Live** — sole real consumer is `components/hall-of-legends/HallOfLegendsExperience.tsx` (the real `/collection` route's compare flow). Previously rendered **no card visual at all** (custom OVR-number tile). | **Migrated** — `density="compact"`, card visual added |
| `components/match/premium/MatchResultScreen.tsx` | Live production | **Live** — MVP reveal tab, reached from `/match` → `MatchExperience.tsx` | **Migrated** — `density="showcase"` |
| `components/profile/premium/BestCardShowcase.tsx` | Live production | **Live** — `/profile`, `/profile/[userId]` | **Migrated** — `density="standard"` |
| `components/profile/premium/FavoriteCards.tsx` | Live production | **Live** — `/profile`, `/profile/[userId]` | **Migrated** — `density="compact"` |
| `components/hall-of-legends/HallOfLegendsExperience.tsx` | Live production | **Live** (`/collection`) | **Dead import removed** — imported `PlayerCard` but never rendered it; the museum grid has used `ResolvedWorldLegendsCard` directly since Sprint 36 |
| `components/collection/CollectionExperience.tsx` | Orphaned | **Dead** — imported by zero routes or components (already flagged as orphaned in Sprint 36's own test comments: *"não CollectionCardTile/CollectionExperience — esses ficaram órfãos"*). References `CardDetailModal`/`CompareModal` but is itself unreachable. | Not migrated (dead component; migrating it would not reduce any real grep-of-live-code result) |
| `lib/perf/lazy.tsx` (`CompareModalLazy`, `CardDetailModalLazy`) | Orphaned plumbing | **Dead** — zero consumers found repo-wide; leftover lazy-load wrappers, presumably from when `CollectionExperience.tsx` was live | Not touched — not a `PlayerCard` consumer itself |
| `components/dev/CardPreviewPanel.tsx` (+ `CardAssetsInspector.tsx` wrapper) | Dev-only tool | Live dev route `/dev/card-assets` | **Not migrated, by design** — tool's stated purpose is a live preview of the real `PlayerCard` component, including a `debugOverride` prop "que só este Dev Tool usa" |
| `components/dev/CardStressTestGrid.tsx` | Dev-only tool | Live dev route `/dev/card-stress-test` | **Not migrated, by design** — stress-tests N real `PlayerCard` instances directly |
| `components/dev/CardV3Gallery.tsx` | Dev-only tool | Live dev route `/dev/card-v3-gallery` | **Not migrated, by design** |
| `components/dev/StaticCardPipelineComparison.tsx` | Dev-only tool | Live dev route `/dev/static-card-pipeline` | **Not migrated, by design** — explicitly a Sprint 35B tool that *compares* the current `PlayerCard` (Card Engine v3) against other pipelines; migrating it would defeat its purpose |
| `components/cards/PlayerCard.tsx` | The façade itself | N/A | Not removed this sprint (explicit instruction) |
| Various `tests/lib/*.test.ts` | Test-only | N/A | String-literal references used for regression assertions, not real imports |

### 1a. Architectural correction found during discovery

The brief's PROFILE/COMPARE sections assumed `CollectionExperience.tsx` (which wires `CardDetailModal` + `CompareModal` together) was the live Collection detail/compare flow. It is not — `/collection` (`app/collection/page.tsx`) renders `HallOfLegendsExperience.tsx` directly, which uses `CardSpotlightModal` (already Showcase, migrated Sprint 37) for card detail and `CompareModal` (this sprint) for its own separate "⚖️ Selecionar" compare-mode flow. `CardDetailModal` turned out to be live *only* via Squad's `PitchBuilder.tsx`. This didn't change which files needed migrating (both were still live via their real consumer) — it only corrects which route/flow each belongs to, documented here per the brief's "surface architectural mismatches" instruction.

## 2. Architecture before/after

**Before:** each of the 5 migrated files either called `<PlayerCard card={...} size="..." glow />` with no explicit `density` (silently inheriting a density from `SIZE_TO_MODE[size]`), or — in `CompareModal.tsx`'s case — rendered no shared card component at all.

**After:** all 5 call `<ResolvedWorldLegendsCard card={...} size="..." density="..." glow />` with the density stated explicitly, matching the acceptance criterion "explicit density exists at every migrated call site." No file imports `CARD_STATIC_MANIFEST` or calls the resolver directly; all resolve via `resolvePlayerCardRendererForDensity` inside `ResolvedWorldLegendsCard`, same single decision point as every other migrated surface.

## 3. Density selected per surface, and why

| Surface | Density | Reasoning |
|---|---|---|
| `CardDetailModal.tsx` (Squad card quick-look) | `showcase` | Preserves the *existing* effective behavior exactly — `size="lg"` with no explicit density already resolved to Showcase via the façade's default `SIZE_TO_MODE` mapping. Making it explicit doesn't change what's on screen; it just stops relying on an implicit default, per "explicit density everywhere." Classified as a legitimate hero/modal presentation (large card at the top of a detail sheet), consistent with the brief's Showcase allowance for "existing hero, spotlight or modal presentations." |
| `CompareModal.tsx` (side-by-side comparison) | `compact` | Matches the brief's density table verbatim ("comparison lists: Compact"). |
| `MatchResultScreen.tsx` (MVP reveal) | `showcase` | A genuine one-off hero reveal — only mounts when `mvpPhase !== 'hidden'` and the MVP tab is active, with a spring/rotateY entrance and glow rings, architecturally identical to `GoatReveal`'s already-proven Showcase usage from Sprint 38. |
| `BestCardShowcase.tsx` (Profile primary card) | `standard` | The brief's density table explicitly names "profile primary card" under Standard. This *changes* the previous implicit density (was Showcase via `size="lg"` default) to Standard — a deliberate, brief-directed correction, not an accidental artwork change. On-screen size (`size="lg"`) is unchanged; only the fetched asset tier moves down, matching the always-visible (non-modal) nature of this section. |
| `FavoriteCards.tsx` (Profile favorites strip) | `compact` | Matches current implicit behavior exactly (`size="sm"` already implied Compact) — a "history row," per the density table. |

## 4. Compare — correctness verification

`CompareModal.tsx` previously rendered a custom "OVR-on-gradient" tile per compared card (identical pattern to pre-Sprint-40 Marketplace) with no real card visual. Migrated the same way: each compared card resolves independently via its own `card` prop, keyed by `card.cardId`. `compareCards()` (`lib/collection-filters.ts`) — the actual diff/attribute-comparison calculation — was inspected and confirmed to be purely numeric: it never reads `artworkPresetId`, never calls the resolver, and its output is identical regardless of which side renders full-artwork vs. procedural (verified live: comparing "Taffarel" against "Lucio", both procedural, produced correct independent OVR/attribute/traits output with zero cross-contamination).

## 5. Match — correctness verification

`display.mvp` is typed `CollectionCard | null` in `lib/match-data.ts`, the identical DTO used everywhere else — confirmed to contain zero resolver/artwork-related fields or logic. The reveal only mounts `ResolvedWorldLegendsCard` when `mvpPhase !== 'hidden'` (guarded by `AnimatePresence`), so it doesn't remount on every match-clock tick or event — there is no clock/event driving this component at all once the result screen is reached (match simulation has already completed by then). No pre-match lineup surface renders individual player cards today; Squad Builder (migrated Sprint 39) is the closest analog for that role.

**Known limitation:** live MVP-reveal QA via an actually-played match was attempted but blocked by a pre-existing, unrelated squad/match validation inconsistency — the QA account's squad, even after using Squad Builder's own "Melhor Time" auto-build and confirming a "Squad salvo!" save, was still rejected by `/match`'s pre-flight check (`buildSBStateFromSaved` / `createSBState` in `lib/squad-builder.ts`) as incomplete. This is unrelated to card rendering (it never touches `ResolvedWorldLegendsCard`, `artworkPresetId`, or the resolver) and matches a previously-documented deferred issue in this project's history (squad/match validation problems, parked pending card-pipeline work). Not fixed here, per this sprint's explicit "do not alter match simulation" boundary. MVP artwork correctness is instead covered by: (a) automated tests proving the resolver/density/mount-gating logic, and (b) architectural identity with `GoatReveal`, which *was* empirically verified live in Sprint 38 using the exact same component and density.

## 6. Hall of Legends — correctness verification

The museum grid (`/collection`) has used `ResolvedWorldLegendsCard` with `density="compact"` since Sprint 36 — confirmed unchanged. The only change this sprint was removing the dead `import { PlayerCard }` line (zero JSX usages found anywhere in the 2777-line file). `toggleFavoriteCardAction`, `onToggleCompare`, and the `CompareModal` wiring were confirmed present and untouched after the edit. `CardSpotlightModal` (Showcase, Sprint 37) was not touched.

## 7. Fallback QA

All migrated surfaces preserve the standard three-way fallback (missing preset / `productionEligible: false` / missing requested-density output → procedural), verified via the same fixture-based tests used in every prior sprint (see tests #2, #4 below and the shared resolver test suite). Live QA confirmed procedural rendering with zero broken images across Profile's Best Card, Compare's two sides, and Squad's `CardDetailModal` (all showed procedural silhouettes correctly for this QA account's non-pilot cards).

## 8. Network evidence (live QA, headless Chrome, QA account)

| Interaction | Result |
|---|---|
| `/profile` load | Only procedural `frame-ultra.png`/`bg-ultra.webp` requested (Best Card is a non-pilot ultra card for this account) — no Standard/Showcase full-artwork leakage |
| `/collection` → Álbum tab → Selecionar → pick 2 owned cards → open Compare | **0 new asset requests** — both cards' Compact assets were already resident from the grid; Compare modal reused them |
| Mobile `/profile` (390×844) | Renders correctly, responsive, Best Card and layout intact |

## 9. Tests

New file `apps/web/tests/lib/remaining-call-sites-renderer-integration.test.ts` — 36 tests (5 migrated files × 4 parameterized checks + 16 standalone). Updated `tests/lib/player-details-standard-showcase.test.ts` test #12 (previously asserted Profile *kept* the façade; now asserts it migrated, mirroring how Sprint 39 updated the same test for Squad). **Full suite: 433/433 passing.** `pnpm lint` (462 pre-existing warnings, 0 errors — two new non-null-assertion warnings introduced while writing tests were caught and fixed before the final run), `pnpm typecheck` clean, `pnpm build` 34/34 tasks green.

## 10. Desktop / mobile / keyboard QA

- **Desktop (1400×1200):** Profile (Best Card + stats), Collection's Album-tab Compare flow (2-card side-by-side, attribute table, traits) verified live with zero regressions.
- **Mobile (390×844):** Profile verified responsive, Best Card renders correctly at the same reduced viewport.
- **Keyboard:** Tab focus and visible focus ring confirmed unchanged on `/profile` (pre-existing sidebar nav order, untouched by this sprint).
- **Console:** zero regressions; only the 5 known pre-existing PostHog placeholder-key 404s, consistent with every prior sprint.

## 11. Final PlayerCard audit (per brief's required table)

See §1 above for the complete table. Summary counts:
- **Live production, migrated this sprint:** 5 files
- **Live production, dead import removed:** 1 file
- **Orphaned/dead, not migrated:** 2 (`CollectionExperience.tsx`, `lib/perf/lazy.tsx`'s unused lazy wrappers)
- **Dev-only, intentionally deferred (tools that exist specifically to test `PlayerCard` itself):** 4
- **The façade itself:** 1 (`PlayerCard.tsx`, not removed)

**Recommendation for Sprint 42 (PlayerCard removal):** Zero live production feature call sites remain. The only remaining references to the façade are the 4 dev-only tools, which import it *by design* (debug harnesses, pipeline comparison, stress testing — their entire purpose requires direct access to `PlayerCard`), plus `PlayerCard.tsx` itself. Removing `PlayerCard.tsx` in Sprint 42 would break those 4 dev tools unless they are explicitly updated or intentionally left broken/removed first — that decision should be made explicitly in Sprint 42's own discovery phase rather than assumed here. Production-wise, removal is safe today.

## 12. Files changed

- `apps/web/components/collection/CardDetailModal.tsx`
- `apps/web/components/collection/CompareModal.tsx`
- `apps/web/components/match/premium/MatchResultScreen.tsx`
- `apps/web/components/profile/premium/BestCardShowcase.tsx`
- `apps/web/components/profile/premium/FavoriteCards.tsx`
- `apps/web/components/hall-of-legends/HallOfLegendsExperience.tsx` (dead import removed)
- `apps/web/tests/lib/player-details-standard-showcase.test.ts` (test #12 updated)
- `apps/web/tests/lib/remaining-call-sites-renderer-integration.test.ts` (new, 36 tests)

## 13. Production deployment

URL: _pending — updated after deploy confirmation._
