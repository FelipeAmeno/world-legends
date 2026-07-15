# Sprint 43B — Gemini Nano Banana Image Provider

Connects Sprint 43A's Asset Studio job/attempt/candidate workflow to a real, server-only image-generation provider. Supports single-job generation with one or more variants via a fake (deterministic, cost-free) provider always available for dev/test, and a real Gemini REST adapter reachable only when explicitly enabled and fully configured. No Batch API, no auto-approval, no auto-publish, no writes to production `source/artworks`, no credentials exposed to the browser, no production card assets altered.

## 1. Discovery

Audited (before writing code): server-only module conventions, env-var validation patterns, existing route handlers/server actions, the Supabase Storage adapter shape, timeout/retry utilities, structured logging, existing HTTP client conventions, Vercel runtime constraints, and any existing Gemini SDK dependency. Key findings:

- **No Gemini SDK precedent** — neither `@google/generative-ai` nor `@google/genai` exists in the dependency tree, and no generic reusable HTTP client wrapper exists either. Per the brief's "smallest stable dependency surface" instruction, the Gemini adapter uses native `fetch` directly — no new dependency added.
- **No retry/timeout utility precedent** — nothing in the codebase did bounded timeout+retry with backoff before this sprint; `lib/asset-studio/retry.ts` is new, generic, and only consumed by the generation orchestrator.
- **`sharp` is already a project dependency** (used by `scripts/cards/*.mts`) — reused as-is for both the fake provider's fixture PNG generation and server-side image metadata derivation, no new dependency.
- **Sprint 43A's Ports & Adapters pattern extends cleanly**: a new `AssetStudioStorage` port (`InMemoryAssetStudioStorage` / `SupabaseAssetStudioStorage`) mirrors `AssetStudioRepository` exactly, and a new `ImageGenerationProvider` port (`FakeImageProvider` / `GeminiImageProvider`) follows the same shape.
- **Sprint 42B's `buildV2ArtworkPrompt()`** builds a prompt from a structured input but is never DB-persisted — deliberately left untouched and reserved for a possible future prompt-authoring UI. A separate, new function (`resolvePromptTemplateContent`) does `{{PLACEHOLDER}}` substitution against the DB-persisted `asset_prompt_templates.content` field — this is what the real orchestrator uses, since prompts must come from the versioned template system, never be hand-authored per request.
- **Concurrency gap in the Sprint 43A repository interface**: `updateJob` alone (read status, then write) has a real race window between two concurrent generation requests for the same job. Closed by adding `claimJobForGenerating(jobId): Promise<boolean>` to the port — a conditional `UPDATE ... WHERE status = 'queued'` on the Supabase adapter, a synchronous check-then-set on the in-memory adapter (safe because JS is single-threaded and the check has no `await` before the set).

## 2. Provider abstraction

`lib/asset-studio/image-provider.ts` — the exact contract from the brief (`GenerateArtworkRequest`, `GeneratedArtworkCandidate`, `ImageGenerationProvider`), plus `ProviderErrorCode` (8-value union) and a `ProviderError` class carrying a `retryable` flag. No Gemini-specific type crosses this boundary — verified by a dedicated boundary test (§7, scenario 80).

## 3. Gemini implementation

`lib/asset-studio/providers/gemini-image-provider.ts` — REST adapter (`fetch`, no SDK) against `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`. Sends the resolved prompt plus each reference image as `inlineData`, requests `candidateCount` variants with `responseModalities: ['IMAGE']`. The API key travels only in the `x-goog-api-key` header — never in the body, URL, or logs. HTTP status is classified into the shared error taxonomy (401/403 → `provider-authentication`, non-retryable; 429 → `provider-rate-limit`, retryable; 5xx → `provider-invalid-response`, retryable; other 4xx → `provider-invalid-response`, non-retryable); a `promptFeedback.blockReason` or an all-candidates-blocked response raises `provider-safety-block`. **Honest limitation**: this adapter was never exercised against the real API this sprint — no credential exists in this session's control, and `ASSET_STUDIO_GEMINI_ENABLED=false` is the recommended default. Its request/response contract is validated with `fetch` mocked (9 tests), not a live integration test.

## 4. Prompt construction and reference-set resolution

