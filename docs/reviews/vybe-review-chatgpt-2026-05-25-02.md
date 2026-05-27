# VYBE Review: ChatGPT - CSRF/Auth + Gift Spectacle Polish + Copy Risk Audit

Date: 2026-05-25
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees / heads:
- Codex/backend: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy` (`backend/csrf-protection`, `1db9d88`)
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend` (`frontend/gift-spectacle-runtime`, `4df948b`)
- Review worktree: `C:\Users\Damon\Downloads\vybe-project\vybe-chatgpt-review`

## Executive verdict

Backend (CSRF refresh/logout): PASS.
- Good direction for cookie-auth hardening: explicit CSRF issuance endpoint + double-submit enforcement + test coverage + contract doc update.

Frontend (gift runtime polish): PARTIAL PASS (accessibility) / OVERALL FAIL (policy + integration + copy risk).
- Reduced-motion handling is the right "luxury accessibility" move, but the frontend still violates the no-raw-provider rule and the gift spectacle is not yet wired to backend socket/event contracts.

## What improved (credit where due)

### Backend: CSRF for refresh/logout (Codex)
Positive:
- Clean separation of concerns (`backend/middleware/csrf.js`) and explicit `GET /api/auth/csrf` contract in `docs/BACKEND_API_CONTRACTS.md`.
- `requireCsrf` applied to `POST /api/auth/refresh` and `POST /api/auth/logout`.
- A real regression test exists (`backend/tests/authCsrf.test.js`) exercising missing-header failures and happy-path.

Luxury expectation gap to address next (non-blocking, but important):
- Frontend integration needs an explicit "auth bootstrap" step: call `GET /api/auth/csrf` and then attach `x-vybe-csrf` for refresh/logout calls (with `credentials: "include"` in browser fetch).
- Consider documenting the "cookie + credentialed fetch" requirement more explicitly for browsers (CORS + credentials + SameSite behavior).

### Frontend: Reduced-motion polish (Claude)
Positive:
- Gift spectacle respects `prefers-reduced-motion` via `frontend/src/gifts/useReducedMotion.js`.
- High-tier overlays skip particle bursts and slide/enter animations in reduced-motion mode.
- This is aligned with 2026 expectations: accessibility is a core "premium" signal.

## Critical blockers (must-fix)

### 1) Raw provider API call from the browser (policy violation) - still present

Found:
- `frontend/src/App.jsx` contains `genQs()` calling `https://api.anthropic.com/v1/messages` directly.

Why this is a blocker:
- Violates VYBE operating rules (no raw provider APIs from browser; no paid/provider calls in this phase).
- Implies client-side secrets, which is disallowed.

Required next action (Owner: Claude / frontend):
- Remove/disable the browser provider call and switch to backend-safe endpoint:
  - `POST /api/games/questions` (Codex already documents this contract).
- Wire a single `questionsProvider = "local"` path until Damon explicitly approves provider access.

Files to change (Claude):
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend/src/App.jsx`

### 2) Gift spectacle still not integrated with backend events/contracts

Current state:
- App triggers gifts via local demo state (`fireDemoGift()` and `<button>Send Demo Gift</button>`).
- No evidence of Socket.IO/WebSocket client wiring in `frontend/src/**` to consume backend events.

Why this matters for the "first vertical slice":
- The platform's "this is real" moment is: backend gift send -> socket event(s) -> frontend spectacle + platform banner + storm.

Required next action (Owner: Claude / frontend; contract coordination with Codex / backend):
- Add a minimal socket client that listens for the backend's existing events:
  - `gift_animation`
  - `platform_banner`
  - `spark_storm_start` / `spark_storm_update` / `spark_storm_complete`
- Route those payloads into the existing React spectacle shell instead of local-only demo events.

Files to change (Claude):
- Likely new file(s): `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend/src/lib/socketClient.(js|ts)`
- Likely update: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend/src/App.jsx`

Files to confirm/adjust (Codex):
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs/BACKEND_API_CONTRACTS.md` (ensure event payload shapes are explicit enough for Claude)

## Copy / trust risks (high priority, not a "code policy" blocker)

The frontend currently asserts vendor + legal/compliance states that are not yet implemented/verified:
- "Powered by Yoti - zero-knowledge, we never see your ID."
- "18 USC 2257 Compliant" (and multiple 2257 links/mentions)
- "CCBill/Segpay" named in footer

Luxury UX principle:
- Premium brands do not over-claim. Overconfident compliance copy reads as low-trust.

Required next action (Owner: Claude / frontend):
- Convert compliance/vendor mentions to neutral placeholders until real flows exist.
  - Example direction (not literal copy): "Age verification will be required before viewing streams." / "Compliance links coming soon."
- Keep the aesthetic, but remove claims that can't be substantiated in the demo.

Files to change (Claude):
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend/src/App.jsx`

## 3D / spectacle architecture: next standards gate (forward-looking)

The current "gift effect catalog = pure data contract" is the right foundation. Next step should preserve that while upgrading the renderer.

Standards gate for the next milestone (Owner: Claude / frontend, with review from ChatGPT):
- Maintain an effect DSL that can target multiple renderers:
  - `dom-css` (fallback / low-tier)
  - `webgl` or `webgpu` (high-tier "cinematic")
- Define budgets explicitly per tier:
  - mobile mid-tier: low CPU main-thread, predictable frame time, limited particles
  - high-tier: GPU-first, shader-driven, deterministic durations
- Authoring pipeline expectation:
  - glTF/GLB for 3D props + a JSON timeline/effect config
  - no hard-coded React animations as the long-term path for premium gifts

Concrete next action request (Claude):
- Propose a "renderer interface" for gifts (no implementation required yet), then implement one high-tier effect in WebGL/WebGPU behind a feature flag.

