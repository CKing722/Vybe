# VYBE PR Queue (Manual Compare Links)

This repo currently cannot open PRs via the Codex GitHub integration (`403 Resource not accessible by integration`).
Use the compare links below to create PRs manually in the GitHub UI.

Last updated: 2026-05-27T03:38:43-05:00

## Manual PR Steps (GitHub UI)

1. Open the compare link for the branch.
2. Click **Create pull request**.
3. Base: `main` ← Compare: `<branch>`.
4. Title: start with the ledger ID (ex: `VYBE-GHO-015 ...`).
5. In the PR body, include:
   - Goal / scope summary
   - Validation command + result
6. Apply labels if available: `codex` and `codex-automation`.

## Merge Order (Recommended)

1. **Backend contract baseline into `main` (recommended first)**
   - Branch: `backend/contracts-mainline-integration-sync`
   - Why: `main` does not yet contain `backend/contracts/**` (OpenAPI + AsyncAPI + Socket.io schemas) or the runtime contract test harness.

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

### `backend/contracts-mainline-integration-sync` -> `main`

- Compare: https://github.com/CKing722/Vybe/compare/main...backend/contracts-mainline-integration-sync?expand=1
- Validation (2026-05-27): `cd backend && npm run check` -> PASS (18 tests)
- Notes:
  - This branch supersedes many intermediate contract branches (`backend/*contract*`, `backend/*baseline*`, `backend/*runtime*`).

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
