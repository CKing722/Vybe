# VYBE Review: ChatGPT (2026-05-26 #11)

Timestamp (America/Chicago): 2026-05-26 07:58

## Executive summary

Overall: **Fail (still P0 integration blockers)**. No new lane commits were detected since review #10, so this pass is a **standards + contract-alignment gate** to unblock the first vertical slice without rework.

If the goal is “demoable live room where a high-tier gift creates a platform-visible event”, the next work must make the integration contract canonical and eliminate drift (provider calls, realtime protocol mismatch, gift id mismatch).

## What changed since #10

- Claude/frontend head unchanged: `frontend/gift-spectacle-runtime` @ `c6e4e5e`.
- Codex/backend contract baseline unchanged: `backend/contracts-baseline-into-main` @ `23df0fc`.
- Codex/backend `main` unchanged: `41edcf0`.

## P0 blockers (same as #10, restated as an explicit gate)

### P0-A: No raw AI provider calls from the browser (Claude)

- Finding: `frontend/src/App.jsx` still calls `https://api.anthropic.com/v1/messages` for question generation.
- Required: replace with backend-only `/api/games/questions` in dev/demo mode (deterministic/no-spend), keep a small local fallback list if needed.

Files to change (Claude):
- `frontend/src/App.jsx` (remove provider fetch; route to backend)

### P0-B: Realtime contract must be Socket.io named events end-to-end (Claude + Codex)

- Backend reality: Socket.io events (`join_room`, `leave_room`, `send_gift`) and server emits (`gift_animation`, `platform_banner`, storm events).
- Frontend reality: raw `WebSocket` `ws://.../room/:roomId?token=...` + `{ type, payload }` multiplexing.

Required: replace the raw WebSocket client with `socket.io-client` and implement named-event handlers that match `backend/contracts/socketio/v1/**` payload shapes.

Files to change (Claude):
- `frontend/src/gifts/useGiftSocket.js` (Socket.io client; stop using `?token=...` querystring)

Files to change (Codex):
- `backend/contracts/**` must be merged to `main` so Claude has a canonical target.

### P0-C: Canonical gift ids must match across backend, contracts, and spectacle catalog (Claude + Codex)

Current backend ids: `rose|flame|kiss|diamond|crown|champagne|key` (`backend/services/giftCatalog.js`).

Current frontend catalog ids: `neon_rose|fire_shot|velvet_kiss|diamond_rain|crown_drop|champagne_pour|private_key` (`frontend/src/gifts/giftEffectCatalog.js`), plus an error-prone `BACKEND_ID_MAP` (`frontend/src/gifts/useGiftSocket.js`).

Recommended fix (min surface area): **make frontend catalog `id` exactly equal to backend gift type id**, keep “Neon Rose / Fire Shot / Crown Drop” as `displayName`, and delete the mapping layer.

Files to change (Claude):
- `frontend/src/gifts/giftEffectCatalog.js` (rename ids to backend slugs; preserve displayName)
- `frontend/src/gifts/useGiftSocket.js` (remove/simplify `BACKEND_ID_MAP`)

Files to change (Codex) only if needed:
- Keep `giftCatalog` ids as-is; update only if the team explicitly prefers “long ids” everywhere.

## P1 luxury/compliance gaps (high leverage, avoid legal landmines)

### P1-A: Remove hard legal/compliance claims from UI copy (Claude)

Examples currently in `frontend/src/App.jsx` that should not ship in a demo without counsel signoff:
- “Age verification required by federal and state law.”
- “Powered by Yoti — zero-knowledge, we never see your ID.”
- “18 USC §2257 Compliant”

Safer luxury-grade placeholder copy (recommended direction):
- Age gate: “Verify age to enter. We store verification status, not your ID.”
- Compliance: replace “2257 compliant” with “Compliance-first platform. Details coming soon.”

Files to change (Claude):
- `frontend/src/App.jsx` (age gate + compliance line items)

## 2026 gift spectacle architecture gate (forward-looking, tie to Hermes pipeline)

Hermes’ recommendation (`docs/research/vybe-gho-007-3d-gift-pipeline.md`) is directionally correct: glTF/GLB-first, WebGL baseline + WebGPU enhancement, small JSON effect DSL validated by schema.

To keep the current Canvas-driven runtime from painting VYBE into a corner, hit these gates before adding more gift types:

1. **Effect DSL versioning + schema**: every effect entry carries `schemaVersion` and validates at runtime load.
2. **Deterministic seeding**: a gift event renders identically (or intentionally close) across clients for “shared spectacle”.
3. **Renderer isolation**: an “effect runner” module owns the render loop; React only mounts/unmounts and passes events.
4. **Tiered fallback**: explicit capability tiers (CSS -> 2D canvas -> WebGL -> WebGPU) with budgets and degrade rules.
5. **Text system**: a single typographic spec for overlays/banners (case, tracking, truncation, RTL/CJK readiness).

Owner mapping:
- Claude owns implementing these gates inside `frontend/src/**`.
- Hermes owns expanding the QA checklist to assert them (no provider URLs, Socket.io events, id alignment, reduced motion).

## Concrete next actions (queue)

- Claude: implement P0-A/P0-B/P0-C; then do P1-A copy cleanup.
- Codex: merge `backend/contracts/**` + contract tests to `main` (make contracts canonical).
- Hermes: add explicit “fail if provider URL exists / fail if not Socket.io / fail if gift ids drift” checks to `docs/qa/vybe-gho-008-gift-spectacle-qa.md`.
