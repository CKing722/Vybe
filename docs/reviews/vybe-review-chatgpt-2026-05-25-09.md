# VYBE Review: ChatGPT — Gift Queue (FIFO Playback) + Vertical Slice P0s Still Open

Date: 2026-05-25  
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees / heads (as found on disk):
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
  - Branch: `frontend/gift-spectacle-runtime`
  - Head: `7d971a8` (2026-05-25 04:02 -05:00)
- Codex/backend: no new commits detected after the prior review timestamp (2026-05-25 03:23 -05:00). (Still blocked on the same payload-example + ID-mapping contract items.)

## Executive verdict

Frontend: QUALITY WIN (queueing), but STILL FAIL for demo readiness.
- Win: sequential gift playback is the right direction for a luxury “gift moment” (no hard interrupts).
- Still FAIL: policy + trust + integration blockers remain unchanged (raw browser provider call, compliance/vendor overclaims, no socket wiring, and gift id/effect id mismatch).

## What changed (Claude)

### 1) `useGiftQueue` (new) — correct product intent

Files:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\useGiftQueue.js`
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

Behavior:
- Rapid gifting no longer overwrites the current spectacle.
- Gifts enqueue FIFO (max 4) and play one-by-one; `onDone` advances the queue.

Luxury expectation check:
- This is a baseline requirement for any premium gifting product in 2026 (interrupting high-tier moments reads “cheap”).

### 2) Queue UX gaps (still product-visible)

Current behavior silently drops gifts after queue fills:
- When `maxSize` is hit, additional gifts are discarded with no viewer feedback.

Recommendation (Owner: Claude/frontend; scope: `frontend/src/gifts/useGiftQueue.js` + `frontend/src/App.jsx`):
- Add an explicit “overflow strategy”:
  - Option A: collapse identical gifts into a multiplier (e.g., `crown_drop ×3`) instead of dropping.
  - Option B: show a subtle queue counter / toast (“3 gifts queued”) and always keep the newest N by tier.
  - Option C: priority queue: never drop high-tier; drop low-tier first.

## P0 blockers unchanged (do not call this demo-ready)

### 1) Policy violation: raw provider API call still in browser code

In:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

Still present:
- `fetch("https://api.anthropic.com/v1/messages" …)` inside `genQs()`

Required fix (Owner: Claude/frontend; scope: `frontend/src/App.jsx`):
- Delete/disable raw provider fetch in the browser.
- Route questions through backend only (`POST /api/games/questions`) with a local/mock response until Damon explicitly approves any paid/provider integration.

### 2) Trust/legal-risk copy: compliance + vendor/payment claims read “real”

In:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

Examples still present:
- “Powered by Yoti…”
- “18 USC §2257 Compliant”
- “CCBill/Segpay”

Required fix (Owner: Claude/frontend; scope: `frontend/src/App.jsx`):
- Convert these to clearly labeled demo-safe placeholders (non-committal, non-legal-claim language).
- Keep the “luxury” tone, but do not imply verification or vendor decisions that have not been made.

### 3) Realtime integration gap: spectacle not driven by backend payloads

Still missing (Owner: Claude + Codex):
- Frontend socket client wiring that consumes backend events.
- Backend contract examples that make payload shapes unambiguous.

Concrete next actions:
- Codex/backend: add explicit JSON payload examples for gift/banner/storm events in:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`
- Claude/frontend: wire client-side consumption without guessing payloads once examples exist (no hardcoded demo-only IDs).

### 4) Gift type id vs effect id mismatch still present

Observed:
- Backend canonical gift type ids: `rose`, `crown`, `key`
- Frontend effect ids: `neon_rose`, `crown_drop`, `private_key`

Minimum-break recommendation (Owner: Codex/backend; docs + contracts only until schema changes are coordinated):
- Provide `effectId` explicitly in:
  - `GET /api/gifts/types`
  - gift socket payloads (`gift_animation`, `platform_banner`)
So the backend remains canonical and the frontend runtime stays designer-friendly.

## 2026 luxury bar (next milestone gate)

The “real-time gift loop” milestone is PASS only if all are true:
1) No raw provider calls in browser.
2) Trust/copy is demo-safe (no compliance/vendor claims without verification).
3) Frontend gift/storm/banner are driven by backend payloads (not demo toggles).
4) Gift ID mapping is deterministic (backend provides `effectId` or a single canonical id).

