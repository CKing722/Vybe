# VYBE Review: ChatGPT — Backend Viewer History Endpoint + Frontend Particle Fidelity (Flags Honored)

Date: 2026-05-25  
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees / heads (as found on disk):
- Codex/backend: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
  - Branch: `backend/me-history-endpoint`
  - Head: `75d8b09` (2026-05-25 02:33 -05:00)
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
  - Branch: `frontend/gift-spectacle-runtime`
  - Head: `0f431ca` (2026-05-25 03:02 -05:00)

## Executive verdict

Backend: PARTIAL PASS (new endpoint + tests are solid), but NOT READY due to a major regression and remaining integration gaps.
- Good: `GET /api/me/history/:performerId` is a useful “Your History” contract with tests.
- Major regression: `PUT /api/me/profile` appears removed on this branch, and docs drifted accordingly.
- Still blocking Claude: socket payload examples are still missing; gift ID / effect ID mismatch is still unresolved.

Frontend: STILL FAIL (core policy + trust + realtime wiring blockers remain), with one meaningful quality win.
- Win: Canvas particle renderer now honors `glitterEnabled` + `trailFade` (better designer-facing controls).
- Blockers unchanged: raw browser provider call, compliance/vendor overclaims, no `/api/games/questions` usage, no socket client wiring, and gift ID mismatch.

## Queue rule status (previous pass vs now)

Previously reviewed item: “Vertical slice readiness (policy + trust + sockets)”
- Backend: ACTED ON (added viewer history endpoint), but REGRESSED by dropping the viewer profile update endpoint on this branch.
- Frontend: NOT ACTED ON (policy/trust/socket wiring blockers still present).

## Backend review (Codex ownership)

### What shipped (good direction)

1) New endpoint: viewer → performer history
- Route: `GET /api/me/history/:performerId` in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\routes\users.js`
- Service: `getViewerPerformerHistory()` in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\viewerHistoryService.js`
- Tests: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\viewerHistory.test.js`
- Docs: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

Quality notes:
- The contract is product-usable: `performer`, `summary`, and a `gifts` list with gift metadata (icon/color/duration).
- `limit` is bounded (max 100), and the service supports DB and memory-store modes.

### Major regression: viewer profile update endpoint appears removed

On this branch, `PUT /api/me/profile` is no longer present in backend routing:
- Confirmed missing: no route match under `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\**`
- Spec drift: it is still listed in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_SPEC.md`
- Contract doc drift: the `PUT /api/me/profile` section appears replaced by the new history endpoint in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

Recommendation (Owner: Codex/backend):
- Treat this as a branch coordination failure: either reintroduce `PUT /api/me/profile` on this branch, or explicitly mark it deferred everywhere (spec + contract docs + frontend assumptions) so lanes don’t build against phantom endpoints.

### Contract polish needed (to unblock Claude without guessing)

1) Response examples for `GET /api/me/history/:performerId`
- Add a concrete JSON response example (including `createdAt` format and at least one gift entry) to:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

2) Socket payload examples (still missing)
The primary vertical-slice blocker remains: docs list event names but not payload shapes.
- Add explicit JSON payload examples for:
  - `gift_animation`
  - `platform_banner`
  - `spark_storm_start`, `spark_storm_update`, `spark_storm_complete`
- Primary doc: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

3) Gift ID vs effect ID mismatch (integration hazard)
- Backend gift type IDs are canonical today (`rose`, `crown`, `key`) in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\schema.sql`
- Frontend effect IDs are different (`neon_rose`, `crown_drop`, `private_key`) in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\giftEffectCatalog.js`

Minimal-break recommendation (Owner: Codex/backend):
- Add an explicit `effect_id` (or `effectId`) field to:
  - `GET /api/gifts/types` response
  - `gift_animation` socket payload
  - gift send response `animation` payload
So the backend remains canonical while the frontend spectacle runtime can stay designer-friendly.

## Frontend review (Claude ownership)

### What improved (good luxury direction)

- `glitterEnabled` now produces sparkle particles, and `trailFade=false` now produces hard-edge particles:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\CanvasParticleRenderer.jsx`

Luxury/perf note:
- The sparkle path draw per particle per frame may be fine at current budgets, but for “high-tier” effects you’ll likely want a mobile/low-power cap and/or a cached `Path2D` sparkle to keep animation consistently premium (no frame hitching).

### Blocking issues still present (P0 for vertical slice credibility)

In `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`:
- Raw browser provider call still exists (`https://api.anthropic.com/v1/messages`) — violates the no-raw-provider rule and breaks demo safety.
- Compliance/vendor/payment copy reads as “real” (Yoti, 2257, CCBill/Segpay) — creates trust and legal-risk signaling without verification.
- No usage found for backend-safe questions endpoint (`POST /api/games/questions`).

Integration gaps (still open):
- No socket client wiring detected under `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\**` for `gift_animation`, `platform_banner`, storm events.
- Gift IDs do not match backend gift type IDs; the spectacle cannot be reliably driven by backend events yet.

## PASS gate (still unchanged): “Vertical Slice — Real-Time Gift Loop”

This milestone is PASS only if all are true:
1) No raw provider calls in browser; questions go through backend `POST /api/games/questions` (Claude).
2) Compliance/vendor/payment copy is neutral placeholders until verified (Claude).
3) Frontend consumes backend realtime gift/storm/banner events with no guessing (Claude + Codex docs).
4) Gift IDs are canonical + mapped deterministically (Codex provides `effectId` or Claude adds a mapping layer).