`resolvePromptTemplateContent` (extends `lib/asset-studio/prompt-template.ts`) substitutes `{{PLACEHOLDER}}` tokens in the active template's persisted `content` against job-derived values (`DISPLAY_NAME`, `RARITY`, `ARTWORK_PRESET_ID`, `IDENTITY_NOTES`, `REFERENCE_SET`) and fails closed if any placeholder the template marks required has no non-empty value. `lib/asset-studio/reference-resolution.ts` reads only from `lib/asset-studio/reference-sets/<id>/` (repository-approved, never an external URL), enforcing a max file count (6), max per-file size (8MB), and max total payload (32MB) — all checked *before* touching disk where possible, and any missing/unreadable required file fails before any provider call.

## 5. Orchestration

`lib/asset-studio/generation-orchestrator.ts::generateJobAttempt(repo, storage, provider, jobId)` — the only place repository, storage, and provider are wired together for a real generation. Flow: load job (must be `queued`) → validate template (active, schema-compatible) → validate reference set (active, schema+rarity-compatible) → resolve reference files → resolve final prompt → **atomically claim the job** (`claimJobForGenerating`, closing the concurrency gap from §1) → insert attempt with prompt/reference snapshots → invoke the provider under `withTimeoutAndRetry` → validate every returned candidate's bytes server-side, never trusting provider-claimed metadata (`image-validation.ts`) → store each valid variant to the private staging bucket → persist candidates via the (refactored) `service.attachCandidates`, which transitions the job `generating → generated → validating → needs_review` once. Any failure after the claim marks the attempt `failed` and the job `failed` — never leaves a job stuck in `generating`, never deletes a prior attempt. If *any* variant in a multi-variant response fails byte validation, the whole attempt is treated as failed (documented, deliberate simplification — no partial-candidate persistence this sprint).

## 6. Storage, retry, idempotency

- **Staging storage** (`lib/asset-studio/storage.ts`) — new `AssetStudioStorage` port; `SupabaseAssetStudioStorage` writes to a new private bucket `asset-studio` (`supabase/migrations/20260714211734_asset_studio_storage_bucket.sql`, no policy for `anon`/`authenticated`); `InMemoryAssetStudioStorage` is what every test and local dev without Supabase Storage configured uses. Both reject any path outside the `asset-studio/` prefix. A module-level singleton (`inMemoryAssetStudioStorage`) is exported and reused across server-action calls — a fresh instance per call would silently lose every "saved" candidate before the UI could fetch its thumbnail; caught and fixed before shipping.
- **Retry** (`lib/asset-studio/retry.ts`) — 45s timeout via `AbortController`, up to 2 retries, exponential backoff with jitter (500ms base, 4000ms cap), only for errors marked `retryable`. Authentication, safety-block, and invalid-prompt errors never retry.
- **Idempotency/concurrency** — `claimJobForGenerating` guarantees only one of two concurrent generation calls for the same job succeeds (verified with a real `Promise.all` race in tests); a retry after failure always creates a new attempt row (`attempt_number` incremented), never overwrites the failed one.

## 7. Internal UI

`/dev/asset-studio` and `/dev/asset-studio/[jobId]` now show a safe provider-status indicator ("Provider configured (name · model)" / "Provider disabled" / "Provider unavailable" — never a key value) and, on the detail page, a **Generate** button gated on `job.status === 'queued'` + provider configured + active template + active reference set, with a confirmation dialog, an in-progress state, staging-labeled candidate thumbnails (served via a new `getCandidateImageDataUrlAction` returning a base64 data URL, never a public/signed storage URL), and a retry action for failed jobs. Nothing in this UI auto-approves or auto-publishes.

## 8. Tests

**64 new tests across 9 files**, all against `InMemoryAssetStudioRepository`/`InMemoryAssetStudioStorage`/`FakeImageProvider` or a mocked `fetch` — never a real Supabase or Gemini call:

