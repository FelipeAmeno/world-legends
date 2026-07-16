# Sprint 43C — Asset Candidate Validation and Human Approval

Implements the technical-validation and human-review workflow for Asset Studio candidates, working fully against the fake provider. No Gemini call, no OCR gate, no batch generation, no real publication into `source/artworks`, no automatic approval.

## 1. Discovery

Audited the existing candidate/review/publish implementation before writing anything (full detail in `docs/design/08-asset-validation-and-approval.md` §1). Key finding: the Sprint 43A/43B foundation already had the right schema (`technical_validation`/`visual_validation`/`checksum`/`perceptual_hash`/`review_status` columns) and the right service functions (`approveCandidate`/`rejectCandidate`/`requestRevision`, all append-only reviews) — this sprint's job was completing the business logic and UI, not redesigning schema. Two real gaps found: (1) review eligibility was only checked in the UI (Sprint 43B fix), never server-side — closed now via `service.ts::assertReviewEligible`; (2) `rejectCandidate`/`requestRevision` accepted arbitrary `issueCodes` strings with no validation and no requirement that a revision request explain itself.

## 2. Technical validation

New `lib/asset-studio/technical-validation.ts` — deterministic, no AI, no network, re-runnable at any time (not just at generation). Reuses Sprint 43B's `image-validation.ts` for the byte-level baseline and adds: staging-path compliance, vertical-orientation check (hard error), 2:3 aspect-ratio check (soft warning outside ±0.05 tolerance), a two-tier resolution check (200×300 hard floor, 800×1200 recommended — **the fake provider's 400×600 fixture deliberately falls in the warning band**, so QA can exercise the warning path without needing a real image), schema-version check, duplicate-checksum detection (via a new `repo.findCandidatesByChecksum`), and two text-based Schema V2 heuristics (safe-zone mention present / no legacy stat-box vocabulary). Also computes and persists a real average-hash perceptual hash via `sharp` (8×8 grayscale, no AI) — `candidate.perceptualHash` was always `null` before this sprint.

Persisted result shape: `{ passed, warnings, errors, validatedAt, validatorVersion }` — `passed` is false iff `errors.length > 0`; warnings never block.

## 3. Visual validation contract

New `lib/asset-studio/visual-validation.ts` — the interface a future real visual-AI validator will implement, plus `FakeVisualValidator` (deterministic, always passes, clearly marked as fixture) and the closed 13-code human issue-code vocabulary from the brief. No Gemini Vision call anywhere — `rejectCandidate`/`requestRevision` now validate any submitted issue code against this vocabulary and reject the whole call before any mutation if an unknown code is submitted.

## 4. Review workflow changes

- **Server-side eligibility** (`service.ts::assertReviewEligible`, reusing the same `ui-eligibility.ts::canReviewCandidate` the UI already used): only a `pending` or `needs_revision` candidate with the job in `needs_review` can be approved/rejected/revision-requested — checked on the server now, not just hidden in the UI.
- **Approval requires successful technical validation**: `approveCandidate` fails explicitly (`"não pode ser aprovado sem validação técnica bem-sucedida"`) if `technicalValidation.passed !== true` — never run, or run and failed.
- **Revision requires notes or issue codes**: an empty request is rejected before any state change.
- **One approved candidate per job, replacement always explicit**: proved by test rather than new code — the existing status-transition map (`needs_review → approved` only) already makes a second direct `approveCandidate` call fail once a job is `approved`; replacing it requires the explicit request-revision → re-queue → re-generate cycle.
- Rejection never deletes the image; reviews remain append-only (unchanged, re-verified by test).

## 5. Publication boundary

Re-audited `markJobPublished` — confirmed (again) it only sets `status`/`completedAt`, never touches a file, never runs `cards:build`/git/deploy. Per the brief's instruction to avoid giving a false impression, the UI button is now explicitly labeled **"Marcar publicado (placeholder de status — não publica de verdade)"** with a tooltip explaining the game sees no change. No code behavior changed here — only the label, since the underlying action was already correctly scoped.

## 6. UI

