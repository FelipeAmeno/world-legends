# Sprint 43B.1 — Safe Gemini Rate-Limit Diagnostics

Follow-up to Sprint 43B, triggered by the first real Gemini smoke test hitting a real `429` with zero useful diagnostic captured. Adds allowlisted, secret-free error diagnostics for Gemini provider failures and fixes `attempt.model` to actually record the model used. No real Gemini call was made during this task — everything was implemented and tested against mocked `fetch` responses only.

## 1. Root cause

The first real Gemini smoke test (`gemini-smoke-test-preset-001`, job `75ae0568-...`, attempt `84bdfb97-...`) failed with `provider-rate-limit`. Inspecting the persisted row showed `usage_metadata: {}` — completely empty — because `classifyHttpError`'s 429 branch discarded the response body entirely:

```ts
if (status === 429) {
  return new ProviderError('provider-rate-limit', 'limite de taxa do provedor atingido', true);
}
```

No HTTP status, no Google error status/code, no quota metric/value, no `Retry-After`/`RetryInfo`, and no model name were ever captured — this wasn't a redaction problem, it was an information-loss problem: the data was never read from the response in the first place. Separately, `attempt.model` was `null` for every attempt regardless of provider, because `generation-orchestrator.ts` persisted `job.model` (always hardcoded `null` at job creation) instead of the model actually resolved for the call.

## 2. Provider error contract

`lib/asset-studio/image-provider.ts` — added a typed allowlist (not an unrestricted `Record<string, unknown>`, per the brief):

```ts
export type ProviderSafeDetails = {
  httpStatus?: number;
  googleErrorStatus?: string;
  googleErrorCode?: number;
  quotaMetric?: string;
  quotaId?: string;
  quotaValue?: string | number;
  retryDelay?: string;
  retryAfterSeconds?: number;
  model?: string;
  rateLimitCategory?: 'temporary-rate-limit' | 'daily-quota-exhausted' | 'zero-quota' | 'unavailable-tier' | 'unknown-rate-limit';
};
```

`ProviderError` gained a 4th constructor param, `safeDetails?: ProviderSafeDetails`, propagated to every throw site in `gemini-image-provider.ts` (auth, rate-limit, 5xx, generic 4xx, network error, safety block, no-candidates) — each attaches `model` at minimum, plus whatever else was safely extracted.

## 3. Gemini error parsing (allowlisted, defensive)

New functions in `gemini-image-provider.ts`:

- `parseGoogleErrorBody(bodyText)` — `JSON.parse`s once, defensively (returns `null` on any parse failure, never throws a second exception). Extracts **only** `error.code`, `error.status`, and — from `error.details[]` — a `QuotaFailure` detail's first violation (`quotaMetric`/`quotaId`/`quotaValue`) and a `RetryInfo` detail's `retryDelay`. Never returns the parsed object itself, only these named fields.
- `parseRetryAfterHeader` / `parseRetryDelaySeconds` — parse the standard `Retry-After` header and Google's `"31s"`-style `retryDelay` string into a common `retryAfterSeconds` number. The header takes precedence when both are present.
- `deriveRateLimitCategory(parsed)` — best-effort heuristic (documented as such — no real Gemini 429 response was available to validate the exact shape against): zero `quotaValue` + a `FreeTier` quotaId → `unavailable-tier`; zero `quotaValue` alone → `zero-quota`; `quotaId` containing `PerDay` → `daily-quota-exhausted`; containing `PerMinute` → `temporary-rate-limit`; otherwise `unknown-rate-limit`.
- Malformed/absent error body → `parseGoogleErrorBody` returns `null`, `classifyHttpError` still returns a valid `ProviderError` with `httpStatus`/`model` preserved and `rateLimitCategory: 'unknown-rate-limit'` — never a second thrown exception, never a crash.

`error_code` (`provider-rate-limit`) and the short `error_message` (`'limite de taxa do provedor atingido'`) are **unchanged** — exactly as the brief required. All new detail lives in `safeDetails`.

## 4. Retry-ability decisions

| Category | Retryable? | Why |
|---|---|---|
| `provider-authentication` | No (unchanged) | |
| `provider-safety-block` | No (unchanged) | |
| `zero-quota` / `unavailable-tier` | **No** | Nothing changes by retrying; a bounded few-second retry can't fix a zero quota |
| `daily-quota-exhausted` | **No** | The existing bounded retry (seconds, exponential backoff) would never respect a reset that's hours away — retrying "immediately" (in machine terms) would be actively wrong |
| `temporary-rate-limit` / `unknown-rate-limit` | Yes (unchanged bound) | Existing `retry.ts` policy (2 retries, exponential backoff + jitter) is untouched |

