# VYBE Review: ChatGPT — Backend Integration Baseline (Auth Hardening) + Contract Gaps

Date: 2026-05-25  
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees / heads (as found on disk):
- Codex/backend: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
  - Branch: `backend/integration-baseline`
  - Head: `41edcf0` (2026-05-25 04:41 -05:00)
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
  - Branch: `frontend/gift-spectacle-runtime`
  - Head: `7d971a8` (2026-05-25 04:02 -05:00) — unchanged since prior review

## Executive verdict

Backend: PASS for security-direction and demo-friendly auth mechanics, but FAIL for “frontend-ready realtime contract clarity”.

Why FAIL:
- Socket event payloads are named but still not documented with concrete JSON examples.
- Spec drift persists: `PUT /api/me/profile` is listed in `docs/BACKEND_SPEC.md` but not implemented on the current backend head (and not in `docs/BACKEND_API_CONTRACTS.md`).
- Gift/effect mapping is still underspecified (backend returns `gift.id` + `animationType`, frontend runtime uses different effect ids).

Frontend P0s remain unchanged (see prior notes): raw browser provider call, compliance/vendor/payment overclaims, and missing socket client wiring.

## What changed (Codex/backend) — meaningful progress

### 1) Refresh token rotation + CSRF for cookie-auth endpoints (good baseline)

Docs updated:
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

Notable improvements:
- `GET /api/auth/csrf` issues a CSRF token/cookie and tells the client which header to echo (`x-vybe-csrf`).
- `POST /api/auth/refresh` rotates refresh tokens and requires CSRF (cookie-auth).
- `POST /api/auth/logout` requires CSRF and clears refresh + CSRF cookies.

Luxury/2026 expectation check:
- This is the right “adult” direction for a premium web app: short-lived access tokens, silent refresh, and refresh rotation.

Watch-outs to document (Owner: Codex):
- Refresh rotation state is currently in-memory (single-instance / resets on restart). That’s fine for demo, but the docs should say so explicitly to avoid surprise.

### 2) 2FA (TOTP) scaffold (good, but keep it clearly “scaffold”)

Docs added:
- `POST /api/auth/2fa/setup`
- `POST /api/auth/2fa/verify`

Product note:
- Returning the raw TOTP secret is acceptable for a dev/demo scaffold, but should be treated as temporary (QR-only UX later).

### 3) Viewer-performer history endpoint now has an actual service contract shape

Backend now provides:
- `GET /api/me/history/:performerId` returning `{ performer, summary, gifts }` (code-level shape is solid).

Gap:
- `docs/BACKEND_API_CONTRACTS.md` still lacks a concrete JSON response example for the endpoint (it’s now important because Claude’s “Your History” UI will want consistent fields/casing).

### 4) Backend explicitly documents “no raw provider calls” stance for questions (strong alignment)

Docs now correctly position:
- `POST /api/games/questions` as the frontend-safe replacement for direct browser AI calls, using local/no-cost questions under the current no-API rule.

This should unblock Claude removing the raw `fetch("https://api.anthropic.com/v1/messages" …)` call from the frontend.

## Remaining blockers / gaps (concrete next actions)

### P0 — Realtime contract clarity (Owner: Codex/backend; docs-only change required)

Update:
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

Add explicit JSON payload examples for:
- `POST /api/gifts/send` full response (`giftSent`, `balance`, `animation`, `banner`).
- Socket events (payloads as actually emitted):
  - `gift_animation` (matches `backend/services/sparkEngine.js` `giftAnimationPayload`)
  - `platform_banner` (matches `backend/services/bannerService.js` normalized banner)
  - `spark_storm_start`, `spark_storm_update`, `spark_storm_complete` (matches `backend/services/stormService.js`)

Rationale:
- Claude cannot responsibly wire a luxury realtime loop without “copy/pasteable” contract examples; guessing payloads produces brittle UI and demo-only hacks.

### P0 — Gift id / effect id mapping must become deterministic (Owner: Codex + Claude)

Minimum-break path:
- Codex: add `effectId` (or a canonical mapping field) to `GET /api/gifts/types` and include it in `gift_animation` payloads.
- Claude: consume backend-provided `effectId` (preferred) or switch runtime to use the backend’s canonical `gift.id` as the effect key.

Scope targets:
- Codex: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\giftCatalog.js` + `docs/BACKEND_API_CONTRACTS.md`
- Claude: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\*` + `frontend\src\App.jsx`

### P1 — Spec drift: `PUT /api/me/profile` inconsistency (Owner: Codex/backend)

Currently:
- Listed in: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_SPEC.md`
- Not implemented on current backend head (no route for update in `backend/routes/users.js`).

Pick one and make the whole repo consistent:
- Option A: Reintroduce `PUT /api/me/profile` (and document it in `docs/BACKEND_API_CONTRACTS.md`).
- Option B: Explicitly defer/remove it from `docs/BACKEND_SPEC.md` until it’s back on the active branch.

### P0 (unchanged) — Frontend policy + trust copy + sockets (Owner: Claude/frontend)

Required edits (same as prior review; still present in `frontend/src/App.jsx`):
- Remove raw browser provider fetch and call backend `POST /api/games/questions` instead.
- Neutralize legal/compliance/vendor/payment claims into demo-safe placeholders.
- Add socket client wiring and drive spectacle from backend payloads once examples exist.

## Next milestone “standards gate” (real-time gift loop)

Call this milestone PASS only if all are true:
1) No raw provider calls in browser code (questions flow goes through backend).
2) Demo-safe trust copy (no vendor/compliance/payment claims presented as fact).
3) Frontend consumes backend realtime events (`gift_animation`, `platform_banner`, storm events).
4) Gift→effect mapping is deterministic (backend supplies `effectId` or a single canonical id is shared).

