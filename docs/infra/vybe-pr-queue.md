# VYBE PR Queue (Manual Compare Links)

This repo currently cannot open PRs via the GitHub integration (`403 Resource not accessible by integration`).
Use the compare links below to create PRs manually.

Last updated: 2026-05-27T02:37:20-05:00

## Merge Order (Recommended)

1. **Backend contract baseline into `main`**
   - Branch: `backend/contracts-mainline-integration-sync`
   - Why: `main` does not yet contain `backend/contracts/**` (OpenAPI + AsyncAPI + Socket.io schemas) or the runtime contract test harness.

2. **Infra doc: GitHub SSH bootstrap**
   - Branch: `infra/github-ssh-bootstrap-doc`
   - Why: self-serve unblocker doc; no runtime risk.

## Compare Links

### `backend/contracts-mainline-integration-sync` -> `main`

- Compare: https://github.com/CKing722/Vybe/compare/main...backend/contracts-mainline-integration-sync?expand=1
- Validation (2026-05-27): `cd backend && npm run check` -> PASS (18 tests)
- Notes:
  - This branch supersedes many intermediate contract branches (`backend/*contract*`, `backend/*baseline*`, `backend/*runtime*`).

### `infra/github-ssh-bootstrap-doc` -> `main`

- Compare: https://github.com/CKing722/Vybe/compare/main...infra/github-ssh-bootstrap-doc?expand=1
- Contents: `docs/infra/vybe-gho-006-github-ssh-bootstrap.md`
