# VYBE Review: ChatGPT - Frontend Gift Spectacle Runtime (Hook Fix) + Demo-Safety P0s Still Open

Date: 2026-05-25  
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees / heads (as found on disk):
- Codex/backend: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
  - Branch: `main` (also `backend/integration-baseline`)
  - Head: `41edcf0` (unchanged since prior review)
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
  - Branch: `frontend/gift-spectacle-runtime`
  - Head: `01b1721`

## Executive verdict

Frontend: PASS for fixing a real runtime correctness bug (Rules of Hooks), but FAIL for demo-safety and realtime-readiness.

Why FAIL (still P0):
- Raw browser provider call remains in `frontend/src/App.jsx` (`fetch("https://api.anthropic.com/v1/messages" ...)`) and must be routed through backend (`POST /api/games/questions`) per repo policy.
- Trust/legal signaling still over-claims (Yoti / "required by law" / "2257 compliant" / "CCBill/Segpay") in `frontend/src/App.jsx`. Until verified, these must be demo-safe placeholders.
- Socket client wiring is still missing (spectacle is driven by local demo triggers, not backend event payloads).

New P1 correctness risk discovered:
- `frontend/src/gifts/CanvasParticleRenderer.jsx` re-runs its animation effect only on `[active]`, so sequential gifts in `useGiftQueue()` can render stale particles/palette when `giftId` changes while `active` stays true.

## What changed (Claude/frontend) - good progress

### 1) Hooks correctness fix (good, keep it)

Change summary:
- `frontend/src/gifts/CanvasParticleRenderer.jsx` now derives an `active` flag before all hooks and uses it as both the render condition and effect guard.

Outcome:
- Prevents hook-order mismatch when phase transitions to `"exit"` while the component remains mounted.

## Critical gaps / next actions (concrete)

### P0 - Remove raw browser provider calls (Owner: Claude/frontend)

File to change:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

Required behavior:
- Replace the direct provider fetch with a backend call (the backend already documents `POST /api/games/questions` as the allowed path).

Acceptance check:
- `rg -n "api\\.anthropic\\.com|anthropic\\.com/v1/messages" frontend/src` returns no matches.

### P0 - Neutralize demo-unsafe compliance/vendor/payment claims (Owner: Claude/frontend)

File to change:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`

Specific strings/areas to remove or rewrite as placeholders:
- "Age verification required by federal and state law. Powered by Yoti ..."
- "18 USC §2257 Compliant" (and any footer/header repetition)
- "CCBill/Segpay" references

Replacement guidance (demo-safe):
- Use "Age verification (placeholder)" / "Compliance links (placeholder)" / "Payments provider (TBD)" language until Hermes research is merged + Damon approves claims.

### P1 - Fix sequential-gift correctness in Canvas renderer (Owner: Claude/frontend)

Files to change:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\CanvasParticleRenderer.jsx`
- (or) `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\GiftSpectacleOverlay.jsx`

Observed risk:
- `CanvasParticleRenderer`'s `useEffect(..., [active])` will not restart when `pal` / `budget` changes between gifts while remaining active.

Two acceptable fixes:
- Option A (preferred): update the effect dependencies and lifecycle so it restarts when `pal` or `budget` changes (and cancels the previous RAF cleanly).
- Option B: force remount with `key={giftId}` where `CanvasParticleRenderer` is used.

Acceptance check:
- Trigger `neon_rose` then `private_key` back-to-back (queued) and verify palette + particle mode update (radial-tight vs matrix-fall) without requiring an unmount gap.

### P0 (unchanged) - Realtime contract + sockets (Owner: Codex + Claude)

Codex (docs) must supply copy/pasteable JSON payload examples (per prior review):
- `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

Claude should only wire sockets after payload examples exist:
- `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\**`

## 2026 "luxury spectacle" standards gate (next milestone)

Call the gift spectacle loop PASS only if all are true:
1) No raw provider calls in browser code; questions flow is backend-only.
2) Demo-safe trust copy (no unverified legal/vendor/payment claims presented as fact).
3) Sequential gifts render correctly (no stale particles/palette between queued gifts).
4) Frontend consumes backend realtime events (gift animation + platform banner + storm), not local demo triggers.
5) Gift -> effect mapping is deterministic (backend supplies `effectId` or frontend consumes backend's canonical id).