`CandidateCard` (`JobDetailView.tsx`) now shows dimensions, format, file size, a truncated checksum, a color-coded technical-validation status (not-run / passed / passed-with-warnings / failed) with the full warnings/errors list, a "Rodar validação técnica" button (always available — it's a diagnostic recompute, not a state transition), and an inline notes-textarea + issue-code-checkbox form that appears when Reject or Request-Revision is clicked (previously these always submitted `null`/`[]`). Review history now shows issue codes alongside notes. Multiple variants already render side-by-side in the existing grid — used as this sprint's "compare candidates" mechanism (no dedicated comparison modal built, a deliberate scope decision).

## 7. Tests — 38 new/adjusted, 626/626 total

- `tests/lib/asset-studio-technical-validation.test.ts` (13): valid fixture passes, invalid signature fails, unsupported MIME fails, non-vertical is an error, off-ratio-but-vertical warns only, below-recommended-resolution warns only (fake fixture exercises this for real), below-hard-floor fails, oversized fails, production path rejected before any byte read, duplicate checksum detected via injected callback, schema-version mismatch fails, prompt heuristics (safe-zone/legacy-stat-box), validatedAt/validatorVersion always present.
- `tests/lib/asset-studio-visual-validation.test.ts` (4): closed issue-code vocabulary matches the brief exactly, validator function, `FakeVisualValidator` determinism, no network code in the file.
- `tests/lib/asset-studio-review-workflow.test.ts` (12): approval blocked without technical validation, approval works after validation passes, rejection preserves candidate+history, revision requires notes-or-issues (both forms), reviews append-only across a second cycle, unknown issue code rejected before mutation, an already-decided candidate can't be re-reviewed server-side, approval never sets `completedAt`/never transitions to `published`, second approval attempt fails via the state machine, server actions check authorization before calling the service layer, no `cards:build`/`source/artworks`/Gemini reference anywhere in the validation/service code, `markJobPublished` still has no file/process side effects.
- Adjusted 3 pre-existing `asset-studio-service.test.ts` fixtures to seed a passed `technicalValidation` before calling `approveCandidate` (a deliberate, expected breaking change from this sprint's new requirement) and fixed `ui-eligibility.ts::canReviewCandidate` to also accept `needs_revision` (not just `pending`), matching the brief's rule 1 exactly — the existing Sprint 43A review-history test already relied on this and would have failed otherwise.

**Full suite: 626/626 passing** (596 prior + 30 net new). `pnpm lint`: 0 errors, 462 pre-existing warnings (unchanged baseline). `pnpm typecheck`: clean. `pnpm build`: green, run only after stopping `next dev` (established convention from earlier `.next` corruption this sprint).

## 8. Gemini QA status (external blocker, unrelated to this sprint's work)

Real Gemini generation QA is paused because the current Google project cannot enable billing/image quota. Implementation remains ready for retesting with a future Google project. Nothing from Sprint 43B/43B.1 was reverted — the provider, diagnostics, bucket migration, tests, and docs are all intact and untouched. Local `.env.local` remains `ASSET_STUDIO_IMAGE_PROVIDER=fake` / `ASSET_STUDIO_GEMINI_ENABLED=false` (confirmed unchanged from the prior session). `GEMINI_API_KEY` was not displayed, modified, or used. No Vercel environment changes were made or are authorized. Sprint 43D (Batch Generation) remains deferred until real Gemini provider QA succeeds against a future Google project.

## 9. Files changed

- `apps/web/lib/asset-studio/repository.ts` — `findCandidatesByChecksum`
- `apps/web/lib/asset-studio/in-memory-repository.ts` — `findCandidatesByChecksum`
- `apps/web/lib/asset-studio/supabase-repository.ts` — `findCandidatesByChecksum`, `checksum`/`perceptualHash` in `updateCandidate` patch mapper
- `apps/web/lib/asset-studio/technical-validation.ts` — new
- `apps/web/lib/asset-studio/visual-validation.ts` — new
- `apps/web/lib/asset-studio/ui-eligibility.ts` — `canReviewCandidate` now also accepts `needs_revision`
- `apps/web/lib/asset-studio/service.ts` — `runTechnicalValidation`, `assertReviewEligible`, issue-code validation, revision notes-or-issues requirement, approval requires passed technical validation
- `apps/web/lib/actions/asset-studio.ts` — `runTechnicalValidationAction`
- `apps/web/lib/actions/index.ts` — barrel export
- `apps/web/components/dev/asset-studio/JobDetailView.tsx` — full candidate-card rewrite (technical validation display, review-form, publish-label clarity)
- `apps/web/tests/lib/asset-studio-technical-validation.test.ts` — new, 13 tests
- `apps/web/tests/lib/asset-studio-visual-validation.test.ts` — new, 4 tests
- `apps/web/tests/lib/asset-studio-review-workflow.test.ts` — new, 12 tests
- `apps/web/tests/lib/asset-studio-service.test.ts` — 3 fixtures updated for the new approval requirement
- `apps/web/tests/lib/asset-studio-ui-eligibility.test.ts` — unaffected (already covered `needs_revision` exclusion correctly; no `needs_revision`-must-be-false assertion existed to conflict)
- `docs/design/08-asset-validation-and-approval.md` — new
- `docs/design/07-gemini-image-provider.md` — unchanged (blocker status documented in the new doc and this report instead, to avoid rewriting a doc that's otherwise accurate)

## 10. Production deployment

URL: https://world-legends.vercel.app (confirmed aliased to commit `7ff75b03`, deployment `world-legends-dss4h8avr`, status ● Ready)
