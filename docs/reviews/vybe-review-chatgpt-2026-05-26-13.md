# VYBE Review: ChatGPT — 2026-05-26 (#13)

Timestamp: 2026-05-26 (America/Chicago)

Scope: luxury product/design critique + contract/architecture risk scan. No implementation edits.

## Reviewed artifacts (new since review #12)

### Codex / backend
- Commit: `0390a96` (branch: `backend/gift-send-banner-tests`)
  - Added: `backend/tests/giftSendBanner.test.js`

No new Claude/frontend commits detected since #12 (frontend head still `f152203`).

## Recommendation

Status: **Conditional pass** (quality improving), **but P0 integration blockers remain** and should be treated as demo-stoppers for the “first vertical slice”.

## What’s strong

- Backend is converging on test-backed, demo-friendly primitives:
  - Gift send returns `giftSent`, `animation`, and `banner` in a single response.
  - New banner tests cover the “no banner” vs “platform banner” outcomes and validate `/api/banners/active`.
- Frontend gift catalog is trending the right direction with designer-editable effect definitions (a proto effect DSL) in `frontend/src/gifts/giftEffectCatalog.js`.

## P0 gaps (must-fix before the slice is “real enough”)

### 1) Gift IDs are drifting across backend ⇄ frontend

Backend seed IDs (current) appear to be short slugs:
- `rose`, `flame`, `kiss`, `diamond`, `crown`, `champagne`, `key` (see `backend/schema.sql`)

Frontend catalog IDs are different:
- `neon_rose`, `fire_shot`, `velvet_kiss`, `diamond_rain`, `crown_drop`, `champagne_pour`, `private_key` (see `frontend/src/gifts/giftEffectCatalog.js`)

Impact:
- Contract-level mismatch breaks effect lookup and makes “gift → spectacle” unreliable.
- The current `frontend/src/gifts/useGiftSocket.js` mapping is incomplete relative to backend IDs (ex: `kiss`, `flame`, `key`) and will cause silent drops.

### 2) WebSocket/event contract mismatch (raw WS vs Socket.io named events)

Backend emits Socket.io events named:
- `gift_animation`, `platform_banner`, plus `spark_storm_*` typed events (see `backend/routes/gifts.js`, `backend/sockets/giftHandler.js`)

Frontend listens with a raw `WebSocket` expecting `{ type, payload }` envelopes:
- `frontend/src/gifts/useGiftSocket.js`

Impact:
- Real-time gift spectacle will not trigger consistently (or at all) when pointed at the current backend.
- This is also a maintainability hazard: two parallel “event styles” will keep diverging.

### 3) Browser is still calling Anthropic directly (policy + ops violation)

- `frontend/src/App.jsx` contains a direct call to `https://api.anthropic.com/v1/messages`.

Impact:
- Violates the repo rule: “AI provider calls must run through backend endpoints, not directly from browser code.”
- Breaks “no secrets”/Damon-gated key policy and risks accidental leakage.

## Architecture / luxury standard notes (2026 expectations)

### Effect system direction is correct, but it needs a “runtime contract”

The effect catalog is an excellent start (phases, budgets, palette, typography). To meet a 2026 luxury bar, the next milestone should formalize:
- A stable **Gift Effect Runtime Contract** (inputs: gift id + tier + sender/performer + timing; outputs: deterministic effect playbook).
- A renderer strategy for high-tier gifts:
  - Canvas2D is fine for low/mid tier and fallback, but cinematic gifts should have an explicit path toward WebGL2/WebGPU (even if stubbed today).
  - Performance budgets should be expressed in the catalog (mobile caps, max particles, max overdraw) and enforced in runtime.

### Microcopy (quick wins)

- Replace generic calls-to-action like “Tap to join her room” with performer-specific intent:
  - “Tap to join Luna live” / “Join Luna Voss” (and ensure it’s only shown when the action is real).
- Keep spark formatting consistent:
  - Always render as “2,500 Sparks” or “2,500 sparks” consistently across surfaces.

## Concrete next actions (by owner)

### Claude (frontend)
1) Remove the direct Anthropic call and route questions through backend or local mocks:
   - File: `frontend/src/App.jsx`
   - Expected end state: browser never calls provider URLs; use `/api/games/questions` (or a local mock list) until keys exist.
2) Align gift IDs with backend contract (pick one canonical source of truth and conform to it):
   - Files: `frontend/src/gifts/giftEffectCatalog.js`, `frontend/src/gifts/useGiftSocket.js`
   - Recommendation: treat backend `gift_types.id` slugs as canonical for the slice; keep “luxury names” as `displayName`.
3) Replace raw `WebSocket` client with Socket.io client and subscribe to named events:
   - File: `frontend/src/gifts/useGiftSocket.js`
   - Target events: `gift_animation`, `platform_banner`, `spark_storm_start|update|complete`.

### Codex (backend)
1) Add `giftTypeId` (or equivalent stable id) into `platform_banner` payloads:
   - Files: `backend/services/bannerService.js` (normalize + stored payload), and any API/socket emitters.
   - Rationale: frontend must be able to choose an effect by id without string-matching `giftName`.
2) Publish/merge a single canonical “event contract” (docs + tests) for:
   - `gift_animation` payload shape (currently `giftAnimationPayload`)
   - `platform_banner` payload shape
   - `spark_storm_*` payload shapes

### Hermes (research/QA)
- No new artifacts to review this pass.

## Next milestone gate (what I’ll review next)

“Vertical slice ready for autonomous extension” means:
- Frontend consumes Socket.io named events end-to-end and shows at least one gift spectacle + one platform banner using canonical ids.
- Backend publishes a single contract doc (OpenAPI + a short WS event schema doc) that matches what the frontend consumes.
- No browser-to-provider calls remain in the repo.

