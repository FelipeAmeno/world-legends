# WORLD LEGENDS ASSET STUDIO — ARCHITECTURE (FOUNDATION)

**Version:** 1.1 (Sprint 43A foundation + Sprint 43B real generation provider)
**Status:** Domain persisted, service layer built, internal UI functional for fixture workflows AND real generation (fake provider always; Gemini when explicitly configured)
**Owner:** Creative Direction / Art Systems
**Project Owner:** Felipe Ameno
**Derived from:** `03-world-legends-asset-studio-spec-v1.md` (V1 layered-asset vision, largely superseded by the Sprint 35D full-card-artwork pivot); `05-artwork-schema-v2.md` (the artwork contract this domain generates against); `07-gemini-image-provider.md` (Sprint 43B — the real provider integration described in this document's §12)
**Language:** Portuguese
**Last updated:** 2026-07-14

---

## 0. Purpose and scope

Sprint 43A built the **persistent domain and internal workflow** for future automated Artwork Schema V2 generation: jobs, attempts, candidates, reviews, reference sets, prompt templates, a status state machine, storage-path conventions, a service layer, authorization, and a minimal internal UI to inspect and manually drive fixture jobs through safe test states. At that point, nothing called a real provider, generated an image, or published artwork.

**Sprint 43B (this update) connects that workflow to a real, server-only image-generation provider** — see §12 below and the dedicated `07-gemini-image-provider.md`. Jobs still never advance automatically: a human must move a job to `queued` and explicitly click Generate; nothing is ever auto-approved or auto-published.

## 1. Where this lives, and why

Discovery (this sprint) confirmed:
- No admin/internal role model exists anywhere in the project (`profiles` has no role column; `apps/admin` is an uninitialized stub).
- `/dev/*` routes are gated only by generic "logged in" middleware — any player can open them today.
- No job-queue, audit-log, or Supabase Storage usage precedent exists in the codebase (storage buckets are declared in migrations but never used in app code).
- The established persistence-testing convention across the project is **Ports & Adapters**: a repository interface, a Supabase-backed adapter (untested directly — "Fase 6" convention), and an in-memory fake exercised by all unit tests.

Given Asset Studio is single-app-consumed today (only `apps/web` needs a UI for it) and the project's shared `packages/db` repositories are scoped to core gameplay domain, all of Asset Studio's domain/service/repository code lives in `apps/web/lib/asset-studio/` — extending the directory Sprint 42B already started (prompt-template, reference-set) rather than introducing a new shared package. Server actions live in `apps/web/lib/actions/asset-studio.ts`, following the existing per-domain action-file convention. The internal UI lives at `/dev/asset-studio`, per the brief's own suggested convention, but with a authorization check `/dev/card-assets` and its siblings never had (see §5).

## 2. Domain model

Six tables (`supabase/migrations/20260714065108_asset_studio_foundation.sql`):

| Table | Purpose |
|---|---|
| `asset_generation_jobs` | Intent to generate/replace artwork for one preset. One row per job. |
| `asset_generation_attempts` | One row per provider invocation (none real yet — fixture/manual only this sprint). Snapshots prompt/reference at creation time. Never overwritten; retry always inserts a new row (`unique(job_id, attempt_number)`). |
| `asset_candidates` | One generated image result, in staging. Never written to `public/assets/cards/source/artworks`. |
| `asset_reviews` | Append-only review decisions per candidate. Never deleted or overwritten. |
| `asset_reference_sets` | The persisted form of Sprint 42B's `REFERENCE_SETS` concept — same 6-rarity convention, now with a real `active`-per-`(rarity, schema_version)` unique constraint. |
| `asset_prompt_templates` | Versioned prompt templates. Editing a template never mutates an attempt's `prompt_snapshot`. |

Conventions followed (audited from existing migrations): `uuid primary key default gen_random_uuid()`; `timestamptz not null default now()`; status/enum via `TEXT + CHECK` (never native Postgres `ENUM`, matching every existing table); FK `on delete cascade` for owned child rows (attempts/candidates/reviews cascade from their job/attempt/candidate); the `craft_requests`-style pattern of a status column + timestamps for a simple state machine.

**No separate audit-log table was introduced.** The job/attempt/candidate/review rows themselves *are* the audit trail — none are ever hard-deleted, and `asset_reviews` is explicitly append-only. Introducing a second, redundant event-log table would duplicate what these tables already guarantee by construction.

## 3. Status state machine

One shared map (`lib/asset-studio/status-transitions.ts`), matching the brief's example exactly:

```
draft        → queued | cancelled
queued       → generating | cancelled | failed
generating   → generated | failed
generated    → validating | failed
validating   → needs_review | failed
needs_review → approved | rejected | queued
approved     → published | queued
rejected     → queued | cancelled
failed       → queued | cancelled
published    → (terminal)
cancelled    → (terminal)
```

`assertJobStatusTransition(from, to)` is the single function every service-layer mutation calls — no status string is ever compared inline elsewhere. Same-status "transitions" are always rejected (a no-op edit is not a transition). Fully tested (valid + invalid transitions, terminal-state checks).

Since no real technical/visual validation pipeline exists yet (explicit non-goal), `attachCandidate` collapses `generating → generated → validating → needs_review` into one synchronous call — each step is still checked against the map, there's just no async work happening between them yet. This is documented in `service.ts` directly, not hidden.

## 4. Storage conventions

Conceptual staging structure (`lib/asset-studio/storage-paths.ts`), bucket `asset-studio` (never created in this sprint — no image is ever written):

```
asset-studio/
  pending/<jobId>/<attemptId>/<variantIndex>.<ext>
  candidates/<jobId>/<attemptId>/<variantIndex>.<ext>
  approved/<jobId>/<candidateId>.<ext>
  rejected/<jobId>/<attemptId>/<variantIndex>.<ext>
  published/<artworkPresetId>.<ext>
```

Paths are deterministic by job/attempt/variant id — **never** by player display name. Segments are validated against `^[a-zA-Z0-9_-]+$` (`UnsafeStoragePathError` on anything else — blocks `../`, `/`, null bytes, spaces). `published/` is a distinct, explicit promotion path — nothing in this module ever touches `public/assets/cards/source/artworks`; publishing there remains a separate, human-approved step for a future sprint, exactly as the brief requires.

**Local-dev fallback:** since no candidate is ever really created outside test fixtures this sprint, there is no upload code path to fall back from yet — `buildCandidateStoragePath` is a pure string-building function with no I/O, so it behaves identically with or without Supabase Storage configured.

## 5. Authorization — a documented, deliberate gap closure

**No admin/role model exists in this project today.** Rather than reuse the existing `/dev/*` pattern (any authenticated player can open it), Asset Studio introduces a **stricter, temporary allowlist**: `lib/asset-studio/authorization.ts` checks the current user's email against `ASSET_STUDIO_ALLOWED_EMAILS` (server-only env var, never `NEXT_PUBLIC_*`). **Fail-closed**: if the env var is unset or empty, nobody is authorized — not even a logged-in developer.

This check runs independently at three layers (defense in depth, not relying on hidden navigation):
1. The page itself (`app/dev/asset-studio/page.tsx` and `[jobId]/page.tsx`) — renders an explicit "access denied" message, never the real UI, if unauthorized.
2. Every server action (`lib/actions/asset-studio.ts`) — re-checks independently of the page.
3. Storage access — moot this sprint (no real uploads happen), but the same `checkAssetStudioAuthorization` function is the intended single gate when uploads are implemented.

This is documented as a **temporary limitation** in the source itself: when the project gains a real role model (a `profiles.role` column, or `apps/admin` gaining its own auth), `checkAssetStudioAuthorization` is the one function to update — every call site already depends only on it.

## 6. Service layer

`lib/asset-studio/service.ts` — all business logic, injected with an `AssetStudioRepository` (port). Functions: `createJob`, `updateDraftJob`, `queueJob`, `cancelJob`, `startAttempt`, `markAttemptFailed`, `attachCandidate`, `submitReview`, `approveCandidate`, `rejectCandidate`, `requestRevision`, `markJobPublished`, `listJobs`, `getJobDetails`.

Every mutation validates input, enforces the status-transition map, and returns a typed `{ ok: true; data } | { ok: false; error }` result — never throws for expected failure paths. `startAttempt` never calls a provider; it only snapshots the prompt/reference-set content at that instant into the new attempt row.

## 7. Testing strategy

Matches the established project convention exactly: `InMemoryAssetStudioRepository` (`lib/asset-studio/in-memory-repository.ts`) implements the same `AssetStudioRepository` interface as `SupabaseAssetStudioRepository`, and **every** test exercises the service layer against the in-memory fake — never a real or mocked Supabase client. `SupabaseAssetStudioRepository` is untested directly this sprint, matching the "Fase 6" deferred-real-infra-testing convention already documented (and never yet implemented) elsewhere in this repo.

## 8. Separation between staging and production

Nothing this sprint writes to `public/assets/cards/`. `asset_candidates.storage_path` always resolves under the conceptual `asset-studio/` bucket prefix (verified by tests). No `cards:build`/`cards:validate` script references any Asset Studio table. Publishing a candidate into the real card pipeline (writing a source artwork file, bumping `artworkSchemaVersion`, re-running `cards:build`) remains an explicit, separate, human-driven step for a future sprint — `markJobPublished` only flips the job's own status and timestamp; it does not touch any file.

## 9. Future work (explicitly out of scope through Sprint 43B)

- Batch generation API across multiple jobs/providers.
- Automated technical validation beyond byte/dimension checks (watermark detection, composition checks) and visual AI validation (the `needs_review` step is still entered synchronously after generation, with no automated visual check performed).
- OCR-based text/logo detection on candidates.
- Automatic `cards:build`/commit/deploy after publish.
- A real admin/role model (`checkAssetStudioAuthorization` is the seam where this plugs in later).
- Ingesting real, human-approved reference images into `lib/asset-studio/reference-sets/<id>/` (still all `files: []`/`active: false`).
- Automatic approval or publishing of any generated candidate — always a separate human action.

## 10. Failure and retry strategy

A failed attempt (`markAttemptFailed`) transitions its job to `failed`. From `failed`, the only valid next steps are `queued` (retry) or `cancelled` (give up) — generating again after re-queuing always creates a **new** attempt row with `attempt_number` incremented; the failed attempt's row, error code, and error message remain in the table forever as history. Sprint 43B's real orchestrator (`generation-orchestrator.ts`) additionally wraps the provider call itself in bounded timeout+retry (`retry.ts`) — see §12 and `07-gemini-image-provider.md` for the full error-classification and retry contract.

## 11. Non-goals (explicit, through Sprint 43B)

Batch API, visual AI validation, OCR, publishing into `source/artworks`, automatic `cards:build`, automatic commit/deploy, football-data APIs, real production reference-image ingestion, and any form of automated approval/publishing are all explicitly not implemented.

## 12. Sprint 43B — real generation provider (summary; full detail in `07-gemini-image-provider.md`)

The domain/service layer from §2–§8 above is unchanged. Sprint 43B adds a new layer on top, connected only through the existing `AssetStudioRepository` port and a new `AssetStudioStorage` port:

- **`lib/asset-studio/image-provider.ts`** — the `ImageGenerationProvider` contract (`generate(request, signal) → GeneratedArtworkCandidate[]`). No Gemini-specific type crosses this boundary.
- **`lib/asset-studio/providers/fake-image-provider.ts`** — deterministic, cost-free, real (but obviously-fixture) PNGs via `sharp`. Used by every test and by default in local dev (`ASSET_STUDIO_IMAGE_PROVIDER` unset or `fake`).
- **`lib/asset-studio/providers/gemini-image-provider.ts`** — REST adapter (`fetch`, no new SDK dependency) over the Gemini `generateContent` API. Only reachable when `ASSET_STUDIO_IMAGE_PROVIDER=gemini`, `ASSET_STUDIO_GEMINI_ENABLED=true`, and both `GEMINI_API_KEY`/`GEMINI_IMAGE_MODEL` are set — otherwise `provider-config.ts` fails closed and never silently substitutes the fake provider.
- **`lib/asset-studio/generation-orchestrator.ts`** — the only place that wires repository + storage + provider together for a real job. Validates template/reference-set/reference-files/placeholders *before* atomically claiming the job (`repo.claimJobForGenerating`, preventing two concurrent generations for the same job), then creates the attempt, invokes the provider under `withTimeoutAndRetry`, validates every returned candidate's bytes server-side (`image-validation.ts`, never trusting provider-claimed metadata), stores them under `asset-studio/candidates/<jobId>/<attemptId>/<variantIndex>.png` in the new private `asset-studio` Storage bucket, and hands off to the unchanged `service.attachCandidates` for the `generating → generated → validating → needs_review` transition. A failure at any point after the claim marks the attempt `failed` and the job `failed`, never leaving a job stuck in `generating`.
- **`/dev/asset-studio`** now shows a safe provider-status indicator and a **Generate** button (with confirmation dialog) on eligible `queued` jobs, plus staging-labeled candidate thumbnails served through a server-action data-URL (never a public/signed storage URL) and a retry action for `failed` jobs. No candidate is ever auto-approved or auto-published from this UI.

See `07-gemini-image-provider.md` for environment variables, the full retry/error-classification table, idempotency guarantees, observability, cost handling, and the key-rotation procedure.
