# VYBE Review: ChatGPT (2026-05-26 #09)

Timestamp (America/Chicago): 2026-05-26 05:53

## Executive Summary

Overall: **Fail (P0 blockers remain)** — the direction is strong (contracts + gift runtime), but the vertical-slice “demoable live room” is not yet integration-safe because:

- Frontend still calls Anthropic directly and generates adult trivia client-side.
- Frontend gift socket client still speaks a raw `WebSocket` `{type,payload}` protocol that doesn’t match the backend’s Socket.io contract.
- Backend contract work is still on feature branches, not merged to `main`.

## What I reviewed this pass

No new commits since the last review pass (2026-05-26 #08) on either lane:

- Codex/backend: still at `backend/contracts-baseline-into-main` (HEAD `23df0fc`).
- Claude/frontend: still at `frontend/gift-spectacle-runtime` (HEAD `c6e4e5e`).

This pass adds a **forward-looking standards gate** for the next milestone, plus concrete file-level next actions.

---

## P0 Blockers (must fix before calling the slice “real”)

### Claude (frontend) — remove raw provider calls

- **Finding:** Direct Anthropic call in the browser.
- **Where:** `frontend/src/App.jsx` around line 185–188 (`genQs()` fetches `https://api.anthropic.com/v1/messages`).
- **Why this is a P0:** Violates “no raw provider APIs from browser” and makes demo non-deterministic + privacy/compliance risky.

**Required action (Claude):**
- Replace `genQs()` with a backend call (local deterministic) to `/api/games/questions` (or equivalent) and keep a local fallback list.
- Delete any provider-key / provider-endpoint usage from frontend codepaths.

### Claude (frontend) — align realtime contract (Socket.io)

- **Finding:** Gift realtime uses `new WebSocket(ws://.../room/:roomId)` and parses `{ type, payload }`.
- **Where:** `frontend/src/gifts/useGiftSocket.js` lines ~62–116.
- **Why this is a P0:** Backend contract is Socket.io + named events with JSON-schema payloads (`backend/contracts/socketio/v1/**`). Current frontend cannot be validated against those contracts.

**Required action (Claude):**
- Migrate to `socket.io-client` and use **named events** (`gift_animation`, `platform_banner`, `spark_storm_*`, etc.).
- Remove `{type,payload}` multiplexing.

### Codex (backend) — merge contracts to `main`

- **Finding:** Contract baseline is still off-main.
- **Where:** `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy` current branch `backend/contracts-baseline-into-main`.
- **Why this is a P0:** Claude cannot safely integrate against contracts until they’re canonical on `main`.

**Required action (Codex):**
- Open PR from `backend/contracts-baseline-into-main` (or whatever consolidated branch) → `main` with:
  - `backend/contracts/**`
  - runtime contract tests (`backend/tests/*Contract*.test.js`)
  - `docs/BACKEND_API_CONTRACTS.md`

---

## P1 Quality / “Luxury” Gaps (should fix next)

### Copy & compliance-risk language (Claude)

- **High-risk copy claim:** “Age verification required by federal and state law” and “zero-knowledge, we never see your ID.”
- **Where:** `frontend/src/App.jsx` Age verify UI around lines ~218–226.

**Recommendation:**
- Replace with softer, defensible language until legal/product confirms specifics (e.g., “Age verification required to access adult content. We don’t store your ID.”).

### Canonical casing decision (Codex + Claude)

- **Finding:** Socket.io JSON schemas accept both `snake_case` and `camelCase` for required fields using `anyOf`.
- **Where:** `backend/contracts/socketio/v1/client-to-server/send_gift.schema.json` lines ~16–18; join/leave schemas similar.

**Recommendation:**
- Pick one canonical casing (prefer `snake_case` end-to-end if DB-centric, or `camelCase` end-to-end if JS-first) and document a deprecation window. Supporting both forever makes “contract tests” weaker.

### AsyncAPI semantics clarity (Codex)

- **Finding:** `asyncapi.yaml` uses `subscribe` for client-to-server events (`join_room`, `leave_room`, `send_gift`) while descriptions read from a client POV.
- **Where:** `backend/contracts/asyncapi.yaml` channels section.

**Recommendation:**
- Either explicitly define the “application” as the backend server (so `subscribe` is correct), or flip narrative to avoid ambiguity.

---

## Standards Gate: Next Milestone (“Demoable Live Room”)

Pass this gate before declaring the first vertical slice complete:

1. **No raw provider calls** in frontend; games/questions come from backend only; deterministic dev mode.
2. **Contracts are on `main`** and `npm run check` passes in backend.
3. **Realtime uses Socket.io named events** + payloads match JSON schemas.
4. **Gift spectacle performance budget** documented (mobile baseline):
   - target 60fps on modern iPhone/Android; effects degrade gracefully.
   - hard cap on particles / draw calls; pause on background tab.
5. **Luxury microcopy pass** for: age-gate, gifting, request accept/decline, and live controls (captions/fullscreen).
6. **Consent-safe content rules**: no “explicit” generation prompts in client; backend filters + curated prompt packs.

---

## Concrete Next Actions (by owner)

### Claude (frontend)

- Edit: `frontend/src/App.jsx` — remove `fetch("https://api.anthropic.com/v1/messages"...)` and route questions through backend.
- Edit: `frontend/src/gifts/useGiftSocket.js` — migrate from raw `WebSocket` to `socket.io-client` named events.
- Edit: `frontend/src/App.jsx` Age verify microcopy — remove hard legal claims.

### Codex (backend)

- PR: merge `backend/contracts/**` + contract runtime tests into `main`.
- Edit: `backend/contracts/socketio/v1/**` — pick canonical casing; update docs + tests accordingly.
- Edit: `backend/contracts/asyncapi.yaml` — clarify POV/semantics.

### Hermes (research/QA)

- Add checklist section to QA doc: gate items (provider calls, contracts-on-main, socket.io event alignment) once the above changes land.

