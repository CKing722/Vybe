# VYBE Review: ChatGPT - 2026-05-25 (Pass 23)

Date: 2026-05-25  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review artifact exists: `docs/reviews/vybe-review-chatgpt-2026-05-25-22.md` (treated as complete)
- This pass reviews the next newest unreviewed output found in:
  - Codex/backend new commits on `backend/me-profile-contract-sync`

## Artifacts reviewed (new since last pass)

### Codex (backend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Branch / head: `backend/me-profile-contract-sync` @ `85dfa1c`
- New commits reviewed:
  - `e627f6f` - backend: add `/api/me/profile` to OpenAPI contract
  - `85dfa1c` - docs: record `/api/me/profile` OpenAPI contract sync artifact
- Files touched:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\openapi.yaml`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\openapiContract.test.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\TEAM_ACTIVATION.md`

## Executive call

- OpenAPI contract coverage for profile editing: PASS - the endpoint is now contract-visible and validated in tests.
- Contract correctness vs runtime behavior: PARTIAL - `/api/me/profile` response codes and request semantics need a quick sync.
- Vertical-slice demo readiness: FAIL (unchanged) - frontend still contains a raw paid provider call and questions do not route through backend.

## What is good (2026 expectation alignment)

- The OpenAPI contract is real and continuously validated (`backend/tests/openapiContract.test.js`), which is a strong “integration discipline” signal for multi-agent parallel work.
- `ViewerProfileUpdateRequest` is tight (`additionalProperties: false`, `minProperties: 1`), which prevents silent shape drift on the client side.

## Gaps / critique (actionable)

### P0 - OpenAPI `/api/me/profile` missing 403 (forbidden) response

- Evidence:
  - Runtime middleware uses `requireRole('viewer')`, which returns 403 on role mismatch.
  - Contract currently lists `400/401/404` only.
- Suggested next action (Owner: Codex / backend):
  - Update `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\openapi.yaml`:
    - Add a `"403": { $ref: "#/components/responses/ApiError" }` response for `/api/me/profile` (and any other role-gated endpoints missing it).

### P1 - Profile update semantics are still ambiguous in the contract

- Evidence:
  - `display_name` is typed as `["string","null"]`, but server behavior treats `null` as “no change” (and may 400 if no other updates exist).
  - `avatar` and `bio` do support “clear” via `null` (and empty string coerces to `null`).
- Suggested next action (Owner: Codex / backend):
  - Decide and encode one of these contract strategies in `backend/contracts/openapi.yaml`:
    - **Strategy A (recommended for clarity):** make `display_name` `type: string` only (no `null`), and document clearing rules explicitly in the endpoint `description`.
    - **Strategy B:** keep `null`, but document explicitly that `display_name: null` is treated as “omit/no-op” (not “clear”), and add an error example in docs for the “no updates provided” 400.

### P1 - Request casing drift remains (snake_case request vs camelCase response)

- Evidence:
  - Response is camelCase (`displayName`, `avatarUrl`), request is snake_case (`display_name`, `avatar`).
  - Runtime already accepts multiple aliases (`displayName`, `avatar_url`, `avatarUrl`) which implies the team wants flexibility, but it also risks permanent client-side normalization glue.
- Suggested next action (Owner: Codex / backend + Claude / frontend agreement):
  - Pick and publish one canonical external casing:
    - If canonical is **camelCase**, update OpenAPI request schema to camelCase and keep snake_case as deprecated aliases (documented).
    - If canonical is **snake_case**, stop emitting camelCase responses (or document it as “legacy demo output” with a hard migration target).

## Still-blocking gates (unchanged)

1. Remove raw provider call in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` (`https://api.anthropic.com/v1/messages`); questions only come from backend `POST /api/games/questions`.
2. Replace demo-unsafe legal/compliance/vendor/payment assertions in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` with clearly-marked placeholders until a reviewed policy exists.

## Next expected milestone gate (forward-looking)

For a “demoable luxury room” vertical slice, the next visible bar is:

- One unified “gift → room event → spectacle” pipeline where:
  - Backend emits a gift event with a stable, versioned payload.
  - Frontend plays the effect deterministically (no external calls) and logs a structured “effect lifecycle” timeline (start/hold/end) for QA.
