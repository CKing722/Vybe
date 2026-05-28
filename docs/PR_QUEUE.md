# VYBE PR Queue

Updated: 2026-05-28

This repo requires feature branches + PRs (no direct pushes to `main`).

Notes:
- GitHub CLI (`gh`) is not available on this machine.
- If the Codex GitHub connector can open PRs, prefer it; otherwise use the manual PR creation URLs below.

## Backend PR stack (merge order)

1) `backend/contracts-baseline-into-main` -> `main`
- PR create URL: https://github.com/CKing722/Vybe/pull/new/backend/contracts-baseline-into-main

2) `backend/vertical-slice-integration` -> `main`
- PR create URL: https://github.com/CKing722/Vybe/pull/new/backend/vertical-slice-integration
- Depends on: `backend/contracts-baseline-into-main`

3) `backend/openapi-vertical-slice-sync` -> (retarget base to keep diff small)
- PR create URL: https://github.com/CKing722/Vybe/pull/new/backend/openapi-vertical-slice-sync
- Preferred base **before** step (2) merges: set base branch to `backend/vertical-slice-integration`
- Preferred base **after** step (2) merges: set base branch to `main`

## Follow-up PRs (after backend stack)

4) `backend/query-param-safety` -> `main`
- PR create URL: https://github.com/CKing722/Vybe/pull/new/backend/query-param-safety
- Recommendation: merge after step (2) to avoid conflict churn.

5) `backend/user-rate-limit-key` -> `main`
- PR create URL: https://github.com/CKing722/Vybe/pull/new/backend/user-rate-limit-key
- Recommendation: merge after step (2) to avoid conflict churn.

## Validation reminder

Before merging each PR, rerun:

```bash
cd backend
npm run check
```
