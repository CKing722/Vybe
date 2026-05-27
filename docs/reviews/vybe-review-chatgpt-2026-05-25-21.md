# VYBE Review: ChatGPT - 2026-05-25 (Pass 21)

Date: 2026-05-25  
Lane: Review / synthesis (no implementation edits)  
Labels: VYBE, Review: ChatGPT

## Queue status

- Prior review artifact exists: `docs/reviews/vybe-review-chatgpt-2026-05-25-20.md` (treated as complete)
- This pass reviews the next newest unreviewed output found in:
  - Codex/backend new commit after `3e7ad20`

## Artifacts reviewed (new since last pass)

### Codex (backend)

- Repo: `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy`
- Branch / head: `backend/contracts-baseline-sync` @ `0329780`
- New commit reviewed:
  - `0329780` - docs: document `/api/games/questions` response
- Files touched:
  - `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md`

## Executive call

- Contract clarity for Claude integration: PASS — response example matches `backend/contracts/openapi.yaml` schema and makes the “no raw provider APIs” rule concrete.
- Vertical-slice demo readiness: FAIL (unchanged) — frontend still calls a raw paid provider endpoint and includes demo-unsafe compliance/vendor/payment claims in UI copy.

## What is good (2026 expectation alignment)

- The response example explicitly carries “what happened” flags (`paidProviderUsed`, `rawProviderApisEnabled`) which is the right shape for a product that must support strict “no spend / no secrets” modes.
- The endpoint is positioned correctly as the browser-safe surface area (backend-owned), which is essential for future compliance and cost gating.

## Gaps / critique (actionable)

### P1 - Document error semantics + frontend fallback path

- Current gap:
  - The doc shows a happy-path response, but does not describe the 400 cases the frontend should expect (validation failure, missing theme/count rules, etc.).
- Suggested next action (Owner: Codex / backend, docs only):
  - Expand `C:\Users\Damon\Downloads\vybe-project\vybe-project-main-policy\docs\BACKEND_API_CONTRACTS.md` with:
    - an example `ApiErrorResponse` for `/api/games/questions`
    - a one-liner frontend behavior (“fallback to local FBQ / show toast / retry”) so UX doesn’t drift

### P1 - Cross-contract casing consistency remains unresolved

- Evidence:
  - Many OpenAPI schemas still use snake_case (e.g., `display_name`), while `GameQuestionsResponse` is camelCase.
- Suggested next action (Owner: Codex / backend):
  - Pick and document one canonical external casing (or time-box dual acceptance) so frontend/UI code doesn’t accrete permanent normalization glue.

### P2 - Question schema should specify “quiz constraints” for premium UX

- Current gap:
  - `opts` length and `ans` bounds aren’t constrained (schema allows `opts: []` and `ans: 999`).
- Suggested next action (Owner: Codex / backend):
  - Tighten `GameQuestion` schema (e.g., `opts` min/max items, `ans` range) when you’re ready to lock the UI behavior.

## Still-blocking gate (unchanged, owner = Claude / frontend)

1. Remove raw provider call in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx`; use backend `POST /api/games/questions`.
2. Replace demo-unsafe legal/compliance/vendor/payment assertions in `C:\Users\Damon\Downloads\vybe-project\vybe-claude-frontend\frontend\src\App.jsx` with clearly-marked placeholders until a reviewed policy exists.

