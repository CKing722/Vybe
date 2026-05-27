# VYBE Review: ChatGPT - 2026-05-25 (Pass 20)

Date: 2026-05-25  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review artifact exists: `docs/reviews/vybe-review-chatgpt-2026-05-25-19.md` (treated as complete)
- This pass reviews the next newest unreviewed output found in:
  - Claude/frontend new commit after `33631c6`

## Artifacts reviewed (new since last pass)

### Claude (frontend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
- Branch / head: `frontend/gift-spectacle-runtime` @ `b7be1dc`
- New commit reviewed:
  - `b7be1dc` - feat(gifts): cap canvas particle count on mobile viewports (<480px)
- Files touched (high signal):
  - `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\CanvasParticleRenderer.jsx`

## Executive call

- Mobile performance guardrail: PASS — adding a hard cap for particle count on narrow viewports is directionally correct for 2026 mobile perf expectations.
- Vertical-slice demo readiness: FAIL (unchanged) — frontend still includes a raw paid provider call and demo-unsafe compliance/vendor/payment claims in UI copy.
- Cross-stack spectacle identity: FAIL (unchanged) — frontend still infers spectacle tier from cost; backend does not emit a stable `effectId` for `gift_animation`.

## What is good (2026 expectation alignment)

- The cap targets the right failure mode: particle-count scaling is the first thing that blows up mobile frame pacing.
- The change is low-risk and localized: it doesn’t alter desktop fidelity, only narrows mobile budgets.

## Gaps / critique (actionable)

### P1 - Renderer should not be the only place where “mobile budgets” live

- Why this matters:
  - Luxury-grade effects should be authorable with explicit budgets per device class (desktop/mobile/reduced-motion) rather than hard-coded heuristics inside a renderer.
- Suggested next action (Owner: Claude / frontend):
  - Move the “mobile cap” concept into the effect definition layer (e.g., `giftEffectCatalog` / effect budget objects) so designers/engine can tune budgets without touching renderer logic.

### P1 - Guard against `budget.count` being unset (minor correctness)

- Evidence:
  - `Math.min(budget.count, 32)` assumes `budget.count` is always a number; if any effect omits `count`, this becomes `NaN` and particle spawning breaks.
- Suggested next action (Owner: Claude / frontend):
  - Add a safe numeric fallback for `budget.count` (renderer-side or catalog-side) so missing/partial budgets fail gracefully.

### P0 (still blocking) - Frontend contains raw provider call + demo-unsafe compliance/vendor/payment claims

- Evidence (unchanged from Pass 19):
  - Raw AI provider call: `https://api.anthropic.com/v1/messages` in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`.
  - Definitive vendor/legal/payment claims: Yoti, “18 USC §2257 Compliant”, “CCBill/Segpay”, etc. in the same file.
- Required next action (Owner: Claude / frontend):
  - Replace direct provider calls with backend `POST /api/games/questions`.
  - Replace vendor/legal/payment assertions with demo-safe placeholders (clearly marked as non-final) until Hermes research is converted into reviewed product policy.

## Updated gate for the next milestone (unchanged)

1. Frontend has zero raw provider calls; questions only come from `POST /api/games/questions`.
2. UI copy contains no finalized legal/compliance/vendor/payment claims; placeholders are clearly marked as demo placeholders.
3. Gift spectacle identity is contract-driven: backend emits a stable `effectId`/`effect_id` (and ideally version/params) so the frontend never guesses spectacle from cost.
4. Contracts converge on one external JSON casing choice (or an explicitly time-boxed migration plan exists).

