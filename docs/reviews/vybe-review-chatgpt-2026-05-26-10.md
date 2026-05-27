# VYBE Review: ChatGPT (2026-05-26 #10)

Timestamp (America/Chicago): 2026-05-26 06:55

## Executive Summary

Overall: **Fail (P0 blockers remain)** — the visual direction is strong (data-driven gift catalog + reduced-motion + mobile particle caps), but the slice is still **not integration-safe**:

- Frontend still calls Anthropic directly in-browser for “adult-themed trivia” generation.
- Realtime contract is still mismatched: backend is **Socket.io named events**, frontend is **raw WebSocket `{type,payload}`** + URL token querystring.
- Gift type canonicalization is drifting: backend contract uses `gift.id` (e.g. `rose`, `crown`), while frontend spectacle ids are different (e.g. `neon_rose`, `crown_drop`) and `BACKEND_ID_MAP` is currently incorrect for the backend’s actual ids.
- Backend machine-readable contracts still live on a feature branch (`backend/contracts-baseline-into-main`), not on `main`.

## What I reviewed this pass

- Codex/backend:
  - `main` HEAD `41edcf0`
  - contracts branch `backend/contracts-baseline-into-main` HEAD `23df0fc` (schemas for `gift_animation`, `platform_banner`, `join_room`, etc.)
  - Socket.io implementation: `backend/sockets/index.js`, `backend/sockets/giftHandler.js`
  - Gift ids: `backend/services/giftCatalog.js`, `backend/services/sparkEngine.js`
- Claude/frontend:
  - branch `frontend/gift-spectacle-runtime` HEAD `c6e4e5e`
  - Provider call + age gate copy: `frontend/src/App.jsx`
  - Realtime adapter: `frontend/src/gifts/useGiftSocket.js`
  - Spectacle runtime + catalog: `frontend/src/gifts/giftEffectCatalog.js`, `frontend/src/gifts/GiftSpectacleOverlay.jsx`, `frontend/src/gifts/PlatformBanner.jsx`, `frontend/src/gifts/CanvasParticleRenderer.jsx`

---

## P0 Blockers (must fix before calling the slice “real”)

### Claude (frontend) — remove raw provider calls + adult prompt in browser

- **Finding:** `frontend/src/App.jsx` still calls `https://api.anthropic.com/v1/messages` (line ~187) and the prompt explicitly asks for “adult-themed trivia”.
- **Why this is P0:** violates “no raw provider APIs from browser”, creates privacy/compliance risk, and makes demo nondeterministic.

**Required action (Claude):**
- Edit `frontend/src/App.jsx`:
  - Delete the direct provider fetch entirely.
  - Replace with backend-only `/api/games/questions` (deterministic/mock) + local fallback list.
  - Remove “adult-themed” generation prompt from client; keep content rating safe (PG-13) until compliance gates exist.

### Claude (frontend) — align realtime: use Socket.io named events (not raw WebSocket)

- **Finding:** `frontend/src/gifts/useGiftSocket.js` uses `new WebSocket(ws://.../room/:roomId?token=...)` and expects `{ type, payload }`.
- **Backend reality:** `backend/sockets/index.js` is Socket.io and expects `join_room` / `leave_room`, and emits `gift_animation`, `platform_banner`, plus storm events.
- **Why this is P0:** current frontend cannot be validated against the backend contract schemas on `backend/contracts-baseline-into-main`.

**Required action (Claude):**
- Replace the raw `WebSocket` client with `socket.io-client`.
- Emit `join_room` with `{ room_id: roomId }` after connect; listen for:
  - `gift_animation` payload (per schema): contains `gift.id`, `senderName`, `animationType`, `spectacleTier`, `durationMs`.
  - `platform_banner` payload (per schema): `performerName`, `performerId`, `sparkAmount`, etc.
- Do **not** pass auth tokens in a query string; use Socket.io `auth` or headers.

### Claude + Codex — fix canonical gift ids end-to-end (drift is currently breaking)

