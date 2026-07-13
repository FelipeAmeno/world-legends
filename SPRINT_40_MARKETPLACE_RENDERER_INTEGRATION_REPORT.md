# Sprint 40 — Marketplace Renderer Integration

Integration and performance sprint. Wires the real, live Marketplace onto the shared `ResolvedWorldLegendsCard` resolver pipeline established in Sprints 36–39.

## 1. Scope correction (discovery finding, confirmed by user before implementation)

Discovery surfaced a fundamental mismatch with the original brief before any code was written:

- **No Inventory feature exists anywhere in the codebase.** A full-tree grep for "inventory" returned nothing — no route, no component. Collection (migrated in Sprint 36) is the current owned-card surface and was left untouched this sprint per explicit instruction.
- **Marketplace has no real transactional backend.** `app/market/page.tsx` renders an "Em breve" (Coming Soon) badge. `lib/marketplace/mock-listings.ts`'s `getListings()` generates fake listings client-side from the real catalog (`getCollection()`) with fake sellers and computed prices — its own header comment says: *"when the backend is connected, replace this — the UI won't need to change."* The Buy button in `ListingDetailModal.tsx` is hardcoded `disabled` with the label "🔒 Comprar — Em breve". Repo-wide grep for `buyListing`/`sellCard`/`createListing`/`cancelListing`/`purchase` returned zero matches — there is no ownership transfer, balance validation, optimistic update, or rollback logic to preserve or test.

The user confirmed the revised scope: integrate the shared renderer into every real, live Marketplace card-visual surface; do not invent Inventory; do not treat Collection as new work; do not build any transactional logic. This report documents that revised scope.

## 2. Discovery — live route and component tree

```
app/market/page.tsx (server component: getListings() from mock-listings.ts)
  → <MarketExperience listings>
      → MarketFilterBar / MarketFilterPanel  (search, rarity/position/country/era/type/price/OVR filters, 8 sort modes — no card visual, untouched)
      → TrendingChip (×6, horizontal strip)  — OVR number as colored text + name + price, no card frame. NOT a card visual. Left unchanged per confirmed scope.
      → ListingGrid → ListingCard (×N, responsive 2/3-col CSS grid, IntersectionObserver lazy-reveal, no pagination/virtualization)
      → ListingDetailModal  (bottom-sheet/modal, opened via SELECT reducer action)
```

