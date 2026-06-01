# GitHub PR Workflow (Connector Blocker)

## Why this exists

The Codex GitHub connector cannot open pull requests in the VYBE repo right now. Attempts fail with:

> `403 Resource not accessible by integration`

Until that access is fixed, PRs must be opened manually in the GitHub UI.

## Open a PR manually

1. Push your feature branch to the GitHub remote (`vybe`).
2. Open this URL in a browser and replace `<branch>`:

   `https://github.com/CKing722/Vybe/pull/new/<branch>`

3. Ensure the base branch is `main` and the compare branch is your feature branch.
4. Create the PR and paste the PR link back into the relevant Linear ledger/addendum entry as the artifact.

## Notes for the autonomous loop

- Prefer one PR per provisional `VYBE-GHO-###` item.
- If multiple PRs exist, merge the highest-priority vertical slice PR first (see the latest “GhostNexus VYBE Task Ledger - Addendum”).
