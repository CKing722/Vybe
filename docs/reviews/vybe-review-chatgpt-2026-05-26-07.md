# VYBE Review: ChatGPT - 2026-05-26 (Pass 07)

Date: 2026-05-26  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review pass considered complete for queue purposes: `docs/reviews/vybe-review-chatgpt-2026-05-26-06.md`.
- New unreviewed artifact found: **Claude/frontend** commit `c6e4e5e` (ParticleBurst stability).
- No new backend commits found since last pass (still `main` @ `41edcf0`).

## Current heads

### Claude (frontend)

- Worktree: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
- Branch / head: `frontend/gift-spectacle-runtime` @ `c6e4e5e`

### Codex (backend)

- Worktree: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Branch / head: `main` @ `41edcf0`

## Executive call (demo readiness)

- Status: **FAIL (unchanged)**.
- Reason: the vertical slice is still not "real enough to extend safely" while these P0 blockers remain:
  1) browser makes a direct paid-provider call (`https://api.anthropic.com/v1/messages`) and
  2) frontend socket transport/payload assumptions drift from backend runtime/contract (raw WS vs Socket.io + named events).

## Review: `c6e4e5e` (ParticleBurst stability)

### What improved

- ✅ Fix is correct and high-impact: memoizing particle position generation prevents mid-animation snapping across phase transitions.
- ✅ React render hygiene: moving randomness out of render avoids jank and visual discontinuities.

### Remaining risks / next polish (P1)

- P1: Consider **seeded randomness** (e.g., seeded by `giftSentId`) so a gift effect is deterministic per event. This helps replay/debug, reduces "why did it look different" reports, and matches premium 2026 expectations.
- P1: `useMemo` deps are currently keyed to `(count, spread, maxRadius)`; that’s fine for stability, but note that changing other budget fields later will not regenerate particles unless added.

Owner: Claude / frontend  
File touched: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\GiftSpectacleOverlay.jsx`

## P0 gate (still blocking)

### P0 — Remove raw paid-provider calls from the browser

- Still present: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` (function `genQs`, line ~187).
- Required direction (no secrets/no spend): route through backend `POST /api/games/questions` (mock/local only) or remove generation entirely and use local demo fixtures.

Owner: Claude / frontend  
File to change: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

### P0 — Socket transport + event contract alignment

- Still present: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\useGiftSocket.js` uses raw `WebSocket` and `{type,payload}` message envelopes.
- Required direction: use `socket.io-client`, authenticate via `handshake.auth.token`, emit `join_room`, and subscribe to named server events (once contracts are canonical on `main`).

Owner: Claude / frontend  
File to change: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\useGiftSocket.js`

### P0 — Make machine-readable contracts canonical on `main`

- Still blocked: backend `main` does not include `backend/contracts/**` (contract truth is still off-main).

Owner: Codex / backend  
Files (target state on `main`):
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\**`

## Next artifacts to review

- Claude: provider call removed from `App.jsx` + socket migrated to Socket.io client.
- Codex: PR landing `backend/contracts/**` onto `main` + runtime/schema validation coverage.
