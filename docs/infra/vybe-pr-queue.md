# VYBE PR Queue (Manual Compare Links)

This repo currently cannot open PRs via the Codex GitHub integration (`403 Resource not accessible by integration`).
Use the compare links below to create PRs manually in the GitHub UI.

Last updated: 2026-06-01T06:20:00-05:00

## Manual PR Steps (GitHub UI)

1. Open the compare link for the branch.
2. Click **Create pull request**.
3. Base: `main` <- Compare: `<branch>`.
4. Title: start with the ledger ID (ex: `VYBE-GHO-015 ...`).
5. In the PR body, include:
   - Goal / scope summary
   - Validation command + result
6. Apply labels if available: `codex` and `codex-automation`.

## Merge Order (Recommended)

1. **Backend vertical slice baseline into `main` (recommended first)**
   - Branch: `backend/vertical-slice-mainline-ready`
   - Why: single PR-ready branch consolidating machine-readable contracts + demo HTTP endpoints + Socket.io realtime events + runtime contract tests.
   - Validation (2026-06-01): `cd backend && npm run check` -> PASS (29 tests).

2. **Review doc: ChatGPT autonomous review lane**
   - Branch: `review/chatgpt-autonomous`
   - Why: shared quality gate + prompt pack artifacts for the team.

3. **Infra doc: PR queue (this doc)**
   - Branch: `infra/pr-queue-doc`
   - Why: keeps manual PR creation unblocked while integration is offline.

4. **Infra doc: GitHub SSH bootstrap**
   - Branch: `infra/github-ssh-bootstrap-doc`
   - Why: self-serve unblocker doc; no runtime risk.

5. **Frontend: Gift spectacle runtime**
   - Branch: `frontend/gift-spectacle-runtime`
   - Why: VYBE vertical slice differentiator; requires frontend build + visual QA evidence.

## Compare Links

### `backend/vertical-slice-mainline-ready` -> `main`

- Compare: https://github.com/CKing722/Vybe/compare/main...backend/vertical-slice-mainline-ready?expand=1
- Create PR: https://github.com/CKing722/Vybe/pull/new/backend/vertical-slice-mainline-ready
- Validation (2026-06-01): `cd backend && npm run check` -> PASS (29 tests)
- Notes:
  - This branch supersedes most intermediate backend PR branches; prefer merging it first to unblock Claude integration.

### Alternative: `backend/machine-readable-contracts-mainline` -> `main` (contracts-only)

Use this only if the vertical slice PR is too large to review/merge first.

- Compare: https://github.com/CKing722/Vybe/compare/main...backend/machine-readable-contracts-mainline?expand=1
- Create PR: https://github.com/CKing722/Vybe/pull/new/backend/machine-readable-contracts-mainline
- Validation (2026-06-01): `cd backend && npm run check` -> PASS (16 tests)
- Notes:
  - Adds `backend/contracts/**` (OpenAPI + AsyncAPI + Socket.io schemas) and related contract validation tests.

### Superseded: `backend/me-profile` -> `main`

Do not merge this if `backend/vertical-slice-mainline-ready` is merged first (it already contains the same endpoint + contract updates).

- Compare: https://github.com/CKing722/Vybe/compare/main...backend/me-profile?expand=1

### `review/chatgpt-autonomous` -> `main`

- Compare: https://github.com/CKing722/Vybe/compare/main...review/chatgpt-autonomous?expand=1
- Contents: `docs/review/**` (review artifacts and prompts)

### `infra/pr-queue-doc` -> `main`

- Compare: https://github.com/CKing722/Vybe/compare/main...infra/pr-queue-doc?expand=1
- Contents: `docs/infra/vybe-pr-queue.md`

### `infra/github-ssh-bootstrap-doc` -> `main`

- Compare: https://github.com/CKing722/Vybe/compare/main...infra/github-ssh-bootstrap-doc?expand=1
- Contents: `docs/infra/vybe-gho-006-github-ssh-bootstrap.md`

### `frontend/gift-spectacle-runtime` -> `main`

- Compare: https://github.com/CKing722/Vybe/compare/main...frontend/gift-spectacle-runtime?expand=1
- Validation: `cd frontend && npm run build`
