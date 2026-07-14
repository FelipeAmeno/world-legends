# Sprint 42A — HUD Simplification

Presentation-layer sprint. Removes the six player attributes (pace/finishing/passing/dribbling/defending/physical) from the visible card face, in every density, for both full-artwork and procedural cards — while keeping them fully intact in the data model, gameplay, and the real detail page.

## 1. Discovery

Traced every code path that renders the six attributes on a card's front face:

- **Procedural cards** (`ResolvedWorldLegendsCard`'s procedural branch, 9-layer composition): the six-attribute pip row lives in `components/cards/layers/CardAttributesLayer.tsx`, but it only renders when an `attributes` prop is explicitly passed to `ResolvedWorldLegendsCard` (`attributesSlot={attributes ? <CardAttributesLayer .../> : undefined}`). **Zero live call sites pass this prop** — grepped every `<ResolvedWorldLegendsCard` usage repo-wide (Collection, Squad, Marketplace, Profile, Compare, Match, Hall of Legends, Packs) and none supply `attributes=`. Procedural cards were already fully compliant before this sprint; nothing needed to change there.
- **Full-artwork cards** (`components/cards/FullArtworkWorldLegendsCard.tsx`): the six attributes render via three optional HUD zones — `statsTop`/`statsBottom` (two rows of 3, matching V1 artwork's baked-in stat boxes) or `stats` (single strip). Before this sprint, `showStatsTop`/`showStatsBottom`/`showStats` were only hidden in Compact (`hideByDefaultIn: ['compact']`) — meaning Standard and Showcase **did** show the six attributes for any of the 10 pilot players whose preset defines these zones. Confirmed 56 occurrences of `statsTop`/`statsBottom` in the generated manifest — this was a real, visible effect, not a no-op.

## 2. Implementation

`components/cards/FullArtworkWorldLegendsCard.tsx`: `showStatsTop`, `showStatsBottom`, and `showStats` are now unconditional `false` constants — they no longer call `shouldShowZone` at all, which means the removal is **not density-conditional and ignores any preset-level `visible: true` override**. This guarantees no current or future preset can silently reintroduce the six attributes on the card face. `hud.statsTop`/`hud.statsBottom`/`hud.stats` are still read into local variables (harmless dead reads used only by the now-unreachable `StatsRow` JSX branches) — nothing was removed from the HUD-layout resolution pipeline itself, only the rendering decision.

OVR, position, name, and nickname (per its own pre-existing density rule, unchanged) continue to render exactly as before — none of that logic was touched. Trait (a separate field, not one of the six attributes) also keeps its own pre-existing density rule (`hideByDefaultIn: ['compact', 'standard']`) — out of this sprint's explicit scope, since the brief's "six player attributes" language and its own discovery section never named trait.

## 3. A bug found and fixed while verifying requirement #5

The brief requires confirming the six attributes remain visible outside the card on `/collection/[cardId]` (`CardFullPage`). Verifying this surfaced a real, pre-existing, unrelated bug: `CollectionCard.attributes` (`lib/collection-data.ts`) is built with **Portuguese-labeled keys** (`Velocidade`, `Finalização`, `Passe`, `Drible`, `Defesa`, `Físico`), but three separate consumers read it with **English keys** (`pace`, `finishing`, `passing`, `dribbling`, `defending`, `physical`) that never existed on the object — so the lookup silently fell through to `?? 0` (or `undefined`) everywhere:

- `components/collection/CardFullPage.tsx` — the exact "Atributos" section this sprint needed to verify was always showing **0** for every bar, for every card, for every player.
- `components/collection/CardDetailModal.tsx` — Squad's card quick-look modal (migrated Sprint 41), same bug.
- `lib/collection-filters.ts`'s `compareCards()` — used by Collection's Compare flow (migrated Sprint 41). This was directly observed, unnoticed, in Sprint 41's own QA screenshot: the Taffarel-vs-Lucio comparison showed `0/0` for every one of the six attribute rows.

Fixed all three by correcting the key strings to match the real data (`Velocidade`, `Finalização`, `Passe`, `Drible`, `Defesa`, `Físico`). This directly serves this sprint's own acceptance criterion — attributes weren't meaningfully "visible" outside the card if every value shown was a wrong zero. Verified live: an owned card (Gheorghe Hagi, "Maradona dos Cárpatos") now shows real, distinct values (Ritmo 69, Finalização 72, Passe 82, Drible 80, Defesa 33, Físico 63) on `CardFullPage`, and Compare now shows real, distinct values per side instead of `0/0` for both compared cards.

**Known residual limitation (not fixed, out of scope):** for goalkeepers, `toCollectionCard()` deletes `Finalização`/`Drible`/`Defesa` from `attributes` and replaces them with GK-specific keys (`Reflexos GK`, `Posicion. GK`, etc.) that neither `CardFullPage`, `CardDetailModal`, nor `compareCards()` read — so those three bars will correctly compute `0` for goalkeepers (verified live with Taffarel in Compare). This mirrors `CardAttributesLayer`'s own GK-aware label-swapping, which none of these three surfaces replicate. Fixing this would mean adding GK-specific attribute labels to three separate UI surfaces — real feature work beyond a key-name bug fix, and out of this sprint's "HUD simplification" scope. Documented here rather than silently left broken.

## 4. What stays untouched (verified, not modified)

- `lib/squad-builder.ts` (chemistry, position compatibility, auto-suggest) — confirmed zero references to the resolver, `FullArtworkWorldLegendsCard`, `CardAttributesLayer`, or `artworkPresetId`. Chemistry doesn't read `card.attributes` at all.
- Match engine (`packages/match/*`) — not touched; this sprint only changed presentation-layer files under `apps/web`.
- `CollectionCard.attributes` field shape and the six underlying values (`player.baseAttributes.pace/finishing/passing/dribbling/defending/physical`) — untouched; only the *display-layer key strings* reading them were corrected.
- No PNG, WebP, or generated artwork file was touched. `resolveGeneratedArtwork` (the function that resolves image URLs) is called exactly as before — this sprint only stopped drawing React text on top of the image, in the three lines noted in §2.
- `PlayerCard.tsx` (the façade) — not removed.

## 5. Tests

New file `apps/web/tests/lib/hud-simplification.test.ts` — 12 tests. Covers: the three `showStats*` constants are unconditionally `false` and no longer call `shouldShowZone` for stats zones; real pilot presets do define `statsTop`/`statsBottom` (proving the fix has real effect); OVR/position/name still render unconditionally; nickname's pre-existing density rule is unchanged; `CardAttributesLayer` remains opt-in with zero production call sites passing `attributes`; `CardFullPage` still shows the six attributes via a section separate from the card itself; the data model still carries all six attributes with real numeric values (for outfield players); the three-file key-name bug is fixed (source-inspection) and produces real non-zero values end-to-end via `compareCards()`; `lib/squad-builder.ts` remains fully decoupled from the artwork resolver.

**Full suite: 445/445 passing.** `pnpm lint` (462 pre-existing warnings, 0 errors — unchanged baseline), `pnpm typecheck` clean, `pnpm build` 34/34 tasks green.

## 6. QA

- **Desktop, full-artwork, unowned pilot (Pelé, Standard density, `/collection/pelé-world_cup_hero`):** card face shows OVR (99) and name only — the V1 artwork's baked stat-box outlines are visible but empty (no numbers/labels drawn over them), exactly per the brief's allowance. The "Atributos" section below correctly shows `?` placeholders (a separate, pre-existing, deliberate unowned-card mystery mechanic — unrelated to this sprint's fix, verified not to interfere with it).
- **Desktop, procedural, owned card (Gheorghe Hagi / "Maradona dos Cárpatos"):** card face shows OVR/name only (procedural never had attributes visible); "Atributos" section shows correct real values matching the underlying data exactly.
- **Compare (2 owned procedural cards, Taffarel vs. Lucio):** both sides show correct, distinct, non-zero values (Taffarel's GK-specific zeroes for Finalização/Drible/Defesa are the documented residual limitation above, not a bug).
- **Console:** zero regressions; only the 5 known pre-existing PostHog placeholder-key 404s.

## 7. Files changed

- `apps/web/components/cards/FullArtworkWorldLegendsCard.tsx` (core HUD simplification fix)
- `apps/web/components/collection/CardFullPage.tsx` (attribute-key bug fix)
- `apps/web/components/collection/CardDetailModal.tsx` (attribute-key bug fix)
- `apps/web/lib/collection-filters.ts` (attribute-key bug fix in `compareCards()`)
- `apps/web/tests/lib/hud-simplification.test.ts` (new, 12 tests)

## 8. Production deployment

URL: https://world-legends.vercel.app (confirmed aliased to commit `b60227d3`, deployment `world-legends-529r72nde`, status ● Ready)
