# VYBE Team Activation

Activated: 2026-05-24

Damon has approved moving from setup into active buildout. The team should operate hands-off, no-spend, and continuously from the highest-priority unblocked VYBE work.

## Routing

- Linear team: `GhostNexus`
- Linear project: `VYBE Platform`
- Active task board while issue creation is blocked: `GhostNexus VYBE Task Ledger`
- Provisional task IDs: `VYBE-GHO-###`
- Future real issue IDs: normal `GHO-*`
- Required future labels: `VYBE`, `Project: VYBE`, exactly one VYBE workstream label, safety label, owner/review labels

## Active Assignments

### Claude

- Task: `VYBE-GHO-001: Frontend - Build Gift Spectacle Runtime`
- Scope: `frontend/src/**`, frontend-only docs
- Start from: `CLAUDE.md`, `docs/BACKEND_API_CONTRACTS.md`
- Tool path: Claude Code CLI through Damon's subscription. Do not use raw Anthropic API keys.

### Codex

- Task: `VYBE-GHO-002: Backend - Gift Event Contract And Platform Banners`
- Completed local artifacts:
  - `95d8a44 Add backend gift event contract`
  - `28f1157 Add CI workflow`
  - `863bcfd Add frontend-ready demo API contracts`
  - `22deda5 Document backend API contracts`
- Next scope: continue backend/frontend integration contracts, auth hardening, and no-cost local adapters.

### Hermes

- Task: `VYBE-GHO-003: Research - Live Video, Verification, Payment, Compliance`
- Scope: `docs/research/**`, `docs/compliance/**`
- Notification sent through Hermes Telegram home channel on 2026-05-24.
- Completed artifacts:
  - `docs/research/vybe-gho-003-live-video-compliance.md`
  - `docs/research/vybe-gho-007-3d-gift-pipeline.md`
  - `docs/qa/vybe-gho-008-gift-spectacle-qa.md`
- Hermes board: `vybe-platform`
- ID note: `VYBE-GHO-006` remains GitHub SSH bootstrap; 3D research is `VYBE-GHO-007`; gift QA is `VYBE-GHO-008`.

### ChatGPT

- Task: `VYBE-GHO-004: Review - ChatGPT VYBE Design And 3D Architecture Gate`
- Scope: review/synthesis/copy/architecture critique unless a task explicitly assigns files.
- If no external ChatGPT connector is available, Codex performs ChatGPT-style review in-session and records findings.

## Non-Negotiables

- Claude Code CLI subscription is approved. No raw paid APIs, API-key provider calls, paid assets, or paid infrastructure without Damon approval.
- No secrets in docs, logs, screenshots, Linear, or GitHub.
- Do not mutate non-VYBE GhostOps/Ghost Nexus issues for VYBE work.
- Research current official sources before major 3D/web animation architecture decisions.
- If work does not meet the VYBE standard, it is not done.
