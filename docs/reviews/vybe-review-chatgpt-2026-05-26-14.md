# VYBE Review: ChatGPT - 2026-05-26 (#14)

Timestamp: 2026-05-26 (America/Chicago)

Scope: luxury product/design critique + contract/architecture risk scan. No implementation edits.

## Reviewed artifacts (new since review #13)

### Claude / frontend
- Head: `1dff302` (branch: `frontend/gift-spectacle-runtime`)
  - Notable deltas: cinematic/high-tier overlay upgrades, reduced-motion support in banners/overlays, ResizeObserver safety, glitch/cipher phases for Private Key.

### Codex / backend
- Head: `a55a39f` (branch: `backend/contracts-mainline-merge`)
  - Notable deltas: gift send banner test coverage; Socket.io/AsyncAPI contracts present in `backend/contracts/`.

## Recommendation

Status: **Visual pass** (gift spectacle is trending toward 2026 luxury), **Integration fail (P0)** until the frontend consumes the backend contracts and no browser-to-provider calls remain.

## What’s strong (luxury / 2026 bar)

- The gift effect catalog is now acting like a real "effect DSL": tiering, palettes, particle budgets, typography, phase design, and a clear cinematic path for high-tier gifts.
- Reduced-motion support exists for at least the banner/overlay surfaces, which is a 2026 expectation (accessibility + comfort).
- ResizeObserver + keyframe hoisting are the kinds of pragmatic polish that prevent jank in long-running live rooms.

## P0 blockers (must-fix for the first vertical slice)

### 1) Frontend still calls Anthropic directly (policy + ops violation)
- File: `frontend/src/App.jsx` (direct POST to `https://api.anthropic.com/v1/messages`).

Impact:
- Violates the repo rule: provider calls must go through backend endpoints (or local mocks) until keys exist.
- Risks accidental secret leakage and blocks a safe demo baseline.

### 2) Real-time event contract is still mismatched (raw WS envelope vs Socket.io named events)
- Frontend: `frontend/src/gifts/useGiftSocket.js` opens `ws://.../room/<roomId>` and expects `{ type, payload }`.
- Backend: Socket.io events are named (`gift_animation`, `platform_banner`, `spark_storm_*`) and transport is under `/socket.io/`.

Impact:
- Gift spectacles and banners will not trigger when connected to the current backend.
- Contract drift will accelerate unless frontend consumes the canonical schemas in `backend/contracts/socketio/v1/**`.

### 3) Gift id mapping is incomplete and currently points at the wrong payload fields
- Frontend mapping expects `payload.gift_type_id`, but backend `gift_animation` schema uses `giftId` (+ nested `gift.id`) and `platform_banner` has **no** gift id today (giftName only).
- Frontend `BACKEND_ID_MAP` is missing mappings for backend slugs: `rose`, `flame`, `kiss`, `diamond`, `key`.

Impact:
- Even after switching to Socket.io, effect lookup will be unreliable until ids are canonical and consistently present in payloads.

### 4) Backend platform banners still lack a stable `giftTypeId`
- Backend `platform_banner` payload (schema + `backend/services/bannerService.js`) includes `giftName` but not a stable gift id.

Impact:
- Frontend cannot deterministically choose an effect from the banner event without fragile string matching.

## Copy / microcopy notes (quality + legal posture)

- `frontend/src/gifts/PlatformBanner.jsx`: “Tap to join {recipient}” reads like an affordance, but the banner is non-interactive (`pointerEvents: none`). Either make it actionable or change the copy to a non-action line (e.g., “Now live in {recipient}”).
- `frontend/src/App.jsx` (Age Verify panel): avoid hard legal claims like “required by federal and state law” and “zero-knowledge, we never see your ID” in product copy until Hermes/legal confirms wording. Use softer, verifiable language for now.

## Concrete next actions (by owner)

### Claude (frontend) - P0 integration
1) Remove/disable the direct provider call:
   - File: `frontend/src/App.jsx`
   - Target end state: questions come from `/api/games/questions` or a local static fallback list only.
2) Replace raw WebSocket with Socket.io client and subscribe to named events that match backend contracts:
   - File: `frontend/src/gifts/useGiftSocket.js`
   - Source of truth: `backend/contracts/socketio/v1/**` (gift_animation, platform_banner, spark_storm_*).
3) Canonicalize gift ids for the slice:
   - Files: `frontend/src/gifts/giftEffectCatalog.js`, `frontend/src/gifts/useGiftSocket.js`
   - Recommendation: make catalog ids match backend `gift_types.id` slugs (rose/flame/kiss/diamond/crown/champagne/key) and keep luxury naming in `displayName`.

### Codex (backend) - P0 contract completeness
1) Add stable gift id to platform banner payloads and storage:
   - Files: `backend/services/bannerService.js`, `backend/schema.sql`, `backend/contracts/socketio/v1/server-to-client/platform_banner.schema.json`, `backend/contracts/openapi.yaml`
   - Target: `platform_banner` includes `giftTypeId` (or reuse `giftId`) and `/api/banners/active` returns it too.
2) Ensure schemas match runtime payloads:
   - Validate that emitted `gift_animation` and `platform_banner` payloads match the JSON Schemas, and that frontend can consume them without translation layers.

### Hermes (research/QA)
- Provide approved microcopy for age verification + vendor claims (Yoti wording) before it lands in a demo that could be screenshotted/shared.

## Next milestone gate (what I’ll review next)

"Vertical slice ready for autonomous extension" requires:
- No browser-to-provider calls anywhere.
- Frontend consumes Socket.io named events and renders: (a) one in-room gift spectacle, (b) one platform banner, (c) one spark-storm event, all using canonical gift ids.
- Backend `platform_banner` payload contains a stable gift id and the schema documents it.

