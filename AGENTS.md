# VYBE Agent Operating Rules

This repository is the shared VYBE product workspace. Keep work divided by ownership so autonomous agents can build in parallel without overwriting each other.

## Source Of Truth

- GitHub is the canonical codebase once the private repo is created.
- `main` is protected. No direct pushes to `main`.
- Every change goes through a feature branch and pull request.
- Linear is the source of truth for work status, acceptance criteria, and owner.
- Linear team placement: VYBE work lives in the existing `GhostNexus` team so final issue IDs use the normal `GHO-*` sequence.
- Linear project boundary: VYBE work belongs in the `VYBE Platform` project and must be labeled clearly as VYBE.
- Future VYBE Linear issues must carry `VYBE`, `Project: VYBE`, plus exactly one `VYBE Workstream` label.

## Autonomy Mandate

- Damon should be hands-off unless an issue requires money, secrets, legal approval, account ownership, production-risk approval, or a business decision only he can make.
- Agents keep working from the highest-priority unblocked VYBE task until the project meets the expectations captured in docs and Linear.
- If output does not meet the stated VYBE standard, agents treat that as unfinished work, not as a completed task.
- Agents must coordinate through Linear/project docs, branch scopes, and PR notes so the work behaves like one unified team.
- Do not ask Damon for preference questions that can be answered by the repo, docs, research, or conservative product judgment.

## No-Spend Rule

- Do not create paid accounts, upgrade plans, provision paid infrastructure, buy assets, or call paid APIs without explicit Damon approval.
- Prefer open-source and self-hosted tools first.
- Build internal tooling when it avoids recurring cost and is realistic for the project.
- If a paid provider is eventually required for legal/compliance/payment/production reasons, document the blocker and keep a mock/local implementation moving.
- Secrets, API keys, payment credentials, and age-verification credentials are Damon-gated and must not be invented or requested unless the current task truly needs them.

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

- ChatGPT owns review and synthesis support:
  - product/design second opinions
  - luxury visual critique
  - copy, prompt, and microcopy support
  - 3D/WebGPU/WebGL architecture critique
  - final expectation checks against the VYBE standard
  - no repo file ownership unless a Linear task explicitly assigns a scope

## Branch Naming

- `frontend/<short-task>` for Claude-led frontend work
- `backend/<short-task>` for Codex-led backend work
- `infra/<short-task>` for CI, deployment, GitHub, and environment work
- `research/<short-task>` for Hermes research and docs
- `research/<short-task>` for ChatGPT review synthesis when no repo files are edited
- `qa/<short-task>` for test and verification work

## Autonomous Work Contract

Every Linear issue must include:

- Goal: the user-visible outcome
- Owner: Claude, Codex, Hermes, ChatGPT, or human
- Project boundary: GhostNexus team / `VYBE Platform` / `VYBE` / `Project: VYBE`
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
4. ChatGPT: design/product/copy/3D architecture review using the `Review: ChatGPT` Linear label and prompt pack.

The goal is a demoable live room where a high-tier gift creates a platform-visible event and the backend contract is real enough for autonomous agents to extend safely.

## 3D And Animation Standard

- VYBE gift spectacle should target high-end 2026 web animation standards: GPU-first rendering, graceful fallbacks, mobile performance budgets, asset pipelines, and designer-editable effect definitions.
- Research modern 3D/web animation options before locking architecture.
- Prefer open-source engines and formats: Three.js, Babylon.js, WebGPU/WebGL, glTF/GLB, Blender, Rive/Lottie where appropriate, shader pipelines, and JSON effect definitions.
- Build a VYBE effect DSL/runtime before building a full proprietary 3D design suite.
- A proprietary design tool is allowed only after the runtime proves what designers need to author, preview, version, and ship premium gift effects.
