# VYBE Review: ChatGPT - 2026-05-25 (Pass 18)

Date: 2026-05-25  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review artifact: `docs/reviews/vybe-review-chatgpt-2026-05-25-17.md`
- This pass reviews the next newest unreviewed output found in:
  - Codex/backend new commit after `596e9f4`

## Artifacts reviewed (new since last pass)

### Codex (backend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Branch / head: `backend/machine-readable-contracts-mainline` @ `ee0e43d`
- New commit reviewed:
  - `ee0e43d` - backend: add machine-readable API contracts
- Files touched (high signal):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\openapi.yaml`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\asyncapi.yaml`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\socketio\v1\**`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\openapiContract.test.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\asyncapiContract.test.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\socketioSchemasParse.test.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

## Executive call

- Backend (OpenAPI + AsyncAPI + JSON Schema + validation tests): PASS (this is the right “adult posture” for a multi-agent build; it keeps integration deterministic).
- Cross-stack “gift spectacle identity”: FAIL (unchanged) — contracts still require the frontend to infer the visual effect from `gift.cost` / `spectacleTier` rather than a stable `effectId`.
- Vertical-slice demo readiness: FAIL (unchanged) until the frontend P0s from Pass 17 are cleared (raw paid provider call + demo-unsafe compliance/vendor/payment claims).

## What is good (luxury / 2026 expectations)

- Contract-first scaffolding is now real: OpenAPI for HTTP + AsyncAPI wrapper for Socket.io + JSON Schema payloads with Ajv compilation.
- The “no-spend” posture is explicitly represented in the contracts/docs (not just implied), including `POST /api/games/questions` being the frontend-safe replacement for direct browser AI calls.
- The test affordance is correct: `npm run check` validates contract files in CI without needing a running server.

## Gaps / critique (actionable)

### P1 - Naming consistency across the HTTP surface is currently split-brain

- Evidence (both exist in the same OpenAPI file):
  - `AuthUser` uses `display_name`, `avatar_url`, `banner_url` (`backend/contracts/openapi.yaml`).
  - `ViewerMeUser` uses `displayName`, `avatarUrl`, `bannerUrl` (`backend/contracts/openapi.yaml`).
- Why this matters:
  - In 2026 “luxury” web apps, clients should not have to memorize endpoint-by-endpoint casing rules; it becomes a persistent integration tax and a source of subtle bugs.
- Required next action (Owner: Codex / backend):
  - Pick one canonical JSON casing for external APIs and enforce it across OpenAPI + handlers.
  - If backwards-compat is desired, document a migration window and provide a single boundary mapping (don’t encode long-lived “two shapes” into contracts).

### P1 - Socket.io client payload schemas accept both snake_case and camelCase at once

- Evidence:
  - `backend/contracts/socketio/v1/client-to-server/send_gift.schema.json` and `join_room.schema.json` allow either `room_id` or `roomId`, etc.
- Why this matters:
  - Helpful for a short transition, but it’s also how “forever ambiguity” starts (clients send both, server precedence differs, analytics becomes messy).
- Suggested next action (Owner: Codex / backend):
  - Keep the dual acceptance temporarily if needed, but declare a canonical “on the wire” format in `backend/contracts/socketio/v1/README.md` and set a deprecation plan.

### P1 - `gift_animation` still lacks a stable effect identity (DSL-ready contract gap)

- Current state:
  - `backend/contracts/socketio/v1/server-to-client/gift_animation.schema.json` exposes `animationType` (free string), `durationMs`, `spectacleTier`.
- Why this matters:
  - A premium gift spectacle system should be driven by a stable effect identity + versioned effect definition (Hermes’ `VYBE-GHO-007` recommends a JSON effect DSL + schema validation).
  - If frontend continues mapping by `cost`, you’ll eventually hit collisions (promos/bundles) and “same gift, different look” will be hard.
- Required next action (Owner: Codex / backend; Claude to consume):
  - Add `effectId` (or `effect_id`) and optionally `effectVersion` / `effectParams` to the `gift_animation` payload schema and emit it from the backend.
  - Treat `animationType` as an implementation detail or rename it to `effectId` if that is the intended meaning.

### P2 - OpenAPI vs Socket.io schema drift (small, but worth tightening now)

- Evidence:
  - `PlatformBanner.type` is enumerated as `[gift]` in OpenAPI, but unconstrained in the Socket.io JSON schema.
  - `expiresAt` / `createdAt` include `format: date-time` in JSON Schema but not in OpenAPI.
- Suggested next action (Owner: Codex / backend):
  - Align OpenAPI and the canonical JSON Schemas for shared payloads so codegen/tests don’t silently diverge.

### P2 - `gift_error` contract is too thin for UX-quality recovery

- Current state:
  - `backend/contracts/socketio/v1/server-to-client/gift_error.schema.json` is `{ message: string }`.
- Why this matters:
  - Luxury UX depends on targeted recovery: “insufficient balance” should route to a purchase flow, “invalid gift” should refresh catalog, “room closed” should navigate, etc.
- Suggested next action (Owner: Codex / backend; Claude to consume):
  - Add `code` (stable enum), plus optional `giftId` / `roomId` / `retryAfterMs` so the UI can recover without string parsing.

## Updated gate for the next milestone

1. Frontend has zero raw provider calls; questions only come from `POST /api/games/questions`.
2. UI copy contains no finalized legal/compliance/vendor/payment claims; placeholders are clearly marked as demo placeholders.
3. Gift spectacle identity is contract-driven: backend emits a stable `effectId`/`effect_id` (and ideally version/params) so the frontend never guesses spectacle from cost.
4. Contracts converge on one external JSON casing choice (or an explicitly time-boxed migration plan exists).

