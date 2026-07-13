# Sprint 39 — Squad Builder Full-Artwork Integration

Integration and performance sprint. Wires the real, live Squad Builder onto the shared `ResolvedWorldLegendsCard` resolver pipeline established in Sprints 36–38. No redesign, no formation/chemistry/position/economy/rarity changes, no artwork changes.

## 1. Discovery

Traced the live route end to end before touching anything:

```
app/squad/page.tsx (SquadPage)
  → getCollection() / getSquad() / getFavorites()
  → <PitchBuilder allCards initialState favoriteIds />
      → <PremiumPitch>            (starting XI, pitch slots)      → PitchCard
      → <BenchStrip>               (bench/reserve slots)
      → <CardPoolSheet>            (player picker / pool sheet)   → PoolCard (drag source)
      → <PlayerSelectModal>        (tap-to-swap picker + compare) → CardCell, MiniCard
      → <DragOverlay> → DragPreviewCard   (dnd-kit drag preview, second instance)
      → <CardDetailModal>          (cross-import from collection/, already on the façade — untouched)
```

**Orphan check: none found.** Unlike Sprints 36–38, every card-rendering component reachable from `PitchBuilder.tsx` is genuinely live — no dead components, no architectural mismatch requiring a user decision before implementing. This is the first sprint in the series where discovery didn't surface a surprise.

Desktop and mobile share the same component tree (`PitchBuilder.tsx` is responsive via Tailwind, not a separate mobile implementation) — confirmed by mobile QA (§7).

**Drag preview does mount a second card instance.** `PremiumPitch.tsx`'s `PitchCard` dims to `opacity: 0.2` but stays mounted during drag (not unmounted); `PitchBuilder.tsx`'s dnd-kit `<DragOverlay>` mounts a separate `DragPreviewCard` of the same card, following the cursor. Both are now explicit `density="compact"` for the same player → same resolved WebP URL → the browser dedupes the request (empirically confirmed in §6, not just architecturally asserted).

## 2. Architecture before/after

**Before:** all five files imported `PlayerCard` (the façade), which itself delegated to `ResolvedWorldLegendsCard` — so rendering was already correct, but every Squad call site was one indirection away from the shared resolver.

**After:** all five files import `ResolvedWorldLegendsCard` directly:

- `components/squad/premium/PremiumPitch.tsx` — `PitchCard` (starting XI slot)
- `components/squad/premium/BenchStrip.tsx` — bench/reserve slot
- `components/squad/premium/CardPoolSheet.tsx` — `PoolCard` (picker drag source)
- `components/squad/premium/PlayerSelectModal.tsx` — `CardCell` (picker grid) + `MiniCard` (compare panel)
- `components/squad/premium/PitchBuilder.tsx` — `DragPreviewCard` (dnd-kit `DragOverlay`)

No Squad component calls `resolvePlayerCardRenderer`/`resolvePlayerCardRendererForDensity` directly, imports `CARD_STATIC_MANIFEST`, or duplicates fallback logic — verified by `grep` and by the automated test suite (§5). `PlayerCard` remains a façade for the two Profile consumers (`BestCardShowcase.tsx`, `FavoriteCards.tsx`) not in scope for this sprint.

`lib/squad-builder.ts` (chemistry, formation, position-compat, auto-suggest logic) contains zero references to `artworkPresetId` or the resolver — confirmed by test — so rendering fallback can never influence gameplay math.

## 3. Density strategy

Every Squad card call site uses `density="compact"` explicitly: pitch slots, bench, picker grid, compare-panel mini cards, and the drag preview. No Standard or Showcase request exists anywhere in Squad — there's no larger card view or hero modal in this feature to justify it. Confirmed empirically: across every interaction captured in QA (page load, picker open, drag, formation change, reload), the only artwork-adjacent network requests were procedural-layer assets (`frame-*.png`, `bg-*.webp`) — zero Standard/Showcase/source-PNG requests at any point.

## 4. Drag-and-drop findings

- Original card (pitch slot / bench slot / pool card) stays **mounted**, dimmed to `opacity: 0.2`/`0.25` during drag — not unmounted and remounted.
- dnd-kit's `<DragOverlay>` mounts a **second** `DragPreviewCard` instance that follows the cursor.
- Both instances request the same `density="compact"` artwork for the same player → identical resolved URL → single network fetch (or cache hit), never two distinct downloads. Confirmed via live network capture during an actual pointer-drag sequence (mouse down → move → move → up): **zero new asset requests fired during the drag**, because the dragged card's artwork was already loaded on initial page render.
- Sensors are `PointerSensor` (6px activation distance) and `TouchSensor` (180ms delay / 8px tolerance) — pre-existing dnd-kit config in `PitchBuilder.tsx`, untouched by this sprint. No `KeyboardSensor` is configured, so native drag-via-keyboard isn't available (pre-existing, not introduced or regressed here).

## 5. Automated tests

