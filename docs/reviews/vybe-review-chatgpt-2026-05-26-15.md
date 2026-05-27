# VYBE Review: ChatGPT - 2026-05-26 (#15)

Timestamp: 2026-05-26 (America/Chicago) / 2026-05-27Z

Scope: luxury product/design critique + architecture/contract risk scan. No implementation edits.

Queue note: Prior review artifact exists (#14). This pass reviews the next newer Codex/Claude outputs.

## Reviewed artifacts (new since review #14)

### Claude / frontend
- Head: `15ce97d` (branch: `frontend/gift-spectacle-runtime`)
- Notable deltas: public homepage + public info pages, Spark economics/loyalty copy, Cloudflare Pages + Vercel staging configs.

### Codex / backend
- Head: `810ac66` (branch: `backend/contracts-mainline-integration`)
- Notable deltas: added `/api/gifts/send` + banner persistence tests.

## Recommendation

Status: **Visual pass** (luxury direction continues), **Vertical-slice integration fail (P0)** until the frontend consumes the backend real-time contracts and all browser-to-provider calls are removed.

## What improved

- Backend now has a regression test for platform banner persistence (`backend/tests/giftSendBanner.test.js`), which will be valuable once the payload includes a stable gift id.
- Frontend shipping discipline improved: `robots.txt` disallows crawling and both Cloudflare/Vercel add `X-Robots-Tag: noindex...` headers (good for a pre-launch staging surface).

## P0 blockers (must-fix for the first vertical slice)

### 1) Browser-to-provider call still exists (policy + ops violation)
- File: `frontend/src/App.jsx`
- Evidence: direct POST to `https://api.anthropic.com/v1/messages`.

Required end state:
- Questions must come from backend `/api/games/questions` (or a local static fallback list), with zero provider URLs in browser code.

### 2) Real-time contract mismatch still exists (raw WebSocket envelope vs Socket.io named events)
- Frontend currently opens `ws://.../room/<roomId>` and expects `{ type, payload }` (`frontend/src/gifts/useGiftSocket.js`).
- Backend emits Socket.io named events under `/socket.io/` and the canonical schemas live in `backend/contracts/socketio/v1/server-to-client/*.schema.json` (e.g. `gift_animation`, `platform_banner`).

Required end state:
- Frontend uses `socket.io-client`, subscribes to `gift_animation`, `platform_banner`, `spark_storm_*`, and validates/consumes payload fields per the v1 schemas.

### 3) Gift id canonicalization is still drifting (backend slugs vs frontend catalog ids)
- Backend canonical gift ids (seed): `rose|flame|kiss|diamond|crown|champagne|key` (`backend/schema.sql`).
- Frontend spectacle ids: `neon_rose|fire_shot|velvet_kiss|diamond_rain|crown_drop|champagne_pour|private_key` (`frontend/src/gifts/giftEffectCatalog.js`).
- Frontend socket adapter looks for `payload.gift_type_id`, but backend contract exposes `giftId` (and nested `gift.id`) for `gift_animation`.

Required end state:
- One canonical `giftId` namespace across backend + frontend (recommended: backend slugs as canonical ids, with frontend `displayName` preserving luxury naming).

### 4) Backend platform banner still lacks a stable gift id
- `platform_banner` schema + runtime payload include `giftName` but no `giftId`/`giftTypeId` (`backend/contracts/socketio/v1/server-to-client/platform_banner.schema.json`, `backend/services/bannerService.js`, `backend/schema.sql`).

Required end state:
- `platform_banner` includes a stable `giftId` (and persists it in `platform_banners`) so the frontend can deterministically pick an effect without string matching.

## P1 quality notes (luxury, clarity, safety)

- Age verification copy is over-claiming and legally risky:
  - File: `frontend/src/App.jsx` contains "required by federal and state law" and "zero-knowledge, we never see your ID".
  - Recommendation: switch to conservative, verifiable phrasing until Hermes/legal provides approved wording.
- "Tap to join {recipient}" reads interactive but appears to be a static status banner:
  - File: `frontend/src/gifts/PlatformBanner.jsx`.
  - Recommendation: either make it actionable (real navigation/CTA) or change copy to non-action ("Now live in ...", "Live in ...", etc.).
- Encoding/mojibake artifacts still show up in source comments and this repo's review notes (e.g., smart quotes rendered as "â€™"):
  - Recommendation: normalize files to UTF-8 and prefer plain ASCII punctuation in code comments to avoid future diff noise.
- Deploy script footgun:
  - `frontend/package.json` contains `deploy:vercel` using `vercel --prod`.
  - Recommendation: make "prod" an explicit separate command (not part of staging) and default `deploy:staging` to non-prod targets only.

## Concrete next actions (by owner)

### Claude (frontend)
1) Remove the Anthropic browser call:
   - File: `frontend/src/App.jsx`
2) Replace raw WS with Socket.io client and align payload fields:
   - File: `frontend/src/gifts/useGiftSocket.js`
   - Source of truth: `backend/contracts/socketio/v1/server-to-client/gift_animation.schema.json` + `platform_banner.schema.json`.
3) Canonicalize `giftId` keys to backend slugs:
   - Files: `frontend/src/gifts/giftEffectCatalog.js`, `frontend/src/gifts/GiftSpectacleOverlay.jsx`, `frontend/src/gifts/PlatformBanner.jsx`, `frontend/src/gifts/SparkStormShell.jsx`, `frontend/src/gifts/useGiftSocket.js`.
4) Rewrite age verify microcopy to conservative language:
   - File: `frontend/src/App.jsx`
5) Fix banner affordance mismatch ("Tap to join"):
   - File: `frontend/src/gifts/PlatformBanner.jsx`

### Codex (backend)
1) Add stable gift id to platform banner payload + persistence:
   - Files: `backend/services/bannerService.js`, `backend/schema.sql`, `backend/contracts/socketio/v1/server-to-client/platform_banner.schema.json`, `backend/routes/gifts.js` (and any `/api/banners/active` route).
2) Upgrade the new banner tests to assert the stable gift id:
   - File: `backend/tests/giftSendBanner.test.js`

### Hermes (research/QA)
- Provide approved, screenshot-safe age verification copy claims (what we can say about "law required", "zero knowledge", data retention, etc.) and add a QA gate item to enforce "no provider URLs in browser code".

## Next milestone gate (what I will review next)

"Vertical slice ready for autonomous extension" requires:
- No browser-to-provider calls anywhere in `frontend/src/**`.
- Frontend consumes Socket.io v1 schemas and renders 3 events end-to-end: `gift_animation`, `platform_banner`, `spark_storm_*`.
- `platform_banner` includes a stable `giftId` and the schema/tests enforce it.
