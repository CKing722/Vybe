# VYBE Review: ChatGPT - 2026-05-26 (Pass 06)

Date: 2026-05-26  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review pass treated as complete for queue purposes: `docs/reviews/vybe-review-chatgpt-2026-05-26-05.md`.
- No new commits were found after **2026-05-26 01:52 -0500** across the repo worktrees (Codex/backend and Claude/frontend).
- This pass is therefore a **forward-looking standards gate** for the *next* milestone, with concrete P0 actions per owning lane.

## Current heads (unchanged since Pass 05)

### Claude (frontend)

- Worktree: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
- Branch / head: `frontend/gift-spectacle-runtime` @ `9065496`

### Codex (backend)

- Worktree: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- `main` head: `41edcf0` (still missing `backend/contracts/**`)
- Contract baseline branch head: `backend/contracts-mainline-merge` @ `23df0fc` (contains `backend/contracts/**` + contract tests)

## Executive call (demo readiness gate)

- Status: **FAIL (unchanged)** until P0 blockers are resolved.
- Reason: the demo can’t be “real enough to extend safely” while (1) the browser calls a paid AI provider directly and (2) frontend socket transport/payload assumptions do not match backend runtime/contract.

## P0 gate: must-fix before claiming a working vertical slice

### P0 — Remove raw paid-provider calls from the browser

- Finding (still present): `frontend/src/App.jsx` contains a direct call to `https://api.anthropic.com/v1/messages`.
- Why it blocks: violates the no-provider rule; also makes the demo nondeterministic and forces secrets/payment paths.
- Owner: **Claude / frontend**
- Files to change:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`
- Acceptance criteria:
  - No browser code fetches third-party model APIs.
  - Question generation is **local/mock** or routed through backend `POST /api/games/questions` (mock/local only) with clear UI provenance (“Demo questions”).

### P0 — Socket transport and payload contract alignment (stop “parallel truths”)

- Finding (still present): `frontend/src/gifts/useGiftSocket.js` uses raw `WebSocket` to `/room/{roomId}?token=...` and expects `{ type, payload }` + snake_case fields.
- Backend runtime/contract expects: **Socket.io** named events (e.g. `join_room`, `gift_animation`, `platform_banner`) with payloads that are effectively camelCase (contract also tolerates snake_case for some client->server inputs).
- Owner: **Claude / frontend (primary)**, **Codex / backend (contract authority)**
- Files to change (Claude):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\useGiftSocket.js`
- Acceptance criteria:
  - Frontend uses `socket.io-client`, authenticates via `handshake.auth.token`, emits `join_room`, and subscribes directly to named server events.
  - Frontend consumes the canonical payload shape from `backend/contracts/socketio/v1/**` (treat schemas as source-of-truth once merged to `main`).

### P0 — Make machine-readable contracts canonical on `main`

- Finding (still present): `main` does not contain `backend/contracts/**`; the newest contract baseline lives only on `backend/contracts-mainline-merge` (`23df0fc`) and is ahead of `main` by many commits.
- Why it blocks: Claude is forced to guess; drift is guaranteed without a canonical contract + tests on the protected branch.
- Owner: **Codex / backend**
- Required action:
  - Merge/re-home contract baseline branch into `main` via PR so these are in-tree:
    - `backend/contracts/openapi.yaml`
    - `backend/contracts/asyncapi.yaml`
    - `backend/contracts/socketio/v1/**.schema.json`
  - Keep runtime tests that validate API responses/events against these schemas.
- Acceptance criteria:
  - `main` contains `backend/contracts/**`.
  - CI (or local test suite) fails when runtime payload shape drifts from the schema.

### P0 — Clarify `gift_animation` identifiers (integration footgun)

- Finding (still likely): contract currently defines `giftId` plus nested `gift.id`; this is easy to misinterpret across lanes.
- Owner: **Codex / backend**
- Files to change (Codex):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\sparkEngine.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\socketio\v1\server-to-client\gift_animation.schema.json`
- Acceptance criteria (additive, backward-compatible):
  - Include explicit `giftSentId` and `giftTypeId` in the event payload/schema (keep existing fields for now if needed).

## P1 “luxury” gate (what makes it feel 2026 instead of a prototype)

### Microcopy / tone rules (apply across UI surfaces)

- Avoid “system-y” phrasing on user-facing surfaces (refund/compliance/dev disclaimers). Use short, calm, declarative lines.
- Prefer “sparks returned” over “refund” unless fiat is truly involved.
- Keep compliance notes in docs, not in primary user UI.

Owner: **Claude / frontend**  
Likely touchpoints: request outcomes, payments tab, pinned states, banner copy, error states.

### Gift spectacle architecture: hard requirements for credibility

The current direction (data-driven `giftEffectCatalog.js` + overlay + reduced motion hook) is correct. To meet the “high-end 2026” bar without overbuilding:

- Treat `giftEffectCatalog.js` as the effect DSL contract:
  - Add an explicit `schemaVersion` and a stable `giftTypeId` field to each entry (stop relying on ad-hoc maps).
  - Encode anchor intent (safe-area aware stage geometry) as data, not hard-coded magic numbers.
- Define reduced-motion as a **premium static** variant (glow/typography/composition), not simply “no animation”.
- Bake in performance budgets per tier (particle caps, duration caps, queue/serialization rules, mobile downgrade path).

Owner: **Claude / frontend**

## Hermes QA/doc follow-ups (cheap and high leverage)

Add two checks to the existing QA checklist:

- “No provider API calls from browser” (network tab sanity check).
- “Socket transport matches contract” (Socket.io vs raw WS; event naming + payload casing matches schemas).

Owner: **Hermes / docs**  
File to change:
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\qa\vybe-gho-008-gift-spectacle-qa.md`

## Next artifacts expected (what to review next)

- Codex: PR/branch that lands `backend/contracts/**` onto `main` + contract validation tests.
- Claude: `useGiftSocket` migrated to `socket.io-client` + provider call removed from `App.jsx`.
- Hermes: QA checklist updated with the two additional gates above.

