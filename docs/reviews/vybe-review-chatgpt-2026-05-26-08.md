# VYBE Review: ChatGPT - 2026-05-26 (Pass 08)

Date: 2026-05-26 04:52:53 -05:00  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review pass considered complete for queue purposes: docs/reviews/vybe-review-chatgpt-2026-05-26-07.md.
- New unreviewed artifact found: **Codex/backend** contract mainline merge commit 23df0fc (machine-readable OpenAPI + Socket.io schemas + runtime contract tests), currently **not on main**.
- Frontend head unchanged since last pass: rontend/gift-spectacle-runtime @ c6e4e5e.
- Backend main unchanged since last pass: main @ 41edcf0.

## Executive call (demo readiness)

- Status: **FAIL (unchanged)**.
- Reason: vertical slice is still not “real enough to extend safely” while these P0 blockers remain:
  1) browser makes a direct paid-provider call (https://api.anthropic.com/v1/messages) and
  2) frontend socket transport/payload assumptions drift from backend contract direction (raw WS + {type,payload} vs Socket.io named events + JSON Schema), and
  3) the machine-readable contracts are still off-main.

## Review: backend contracts mainline (23df0fc)

Worktree: C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy  
Branch containing artifact: ackend/contracts-mainline-merge (same head as ackend/machine-readable-contracts-mainline)

### What’s excellent (meets VYBE standard)

- ✅ **Contracts are finally machine-readable and test-enforced**:
  - HTTP: ackend/contracts/openapi.yaml
  - Realtime: ackend/contracts/asyncapi.yaml
  - Canonical payload schemas: ackend/contracts/socketio/v1/**
- ✅ **Runtime contract tests are the right 2026 move**:
  - ackend/tests/httpRuntimeOpenApiContract.test.js validates real responses against OpenAPI.
  - ackend/tests/socketioRuntimeContract.test.js validates Socket.io payloads against JSON Schema (AJV 2020) and exercises ack semantics.
- ✅ **No-spend stance is clearly encoded** in the OpenAPI copy (“local/mock questions; paid provider APIs disabled unless enabled server-side”).

### Contract/interop gaps to fix (P0/P1)

- P0: **These contract files must be merged to main** or the frontend cannot safely converge on them.
  - Target merge set includes: ackend/contracts/** + runtime tests.

- P1: **AsyncAPI directionality is likely inverted / ambiguous**.
  - In ackend/contracts/asyncapi.yaml, channels like join_room and send_gift are marked subscribe even though they’re client→server events from a frontend POV.
  - Fix by either:
    - modeling the spec explicitly as “backend POV” (backend subscribes to client events), and say that loudly in the description, or
    - swapping client→server channels to publish and server→client to subscribe to match common frontend tooling expectations.

- P1: **Canonical casing needs a single “blessed” choice**.
  - The schemas currently allow both oom_id and oomId (same for gift_type_id / giftTypeId). This is helpful for migration, but the *contract standard* should pick one canonical form (recommend camelCase for JS clients) and mark the alternate fields as deprecated in docs.

Owner: Codex / backend

Files of interest (contract branch):
- C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\openapi.yaml
- C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\asyncapi.yaml
- C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\contracts\socketio\v1\**
- C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\httpRuntimeOpenApiContract.test.js
- C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\backend\tests\socketioRuntimeContract.test.js

## P0 gate: remove raw provider calls from browser (still blocking)

Still present:
- C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx (genQs() fetches https://api.anthropic.com/v1/messages).

Required direction (no secrets/no spend):
- Frontend calls backend POST /api/games/questions (local/mock), or uses local fixtures only.

Owner: Claude / frontend

## P0 gate: socket transport + event contract alignment (still blocking)

Still present:
- C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\gifts\useGiftSocket.js uses raw WebSocket and {type,payload} envelopes.

Required direction:
- Use socket.io-client, auth via handshake.auth.token, emit join_room, and consume named events (gift_animation, platform_banner, spark_storm_*) per ackend/contracts/socketio/v1/**.

Owner: Claude / frontend

## Next actions (queue)

1) Codex/backend (P0): merge ackend/contracts/** + contract tests to main via PR, and ensure 
pm run check runs them.
2) Claude/frontend (P0): remove raw provider call from App.jsx and swap gifts socket to Socket.io named events.
3) Codex/backend (P1): clarify/fix AsyncAPI publish/subscribe direction semantics and define one canonical casing.

