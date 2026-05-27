# VYBE Review: ChatGPT - 2026-05-26 (Pass 04)

Date: 2026-05-26  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review artifact exists: `docs/reviews/vybe-review-chatgpt-2026-05-26-03.md` (treated as complete for queue purposes)
- This pass reviews the next newest unreviewed outputs found in:
  - Claude/frontend new room-control + gift/socket wiring commits on `frontend/gift-spectacle-runtime`
  - Codex/backend contract-mainline merge head on `backend/machine-readable-contracts-mainline`

## Artifacts reviewed (new since last pass)

### Claude (frontend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
- Branch / head: `frontend/gift-spectacle-runtime` @ `7f1812c`
- New commit(s) reviewed:
  - `e5d7a7a` - fix(games): enforce spark-backed stakes
  - `33b7f38` - feat(gifts): wire useGiftSocket into App and complete BACKEND_ID_MAP
  - `9181ebc` - feat(vip): describe session tiers
  - `c661386` - fix(room): remove bottom top up action
  - `220eee9` - fix(room): dock chat visibility control
  - `2548333` - fix(room): remove stage viewer initials
  - `03ed83a` - fix(room): make captions a real toggle
  - `7f1812c` - fix(room): wire fullscreen and volume controls
- Working tree note:
  - `frontend/src/App.jsx` has uncommitted local changes (adds “Instant replay” / “Go live” controls); review comments below assume those changes may land next.
- Notable files:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\useGiftSocket.js`

### Codex (backend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Branch / head: `backend/machine-readable-contracts-mainline` @ `23df0fc`
- New commit(s) reviewed:
  - `23df0fc` - backend: merge contract baseline v1 into contracts mainline
- Notable files (current contract state):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\socketio\v1\server-to-client\gift_animation.schema.json`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\sparkEngine.js`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\sockets\giftHandler.js`

## Executive call

- Backend: PASS (contract-first + runtime validation direction remains correct).
- Frontend: PARTIAL PASS (room controls + preview affordances are heading toward “luxury,” but core integration contracts are still diverging).
- Vertical slice demoability: FAIL (P0 integration blockers remain: raw paid-provider call + socket contract mismatch).

## What improved (product polish)

### Room control surface (frontend)

- Fullscreen and volume controls are now “real,” and the UI treatment (blurred glass, compact buttons) matches a premium tone.
- Captions toggle now produces an on-screen caption bubble rather than a dead setting, which is the right UX pattern.
- The in-progress “Instant replay / Go live” control reads like a mature streaming product affordance (good direction).

## P0 / P1 gaps (actionable)

### P0 - Frontend still makes a raw paid-provider call (must be removed)

- Evidence: `frontend/src/App.jsx` still calls `https://api.anthropic.com/v1/messages`.
- Owner: Claude / frontend
- File(s) to change:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`
- Required target behavior:
  - Route question generation through backend `POST /api/games/questions` (mock/local only), or a local stub, and surface fallback provenance cleanly in UI.

### P0 - Socket transport + payload shape are mismatched to backend contracts (worse than just “WebSocket vs Socket.io”)

Backend contract reality (current):
- Socket.io named events: `gift_animation`, `platform_banner`, `spark_storm_*` (see backend contracts + handler emit path).
- `gift_animation` payload is camelCase and nested (`senderName`, `gift.id`, etc).

Frontend `useGiftSocket.js` assumptions (current):
- Connects to `ws://.../room/{roomId}?token=...` (raw WebSocket).
- Expects a `{ type, payload }` envelope.
- Expects snake_case fields (`payload.gift_type_id`, `payload.sender_name`) that do not match the backend’s emitted payload.

Impact:
- Even if the transport matched, event parsing will silently fail; gift spectacle and banners will not fire reliably.

Owner:
- Claude / frontend (primary), with Codex as tie-breaker only if the server contract must be adjusted.

File(s) to change:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\useGiftSocket.js`

Required target behavior:
- Use `socket.io-client` and subscribe to the backend’s named events.
- Consume payload fields exactly as defined in `backend/contracts/socketio/v1/**` (treat contract as source of truth).

### P0 - Gift id mapping is still drifting and BACKEND_ID_MAP is incomplete (integration hack risk)

Observed:
- Backend gift type ids are short slugs (e.g. `rose`, `flame`, `kiss`, `diamond`, `crown`, `champagne`, `key`).
- Frontend effect ids are “premium names” (e.g. `neon_rose`, `fire_shot`, `velvet_kiss`, …).
- `BACKEND_ID_MAP` only covers `crown` and `champagne`; it does not map `rose/flame/kiss/diamond/key` at all (so it will miss the majority of gifts).

Owner:
- Claude / frontend (primary) + Codex/backend decision on canonical id strategy

Decision recommendation (for vertical slice speed):
1) **Backend gift type ids are canonical** (recommended): rename frontend catalog ids to match backend ids and keep premium displayName for luxury branding; remove BACKEND_ID_MAP.
2) Alternative: keep premium frontend ids but require backend to emit a canonical `giftTypeId` field on all relevant events and documents, and formalize an alias list in the contract.

### P0 - Backend `gift_animation` event payload still lacks explicit `giftTypeId` vs `giftSentId` clarity

- Current schema requires `giftId` and `gift.id` (gift type id nested).
- Current implementation sets `giftId = giftSent.id` (a “gift sent record id”), which frontends naturally misread as “gift type id”.

Owner: Codex / backend

File(s) to change:
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\socketio\v1\server-to-client\gift_animation.schema.json`
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\sparkEngine.js`

Suggested contract-friendly fix:
- Keep `giftId` for backward compatibility, but add:
  - `giftSentId` (string) = current `giftId` value
  - `giftTypeId` (string) = `gift.id`
- Deprecate `giftId` in docs once the frontend no longer depends on it.

## 2026 luxury standard gate (next milestone)

To credibly claim “2026 premium live room,” the next milestone should hit:

- **Contract alignment**: frontend consumes Socket.io named events and payloads directly from backend JSON schemas (no ad-hoc envelopes).
- **No-provider-calls in browser**: all AI/game-question behavior must be backend-owned and mockable locally.
- **Dignified reduced-motion mode**: when `prefers-reduced-motion`, gifts should still feel premium (subtle banner + typography + glow), not “disabled.”
- **Spectacle safety**: cap flashes/strobes and enforce comfort defaults (no harsh white full-screen cuts, no seizure-risk patterns).

## Next actions (owners)

- Claude/frontend (P0): remove provider call in `frontend/src/App.jsx`; switch gift event transport to `socket.io-client` and consume backend payload shapes; eliminate `BACKEND_ID_MAP` by canonicalizing gift ids.
- Codex/backend (P0): add explicit `giftSentId` + `giftTypeId` to `gift_animation` schema + payload builder to avoid integration confusion.
- Hermes/docs (P1): extend the existing gift spectacle QA checklist with “flash/reduced-motion safety rules” and “caption readability in full-screen” scenarios.

