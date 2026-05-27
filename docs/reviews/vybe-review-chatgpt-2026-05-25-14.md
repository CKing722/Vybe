# VYBE Review: ChatGPT — 2026-05-25 (Pass 14)

Date: 2026-05-25  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review artifact: `docs/reviews/vybe-review-chatgpt-2026-05-25-13.md`
- This pass reviews the next newest unreviewed output found in Codex/backend. Frontend has no new commits since Pass 13.

## Artifacts reviewed (new since last pass)

### Codex (backend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Branch / head: `backend/ws-event-schemas` @ `2ab9093`
- Notable changes:
  - Added versioned Socket.io payload JSON Schemas: `backend/contracts/socketio/v1/**`
  - Added schema sanity test: `backend/tests/socketioSchemasParse.test.js`
  - Updated contract index docs: `docs/BACKEND_API_CONTRACTS.md`

## Executive call

- Socket.io contract schemas: **Pass (high-leverage, on-track)** — this is the right direction for preventing cross-stack drift as the gift catalogue and spectacle system grows.
- Overall vertical-slice readiness: **Fail until frontend P0s are cleared (unchanged)** — raw third-party AI calls and demo-unsafe legal/vendor/payment claims remain in the UI.

## What’s good (luxury / 2026 expectations)

- **Versioned contracts (`socketio/v1`)** is the correct shape for a long-lived “gift spectacle runtime” program; it supports deliberate evolution instead of ad-hoc payload churn.
- **`additionalProperties: false`** across schemas is a strong default for preventing accidental payload creep (a common source of “polish debt”).
- **Gift payload is already spectacle-aware** (`spectacleTier`, `durationMs`, `animationType`) — this supports frontend tiered render pipelines (CSS → Canvas/Pixi → 3D/WebGL/WebGPU) without needing deep backend changes later.

## Gaps / critique (actionable)

### 1) Schemas are not yet *validated against real payloads*

- Current test only checks “valid JSON + unique `$id`”, not that backend emits conform to the schemas.
- Recommendation (Owner: **Codex / backend**):
  - Add at least one automated validation test that runs sample payloads through a JSON Schema validator (Ajv is the usual choice) for each event type.
  - Minimum target: validate the payload returned by `giftAnimationPayload(...)` and the `stormService` payloads against their schemas.
- Files to change (Codex):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\` (add a schema validation test)
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\socketio\v1\` (if any schema tweaks needed)

### 2) Ack/error semantics aren’t contract-defined

- Socket event *payload* schemas exist, but the **ack response shapes** for `join_room`, `leave_room`, and `send_gift` are not specified.
- Recommendation (Owner: **Codex / backend**):
  - Add a small README section or dedicated schemas for ack payloads, at least for:
    - `send_gift` ack `{ ok: true, result }` vs `{ ok: false, error }`
    - `join_room` / `leave_room` ack `{ ok, roomId, error? }`
- Files to change (Codex):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\socketio\v1\README.md`
  - (Optional) `backend/contracts/socketio/v1/**` (new ack schemas)

### 3) Canonical ID mapping still pending (cross-stack)

- Contract includes `gift.id` (gift type id) and `animationType`, but frontend still has a risk of one-off mapping logic between “gift type” and “effect id”.
- Recommendation:
  - Owner: **Codex / backend** — introduce a stable `effectId` (or `effectKey`) in gift types and in `gift_animation` payloads.
  - Owner: **Claude / frontend** — consume backend `effectId` directly; remove local mapping.
- Candidate files to change:
  - Codex: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\giftCatalog.js`
  - Codex: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\sparkEngine.js`
  - Claude: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` (and/or move mapping into `frontend/src/gifts/`)

## P0 re-check (still open; no new frontend commits)

### A) Raw provider API call in browser (hard stop)

- Evidence: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` still calls `https://api.anthropic.com/v1/messages`.
- Required next action (Owner: **Claude / frontend**):
  - Replace with `POST /api/games/questions` (backend contract endpoint).
  - Remove any third-party AI endpoint codepaths from browser.

### B) Demo-unsafe legal/vendor/payment claims in UI (hard stop)

- Evidence: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` includes 2257 compliance claims + Yoti + CCBill/Segpay references.
- Required next action (Owner: **Claude / frontend**, Hermes as reference):
  - Replace with explicitly-placeholder, non-committal copy (“TBD for demo”) and remove vendor names until Hermes research is finalized and Damon approves.

## Updated gate for the next milestone

1. **Frontend has zero raw provider calls**; questions only come from `POST /api/games/questions`.
2. **UI copy contains no finalized legal/compliance/vendor/payment claims**; placeholders are clearly marked as demo placeholders.
3. **Socket payload contracts are enforceable**: schemas exist *and* at least one automated validation test fails on drift.