New file: `apps/web/tests/lib/squad-builder-renderer-integration.test.ts` — 22 tests, source-inspection + resolver-logic style consistent with Sprints 36–38 (`environment: 'node'`, no component rendering). Covers: all 5 files import `ResolvedWorldLegendsCard` and never `PlayerCard`/`CARD_STATIC_MANIFEST`/the resolver directly; every render call site passes `density="compact"`; `lib/squad-builder.ts` has zero coupling to artwork/resolver logic; `DragPreviewCard` requests the same density as the mounted original.

Updated `apps/web/tests/lib/player-details-standard-showcase.test.ts` test #12 to reflect that `PlayerSelectModal.tsx`/`CardPoolSheet.tsx` no longer use the façade (Squad migrated directly this sprint); only the two Profile files remain façade consumers.

**Full suite: 370/370 passing.** `pnpm lint` (462 pre-existing warnings, 0 errors — unchanged baseline), `pnpm typecheck` clean, `pnpm build` 34/34 tasks green.

## 6. Network evidence (live QA, headless Chrome)

Captured via `page.on('request', ...)` filtering `.webp`/`.png` under `/cards/` across every interaction, using the QA account `s19audit_...@worldlegends-test.com`:

| Interaction | New asset requests | Notes |
|---|---|---|
| Initial `/squad` load | `frame-*.png`, `bg-*.webp` per rarity present | Procedural-layer assets only — QA account owns no full-artwork pilots |
| Open player picker (Coleção sheet) | `frame-legendary.png`, `frame-ultra.png`, `bg-legendary.webp`, `bg-ultra.webp` | Procedural only, no Standard/Showcase |
| Drag starter → starter (swap) | **0** | Both cards' Compact artwork already resident; dedup confirmed |
| Drag starter → bench | **0** | Same — OVR (74→73) and chem (31→30) recalculated correctly, auto-save fired ("Squad salvo!") |
| Formation change (4-3-3 → 4-4-2) | **0** | No re-fetch for already-rendered players |
| Full page reload | `frame-*.png`, `bg-*.webp` only | Persisted state confirmed (bench move survived reload); zero Standard/Showcase/source-PNG at any point |

No duplicate requests observed from the drag-overlay/dimmed-original pair in any interaction.

## 7. Desktop / mobile / keyboard QA

- **Desktop (1400×1200):** full squad (9/11 → 8/11 after bench move) loads correctly, OVR/ATK/MID/DEF panel, chemistry connector lines, formation selector, bench, and bottom action bar all render unchanged. Player picker sheet opens with sector filter/search intact. Drag starter↔starter, drag starter→bench, and formation change all verified live with zero regressions and zero unexpected network activity.
- **Mobile (390×844):** same component tree, fully responsive layout — squad, chemistry dots, bench strip, and bottom nav all render correctly; state matches the desktop session (shared account).
- **Keyboard:** pitch slots are `role="button"`/`tabIndex=0` (pre-existing dnd-kit `useDraggable` a11y attributes). Tab-focus + Enter successfully selects a slot (visible focus ring), confirming tap-to-select remains keyboard-operable. Actual drag-via-keyboard is not available since no `KeyboardSensor` is registered — this is a pre-existing gap in the dnd-kit config, not something this sprint introduced or was asked to add.
- **Console/errors:** zero regressions. One pre-existing, unrelated hydration warning was investigated (`aria-describedby="DndDescribedBy-N"` mismatch) and confirmed via the Next.js error overlay to be a dnd-kit internal SSR/CSR ID-counter issue tied to `DndContext`'s draggable-ID sequence — a part of the codebase this sprint never touched. Not a regression.

## 8. Known limitations

The QA account owns none of the 10 full-artwork pilot players, so full-artwork rendering could not be empirically verified inside the live Squad UI this sprint. Per the standing constraint (no writes to any account's ownership/inventory data without explicit authorization), no card was granted to the QA account to force this. The resolver logic itself is exhaustively covered by the automated suite and by Sprints 36–38's live verification of the identical `ResolvedWorldLegendsCard` component elsewhere (Collection, Card Detail, Pack Reveal) — Squad calls the exact same component with the exact same props shape, so the remaining risk surface is limited to Squad-specific layout/sizing, which was verified directly. Documented honestly rather than worked around.

## 9. Files changed

- `apps/web/components/squad/premium/PremiumPitch.tsx`
- `apps/web/components/squad/premium/BenchStrip.tsx`
- `apps/web/components/squad/premium/CardPoolSheet.tsx`
- `apps/web/components/squad/premium/PlayerSelectModal.tsx`
- `apps/web/components/squad/premium/PitchBuilder.tsx`
- `apps/web/tests/lib/player-details-standard-showcase.test.ts` (test #12 updated)
- `apps/web/tests/lib/squad-builder-renderer-integration.test.ts` (new, 22 tests)

## 10. Production deployment

URL: _pending — updated after deploy confirmation._
