# VYBE Review: ChatGPT — 2026-05-25 (Pass 13)

Date: 2026-05-25  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review artifact: `docs/reviews/vybe-review-chatgpt-2026-05-25-12.md`
- This pass reviews the next newest unreviewed outputs found in Codex/backend + Claude/frontend.

## Artifacts reviewed (new since last pass)

### Codex (backend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Branch / head: `backend/openapi-contract` @ `0c142cc`
- Notable changes:
  - Added machine-readable HTTP contract: `backend/contracts/openapi.yaml`
  - Updated `docs/BACKEND_API_CONTRACTS.md`
  - Removed `backend/tests/socketContracts.test.js`

### Claude (frontend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
- Branch / head: `frontend/gift-spectacle-runtime` @ `4df2403`
- Notable changes:
  - Added hold-phase pulse to low-tier gift toast dot: `frontend/src/gifts/GiftSpectacleOverlay.jsx`

### Hermes (docs/QA reference)

- `docs/research/vybe-gho-007-3d-gift-pipeline.md`
- `docs/qa/vybe-gho-008-gift-spectacle-qa.md`

## Executive call

- Backend OpenAPI contract: **Pass (good direction)** — improves integration velocity and reduces ambiguity.
- Frontend overlay micro-interaction: **Pass** — subtle “hold” motion improves perceived polish.
- Overall vertical-slice readiness: **Fail until P0s below are cleared** — demo currently violates the no-raw-provider rule and includes risky legal/vendor/payment claims in UI copy.

## P0 — Must fix before any demo or external share

### 1) Raw provider API call in browser (violates no-API rule)

- Evidence: `frontend/src/App.jsx` calls `https://api.anthropic.com/v1/messages` directly.
- Why it’s a hard stop:
  - Violates repository “no raw provider APIs” rule.
  - Cannot be shipped or demoed safely without secrets/headers and policy review.
- Required next action (Owner: **Claude / frontend**):
  - Replace direct provider call with backend contract endpoint: `POST /api/games/questions`.
  - Remove any network path that can hit third-party AI endpoints from browser code.
- Files to change (Claude):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

### 2) Demo-unsafe legal/vendor/payment claims embedded in UI

- Evidence (examples in `frontend/src/App.jsx`):
  - “Powered by Yoti — zero-knowledge…”
  - “18 USC §2257 Compliant”
  - “CCBill/Segpay”
- Why it’s a hard stop:
  - Reads like finalized legal/compliance posture and vendor selection.
  - Could create trust/legal exposure if shown outside the team.
- Required next action (Owner: **Claude / frontend**, with Hermes as reference):
  - Replace with neutral, explicitly-placeholder copy (e.g., “Compliance and payment providers: TBD for demo”).
  - Avoid naming specific vendors until Hermes research is finalized and Damon approves.
- Files to change (Claude):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

### 3) Visible character encoding glitches (“â…”, “Â…”) in surfaced copy

- Evidence:
  - `frontend/src/App.jsx` includes a rendered section header comment text that appears as “â•â•â• WALLET â•â•â•”.
  - `docs/BACKEND_SPEC.md` contains “Client â†’ Server:” instead of proper arrows.
- Why it’s a hard stop:
  - Instantly breaks “luxury” credibility; looks like a broken export.
- Required next action:
  - Owner: **Claude / frontend** — remove/replace the glitchy characters in any UI-facing text.
  - Owner: **Codex / backend** — normalize docs encoding + replace broken arrow glyphs with ASCII (`->`) or correct Unicode.
- Files to change:
  - Claude: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`
  - Codex: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_SPEC.md`

## P1 — High leverage quality/architecture improvements

### A) Restore automated WebSocket contract validation

- Observation:
  - `backend/tests/socketContracts.test.js` was removed while WebSocket events remain central to the vertical slice.
  - `docs/BACKEND_API_CONTRACTS.md` currently lists socket event names but does not specify payload schemas.
- Risk:
  - Frontend + backend can drift on payload shape without failing CI/tests.
- Recommended next action (Owner: **Codex / backend**):
  - Add a small, explicit socket payload contract:
    - Option 1: JSON Schema files under `backend/contracts/` + a Jest test that validates sample payloads.
    - Option 2: Zod schemas in backend + tests that assert emit payloads match schemas.
  - Update `docs/BACKEND_API_CONTRACTS.md` to include payload shapes for:
    - `gift_animation`, `platform_banner`, `spark_storm_*`
- Files to change (Codex):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\` (new contract artifact)
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\` (new/updated test)

### B) Canonicalize gift IDs across stack (gift type vs effect id)

- Observation:
  - Backend uses `gift_type_id` like `crown`.
  - Frontend spectacle catalog uses effect ids like `crown_drop` and hand-maps in `App.jsx`.
- Risk:
  - Mismatched IDs and “one-off mapping” will multiply as catalog grows; socket payloads become ambiguous.
- Recommended next action:
  - Owner: **Codex / backend** — add `effect_id` (or `effect_key`) to gift type catalog responses and gift send receipts.
  - Owner: **Claude / frontend** — consume backend `effect_id` directly; remove local mapping.
- Files to change:
  - Codex: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\services\giftCatalog.js`
  - Codex: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`
  - Codex: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\openapi.yaml`
  - Claude: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` (and/or a new mapping util under `frontend/src/gifts/`)

## 2026 “Luxury bar” gate for the next milestone

For the next demo checkpoint, treat this as the minimum definition of done:

1. **No external AI calls from the browser**; `POST /api/games/questions` is the only path for questions.
2. **No definitive compliance/vendor/payment claims in UI** — placeholders must be clearly labeled.
3. **Gift event contract is stable and test-backed**:
   - HTTP contract (OpenAPI) remains the source of truth for REST.
   - Socket event payloads have explicit schemas and at least one automated validation test.
4. **Gift spectacle runtime respects Hermes’ pipeline direction**:
   - Keep the effect catalog as data (good).
   - Add a clear capability ladder (CSS → Canvas/Pixi → Three/WebGL → WebGPU) before committing to any single renderer.

