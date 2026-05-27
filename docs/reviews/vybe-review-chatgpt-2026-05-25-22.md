# VYBE Review: ChatGPT - 2026-05-25 (Pass 22)

Date: 2026-05-25  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review artifact exists: `docs/reviews/vybe-review-chatgpt-2026-05-25-21.md` (treated as complete)
- This pass reviews the next newest unreviewed output found in:
  - Codex/backend new commits on `backend/me-profile-update`

## Artifacts reviewed (new since last pass)

### Codex (backend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Branch / head: `backend/me-profile-update` @ `0529aad`
- New commits reviewed:
  - `c800699` - backend: add viewer profile update endpoint
  - `0529aad` - docs: record viewer profile update artifact
- Files touched:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\routes\users.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\profileService.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\sparkEngine.test.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\TEAM_ACTIVATION.md`

## Executive call

- Backend profile editing foundation: PASS - adds a viewer-scoped `PUT /api/me/profile` with validation + tests and supports no-DB demo mode.
- Contract/doc readiness for frontend integration: PARTIAL - docs add the endpoint but do not specify patch semantics or error shape.
- Vertical-slice demo readiness: FAIL (unchanged) - frontend still contains a raw paid provider call and demo-unsafe compliance/vendor/payment copy.

## What is good (2026 expectation alignment)

- The endpoint is safe by default: auth + role gating (`viewer`) + explicit request validation and structured 400 errors (field-level messages).
- Demo-friendly: supports in-memory store when DB is absent, which keeps the "no spend / no secrets" demo loop unblocked.
- The request accepts some alternate field names (`displayName`, `avatarUrl`, `avatar_url`) which reduces integration footguns while contracts settle.

## Gaps / critique (actionable)

### P1 - Docs need explicit patch semantics + error shape

- Current gap:
  - `docs/BACKEND_API_CONTRACTS.md` documents only the happy-path request/response and does not explain which fields are optional, how clearing works, or what 400/403 look like.
- Suggested next action (Owner: Codex / backend, docs only):
  - Expand `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md` under `PUT /api/me/profile` with:
    - Clear semantics: "partial update" (fields omitted are unchanged)
    - Clearing behavior: `avatar` and `bio` accept `null` (or empty string -> coerced to `null`); `display_name` cannot be cleared (must be 1-50 chars)
    - Error examples:
      - 400 validation error response (including `details.fields[]` shape from `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\middleware\validator.js`)
      - 403 when role is not viewer

### P1 - External casing + field naming is drifting

- Evidence:
  - Endpoint request keys are mixed (`display_name` snake_case but `avatar` not `avatar_url`), while other responses are camelCase (`displayName`, `avatarUrl`).
- Suggested next action (Owner: Codex / backend):
  - Pick and document one canonical external JSON casing for requests + responses (or time-box a migration plan) so frontend/UI does not accumulate permanent normalization glue.

### P2 - Profile update should become a UI-visible "luxury moment" (future-facing)

- Luxury expectation:
  - Profile edits (display name, avatar, bio) should feel "immediate" and "high-trust": optimistic UI, clear error mapping, and instantaneous reflection in room UI + gift sender identity.
- Suggested next action (Owner: Claude / frontend):
  - Wire the existing viewer profile modal to `PUT /api/me/profile` and then refresh `GET /api/me` (or optimistically patch local state) in:
    - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` (current `ViewerProfile` flow)

## Still-blocking gates (unchanged)

1. Remove raw provider call in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` (`https://api.anthropic.com/v1/messages`); questions only come from backend `POST /api/games/questions`.
2. Replace demo-unsafe legal/compliance/vendor/payment assertions in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` with clearly-marked placeholders until a reviewed policy exists.
