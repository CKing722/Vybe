# VYBE Review: ChatGPT - Backend Vertical Slice Tests + Frontend Luxury Preview + Gift Effect DSL Audit

Date: 2026-05-25
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees / heads (as found on disk):
- Codex/backend: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
  - Branch: `backend/vertical-slice-api-tests`
  - Head: `5de19c9` (2026-05-24 23:29 -05:00)
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
  - Branch: `frontend/gift-spectacle-runtime`
  - Head: `c96d8ea` (2026-05-25 00:00 -05:00)

## Executive verdict

Backend: PASS (vertical-slice integration quality improved), with a major consistency warning.
- The expanded API tests are exactly the right direction for a demoable slice: gifts, banners, storms, and local questions all validated.
- Warning: 2FA was removed from the current backend branch but remains referenced in spec/schema/deps; this needs deliberate alignment (either keep it, or cleanly mark/remove it).

Frontend: FAIL (policy + trust blockers remain), with real progress on the luxury preview and effect DSL.
- Gift spectacle runtime work is getting structurally stronger (effect catalog as data contract is the right move).
- Blockers still present in `frontend/src/App.jsx`: raw provider call from browser + overconfident compliance/vendor copy + no socket wiring.

## Queue rule status (previous pass vs now)

Previously flagged items (review head `c5e37c0`):
- UTF-8 BOM in `frontend/src/gifts/GiftEffectPreviewControls.jsx`: appears acted on (commit message indicates BOM stripped).
- Raw browser provider call + compliance/vendor over-claims + missing socket wiring: NOT acted on (still present at `c96d8ea`).

## Backend review (Codex ownership)

### What improved (strong signals)

- `backend/tests/sparkEngine.test.js` now validates the full vertical-slice HTTP surface:
  - `GET /api/gifts/types` returns a stable list and includes `crown` as platform-banner eligible.
  - `POST /api/games/questions` returns `{ provider: "local", paidProviderUsed: false }`.
  - `POST /api/gifts/send` returns a coherent `{ giftSent, balance, animation, banner }` response.
- Storm logic now has explicit behavior tests via `recordGiftForStorm` (start/complete events).

### Consistency warning: 2FA removed, but spec/schema still claim it

`5de19c9` removes:
- `POST /api/auth/2fa/setup` and `POST /api/auth/2fa/verify` routes from `backend/routes/auth.js`.
- TOTP/otplib logic and 2FA fields from `backend/services/authService.js`.
- 2FA docs from `docs/BACKEND_API_CONTRACTS.md`.

But 2FA still appears to exist “on paper”:
- `docs/BACKEND_SPEC.md` still lists 2FA routes and includes “TOTP 2FA” in stack/security text.
- `backend/schema.sql` still includes `two_factor_enabled` and `two_factor_secret`.
- `backend/package.json` still depends on `otplib`.

This is a luxury trust issue because it creates “phantom security” (claims without live behavior).

### Concrete next actions (Owner: Codex/backend)

Pick one (do not leave it ambiguous):
1) **Keep 2FA in the product direction**: restore 2FA routes/service + keep docs/tests, or
2) **Defer 2FA** (acceptable for vertical slice): remove/label all 2FA references in docs/spec/schema and drop `otplib` until reintroduced.

Files/docs to touch:
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_SPEC.md`
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\schema.sql`
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\package.json`

### Contract gap still open: socket payload shapes

Backend docs list socket event names but still omit payload shapes and an envelope recommendation. This blocks Claude from wiring real-time effects safely.

Concrete next action (Owner: Codex/backend):
- Add explicit JSON examples for:
  - `gift_animation`
  - `platform_banner`
  - `spark_storm_start`, `spark_storm_update`, `spark_storm_complete`
- Recommend an event envelope to support dedupe/ordering:
  - `{ type, eventId, roomId, sentAt, payload }`

Primary doc:
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

## Frontend review (Claude ownership)

### What’s strong (luxury direction)

- `frontend/src/gifts/giftEffectCatalog.js` is the correct shape for a “VYBE effect DSL”:
  - pure data contract (designer-editable direction)
  - explicit durations/phases
  - particle budgets + palette + typography
  - room/platform audience scope
- `frontend/src/gifts/VybeLuxuryPreview.jsx` is a good “north star” staging composition for the live room look:
  - performer-first stage composition
  - rails + chat + wallet + banner all in one cohesive scene

### Critical blockers still present (must-fix)

1) **Raw provider API call from the browser (repo policy violation)**
- Still present:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` (`genQs()` fetches `https://api.anthropic.com/v1/messages`)
- Required fix (Owner: Claude/frontend):
  - Remove the browser provider call entirely.
  - Route question generation through the backend-safe endpoint:
    - `POST /api/games/questions`

2) **Compliance/vendor over-claims (luxury trust risk)**
- Still present in `frontend/src/App.jsx` (examples include “Powered by Yoti…”, “18 USC §2257 Compliant”, “CCBill/Segpay”).
- Required fix (Owner: Claude/frontend):
  - Replace with neutral placeholder copy until legal/vendor reality exists.

3) **Realtime socket wiring still missing (vertical slice gap)**
- No `socket.io`/WebSocket client wiring found in `frontend/src/**`.
- Required fix (Owner: Claude/frontend):
  - Add a minimal socket client and drive:
    - `GiftSpectacleOverlay` from `gift_animation`
    - `PlatformBanner` from `platform_banner`
    - `SparkStormShell` from storm events

### High-risk integration mismatch: gift IDs don’t match backend contract

Backend gift types (current contract) use IDs like:
- `rose`, `crown`, `key` (see backend `backend/services/giftCatalog.js` and `schema.sql`).

Frontend effect catalog currently defines:
- `neon_rose`, `crown_drop`, `private_key`.

If Claude wires backend events directly, spectacle lookup will fail without a mapping layer.

Concrete next action (Owner: Claude/frontend, with Codex contract confirmation):
- Align effect IDs to backend `gift_type_id` values, OR introduce an explicit mapping table:
  - backend `gift_type_id` -> frontend `effectId`

Files to touch:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\giftEffectCatalog.js`
- (optional mapping helper) `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\giftIdMap.js`

## Next milestone gate: “Vertical Slice - Real-Time Gift Loop”

This milestone is PASS only if all are true:
1) No raw provider calls in browser; questions go through `POST /api/games/questions` (Claude).
2) Frontend consumes backend realtime gift/storm/banner events and drives spectacle from payloads (Claude).
3) Backend docs include explicit socket payload shapes + an envelope recommendation (Codex).
4) Compliance/vendor copy is neutral placeholders until verified (Claude).

