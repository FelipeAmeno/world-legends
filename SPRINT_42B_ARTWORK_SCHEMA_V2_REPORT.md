# Sprint 42B — Artwork Schema V2 Contract and Backward Compatibility

Defines the formal Artwork Schema V2 contract for all future generated full-card artworks, with full V1 backward compatibility. No artwork generated, no Gemini call, no PNG replaced, no card visual altered, `PlayerCard` not removed.

## 1. Discovery

Audited the current metadata schema end to end:

- `scripts/cards/_shared.mts` deliberately duplicates the preset shape from `lib/card-static/types.ts` (documented in its own header comment: "scripts run outside the app's typecheck, keeping the shape here avoids coupling script module resolution to the bundler"). Both had to be updated in sync.
- `CardArtworkPreset` (`lib/card-static/types.ts`) already supports `sourceType: 'full-card-artwork'` (Sprint 35D) with `artwork`, `hudLayout`/`hudLayouts` (per-density HUD overrides, Sprint 35D.3), `productionEligible`, `experimental`, and a pre-existing unrelated `version?: number` field (asset revision number — not a schema-contract version, easy to confuse, documented the distinction explicitly).
- `resolveHudLayout` (`lib/card-static/hud-layout.ts`) already uses a normalized-percentage, center-anchored coordinate convention (`HudZone`: `x`/`y` = center, optional `width`/`height`) — reused for the new `ArtworkSafeZone` type rather than inventing a second coordinate system, per the brief's explicit instruction.
- `resolvePlayerCardRenderer`/`resolvePlayerCardRendererForDensity` (`lib/card-static/resolve-player-card-renderer.ts`) never reads schema/version fields — decision is based purely on `generated`/`productionEligible`. Confirmed this stays true after the change (test #13).
- `cards:validate`/`cards:build`/`cards:manifest` (`scripts/cards/*.mts`) — validate checks file existence/aspect-ratio/resolution/alpha; build does resize+reencode only for `full-card-artwork` (no compositing); manifest generation reads presets and writes the typed `manifest.generated.ts`.
- Legacy HUD fields still present: `statsTop`/`statsBottom` (two-row stat-box layout, baked into several real V1 presets — confirmed via `grep`, 56 occurrences across the manifest), `stats` (single-strip alternative), plus `overall`/`position`/`name`/`nickname`/`country`/`era`/`trait`. Sprint 42A already made the renderer ignore `stats`/`statsTop`/`statsBottom` unconditionally in every density — this sprint's V2 contract builds on that fact rather than re-solving it.

**Architectural finding surfaced before implementation:** because Sprint 42A already unconditionally disabled attribute-zone rendering for *all* presets (V1 and any future V2), no renderer code change was required for V2 support. This is documented explicitly in §7 of the new design doc rather than left implicit — it's the reason `FullArtworkWorldLegendsCard`/`ResolvedWorldLegendsCard` were not touched in this sprint at all.

## 2. Schema versioning

Added `ArtworkSchemaVersion = 1 | 2` and `artworkSchemaVersion?: ArtworkSchemaVersion` to `CardArtworkPreset` (`lib/card-static/types.ts`), plus `resolveArtworkSchemaVersion(preset): ArtworkSchemaVersion` (`preset?.artworkSchemaVersion ?? 1`). Absence always resolves to V1 — never inferred from filename, rarity, folder, dimensions, or presence of stat boxes. An explicit value outside `1`/`2` (e.g. `3`, `0`) is an unknown-version **error**, checked before any V1/V2 branching. Zero existing preset JSON files needed editing.

## 3. Safe zones

`ArtworkSafeZone = { x, y, width, height }` — same normalized-percentage, center-anchored convention as `HudZone`, but `width`/`height` are **required** (a safe zone must have a definable size to validate against zero/negative dimensions). `ArtworkSafeZones = { upperLeftHudZone, lowerIdentityZone, countryOrTraitZone? }`.

Explicitly documented as a *separate concept* from `hudLayout`/`hudLayouts`: safe zones are an authoring/validation contract about the artwork ("does this image reserve space here?"); `hudLayout` is what the renderer actually reads at runtime to position React HUD text. Both describe "zones" with a similar shape but solve different problems — this is called out directly in `lib/card-static/types.ts` and the design doc so the two are never confused or merged into one system.

## 4. Metadata contract

V2 preset fields: `id`, `sourceType` (must be `'full-card-artwork'`), `rarity`, `artworkSchemaVersion: 2`, `artwork`, `productionEligible`, `experimental`, `safeZones`, `generated`. No player name, OVR, position, nickname, gameplay attributes, or country are duplicated into the preset — that dynamic data stays exclusively in `lib/collection-data.ts`, exactly as it already worked for V1.

## 5. Validation

New pure module `lib/card-static/artwork-schema-v2.ts` (`validateArtworkSchema`) — same "pure function, no I/O" pattern already established by `lib/card-static/full-artwork.ts` (`checkCardAspectRatio`/`checkArtworkResolution`), reused by both the Node script and tests so the rule lives in exactly one place.

Rules implemented: unknown version → error; V1 (absent or `1`) never runs any V2 check (guaranteed non-breaking); V2 requires `sourceType: 'full-card-artwork'`, requires `safeZones` with valid `upperLeftHudZone`/`lowerIdentityZone` (finite numbers, 0–100 bounds, non-zero/non-negative dimensions); V2 **rejects** any explicit `statsTop`/`statsBottom`/`stats` field in `hudLayout` or any `hudLayouts.<density>` — this is a hard error, not a silent no-op, since Sprint 42A's renderer-level fix means a V2 preset declaring those zones would be describing a contract that no longer exists.

Wired into `scripts/cards/validate-card-assets.mts`: runs for every preset regardless of `sourceType`, merged with the existing errors/warnings. OCR/text/logo detection deliberately **not** added as a hard gate this sprint, per the brief — reserved for a future Asset Studio validation layer.

**Ran `pnpm cards:validate` against all 11 real presets: 0 errors, same 11 pre-existing warnings (resolution/alpha) — zero regressions.**

## 6. Build and manifest

`scripts/cards/generate-card-manifest.mts` now writes `artworkSchemaVersion: preset.artworkSchemaVersion ?? 1` into every manifest entry (always resolved, never `undefined`). `lib/card-static/resolve-artwork.ts`'s `ManifestPreset` type carries `artworkSchemaVersion?: 1 | 2` as a documented passthrough — explicitly commented that the resolver never reads it.

**Ran `pnpm cards:build` against all 11 real presets:** output was byte-identical (WebP re-encode of the same source images is deterministic) — only `manifest.generated.ts` changed, adding the 11 resolved `artworkSchemaVersion: 1` lines. No metadata JSON file was rewritten with new content beyond its pre-existing `generated` field. No PNG/WebP artwork file changed.

## 7. HUD layout relationship — no renderer change needed

See §1's architectural finding. `FullArtworkWorldLegendsCard.tsx` and `ResolvedWorldLegendsCard.tsx` are untouched by this sprint. `FullArtworkWorldLegendsCardV2` was not created. No V2-specific resolver was created. No duplicated V1/V2 manifest system was created — V1 and V2 presets coexist in the exact same `CARD_STATIC_MANIFEST` array, resolved by the exact same functions.

## 8. Prompt template contract

New `lib/asset-studio/prompt-template.ts` — `buildV2ArtworkPrompt(input: Partial<PromptTemplateInput>): PromptTemplateResult`, a pure, deterministic function (same input always produces the same output string; no timestamp, no randomness, no network call). Missing required fields return `{ ok: false, error, missingFields }` rather than throwing. The generated prompt always includes the full V2 prohibition list (no six attribute boxes, no name/OVR/position/nickname/flag, no logos/sponsors/watermarks, no dynamic gameplay data) and output requirements (vertical 2:3, high-resolution PNG, no mockup, no external background) — never conditional. No player-specific prompt is filled or committed; no image-generation provider is called anywhere in this file.

## 9. Reference-set contract

New `lib/asset-studio/reference-set.ts` — `ReferenceSet` type, `validateReferenceSet`, and a `REFERENCE_SETS` registry of the 6 required entries (`common-v2`, `rare-v2`, `elite-v2`, `legendary-v2`, `goat-v2`, `world-cup-hero-v2`), all `active: false`, `files: []` — no final reference images exist yet, which is expected and correct for this sprint. `getActiveReferenceSet(rarity)` returns `null` for every rarity today, by construction, proving inactive sets can never be selected as a production default. `lib/asset-studio/reference-sets/README.md` documents the expected folder structure and the human-approval rule for flipping `active` to `true`.

## 10. Types and domain contracts

`ArtworkSchemaVersion`, `ArtworkSafeZone`, `ArtworkSafeZones` added to `lib/card-static/types.ts`. `PromptTemplateInput`/`PromptTemplateResult` and `ReferenceSet`/`ReferenceSetValidationResult` added to `lib/asset-studio/`. Discriminated union used for `PromptTemplateResult` (`{ ok: true; prompt } | { ok: false; error; missingFields }`) since it directly simplifies caller handling without a try/catch; no generic workflow engine or over-abstracted validation framework was introduced — plain TypeScript functions matching the codebase's existing style (no zod/ajv/yup dependency exists or was added).

## 11. A Node ESM resolution detail worth documenting

`lib/card-static/artwork-schema-v2.ts` is imported both by the Next.js app (bundler resolution, extensionless imports) and by `scripts/cards/validate-card-assets.mts` (Node's native `--experimental-strip-types` loader, which requires explicit `.ts` extensions for *runtime* imports — `import type` is erased and exempt). Rather than add a `.ts` extension (which would require enabling `allowImportingTsExtensions` in `tsconfig.json`, a broader change with wider blast radius), the one-line `resolveArtworkSchemaVersion` logic was duplicated locally inside `artwork-schema-v2.ts` instead of imported — keeping the file a "leaf" module (type-only imports only), the exact same pattern `scripts/cards/_shared.mts` already uses deliberately for this exact cross-boundary reason.

## 12. Tests

New file `apps/web/tests/lib/artwork-schema-v2.test.ts` — 26 tests covering all 25 required scenarios (test #9 was split into 9/9b to cover both the flat `hudLayout` and per-density `hudLayouts` legacy-zone-rejection paths). **Full suite: 471/471 passing.** `pnpm lint` (462 pre-existing warnings, 0 errors — unchanged baseline), `pnpm typecheck` clean, `pnpm build` 34/34 tasks green, `pnpm cards:validate`/`pnpm cards:build` both run clean against real presets with zero regressions.

## 13. Migration recommendation

Documented in `docs/design/05-artwork-schema-v2.md` §10, not executed this sprint: Priority 1 (Messi, Zidane, Beckenbauer), Priority 2 (remaining current pilot artworks). No mass replacement; V1 stays supported indefinitely; V2 artwork replaces existing assets only after human approval of real reference sets; preset IDs may stay stable across the v1→v2 artwork revision; `cards:validate`/`cards:build` run only after approval; no automatic production publication.

## 14. Files changed

- `apps/web/lib/card-static/types.ts` — `ArtworkSchemaVersion`, `ArtworkSafeZone`, `ArtworkSafeZones`, `resolveArtworkSchemaVersion`, new preset fields
- `apps/web/lib/card-static/artwork-schema-v2.ts` — new, V2 validation logic
- `apps/web/lib/card-static/resolve-artwork.ts` — `ManifestPreset.artworkSchemaVersion` passthrough
- `apps/web/scripts/cards/_shared.mts` — matching duplicated fields
- `apps/web/scripts/cards/validate-card-assets.mts` — wired in V2 validation
- `apps/web/scripts/cards/generate-card-manifest.mts` — resolved schema version in manifest output
- `apps/web/lib/card-static/manifest.generated.ts` — regenerated (11 lines added, no other change)
- `apps/web/lib/asset-studio/prompt-template.ts` — new
- `apps/web/lib/asset-studio/reference-set.ts` — new
- `apps/web/lib/asset-studio/reference-sets/README.md` — new
- `apps/web/tests/lib/artwork-schema-v2.test.ts` — new, 26 tests
- `docs/design/05-artwork-schema-v2.md` — new

## 15. Production deployment

URL: _pending — updated after deploy confirmation._
