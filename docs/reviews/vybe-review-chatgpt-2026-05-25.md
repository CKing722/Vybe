# VYBE Review: ChatGPT — Luxury / Spectacle / Copy Audit

Date: 2026-05-25  
Lane: Review: ChatGPT (synthesis only; no implementation ownership)

Reviewed worktrees:
- Codex/backend: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Claude/frontend: `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend`
- Review worktree: `C:\Users\Damon\Downloads\vybe-project\vybe-chatgpt-review`

## Executive verdict

**Backend vertical slice: PASS (demo-grade).**  
Memory-adapter + gift send + platform banner + Spark Storm eventing is coherent and consistent with the no-spend rule.

**Frontend vertical slice: FAIL (policy + integration gap).**
- A raw provider call exists in browser code (Anthropic API). This violates the “no raw provider APIs / no paid calls” rule and must be removed or gated off immediately.
- Gift spectacle components exist but are not wired to backend contracts (no socket integration; live room is mostly local simulation).

## Critical blockers (must-fix)

### 1) Raw provider API call from the browser (policy violation)

Found in Claude frontend:
- `frontend/src/App.jsx` — `genQs()` calls `https://api.anthropic.com/v1/messages` directly.

Why this is a blocker:
- Violates VYBE operating rules: **AI provider calls must run through backend endpoints, not browser code**, and current VYBE mode is **no paid provider calls**.
- Also implies secrets/API keys would be needed in the client, which is disallowed.

Required next action (Owner: **Claude / frontend**):
- Remove direct provider call and replace with backend-safe endpoint: `POST /api/games/questions` (already implemented on backend with local questions).
- Ensure “questions provider” is always `local` in this phase.

### 2) Gift spectacle not integrated with backend events/contracts

Found in Claude frontend:
- Gift spectacle runtime components exist:
  - `frontend/src/gifts/GiftSpectacleOverlay.jsx`
  - `frontend/src/gifts/PlatformBanner.jsx`
  - `frontend/src/gifts/SparkStormShell.jsx`
  - `frontend/src/gifts/giftEffectCatalog.js`
- But `frontend/src/App.jsx` live room gifting is local-only (adds icons to state; no sockets; no `/api/gifts/send`).

Required next action (Owner: **Claude / frontend**):
- Wire live room gifting to backend:
  - On send: call `POST /api/gifts/send` (or socket `send_gift`) and handle `401/409/429` paths.
  - On receive: subscribe to socket events (`gift_animation`, `platform_banner`, `spark_storm_*`) and drive overlays.

## Luxury product/design critique (2026 expectations)

### Gift spectacle: what’s strong

- The `giftEffectCatalog.js` is directionally aligned with Hermes’ recommendation of a **data-first effect DSL** (phases, typography, palette, budgets).
- `GiftSpectacleOverlay.jsx` + `PlatformBanner.jsx` show good instincts: high-tier = room-dimming cinematic, low-tier = subtle toast, with copy lanes and duration discipline.

### Gift spectacle: what’s missing for “luxury 2026”

Owner: **Claude / frontend**

1) **A real capability resolver + renderer tiers**
   - Current overlay is CSS-only (acceptable as Tier 0), but the “luxury” bar needs a planned Tier 1/2 path:
     - Tier 1: Pixi/WebGL particles + text
     - Tier 2: Three/Babylon GLB scene moments
     - Tier 3: WebGPU enhancements (optional)

2) **A queue/priority model**
   - High-tier effects need deterministic sequencing:
     - queue (serialize) high-tier
     - allow low-tier toasts to stack lightly
     - prevent banner + cinematic headline collisions

3) **Reduced motion / accessibility budget baked into the DSL**
   - Add (or enforce) `prefers-reduced-motion` behavior:
     - replace cinematic overlay with a shorter, calmer banner/toast
     - disable particle bursts / camera shake

4) **Effect IDs and mapping consistency**
   - Backend gift types: `rose|flame|kiss|diamond|crown|champagne|key`
   - Frontend effect IDs: `neon_rose|crown_drop|private_key`
   - Pick one canonical ID scheme and map everything to it (recommend: backend gift type ID is canonical; frontend maps to effect definition).

## Copy & microcopy critique

Owner: **Claude / frontend**

Strong:
- The core mantra “You are known here.” is consistently present and thematically correct.
- Some UI labels feel “premium product” already (e.g., loyalty tier framing, earned identity).

Needs polish:
- Replace placeholder defaults like “Someone” in spectacle/banners; use “Anonymous” only if truly needed, otherwise require a sender name.
- Keep the tone “seductive-but-not-explicit” consistently; the trivia prompt/question bank currently drifts into “sex ed / therapy vocabulary” and “statistics claims” that could read generic or dubious.
- Banner headlines should be templated per gift tier (short, confident, brand-specific) and avoid repeating “sent”.

## Backend contract notes (demo-grade, but tighten the event envelope)

Owner: **Codex / backend**

Current is workable:
- `gift_animation` includes `gift`, `animationType`, `durationMs`, `spectacleTier`
- `platform_banner` exists
- `spark_storm_*` exists

Recommended “next tightening” (non-blocking, but helps frontend luxury work):
- Add an explicit event envelope with `eventId`, `roomId`, `sentAt`, `priority` (tier), and a canonical `giftTypeId` so the frontend can:
  - dedupe
  - queue
  - synchronize timelines across clients
  - map to effect DSL reliably

## Concrete next actions (by owner)

### Claude (frontend)

1) Remove browser provider call:
   - Update `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`
2) Integrate question generation via backend:
   - Call `POST /api/games/questions` (from `docs/BACKEND_API_CONTRACTS.md`)
3) Integrate gifting via backend + sockets:
   - Send via `POST /api/gifts/send` or socket `send_gift`
   - Listen for `gift_animation`, `platform_banner`, `spark_storm_*`
4) Wire spectacle components into the live room:
   - Use `GiftSpectacleOverlay.jsx`, `PlatformBanner.jsx`, `SparkStormShell.jsx`
5) Unify gift IDs:
   - `giftEffectCatalog.js` should map backend gift IDs directly (or provide a mapping table in one place)
6) Start enforcing reduced motion:
   - implement a global “reduced motion” capability flag; DSL must respect it

### Codex (backend)

1) Consider extending event payload shape (envelope) to support luxury sequencing:
   - `backend/services/sparkEngine.js`
   - `backend/routes/gifts.js`
   - `backend/sockets/giftHandler.js`
2) Consider socket send rate limits / spam protection for `send_gift` (aligned with QA checklist):
   - `backend/sockets/giftHandler.js`

### Hermes (QA/docs)

1) Update smoke QA to explicitly check “no raw provider calls from the browser”:
   - `docs/qa/vybe-gho-008-gift-spectacle-qa.md`