- `asset-studio-image-validation.test.ts` (6) — empty/oversized/wrong-MIME/bad-signature/malformed/valid PNG bytes.
- `asset-studio-retry.test.ts` (7) — success-first-try, retryable exhausts then throws, non-retryable never retries, safety-block never retries, timeout classification, unknown-error classification, backoff cap.
- `asset-studio-reference-resolution.test.ts` (5) — empty list, too-many-files, path-traversal filename, missing file, real fixture file read (generated + cleaned up at test time, never committed).
- `asset-studio-prompt-resolution.test.ts` (4) — substitution, missing-required-placeholder, determinism, untouched unknown tokens.
- `asset-studio-provider-config.test.ts` (7) — fake-by-default, disabled, missing-key, missing-model, fully-configured, never-silently-fake, no-key-leakage.
- `asset-studio-fake-provider.test.ts` (3) — correct variant count with valid PNGs, deterministic color-per-variant, fixture markers always present.
- `asset-studio-storage.test.ts` (3) — path-prefix rejection, put/get round-trip, unknown-path returns null.
- `asset-studio-gemini-provider.test.ts` (9, mocked `fetch`) — key only in header, 401/429/400 classification, safety-block, per-candidate SAFETY omission, no key in output, contract-only return shape, network-error classification.
- `asset-studio-generation-orchestrator.test.ts` (13) — full happy path (attempt+candidates+transition+staging paths), job-not-queued, inactive-template-after-creation, incompatible-reference-set-after-creation, missing-reference-file, missing-required-placeholder, placeholder-satisfied prompt snapshot, real concurrent-claim race, failure-after-claim never stuck in `generating`, retry creates new attempt preserving history, all-or-nothing partial-invalid-variant failure, no-secret-in-usage-metadata, staging-only storage paths.
- `asset-studio-gemini-boundaries.test.ts` (7) — no Gemini type/format leaks outside the adapter, env vars read only in `provider-config.ts`, no `NEXT_PUBLIC_` prefix anywhere, Client Components import no provider runtime code, both new server actions authorize before any side effect, fake provider makes no network call, UI never renders a key/secret field.

**Full monorepo suite: 573/573 passing** (509 pre-existing + 64 new). `pnpm lint` clean (same 462 pre-existing warnings in unrelated files, 0 new errors — one cognitive-complexity violation in `JobDetailView.tsx` was caught and fixed via component extraction, see §9). `pnpm typecheck` clean across all 54 workspace tasks. `pnpm build` green, 34/34 tasks, including both Asset Studio routes.

## 9. Fixes made during the gate

- `retry.ts::withTimeoutAndRetry` (complexity 23) and `generation-orchestrator.ts::generateJobAttempt` (complexity 18) both exceeded the project's max-15 cognitive-complexity lint rule — refactored via extraction (`classifyCaughtError`/`attemptOnce` helpers; `prepareGenerationInputs` helper) with no behavior change.
- `components/dev/asset-studio/JobDetailView.tsx` (complexity 24) — extracted `JobHeader` and `GenerateControls` as standalone components and `providerStatusLabel` as a pure helper, dropping the main component below the threshold.
- `fake-image-provider.ts` — a non-null-assertion lint warning on the fixture-color lookup was fixed by extracting `fixtureColorForVariant()` with an explicit fallback instead of `!`.
- Caught before it shipped: the server action's `storage()` helper originally did `new InMemoryAssetStudioStorage()` on every call — a fresh empty store per Server Action invocation would have silently discarded any candidate "saved" during generation before the UI's very next call could fetch its thumbnail. Fixed by exporting and reusing a module-level singleton, documented as local-dev-only (production always has Supabase Storage configured).

## 10. Live QA

Started the dev server and confirmed the two Asset Studio routes mount correctly: unauthenticated requests to `/dev/asset-studio` and `/dev/asset-studio/[jobId]` both receive a clean `307` redirect to `/login?redirect=...` from the existing generic auth middleware (layer 0 of the documented defense-in-depth, ahead of `checkAssetStudioAuthorization`) — no crash, no 500.

**Live QA was intentionally not taken further this sprint**, for two reasons observed during setup, both left as-is rather than worked around:
1. Local `.env.local` currently has `ASSET_STUDIO_ALLOWED_EMAILS` **empty** — nobody is authorized to reach the real UI right now (correct fail-closed behavior, but it means a full click-through requires deciding whose email to add, which wasn't done unilaterally).
2. Local `.env.local` currently has `ASSET_STUDIO_IMAGE_PROVIDER=gemini`, `ASSET_STUDIO_GEMINI_ENABLED=true`, and a populated `GEMINI_API_KEY` that has the shape of a real key — clicking Generate against that configuration would place a real, billed call to the Gemini API. Rather than spend against the user's real key without asking, live generation QA was left to the automated test suite (§8), which exercises the exact same orchestration code path end-to-end through `FakeImageProvider` and in-memory adapters.

The Supabase Storage bucket migration (`20260714211734_asset_studio_storage_bucket.sql`) was written but, consistent with this project's manual-migration convention (also true of Sprint 43A's own tables), was **not applied** to any live Supabase project this sprint.