No orphaned components found. No mobile-specific implementation — same responsive Tailwind tree renders both. No pagination or infinite scroll exists (`ListingGrid` renders the full filtered array in a plain CSS grid); no virtualization library is used or needed here (dataset size — up to 574 listings — is comparable to Collection's, already proven to perform fine with the same lazy-reveal pattern).

`ListingCard` and the inline thumbnail in `ListingDetailModal` were both custom miniature markup — a rarity-tinted gradient background with the OVR number rendered as oversized styled text, no real card frame or artwork at all. `TrendingChip` is genuinely text-only (colored OVR digits + name + price in a pill) and was correctly left alone.

## 3. Architecture before/after

**Before:** `ListingCard`/`ListingDetailModal` rendered a custom "OVR-on-gradient" placeholder — never called into the shared card system at all.

**After:** Both render `<ResolvedWorldLegendsCard card={...} density="compact" glow />` directly.

`MarketListing` (T063's DTO) is deliberately flat — `cardName`, `cardOvr`, etc. — and does **not** carry `artworkPresetId`/`nickname`/`stats`. Rather than duplicating preset data into that DTO (explicitly forbidden), `MarketExperience.tsx` builds a `cardsById: Map<string, CollectionCard>` once via the pre-existing `getCollectionMap()` helper (`lib/collection-data.ts`, already used elsewhere for O(1) cardId lookup — not something invented this sprint) and passes it down. `ListingGrid`/`ListingDetailModal` resolve `cardsById.get(listing.cardId)` — an O(1) lookup reusing the exact same `CollectionCard` objects Collection/Squad/Packs already use. No second player-card identity model, no per-tile map rebuild, no linear scan.

No Marketplace component imports `CARD_STATIC_MANIFEST` or calls `resolvePlayerCardRenderer`/`resolvePlayerCardRendererForDensity` directly — confirmed by `grep` and by the automated test suite.

## 4. Density mapping

- **Listing grid tiles:** `density="compact"` — matches Collection/Squad's `size="md"` pattern exactly.
- **Listing detail modal's inline card thumbnail:** also `density="compact"`. This thumbnail (~92×124px) is not larger than the grid tile (116×156px) — it's a small inline hero avatar, not a spotlight/expanded view. Per the density strategy rule ("Standard only if a real existing *larger* visual exists"), no larger visual exists here, so Standard was not introduced. Confirmed empirically zero new network requests fire when opening/reopening the detail modal — the already-cached Compact asset is reused.
- **`TrendingChip`:** unchanged — no card visual exists there to migrate.
- Showcase is not used anywhere in Marketplace (no spotlight flow exists).

## 5. Transactional-safety verification

Since no real transactional logic exists, "transactional safety" here means confirming the renderer swap didn't accidentally wire artwork into anything transactional:
- `MarketListing`'s price, status, seller, and ID fields are completely independent objects from the resolver result — verified by test (procedural-fallback resolution has zero effect on a listing's price/status/seller/id).
- The disabled Buy button, its "Em breve" label, and the absence of any buy/sell/listing function were re-verified unchanged after the edit (source-inspection test).
- Filtering/sorting operate on the `MarketListing[]` array only; `cardId` per listing is unaffected by reordering (verified by test).
- Selection (`SELECT` reducer action) is keyed by the listing object itself, unrelated to artwork resolution.

## 6. Network evidence (live QA, headless Chrome, QA account)

Since `getListings()` draws from the **full catalog** (not owned cards), Pelé's listing appears organically — meaning full-artwork rendering was verified empirically in Marketplace, unlike Squad in Sprint 39 (no ownership-limitation workaround needed here).

| Interaction | Result |
|---|---|
| Initial `/market` load | Pelé's real Compact WebP requested once (`/assets/cards/generated/compact/wl-goat-brazil-001.webp`); all other visible listings request only procedural `frame-*.png`/`bg-*.webp` layers. Zero Standard/Showcase/source-PNG requests. |
| Open Pelé's listing detail | **0 new asset requests** — reuses the already-cached Compact asset |
| Close + reopen detail | **0 new asset requests** — confirmed no re-fetch |
| Search filter ("pel") | Correctly isolates 2 results (real Pelé + a procedural "The Russian Pele" — different player, name-substring match); each renders its own correct artwork, no leakage between rows |
| Sort by OVR desc | Correctly reorders 574 listings, Pelé remains correctly rendered at top; **0 new/duplicate requests** for already-visible cards |

## 7. Desktop / mobile / keyboard QA

- **Desktop (1400×1200):** grid, trending strip, filters, search, sort, detail modal (price panel, auction fields, seller card, 7-day price history chart, disabled buy button) all verified with zero regressions.
- **Mobile (390×844):** same responsive tree, 2-column grid renders correctly, trending chips scroll horizontally, all card visuals correct.
- **Keyboard:** Tab order and visible focus ring confirmed unchanged (sidebar nav → search input, pre-existing structure, untouched by this sprint). `ListingCard` was already a plain `onClick` div with no `tabIndex`/`role` before this sprint — the renderer swap didn't remove or add any accessibility affordance there.
- **Console:** zero regressions; only the 5 known pre-existing PostHog placeholder-key 404s, consistent with every prior sprint.

## 8. Fallback QA

- **Full-artwork (eligible):** Pelé — verified live, correct in both grid and detail modal.
- **Procedural fallback:** every non-pilot listing (574 total, only 1 has a preset) — verified live, correct silhouette rendering, no broken images.
- **Missing-Compact-output / productionEligible-false fixtures:** covered by automated resolver-logic tests (identical fixture pattern used in Sprints 36–39), not re-tested live since the live catalog has no such fixture — this mirrors how prior sprints handled this exact scenario.

## 9. Known limitations

None specific to Marketplace itself — the full catalog (not just owned cards) is used to generate listings, so all 10 pilot players are reachable and full-artwork rendering was directly verified live, unlike Sprint 39's Squad limitation. The only limitation is the one documented in §1: Marketplace itself has no real backend, so most of the original brief's transactional/optimistic-state/buy-sell requirements don't apply to this codebase yet and were correctly scoped out per user confirmation.

## 10. Files changed

- `apps/web/components/market/ListingGrid.tsx` — `ListingCard` now renders `ResolvedWorldLegendsCard`, accepts `card`/`cardsById` props, removed duplicate name/position text (card now shows its own identity)
- `apps/web/components/market/ListingDetailModal.tsx` — inline thumbnail now renders `ResolvedWorldLegendsCard` at `density="compact"`
- `apps/web/components/market/MarketExperience.tsx` — builds `cardsById` via `useMemo(() => getCollectionMap(), [])`, threads it to `ListingGrid`/`ListingDetailModal`
- `apps/web/tests/lib/marketplace-renderer-integration.test.ts` — new, 27 tests

## 11. Tests

27 new tests (Node-environment, source-inspection + resolver-logic style consistent with Sprints 36–39). **Full suite: 397/397 passing.** `pnpm lint` (462 pre-existing warnings, 0 errors — unchanged baseline), `pnpm typecheck` clean, `pnpm build` 34/34 tasks green, `/market` route builds without error.

## 12. Production deployment

URL: https://world-legends.vercel.app (confirmed aliased to commit `588d0a4c`, deployment `world-legends-gvf7vg3jv`, status ● Ready)
