# VYBE — Review: ChatGPT (2026-05-27 pass 01)

Scope reviewed:
- Claude/frontend worktree `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend` @ `caa86af`
- Codex/backend worktree `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy` @ `69edfa7`
- Prior ChatGPT review baseline: `docs/reviews/vybe-review-chatgpt-2026-05-26-15.md`

## Executive result

**FAIL (integration + compliance + no-spend).** The gift spectacle look/feel is trending luxury, but the current vertical slice still violates the no-raw-provider rule, and the frontend/backend realtime contract is not just “slightly different” — it is fundamentally incompatible (Socket.io named events vs frontend raw WebSocket `{type,payload}` parsing). Compliance copy also makes claims that cannot be safely asserted.

## P0 — Must fix before calling the slice “demoable”

### 1) No-spend / provider policy breach in frontend

Evidence:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` contains a direct browser call to `https://api.anthropic.com/v1/messages`.

Why this is a blocker:
- The repo standard explicitly disallows raw provider calls from browser code for this stage. The backend already documents a safe replacement endpoint (`POST /api/games/questions`) meant to be local/no-cost.

Owner + exact fix surface:
- **Claude/frontend**: remove the provider fetch from `frontend/src/App.jsx` and route question generation through `http://localhost:4000/api/games/questions` with an offline fallback.
- **Codex/backend** (optional hardening): ensure `/api/games/questions` stays provider-disabled and returns stable local questions for the demo path.

### 2) Realtime contract mismatch (currently non-functional)

What backend actually does:
- Socket.io server emits named events:
  - `gift_animation` with payload from `backend/services/sparkEngine.js::giftAnimationPayload` (camelCase fields like `senderName`, `durationMs`, and nested `gift` containing `gift.id` as the gift type id).
  - `platform_banner` with payload from `backend/services/bannerService.js::normalizeBanner` (camelCase fields like `senderName`, `giftName`, no `giftTypeId`).
- Room membership is via Socket.io `join_room` / `leave_room` events (see `backend/sockets/index.js`).

What frontend currently expects:
- `frontend/src/gifts/useGiftSocket.js` opens a raw WebSocket to `/room/<roomId>` and expects each message to be JSON shaped as `{ type, payload }` with snake_case fields like `payload.gift_type_id` and `payload.sender_name`.

Owner + exact fix surface:
- **Claude/frontend**: replace `frontend/src/gifts/useGiftSocket.js` with `socket.io-client` and handle Socket.io named events (`gift_animation`, `platform_banner`, `spark_storm_*`), using the backend’s *actual* payload shape.
- **Codex/backend**: publish an explicit “Socket.io v1” event schema doc (or JSON schema) that matches the current code. `docs/BACKEND_SPEC.md` appears stale/conflicting versus live payloads.

### 3) Gift id namespace drift (guaranteed broken mapping)

Back end canonical gift type ids:
- `rose | flame | kiss | diamond | crown | champagne | key` (see `backend/services/giftCatalog.js`).

Front end effect catalog ids:
- `neon_rose | fire_shot | velvet_kiss | diamond_rain | crown_drop | champagne_pour | private_key` (see `frontend/src/gifts/giftEffectCatalog.js`).

Immediate consequence:
- Even with Socket.io fixed, gifts won’t resolve to effects because ids do not match and the mapping in `useGiftSocket.js` does not map backend ids like `rose` → `neon_rose`.

Owner + exact fix surface:
- **Claude/frontend**: make backend ids canonical in `frontend/src/gifts/giftEffectCatalog.js` (keep luxury naming in `displayName`) OR introduce a single authoritative mapping layer shared by banner + animation + sendGift UI.
- **Codex/backend**: include the canonical id (`giftTypeId`) everywhere the frontend needs to pick visuals (especially `platform_banner`).

## P0 — Compliance copy is unsafe/misleading

Evidence:
- `frontend/src/App.jsx` Age verification modal copy:
  - “Age verification required by federal and state law. Powered by Yoti — zero-knowledge, we never see your ID.”
  - “VYBE never sees your personal information.”

Why this is a blocker:
- Those are strong legal/technical claims and are not safely assertable in a preview environment (and may be jurisdictionally false). They also create trust risk if the integration later differs.

Owner + exact fix surface:
- **Claude/frontend**: replace AgeV copy in `frontend/src/App.jsx` with conservative, verifiable language (e.g., “Age verification is required to enter. Verification integration is pre-launch work; this is a preview flow.”) and remove vendor/vendor-tech assertions unless the integration and legal review exist.
- **Hermes/docs**: provide “approved screenshot-safe” age verification microcopy variants aligned with `docs/research/vybe-gho-003-live-video-compliance.md`.

## P1 — Product/UX expectation gaps (luxury bar)

### Platform banner CTA is currently false

Evidence:
- `frontend/src/gifts/PlatformBanner.jsx` renders “Tap to join {recipient}” while `pointerEvents: "none"` makes tapping impossible.

Owner + exact fix surface:
- **Claude/frontend**: either make the banner actionable (pointer events + click opens room) or make it explicitly informational (no “Tap to join” CTA).

### Staging deploy scripts are risky for this phase

Evidence:
- `frontend/package.json` uses `vercel --prod` in `deploy:vercel`, and `deploy:staging` chains it.

Owner + exact fix surface:
- **Claude/frontend**: change staging scripts to never default to prod. (Also consider removing deploy scripts from the demo repo surface until ownership/secrets are clarified.)

## 2026 gift spectacle architecture critique (directional)

What’s good:
- `frontend/src/gifts/giftEffectCatalog.js` as designer-editable data is the right nucleus for a “VYBE effect DSL”.
- Tiering (`standard|major|cinematic`) exists on backend; it should become the shared semantic driver for spectacle budgets.

What’s missing for a “luxury 2026” bar:
- A single shared contract for: gift identity, tier, timing, and payloads across HTTP + sockets + banner surfaces.
- Performance budgets tied to device class (mobile thermals) and accessibility (reduced motion) as first-class constraints.

Next milestone gate (recommended):
1) **Contract lock**: a single “Socket.io v1” doc/schema that exactly matches code, plus a frontend adapter that consumes it.
2) **Id canon**: one canonical `giftTypeId` across backend + frontend.
3) **Spectacle budgets**: define per-tier budgets (particle count, audio layering, duration caps, GPU load) in the effect catalog; enforce in runtime.