**Also observed, not acted on:** `.env.local` already defines `ASSET_STUDIO_MAX_REFERENCE_BYTES`, `ASSET_STUDIO_MAX_REFERENCE_IMAGES`, `ASSET_STUDIO_MAX_RESULT_BYTES`, `ASSET_STUDIO_MAX_VARIANTS`, `ASSET_STUDIO_PROVIDER_MAX_RETRIES`, and `ASSET_STUDIO_PROVIDER_TIMEOUT_MS` — none of which this sprint's implementation reads (all equivalent limits are hardcoded constants: `MAX_REFERENCE_IMAGES=6`, `MAX_REFERENCE_FILE_BYTES=8MB`, `MAX_CANDIDATE_BYTES=15MB`, `MAX_REQUESTED_VARIANTS=4` from Sprint 43A, `DEFAULT_MAX_RETRIES=2`, `PROVIDER_TIMEOUT_MS=45000`). These look like a pre-existing local template anticipating a more configurable design than the brief asked for. Left untouched rather than guessed at — worth confirming with the user before wiring them up in a future sprint.

## 11. Files changed

- `supabase/migrations/20260714211734_asset_studio_storage_bucket.sql` — new
- `apps/web/lib/asset-studio/image-provider.ts` — new
- `apps/web/lib/asset-studio/retry.ts` — new
- `apps/web/lib/asset-studio/image-validation.ts` — new
- `apps/web/lib/asset-studio/storage.ts` — new
- `apps/web/lib/asset-studio/reference-resolution.ts` — new
- `apps/web/lib/asset-studio/providers/fake-image-provider.ts` — new
- `apps/web/lib/asset-studio/providers/gemini-image-provider.ts` — new
- `apps/web/lib/asset-studio/provider-config.ts` — new
- `apps/web/lib/asset-studio/generation-orchestrator.ts` — new
- `apps/web/lib/asset-studio/prompt-template.ts` — extended (`resolvePromptTemplateContent`)
- `apps/web/lib/asset-studio/repository.ts` — extended (`claimJobForGenerating`)
- `apps/web/lib/asset-studio/in-memory-repository.ts` — extended
- `apps/web/lib/asset-studio/supabase-repository.ts` — extended
- `apps/web/lib/asset-studio/service.ts` — refactored candidate-attach into `attachCandidates`/`attachCandidate`
- `apps/web/lib/actions/asset-studio.ts` — added `generateAttemptAction`, `getCandidateImageDataUrlAction`, `getProviderStatusAction`
- `apps/web/lib/actions/index.ts` — barrel exports added
- `apps/web/components/dev/asset-studio/JobDetailView.tsx` — Generate button, confirmation dialog, candidate thumbnails, retry; refactored into `JobHeader`/`GenerateControls` sub-components
- `apps/web/components/dev/asset-studio/AssetStudioExperience.tsx` — provider-status indicator
- `apps/web/.env.local.example` — documented `GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL`, `ASSET_STUDIO_GEMINI_ENABLED`, `ASSET_STUDIO_IMAGE_PROVIDER`
- `apps/web/tests/lib/asset-studio-image-validation.test.ts` — new, 6 tests
- `apps/web/tests/lib/asset-studio-retry.test.ts` — new, 7 tests
- `apps/web/tests/lib/asset-studio-reference-resolution.test.ts` — new, 5 tests
- `apps/web/tests/lib/asset-studio-prompt-resolution.test.ts` — new, 4 tests
- `apps/web/tests/lib/asset-studio-provider-config.test.ts` — new, 7 tests
- `apps/web/tests/lib/asset-studio-fake-provider.test.ts` — new, 3 tests
- `apps/web/tests/lib/asset-studio-storage.test.ts` — new, 3 tests
- `apps/web/tests/lib/asset-studio-gemini-provider.test.ts` — new, 9 tests
- `apps/web/tests/lib/asset-studio-generation-orchestrator.test.ts` — new, 13 tests
- `apps/web/tests/lib/asset-studio-gemini-boundaries.test.ts` — new, 7 tests
- `docs/design/06-asset-studio-architecture.md` — updated (§9/§11 revised, new §12)
- `docs/design/07-gemini-image-provider.md` — new

## 12. Production deployment

URL: https://world-legends.vercel.app (confirmed aliased to commit `4b4a6036`, deployment `world-legends-55xyzeplx`, status ● Ready)
