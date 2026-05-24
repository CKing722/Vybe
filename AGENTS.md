# VYBE Agent Operating Rules

This repository is the shared VYBE product workspace. Keep work divided by ownership so autonomous agents can build in parallel without overwriting each other.

## Source Of Truth

- GitHub is the canonical codebase once the private repo is created.
- `main` is protected. No direct pushes to `main`.
- Every change goes through a feature branch and pull request.
- Linear is the source of truth for work status, acceptance criteria, and owner.

## Ownership

- Claude owns frontend product experience:
  - `frontend/src/**`
  - design system
  - React component architecture
  - Canvas/WebGL/Pixi/Three gift runtime
  - CSS animation, page transitions, micro-interactions
  - frontend visual QA

- Codex owns backend, infrastructure, and integration contracts:
  - `backend/**`
  - database schema and migrations
  - API routes
  - WebSocket event contracts
  - auth/security middleware
  - CI/CD
  - GitHub branch/PR workflow
  - deployment scripts and environment documentation

- Hermes owns bounded support work:
  - research notes
  - compliance/vendor comparisons
  - QA checklists
  - test scripts
  - docs updates
  - no edits to Claude-owned or Codex-owned implementation files unless the Linear issue explicitly assigns that scope

## Branch Naming

- `frontend/<short-task>` for Claude-led frontend work
- `backend/<short-task>` for Codex-led backend work
- `infra/<short-task>` for CI, deployment, GitHub, and environment work
- `research/<short-task>` for Hermes research and docs
- `qa/<short-task>` for test and verification work

## Autonomous Work Contract

Every Linear issue must include:

- Goal: the user-visible outcome
- Owner: Claude, Codex, Hermes, or human
- Scope: exact directories/files the owner may edit
- Acceptance criteria: observable behavior
- Validation: commands, screenshots, or checks required
- Artifacts: PR link, screenshots, logs, research doc, or test output
- Blockers: missing secrets, infra access, legal decision, design dependency, or upstream task

## Validation Rules

- Frontend work must run `npm run build` in `frontend/`.
- Backend work must run the relevant tests or, until tests exist, at least syntax/startup checks.
- Visual work must include desktop and mobile screenshots once Playwright is available.
- Schema changes must be runnable against PostgreSQL and must avoid non-immutable partial index predicates.
- AI provider calls must run through backend endpoints, not directly from browser code.

## First Vertical Slice

The first coordinated buildout is:

1. Claude: gift spectacle frontend runtime and component split.
2. Codex: Express server, auth foundation, WebSocket setup, gift event contract, `/api/games/questions`.
3. Hermes: LiveKit vs Cloudflare Stream research, CCBill requirements, Yoti SDK requirements, compliance checklist.

The goal is a demoable live room where a high-tier gift creates a platform-visible event and the backend contract is real enough for autonomous agents to extend safely.
