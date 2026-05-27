# VYBE Review: ChatGPT — WebSocket Contract Tests Landed; Frontend Room Polish; Demo-Safety P0s Still Open

Date: 2026-05-25  
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees / heads (as found on disk):
- Codex/backend: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
  - Branch: `backend/ws-contract-tests`
  - Head: `807a13e`
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
  - Branch: `frontend/gift-spectacle-runtime`
  - Head: `9559f6b`

Prior review artifact exists: `C:\Users\Damon\Downloads\vybe-project\vybe-chatgpt-review\docs\reviews\vybe-review-chatgpt-2026-05-25-11.md` (considered complete; moved to newest unreviewed outputs).

## Executive verdict

Backend: **PASS** (meaningful progress) — contract examples + socket contract tests unblock frontend wiring.  
Frontend: **FAIL** (demo-safety) — raw browser provider call + unverified legal/payment claims still present.

### What’s now unblocked

- Claude can wire socket consumers against concrete payload examples in `docs/BACKEND_API_CONTRACTS.md` (gift animation + banner + storm).
- Codex now has a regression net that verifies “HTTP gift send” actually emits the socket events the UI depends on.

## Key wins (keep going)

### 1) Backend socket contracts are now test-backed (Owner: Codex)

New artifact:
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\socketContracts.test.js`

Why this matters:
- It prevents the “demo breaks because one field renamed” problem that kills momentum on spectacle work.
- It makes the “gift -> platform banner -> storm” chain feel like a real product contract, not a mock.

### 2) Gift preview now derives from the canonical catalog (Owner: Claude)

Change:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\VybeLuxuryPreview.jsx` now maps from `GIFT_EFFECT_CATALOG`.

Why this matters:
- Single source of truth for display names + spark cost + palette tone (avoids silent drift).

### 3) Room UX polish: request escrow flow is directionally right (Owner: Claude)

Change:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` adds pending/accept/decline mechanics + refund messaging.

Luxury expectation note:
- “Escrow” is the correct mental model for sparks-based commitments; keep that framing.

## P0 issues (must fix before calling spectacle “demo-safe”)

### P0 — Raw provider call still runs in browser code (Owner: Claude/frontend)

File:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

Observed:
- `fetch("https://api.anthropic.com/v1/messages" ...)` still exists (and will be a policy violation even if it’s only a demo stub).

Required:
- Route all game question generation through backend (`POST /api/games/questions`) and keep browser code provider-agnostic.

Acceptance check:
- `rg -n "api\\.anthropic\\.com|anthropic\\.com/v1/messages" frontend/src` returns no matches.

### P0 — Demo-unsafe legal/vendor/payment claims still presented as fact (Owner: Claude/frontend)

Files:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

Observed examples (non-exhaustive):
- “Age verification required by federal and state law. Powered by Yoti…”
- “18 USC §2257 Compliant”
- “CCBill/Segpay”

Required:
- Replace with demo-safe placeholders (“Age verification (placeholder)”, “Compliance links (placeholder)”, “Payments provider (TBD)”) until Hermes research is merged + Damon approves specific claims.

Acceptance check:
- `rg -n "2257|Yoti|CCBill|Segpay|required by law" frontend/src/App.jsx` returns no matches.

### P0 — Character encoding glitches break “luxury” polish (Owner: Claude + Codex)

Observed:
- Visible `Â` / garbled box-drawing glyphs (e.g., `Â·`, `Â§`, `â•â•â•`) appear in UI strings and SQL/doc comments.

Why it’s P0:
- This reads instantly “cheap demo,” even if the visuals are premium.

Concrete fixes (minimum):
- Claude: normalize visible UI strings in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`.
- Codex: normalize visible headings/comments in `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\schema.sql` and any surfaced docs, or ensure they never render in UI.

## P1 issues (correctness + contract clarity)

### P1 — Sequential gifts can render stale particles/palette (Owner: Claude/frontend)

File:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\CanvasParticleRenderer.jsx`

Observed risk:
- Effect lifecycle only depends on `[active]`, so a queued gift swap can keep the prior particles/palette when `active` stays true.

Required:
- Restart the effect when `pal`/`budget` changes (or force remount using `key={giftId}` at callsite).

### P1 — Cross-stack gift IDs are drifting (Owner: Codex + Claude)

Observed mismatch today:
- Backend `gift_type_id` values: `rose`, `crown` (see `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\schema.sql`)
- Frontend effect catalog IDs: `neon_rose`, `crown_drop`, `private_key` (see `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\giftEffectCatalog.js`)
- Frontend currently bridges this with an inline mapping (see `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` in `sg()`).

Recommendation (pick one and lock it):
- Option A (preferred): make backend `gift_type_id` equal to `GIFT_EFFECT_CATALOG.id` (designer-editable, already canonical on frontend).
- Option B: keep backend IDs short (`rose`/`crown`/`key`), but then the backend must emit an explicit `effectId` that matches the frontend catalog, and the contract docs must treat `effectId` as the canonical runtime key.

Required contract improvement (Owner: Codex/backend):
- In `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`, define **unambiguous** fields for:
  - event id: `id`
  - gift type id: `giftTypeId`
  - runtime effect id: `effectId`
  - deterministic `seed` (so “cinematic” looks identical for all viewers)

## Next milestone “standards gate” (call it PASS only if all are true)

1) No raw provider calls in browser code; questions flow is backend-only.
2) Demo-safe trust copy (no unverified legal/vendor/payment claims presented as fact).
3) Sequential gifts render correctly (no stale particles/palette between queued gifts).
4) Frontend consumes backend realtime events for gift + banner + storm (not local-only triggers).
5) Gift IDs / effect IDs are canonicalized across stack (no hidden inline mapping surprises).

