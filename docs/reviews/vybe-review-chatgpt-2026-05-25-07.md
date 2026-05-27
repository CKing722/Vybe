# VYBE Review: ChatGPT — Backend Viewer Profile Update Endpoint (Contract + Safety Pass)

Date: 2026-05-25  
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees / heads (as found on disk):
- Codex/backend: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
  - Branch: `backend/me-profile-update`
  - Head: `74aea3d` (2026-05-25 01:31 -05:00)
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
  - Branch: `frontend/gift-spectacle-runtime`
  - Head: `2282a58` (2026-05-25 01:02 -05:00)

## Executive verdict

Backend: PASS (good product-facing contract hygiene + tests), with two remaining integration blockers that are still blocking Claude.
- `PUT /api/me/profile` is well-scoped: auth + viewer role enforced, validation present, memory-store and DB paths handled, and tests added.
- Still unresolved (same as prior passes): socket event docs still list names without payload shapes; gift IDs still mismatch across backend vs frontend spectacle runtime.

Frontend: FAIL (policy + trust blockers still present; realtime wiring still missing).
- No new frontend changes observed since the prior review head; prior blockers remain open.

## Queue rule status (previous pass vs now)

Previously reviewed item: “Vertical slice readiness (policy + trust + sockets)”
- Backend: PARTIALLY ACTED ON (contract surface expanded; tests continue to tighten).
- Frontend: NOT ACTED ON (raw browser provider call + compliance/vendor overclaims + missing socket wiring still present).

## Backend review (Codex ownership)

### What shipped (good direction)

1) New endpoint: viewer profile update
- Route: `PUT /api/me/profile` (viewer-only) in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\routes\users.js`
- Service: `updateViewerProfile()` in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\profileService.js`
- Docs: added to `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

Quality signal:
- Added regression tests in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\sparkEngine.test.js` (including a malicious avatar URL rejection case).
- I ran backend tests locally and they passed on this head (`npm test` in `...\vybe-project-main-policy\backend`).

### Product / safety notes (tighten before this becomes “real”)

- Avatar URL validation currently ensures `http(s)` only and caps length (good), but does not protect against “internal network” URLs if VYBE ever adds a server-side image proxy/fetcher later.
  - Recommendation (Owner: Codex/backend): explicitly document that avatar/banner URLs are client-resolved display-only; if/when the backend ever fetches remote images, add SSRF guards at that time.

### Still blocking Claude integration: socket payload shapes + gift ID mapping

Backend docs still need **explicit payload examples** so Claude can wire the spectacle without guessing:
- `gift_animation`
- `platform_banner`
- `spark_storm_start`, `spark_storm_update`, `spark_storm_complete`

Primary doc that should carry these examples:
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

Gift ID mismatch remains a real integration hazard:
- Backend gift type IDs (seed + contract examples): `rose`, `crown`, `key` (see `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\schema.sql`).
- Frontend spectacle effect IDs: `neon_rose`, `crown_drop`, `private_key` (see `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\giftEffectCatalog.js`).

Concrete next action (Owner: Codex/backend; minimal-break solution):
- Keep backend `gift_types.id` stable, and add an explicit `effect_id` (or `effectId`) field in:
  - `GET /api/gifts/types` response
  - `gift_animation` socket payload
  - any gift send response `animation` payload
This avoids forcing DB migrations while giving Claude a canonical key for the spectacle runtime.

## Frontend reminder (Claude ownership; unchanged since last review)

Blocking issues still present in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`:
- Raw browser provider call (`https://api.anthropic.com/v1/messages`) still exists.
- Compliance/vendor claims still read as “real” (e.g., “18 USC §2257 compliant”, “CCBill/Segpay”, etc.).
- No socket client wiring found under `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\**`.

## PASS gate (unchanged): “Vertical Slice — Real-Time Gift Loop”

This milestone is PASS only if all are true:
1) No raw provider calls in browser; questions go through backend `POST /api/games/questions` (Claude).
2) Compliance/vendor copy is neutral placeholders until verified (Claude).
3) Frontend consumes backend realtime gift/storm/banner events and spectacle is driven by payloads (Claude).
4) Backend docs include explicit socket payload shapes + envelope guidance (Codex).
5) Gift IDs are aligned or explicitly mapped so spectacle lookup cannot fail at runtime (Codex + Claude).