`retry.ts` itself was **not modified** — the existing bounded backoff timing is unchanged; `retryAfterSeconds`/`retryDelay` are captured and persisted for visibility but the retry loop doesn't yet sleep for the provider-suggested delay specifically. Documented here as a deliberate, scoped-down decision (the brief said "do not change retry behavior blindly") rather than a silent gap.

## 5. Model persistence fix

`ImageGenerationProvider` interface gained `readonly model: string | null` (`GeminiImageProvider.model` is now public, `FakeImageProvider.model = null` — fake has no real model concept, never invents one). `generation-orchestrator.ts`'s `insertAttempt` call now persists `model: provider.model` — resolved from the provider instance at generation time — instead of `job.model` (always `null`, never trusted as client input). The already-failed real attempt (`84bdfb97-...`) was verified unchanged (`model: null`, `usage_metadata: {}`) — historical snapshots are never rewritten retroactively.

## 6. Orchestrator persistence

`service.markAttemptFailed` gained an optional 5th param, `safeDetails?: Record<string, unknown>`, merged into `attempt.usage_metadata` on the failure update. `generation-orchestrator.ts`'s catch block now passes `providerError.safeDetails` through. `error_code`/`error_message` stay exactly as concise/sanitized as before.

## 7. UI

`JobDetailView.tsx` — the attempts list now shows `model` inline when present, and a new `SafeAttemptDiagnostics` component renders, for failed attempts only, a small `HTTP status / Google status / Quota type / Retry after / Model` table — each field read and type-checked **individually by name** from `usage_metadata`, never a raw dump or object spread. Confirmed by a source-level regression test that the component never contains `JSON.stringify(usageMetadata` or `{...usageMetadata`.

## 8. Tests — 20 new, all mocked, zero real Gemini calls

- `tests/lib/asset-studio-gemini-provider.test.ts` (+10): QuotaFailure parsing, RetryInfo parsing, `Retry-After` header precedence over `RetryInfo`, zero-quota → non-retryable, temporary rate limit → retryable, daily quota exhaustion → non-retryable, malformed JSON falls back safely, raw body never leaks into `safeDetails`/message, response headers never leak, API key never appears in `safeDetails` even when echoed in a fixture error message.
- `tests/lib/asset-studio-generation-orchestrator.test.ts` (+2): `attempt.model` records the provider's real resolved model (never `job.model`); a thrown `ProviderError`'s `safeDetails` land in `attempt.usage_metadata` on failure, with `error_message` staying short/generic.
- `tests/lib/asset-studio-gemini-boundaries.test.ts` (+1): the UI diagnostics component never dumps/spreads `usage_metadata` and only ever references the 5 allowlisted field names.

**Full suite: 596/596 passing** (578 prior + 18 new — some brief-listed scenarios, like "existing fake-provider tests remain green," are satisfied by the existing suite rather than a new test). `pnpm lint`: 0 errors (462 pre-existing warnings, unchanged baseline). `pnpm typecheck`: clean. `pnpm build`: 34/34 green, run only after stopping `next dev` (the earlier session in this sprint corrupted `.next` by running both concurrently — not repeated here).

## 9. Explicit confirmation

**No real Gemini API call was made during this task.** Every test uses `vi.stubGlobal('fetch', ...)` against fixture response bodies. The only real-infrastructure interaction was a read-only Postgres query (service-role key, already-rotated/authorized) confirming the historical failed attempt row is untouched. `.env.local` was not modified; provider mode was left exactly as the user had it (`gemini`/enabled) throughout this task, per instructions not to switch it.

## 10. Files changed

- `apps/web/lib/asset-studio/image-provider.ts` — `ProviderSafeDetails` type, `ProviderError.safeDetails`
- `apps/web/lib/asset-studio/providers/gemini-image-provider.ts` — parsing/classification rewrite, `model` made public
- `apps/web/lib/asset-studio/providers/fake-image-provider.ts` — `model = null` (interface compliance)
- `apps/web/lib/asset-studio/service.ts` — `markAttemptFailed` optional `safeDetails` param
- `apps/web/lib/asset-studio/generation-orchestrator.ts` — `attempt.model` from `provider.model`; `safeDetails` threaded to `markAttemptFailed`
- `apps/web/components/dev/asset-studio/JobDetailView.tsx` — `SafeAttemptDiagnostics`, model label on attempts
- `apps/web/tests/lib/asset-studio-gemini-provider.test.ts` — +10 tests
- `apps/web/tests/lib/asset-studio-generation-orchestrator.test.ts` — +2 tests, test fixture providers updated for the `model` field
- `apps/web/tests/lib/asset-studio-gemini-boundaries.test.ts` — +1 test

## 11. Production deployment

_Pending — filled in after push/deploy/confirm._