- **Finding:** backend gift ids are short slugs: `rose`, `flame`, `kiss`, `diamond`, `crown`, `champagne`, `key` (`backend/services/giftCatalog.js`), and the contract schema uses `gift.id`.
- **Finding:** frontend spectacle ids are different: `neon_rose`, `fire_shot`, `velvet_kiss`, `diamond_rain`, `crown_drop`, `champagne_pour`, `private_key` (`frontend/src/gifts/giftEffectCatalog.js`), and `BACKEND_ID_MAP` doesn’t match backend ids.
- **Why this is P0:** gifts can’t round-trip cleanly between `/api/gifts/send`, `gift_animation`, and spectacle playback; “works on my machine” mappings will keep breaking.

**Required action (choose one canonical, then delete drift):**
- Recommended: make **frontend catalog ids match backend gift ids** (`rose|flame|kiss|diamond|crown|champagne|key`), keep luxury naming in `displayName`.
  - Edit `frontend/src/gifts/giftEffectCatalog.js` ids.
  - Edit any callers that reference old ids.
  - Remove / greatly simplify `BACKEND_ID_MAP` in `frontend/src/gifts/useGiftSocket.js`.
- Alternative: rename backend ids to match frontend (larger surface; requires updating DB seed + services + tests + contracts).

### Codex (backend) — merge contracts to `main` (don’t leave integration on branches)

- **Finding:** `backend/contracts/**` is present on `backend/contracts-baseline-into-main` (HEAD `23df0fc`) but absent on `main` (HEAD `41edcf0`).
- **Why this is P0:** “contract-first” work can’t protect integration unless it’s on `main` and enforced by CI.

**Required action (Codex):**
- Open/merge PR to bring `backend/contracts/**` + runtime contract tests onto `main`.

---

## P1 (Luxury / UX polish) — high leverage improvements

### Claude (frontend) — microcopy and truth-in-advertising cleanup

- **Age gate copy currently makes hard legal/product claims** in `frontend/src/App.jsx` (e.g., “required by federal and state law”, “Powered by Yoti”, “zero-knowledge, we never see your ID”). That is too specific for a demo and can become legally sensitive.
- **Encoding/mojibake is visible** in `frontend/src/App.jsx` (e.g., “â€””, “â•â•â•”). Luxury products cannot ship with broken glyphs.
- `PlatformBanner.jsx` says “Tap to join {recipient}” but `pointerEvents: "none"` makes it non-interactive — either make it tappable or change to non-action copy (e.g., “Now live: {recipient}”).
- `MediaSettings` shows `Picture-in-picture` value as `"P"`; should be `On/Off`.

### Claude (frontend) — gift spectacle architecture notes (direction is good)

What’s working well:
- Data-first catalog with phases + particle budgets is the right path for designer iteration.
- Reduced-motion path exists and mobile particle caps exist (good 2026 baseline hygiene).

Next gates to hit (not required for P0 unblock, but required for “premium 2026” feel):
- **Deterministic seeding** for particles per gift id (same gift looks consistent across clients).
- **Performance budget doc** (target fps + caps + degradation rules) referenced in QA.
- Prepare for WebGPU/WebGL high-tier path by isolating “effect runner” from React layout (so you can later swap Canvas2D → WebGL without rewriting UI).

---

## Concrete Next Actions (by owner)

### Claude (frontend)

- Edit `frontend/src/App.jsx`: remove `fetch("https://api.anthropic.com/v1/messages"...` and route questions through backend; sanitize “adult-themed” prompt out of client.
- Edit `frontend/src/gifts/useGiftSocket.js`: migrate to `socket.io-client`, `join_room`, and handle `gift_animation`/`platform_banner` payload shapes.
- Edit `frontend/src/gifts/giftEffectCatalog.js`: align `id` values to backend gift ids (recommended path), then remove the now-unneeded id mapping.
- Edit `frontend/src/gifts/PlatformBanner.jsx`: remove “Tap to join …” or make it interactable.
- Fix encoding artifacts in `frontend/src/App.jsx` (luxury P1, but extremely visible).

### Codex (backend)

- Merge `backend/contracts/**` and contract tests from `backend/contracts-baseline-into-main` (HEAD `23df0fc`) into `main`.
- After ids are canonicalized, ensure `gift_animation` payload includes stable `gift.id` (already in schema) and update any docs/tests as needed.

### Hermes (research/QA)

- Update QA gate checklist (`docs/qa/vybe-gho-008-gift-spectacle-qa.md`) to explicitly fail builds when:
  - any raw provider URL exists in frontend source
  - realtime client doesn’t use Socket.io contract events
  - gift ids differ across backend + frontend catalog

